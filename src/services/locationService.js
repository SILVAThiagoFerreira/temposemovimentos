import { DEFAULT_LOCALE } from '../i18n/messages.js';
import { nowIso } from './timeService.js';

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

export function projectGpsPoints(points = [], { padding = 8, size = 100 } = {}) {
  const validPoints = points
    .map((point) => (hasGpsSnapshot(point) ? point : normalizeGpsSnapshot(point)))
    .filter(Boolean);

  if (!validPoints.length) {
    return { bounds: null, markers: [] };
  }

  const latitudes = validPoints.map((point) => Number(point.latitude));
  const longitudes = validPoints.map((point) => Number(point.longitude));
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const latitudeSpan = maxLatitude - minLatitude;
  const longitudeSpan = maxLongitude - minLongitude;
  const innerSize = Math.max(1, size - padding * 2);
  const center = size / 2;

  return {
    bounds: {
      minLatitude,
      maxLatitude,
      minLongitude,
      maxLongitude,
    },
    markers: validPoints.map((point) => ({
      ...point,
      x: longitudeSpan > 0 ? padding + ((Number(point.longitude) - minLongitude) / longitudeSpan) * innerSize : center,
      y: latitudeSpan > 0 ? padding + ((maxLatitude - Number(point.latitude)) / latitudeSpan) * innerSize : center,
    })),
  };
}
