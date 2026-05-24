import { StatusChip } from './StatusChip';
import { formatDuration } from '../services/timeService';
import { formatUtilization } from '../services/calculationService';
import { PieChartCard } from './PieChartCard';
import { useApp } from '../context/AppContext';

function formatHours(value, t) {
  return `${Number(value || 0).toFixed(2)} ${t('common.hoursLabel').toLowerCase()}`;
}

function calculateStopMinutes(item) {
  return Number(item.maintenanceMinutes || 0) + Number(item.idleMinutes || 0) + Number(item.otherMinutes || 0);
}

function calculateAvailabilityPercent(availableMinutes, maintenanceMinutes) {
  const totalMinutes = Number(availableMinutes || 0);

  if (!totalMinutes) {
    return 0;
  }

  return Number((((totalMinutes - Number(maintenanceMinutes || 0)) / totalMinutes) * 100).toFixed(1));
}

function calculateClosedCount(item) {
  return Math.max(0, Number(item.count || 0) - Number(item.openCount || 0));
}

function EquipmentKpiTable({ summary, t }) {
  const headers = {
    equipment: t('registrations.equipment.code'),
    plate: t('registrations.equipment.plate'),
    open: t('dashboard.cards.open'),
    totalHours: t('dashboard.cards.totalHours'),
    stop: t('dashboard.cards.stop'),
    maintenance: t('dashboard.cards.maintenance'),
    closed: t('dashboard.cards.closed'),
    availability: t('dashboard.cards.physicalAvailability'),
    utilization: t('dashboard.cards.fleetIU'),
  };

  return (
    <section className="card table-card dashboard-block">
      <div className="card__head">
        <div>
          <p className="eyebrow">{t('dashboard.sections.kpisByEquipment')}</p>
          <h2>{t('dashboard.sections.kpisByEquipment')}</h2>
        </div>
      </div>

      <div className="table-wrap">
        <table className="records-table dashboard-kpi-table">
          <thead>
            <tr className="dashboard-kpi-table__total">
              <th scope="col">{headers.equipment}</th>
              <th scope="col">{headers.plate}</th>
              <th scope="col">{headers.open}</th>
              <th scope="col">{headers.totalHours}</th>
              <th scope="col">{headers.stop}</th>
              <th scope="col">{headers.maintenance}</th>
              <th scope="col">{headers.closed}</th>
              <th scope="col">{headers.availability}</th>
              <th scope="col">{headers.utilization}</th>
            </tr>
          </thead>

          <tbody>
            {summary.equipmentMetrics.map((item) => {
              const stopMinutes = calculateStopMinutes(item);
              const availabilityPercent = calculateAvailabilityPercent(item.availableMinutes || summary.periodAvailableMinutes, item.maintenanceMinutes);

              return (
                <tr key={item.equipmentId}>
                  <td data-label={headers.equipment}>
                    <strong>{item.code}</strong>
                    <small>{item.description}</small>
                  </td>
                  <td data-label={headers.plate}>
                    <strong>{item.plate}</strong>
                  </td>
                  <td data-label={headers.open}>
                    <strong>{item.openCount}</strong>
                  </td>
                  <td data-label={headers.totalHours}>
                    <strong>{formatHours((item.totalMinutes || 0) / 60, t)}</strong>
                  </td>
                  <td data-label={headers.stop}>
                    <strong>{formatHours(stopMinutes / 60, t)}</strong>
                  </td>
                  <td data-label={headers.maintenance}>
                    <strong>{formatHours((item.maintenanceMinutes || 0) / 60, t)}</strong>
                  </td>
                  <td data-label={headers.closed}>
                    <strong>{calculateClosedCount(item)}</strong>
                  </td>
                  <td data-label={headers.availability}>
                    <strong>{availabilityPercent.toFixed(1)}%</strong>
                  </td>
                  <td data-label={headers.utilization}>
                    <strong>{formatUtilization(item.utilizationPercent)}</strong>
                  </td>
                </tr>
              );
            })}

            <tr>
              <td data-label={headers.equipment}>
                <strong>{t('dashboard.labels.total')}</strong>
              </td>
              <td data-label={headers.plate}>
                <strong>-</strong>
              </td>
              <td data-label={headers.open}>
                <strong>{summary.openCount}</strong>
              </td>
              <td data-label={headers.totalHours}>
                <strong>{formatHours(summary.totalHours, t)}</strong>
              </td>
              <td data-label={headers.stop}>
                <strong>{formatHours(summary.stopHours, t)}</strong>
              </td>
              <td data-label={headers.maintenance}>
                <strong>{formatHours(summary.maintenanceHours, t)}</strong>
              </td>
              <td data-label={headers.closed}>
                <strong>{summary.closedCount}</strong>
              </td>
              <td data-label={headers.availability}>
                <strong>{formatUtilization(summary.physicalAvailabilityPercent)}</strong>
              </td>
              <td data-label={headers.utilization}>
                <strong>{formatUtilization(summary.physicalUtilizationPercent)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BarList({ title, items, emptyMessage, locale, t }) {
  const max = Math.max(...items.map((item) => item.minutes || 0), 0);

  return (
    <section className="card dashboard-block">
      <div className="card__head">
        <div>
          <p className="eyebrow">{title}</p>
        </div>
      </div>

      {!items.length ? <p className="empty-state">{emptyMessage}</p> : null}

      <div className="bar-list">
        {items.map((item) => {
          const width = max > 0 ? Math.max(8, Math.round(((item.minutes || 0) / max) * 100)) : 8;

          return (
            <div key={item.key || item.label} className="bar-list__item">
            <div className="bar-list__label">
                <strong>{item.label || item.classification || item.name || item.code || t('common.noTitle')}</strong>
                <small>{item.subtitle || item.code || item.classification || item.name || ''}</small>
              </div>
              <div className="bar-list__track">
                <span style={{ width: `${width}%` }} />
              </div>
              <div className="bar-list__value">
                <strong>{formatHours(item.hours ?? (item.minutes || 0) / 60, t)}</strong>
                <small>{item.count ? t('dashboard.labels.events', { count: item.count }) : formatDuration(item.minutes || 0, locale)}</small>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StackedBarList({ title, items, emptyMessage, locale, t }) {
  const max = Math.max(...items.map((item) => item.totalMinutes || 0), 0);

  return (
    <section className="card dashboard-block dashboard-block--wide">
      <div className="card__head">
          <div>
            <p className="eyebrow">{title}</p>
            <h2>{t('dashboard.sections.detailByEquipment')}</h2>
          </div>
        </div>

      {!items.length ? <p className="empty-state">{emptyMessage}</p> : null}

      <div className="stacked-list">
        {items.map((item) => {
          const totalMinutes = Number(item.totalMinutes || 0);
          const width = max > 0 ? Math.max(10, Math.round((totalMinutes / max) * 100)) : 10;

          return (
            <article key={item.key || item.label} className="stacked-list__item">
              <div className="stacked-list__head">
                <div>
                  <strong>{item.label || t('dashboard.labels.noCode')}</strong>
                  <small>{item.subtitle || t('dashboard.labels.noPlate')}</small>
                </div>
                <div className="stacked-list__value">
                  <strong>{formatHours(item.totalHours || totalMinutes / 60, t)}</strong>
                  <small>{t('dashboard.labels.mainInterval', { value: item.mainGapLabel || t('dashboard.labels.noCriticalIntervals') })}</small>
                </div>
              </div>

              <div className="stacked-list__track" style={{ width: `${width}%` }}>
                {item.segments.map((segment) => {
                  const segmentWidth = totalMinutes > 0 ? Math.max(6, (segment.minutes / totalMinutes) * 100) : 0;

                  return segmentWidth > 0 ? (
                    <span
                      key={segment.key}
                      className={`stacked-list__segment stacked-list__segment--${segment.key}`}
                      style={{ width: `${segmentWidth}%` }}
                      title={`${segment.label}: ${formatDuration(segment.minutes, locale)}`}
                    />
                  ) : null;
                })}
              </div>

              <div className="stacked-list__meta">
                {item.segments.map((segment) => (
                    <span key={segment.key}>
                      <strong>{segment.label}</strong>
                      <small>{formatDuration(segment.minutes, locale)}</small>
                    </span>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function TargetBarList({ title, items, emptyMessage, targetLabel, locale, t }) {
  const max = Math.max(...items.map((item) => item.targetMinutes || 60), 60);

  return (
    <section className="card dashboard-block">
      <div className="card__head">
          <div>
            <p className="eyebrow">{title}</p>
            <h2>{t('dashboard.sections.mealAdherence')}</h2>
          </div>
        </div>

      {!items.length ? <p className="empty-state">{emptyMessage}</p> : null}

      <div className="target-list">
        {items.map((item) => {
          const targetMinutes = Number(item.targetMinutes || 60);
          const width = max > 0 ? Math.max(8, Math.round(((item.minutes || 0) / max) * 100)) : 8;
          const tone = item.tone || (item.adherencePercent >= 100 ? 'success' : item.adherencePercent >= 80 ? 'warning' : 'danger');

          return (
            <div key={item.key || item.label} className="target-list__item">
                <div className="target-list__label">
                <strong>{item.label || t('common.noTitle')}</strong>
                <small>{item.subtitle || `${targetLabel} ${formatDuration(targetMinutes, locale)}`}</small>
                </div>
              <div className="target-list__track">
                <span style={{ width: `${Math.min(100, width)}%` }} />
              </div>
              <div className="target-list__value">
                <strong>{formatDuration(item.minutes || 0, locale)}</strong>
                <small>{targetLabel} {formatDuration(targetMinutes, locale)}</small>
              </div>
              <StatusChip tone={tone}>{Number(item.adherencePercent || 0).toFixed(1)}%</StatusChip>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function DashboardCards({ summary }) {
  const { language, t } = useApp();
  const utilizationAverage = summary.equipmentMetrics.length
    ? summary.equipmentMetrics.reduce((sum, item) => sum + Number(item.utilizationPercent || 0), 0) / summary.equipmentMetrics.length
    : 0;

  return (
    <div className="dashboard-layout">
      <section className="card dashboard-block">
        <div className="card__head">
          <div>
            <p className="eyebrow">{t('dashboard.sections.kpisOverview')}</p>
            <h2>{t('dashboard.sections.kpisOverview')}</h2>
          </div>
          <StatusChip tone="info">{t('dashboard.labels.total')}</StatusChip>
        </div>

        <div className="stats-grid">
          <article className="card stat-card stat-card--success">
            <p>{t('dashboard.cards.open')}</p>
            <strong>{summary.activeEquipmentCount}</strong>
            <small>{t('dashboard.cards.openSub')}</small>
          </article>

          <article className="card stat-card">
            <p>{t('dashboard.cards.totalHours')}</p>
            <strong>{summary.totalHours.toFixed(2)} h</strong>
            <small>{t('dashboard.cards.totalHoursSub', { count: summary.totalRecords })}</small>
          </article>

          <article className="card stat-card stat-card--danger">
            <p>{t('dashboard.cards.stop')}</p>
            <strong>{summary.stopHours.toFixed(2)} h</strong>
            <small>{t('dashboard.cards.stopSub')}</small>
          </article>

          <article className="card stat-card stat-card--warning">
            <p>{t('dashboard.cards.maintenance')}</p>
            <strong>{summary.maintenanceHours.toFixed(2)} h</strong>
            <small>{t('dashboard.cards.maintenanceSub')}</small>
          </article>

          <article className="card stat-card">
            <p>{t('dashboard.cards.closed')}</p>
            <strong>{summary.closedCount}</strong>
            <small>{t('dashboard.cards.closedSub')}</small>
          </article>

          <article className="card stat-card">
            <p>{t('dashboard.cards.physicalAvailability')}</p>
            <strong>{formatUtilization(summary.physicalAvailabilityPercent)}</strong>
            <small>{t('dashboard.cards.physicalAvailabilitySub')}</small>
          </article>

          <article className="card stat-card stat-card--info">
            <p>{t('dashboard.cards.fleetIU')}</p>
            <strong>{utilizationAverage.toFixed(1)}%</strong>
            <small>{t('dashboard.cards.fleetIUSub')}</small>
          </article>
        </div>
      </section>

      <EquipmentKpiTable summary={summary} t={t} />

      <section className="card dashboard-block">
        <div className="card__head">
          <div>
            <p className="eyebrow">{t('dashboard.sections.codesByEquipment')}</p>
            <h2>{t('dashboard.sections.quantityAndPercent')}</h2>
          </div>
        </div>

        {!summary.codeDistributionByEquipment.length ? <p className="empty-state">{t('dashboard.empty.selectedPeriod')}</p> : null}

        <div className="dashboard-pie-grid dashboard-pie-grid--dense">
          {summary.codeDistributionByEquipment.map((item) => (
            <PieChartCard
              key={item.key}
              eyebrow={`UMR ${item.label}`}
              title={item.label}
              subtitle={item.subtitle}
              centerValue={String(item.totalCount)}
              centerLabel={t('common.recordsLabel')}
              segments={item.segments}
              emptyMessage={t('dashboard.empty.selectedPeriod')}
              footnote={t('dashboard.sections.quantityAndPercent')}
              className="pie-chart-card--compact"
            />
          ))}
        </div>
      </section>

      <section className="card dashboard-block">
        <div className="card__head">
          <div>
            <p className="eyebrow">{t('dashboard.sections.equipmentAndActivity')}</p>
            <h2>{t('dashboard.sections.activityByEquipment')}</h2>
          </div>
        </div>

        {!summary.equipmentMetrics.length ? <p className="empty-state">{t('dashboard.empty.available')}</p> : null}

        <div className="equipment-status-list">
          {summary.equipmentMetrics.map((item) => (
            <article key={item.equipmentId} className="equipment-status-item">
              <div>
                <strong>{item.code}</strong>
                <p>{item.plate}</p>
              </div>
              <div>
                <small>{t('common.operation')}</small>
                <p>{item.currentActivityName || '-'}</p>
              </div>
              <div>
                <small>{t('common.hoursLabel')}</small>
                <p>{formatHours(item.hours ?? item.minutes / 60, t)}</p>
              </div>
              <div>
                <small>IU</small>
                <StatusChip tone={item.utilizationPercent >= 75 ? 'success' : item.utilizationPercent >= 50 ? 'warning' : 'danger'}>
                  {item.utilizationPercent.toFixed(1)}%
                </StatusChip>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card dashboard-block">
        <div className="card__head">
          <div>
            <p className="eyebrow">{t('dashboard.sections.physicalIndicators')}</p>
            <h2>{t('dashboard.sections.availabilityAndUtilization')}</h2>
          </div>
        </div>

        <div className="dashboard-pie-grid dashboard-pie-grid--two">
          <PieChartCard
            eyebrow={t('dashboard.sections.physicalIndicators')}
            title={t('dashboard.cards.physicalAvailability')}
            subtitle={`${t('dashboard.series.available')} x ${t('dashboard.series.maintenance')}`}
            centerValue={formatUtilization(summary.physicalAvailabilityPercent)}
            centerLabel={t('dashboard.cards.physicalAvailabilitySub')}
            segments={summary.physicalAvailabilitySegments}
            footnote={`${summary.periodDays} d · ${formatDuration(summary.periodAvailableMinutes, language)}`}
          />

          <PieChartCard
            eyebrow={t('dashboard.sections.availabilityAndUtilization')}
            title={t('dashboard.sections.availabilityAndUtilization')}
            subtitle={`${t('dashboard.series.operation')} x ${t('dashboard.series.rest')}`}
            centerValue={formatUtilization(summary.physicalUtilizationPercent)}
            centerLabel={t('dashboard.cards.physicalAvailabilitySub')}
            segments={summary.physicalUtilizationSegments}
            footnote={`${summary.periodDays} d · ${formatDuration(summary.periodAvailableMinutes, language)}`}
          />
        </div>
      </section>

      <div className="dashboard-columns">
        <BarList
          title={t('dashboard.sections.maintenanceByEquipment')}
          items={summary.maintenanceByEquipment}
          emptyMessage={t('dashboard.empty.maintenance')}
          locale={language}
          t={t}
        />

        <BarList
          title={t('dashboard.sections.maintenanceByActivity')}
          items={summary.maintenanceByActivity}
          emptyMessage={t('dashboard.empty.maintenance')}
          locale={language}
          t={t}
        />
      </div>

      <div className="dashboard-columns">
        <TargetBarList
          title={t('dashboard.sections.mealDaily')}
          items={summary.mealAdherenceByEquipment}
          emptyMessage={t('dashboard.empty.meal')}
          targetLabel={t('common.target')}
          locale={language}
          t={t}
        />

        <BarList
          title={t('dashboard.sections.criticalIntervals')}
          items={summary.criticalGapActivities}
          emptyMessage={t('dashboard.empty.critical')}
          locale={language}
          t={t}
        />
      </div>
    </div>
  );
}
