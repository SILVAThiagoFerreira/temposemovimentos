import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatDateTime } from '../services/timeService';
import { formatGpsAccuracy, formatGpsCoordinates, projectGpsPoints } from '../services/locationService';
import { StatusChip } from './StatusChip';

function getMarkerTone(record) {
  return record?.status === 'ABERTO' ? 'success' : 'info';
}

function getMarkerLabel(record, t) {
  if (!record) {
    return t('dashboard.map.noGps');
  }

  return record.status === 'ABERTO' ? t('dashboard.map.livePoint') : t('dashboard.map.lastPoint');
}

function buildMapItems(summary, language, t) {
  return summary.equipmentMetrics
    .map((item) => {
      const record = item.lastRecord || null;
      const gps = record?.gps || null;

      return {
        ...item,
        record,
        gps,
        label: record ? getMarkerLabel(record, t) : t('dashboard.map.noGps'),
        tone: getMarkerTone(record),
        title: record ? `${item.code} • ${item.plate}` : `${item.code} • ${item.plate}`,
        subtitle: gps ? formatGpsCoordinates(gps, language) : t('dashboard.map.noGps'),
        meta: gps
          ? `${formatDateTime(gps.capturedAt, language)}${formatGpsAccuracy(gps, language) ? ` • ${formatGpsAccuracy(gps, language)}` : ''}`
          : t('dashboard.map.noGps'),
      };
    })
    .filter((item) => Boolean(item.gps));
}

export function FleetMapCard({ summary }) {
  const { language, t } = useApp();

  const mapItems = useMemo(() => buildMapItems(summary, language, t), [language, summary, t]);
  const projectedMap = useMemo(
    () => projectGpsPoints(mapItems.map((item) => ({ ...item.gps, ...item })), { locale: language }),
    [mapItems],
  );

  const trackedCount = mapItems.length;
  const totalCount = summary.equipmentMetrics.length;
  const missingCount = Math.max(0, totalCount - trackedCount);

  return (
    <section className="card dashboard-block dashboard-map-card">
      <div className="card__head">
        <div>
          <p className="eyebrow">{t('dashboard.map.eyebrow')}</p>
          <h2>{t('dashboard.map.title')}</h2>
          <p className="dashboard-map-card__copy">{t('dashboard.map.copy')}</p>
        </div>
        <StatusChip tone={trackedCount ? 'info' : 'neutral'}>{t('dashboard.map.count', { count: trackedCount })}</StatusChip>
      </div>

      <div className="fleet-map">
        <div className="fleet-map__canvas" role="img" aria-label={t('dashboard.map.title')}>
          {projectedMap.mapUrl ? (
            <iframe
              className="fleet-map__frame"
              title={t('dashboard.map.title')}
              src={projectedMap.mapUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : null}

          <div className="fleet-map__veil" aria-hidden="true" />

          <div className="fleet-map__overlay" aria-hidden="true">
            {projectedMap.markers.map((marker) => (
              <div
                key={marker.equipmentId}
                className={`fleet-map__marker fleet-map__marker--${marker.tone}`}
                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                title={`${marker.code} • ${marker.plate}\n${marker.subtitle}\n${marker.meta}`}
              >
                <span className="fleet-map__marker-pin" />
                <span className="fleet-map__marker-tag">{marker.code}</span>
              </div>
            ))}
          </div>

          {!trackedCount ? <div className="fleet-map__empty">{t('dashboard.map.empty')}</div> : null}
        </div>

        <aside className="fleet-map__sidebar">
          <div className="fleet-map__legend">
            <span>
              <i className="fleet-map__legend-swatch fleet-map__legend-swatch--live" />
              {t('dashboard.map.legend.live')}
            </span>
            <span>
              <i className="fleet-map__legend-swatch fleet-map__legend-swatch--closed" />
              {t('dashboard.map.legend.lastPoint')}
            </span>
            <span>
              <i className="fleet-map__legend-swatch fleet-map__legend-swatch--missing" />
              {t('dashboard.map.legend.noGps')}
            </span>
          </div>

          <div className="fleet-map__summary">
            <StatusChip tone="success">{t('common.open')}: {summary.activeEquipmentCount}</StatusChip>
            <StatusChip tone="info">{t('common.closed')}: {summary.closedCount}</StatusChip>
            <StatusChip tone="warning">{t('dashboard.map.noGps')}: {missingCount}</StatusChip>
          </div>

          <div className="fleet-map__list">
            {summary.equipmentMetrics.map((item) => {
              const gps = item.lastRecord?.gps || null;
              const tone = item.lastRecord?.status === 'ABERTO' ? 'success' : 'info';

              return (
                <article key={item.equipmentId} className={`fleet-map__item fleet-map__item--${tone}`}>
                  <div className="fleet-map__item-head">
                    <div>
                      <strong>{item.code}</strong>
                      <small>{item.plate}</small>
                    </div>
                    <StatusChip tone={gps ? tone : 'warning'}>
                      {gps ? getMarkerLabel(item.lastRecord, t) : t('dashboard.map.noGps')}
                    </StatusChip>
                  </div>

                  <div className="fleet-map__item-body">
                    <span>{item.lastRecord?.operatorName || t('common.noData')}</span>
                    <strong>{item.lastRecord?.activityName || t('common.noData')}</strong>
                    <small>{gps ? formatGpsCoordinates(gps, language) : t('dashboard.map.noGps')}</small>
                    <small>{gps ? formatDateTime(gps.capturedAt, language) : t('dashboard.map.noGps')}</small>
                  </div>
                </article>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
}
