import { formatDateTime } from './timeService.js';
import { formatGpsAccuracy, formatGpsCoordinates } from './locationService.js';

function getMarkerTone(record) {
  return record?.status === 'ABERTO' ? 'success' : 'info';
}

function getMarkerLabel(record, t) {
  if (!record) {
    return t('dashboard.map.noGps');
  }

  return record.status === 'ABERTO' ? t('dashboard.map.livePoint') : t('dashboard.map.lastPoint');
}

export function buildActiveMapItems(summary, language, t) {
  return summary.equipmentMetrics
    .map((item) => {
      const record = item.lastRecord || null;

      if (!record || record.status !== 'ABERTO') {
        return null;
      }

      const gps = record.gps || null;

      return {
        ...item,
        record,
        gps,
        label: getMarkerLabel(record, t),
        tone: getMarkerTone(record),
        subtitle: gps ? formatGpsCoordinates(gps, language) : t('dashboard.map.noGps'),
        meta: gps
          ? `${formatDateTime(gps.capturedAt, language)}${formatGpsAccuracy(gps, language) ? ` • ${formatGpsAccuracy(gps, language)}` : ''}`
          : t('dashboard.map.noGps'),
      };
    })
    .filter(Boolean);
}
