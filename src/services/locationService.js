import { DEFAULT_LOCALE, normalizeLocale } from '../i18n/messages.js';
import { nowIso } from './timeService.js';

const SATELLITE_MAP_CANVAS = Object.freeze({
  width: 1600,
  height: 1000,
  padding: 96,
  defaultZoom: 16,
  minZoom: 11,
  maxZoom: 19,
});

function toFiniteNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function normalizeGpsSnapshot(value = null) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const coords = value.coords && typeof value.coords === 'object' ? value.coords : value;
  const latitude = toFiniteNumber(coords.latitude);
  const longitude = toFiniteNumber(coords.longitude);

  if (latitude == null || longitude == null) {
    return null;
  }

  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return null;
  }

  const accuracySource = coords.accuracy ?? value.accuracyMeters ?? value.accuracy ?? null;
  const accuracyMeters = toFiniteNumber(accuracySource);
  const timestampSource = value.capturedAt || value.timestamp || coords.timestamp || null;
  const capturedDate = timestampSource != null ? new Date(timestampSource) : null;
  const capturedAt = capturedDate && !Number.isNaN(capturedDate.getTime()) ? capturedDate.toISOString() : nowIso();

  return {
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6)),
    accuracyMeters: accuracyMeters == null ? null : Math.max(0, Number(accuracyMeters.toFixed(0))),
    capturedAt,
    source: String(value.source || 'browser-geolocation').trim() || 'browser-geolocation',
  };
}

export function hasGpsSnapshot(value) {
  const latitude = Number(value?.latitude);
  const longitude = Number(value?.longitude);

  return Boolean(
    Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      Math.abs(latitude) <= 90 &&
      Math.abs(longitude) <= 180,
  );
}

export function formatGpsCoordinates(snapshot, locale = DEFAULT_LOCALE) {
  if (!hasGpsSnapshot(snapshot)) {
    return '';
  }

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 5,
    maximumFractionDigits: 5,
  });

  return `${formatter.format(Number(snapshot.latitude))}, ${formatter.format(Number(snapshot.longitude))}`;
}

export function formatGpsAccuracy(snapshot, locale = DEFAULT_LOCALE) {
  if (!snapshot || !Number.isFinite(Number(snapshot.accuracyMeters))) {
    return '';
  }

  const formatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  });

  return `±${formatter.format(Number(snapshot.accuracyMeters))} m`;
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toWorldCoordinates(latitude, longitude) {
  const sinLatitude = Math.sin((Number(latitude) * Math.PI) / 180);

  return {
    x: (Number(longitude) + 180) / 360,
    y: 0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI),
  };
}

function fromWorldCoordinates(x, y) {
  const longitude = x * 360 - 180;
  const latitude = (Math.atan(Math.sinh(Math.PI - 2 * Math.PI * y)) * 180) / Math.PI;

  return { latitude, longitude };
}

export function buildGoogleMapsSatelliteUrl(center, zoom, locale = DEFAULT_LOCALE) {
  if (!hasGpsSnapshot(center)) {
    return '';
  }

  const params = new URLSearchParams({
    ll: `${Number(center.latitude)},${Number(center.longitude)}`,
    z: String(Math.max(1, Math.round(Number(zoom) || SATELLITE_MAP_CANVAS.defaultZoom))),
    t: 'k',
    output: 'embed',
    hl: normalizeLocale(locale),
  });

  return `https://www.google.com/maps?${params.toString()}`;
}

export function projectGpsPoints(points = [], options = {}) {
  const validPoints = points
    .map((point) => (hasGpsSnapshot(point) ? point : normalizeGpsSnapshot(point)))
    .filter(Boolean);

  if (!validPoints.length) {
    return {
      bounds: null,
      center: null,
      zoom: SATELLITE_MAP_CANVAS.defaultZoom,
      mapUrl: '',
      markers: [],
    };
  }

  const width = Number.isFinite(Number(options.width)) ? Number(options.width) : SATELLITE_MAP_CANVAS.width;
  const height = Number.isFinite(Number(options.height)) ? Number(options.height) : SATELLITE_MAP_CANVAS.height;
  const padding = Number.isFinite(Number(options.padding)) ? Number(options.padding) : SATELLITE_MAP_CANVAS.padding;
  const defaultZoom = Number.isFinite(Number(options.defaultZoom)) ? Number(options.defaultZoom) : SATELLITE_MAP_CANVAS.defaultZoom;
  const minZoom = Number.isFinite(Number(options.minZoom)) ? Number(options.minZoom) : SATELLITE_MAP_CANVAS.minZoom;
  const maxZoom = Number.isFinite(Number(options.maxZoom)) ? Number(options.maxZoom) : SATELLITE_MAP_CANVAS.maxZoom;
  const locale = options.locale || DEFAULT_LOCALE;

  const worldPoints = validPoints.map((point) => ({
    ...point,
    world: toWorldCoordinates(point.latitude, point.longitude),
  }));

  const xs = worldPoints.map((point) => point.world.x);
  const ys = worldPoints.map((point) => point.world.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const usableWidth = Math.max(1, width - padding * 2);
  const usableHeight = Math.max(1, height - padding * 2);

  const zoomCandidates = [];

  if (spanX > 0) {
    zoomCandidates.push(Math.log2(usableWidth / (256 * spanX)));
  }

  if (spanY > 0) {
    zoomCandidates.push(Math.log2(usableHeight / (256 * spanY)));
  }

  let zoom = zoomCandidates.length ? Math.floor(Math.min(...zoomCandidates)) : defaultZoom;
  if (!Number.isFinite(zoom)) {
    zoom = defaultZoom;
  }

  zoom = Math.round(clampNumber(zoom, minZoom, maxZoom));

  const centerWorld = {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
  };

  const center = fromWorldCoordinates(centerWorld.x, centerWorld.y);
  const scale = 256 * 2 ** zoom;

  const markers = worldPoints.map((point) => {
    const pixelX = (point.world.x - centerWorld.x) * scale + width / 2;
    const pixelY = (point.world.y - centerWorld.y) * scale + height / 2;

    return {
      ...point,
      x: Number(clampNumber((pixelX / width) * 100, 0, 100).toFixed(2)),
      y: Number(clampNumber((pixelY / height) * 100, 0, 100).toFixed(2)),
    };
  });

  return {
    bounds: {
      minLatitude: Math.min(...validPoints.map((point) => Number(point.latitude))),
      maxLatitude: Math.max(...validPoints.map((point) => Number(point.latitude))),
      minLongitude: Math.min(...validPoints.map((point) => Number(point.longitude))),
      maxLongitude: Math.max(...validPoints.map((point) => Number(point.longitude))),
    },
    center,
    zoom,
    mapUrl: buildGoogleMapsSatelliteUrl(center, zoom, locale),
    markers,
  };
}
