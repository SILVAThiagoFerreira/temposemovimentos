import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { projectGpsPoints } from '../services/locationService';
import { buildActiveMapItems } from '../services/fleetMapService';
import { StatusChip } from './StatusChip';

export function FleetMapCard({ summary }) {
  const { language, t } = useApp();

  const mapItems = useMemo(() => buildActiveMapItems(summary, language, t), [language, summary, t]);
  const projectedMap = useMemo(
    () => projectGpsPoints(
      mapItems.filter((item) => item.gps).map((item) => ({ ...item.gps, ...item })),
      { locale: language },
    ),
    [language, mapItems],
  );

  const activeCount = mapItems.length;
  const trackedCount = projectedMap.markers.length;
  const missingCount = Math.max(0, activeCount - trackedCount);

  return (
    <section className="card dashboard-block dashboard-map-card">
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
          <div className="fleet-map__blocker" aria-hidden="true" />

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

          {!activeCount ? <div className="fleet-map__empty">{t('dashboard.map.empty')}</div> : null}
        </div>

        <aside className="fleet-map__sidebar">
          <div className="fleet-map__summary">
            <StatusChip tone="success">{activeCount}</StatusChip>
            <StatusChip tone={missingCount ? 'warning' : 'info'}>{trackedCount}</StatusChip>
          </div>

          <div className="fleet-map__list">
            {mapItems.map((item) => {
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
                      {item.label || t('dashboard.map.noGps')}
                    </StatusChip>
                  </div>

                  <div className="fleet-map__item-body">
                    <span>{item.lastRecord?.operatorName || t('common.noData')}</span>
                    <strong>{item.lastRecord?.activityName || t('common.noData')}</strong>
                    <small>{item.subtitle || t('dashboard.map.noGps')}</small>
                    <small>{item.meta || t('dashboard.map.noGps')}</small>
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
