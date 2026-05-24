import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatDuration } from '../services/timeService';
import { formatUtilization } from '../services/calculationService';
import { StatusChip } from './StatusChip';
import { PieChartCard } from './PieChartCard';

const ENAEX_COLORS = {
  red: '#E20613',
  redAlt: '#E3001B',
  graphite: '#38424B',
  graphiteMedium: '#3D434C',
  graphiteDark: '#283138',
  gray: '#6B6F75',
  light: '#EDEFF2',
  white: '#FFFFFF',
};

const SEGMENT_COLORS = {
  OPERAÇÃO: ENAEX_COLORS.red,
  MANUTENÇÃO: ENAEX_COLORS.graphite,
  OCIOSIDADE: ENAEX_COLORS.gray,
  OUTROS: ENAEX_COLORS.graphiteMedium,
  operation: ENAEX_COLORS.red,
  maintenance: ENAEX_COLORS.graphite,
  meal: ENAEX_COLORS.redAlt,
  gaps: ENAEX_COLORS.graphiteDark,
  idle: ENAEX_COLORS.gray,
  other: ENAEX_COLORS.graphiteMedium,
  available: ENAEX_COLORS.red,
  rest: ENAEX_COLORS.graphiteMedium,
};

function formatHours(value, t) {
  return `${Number(value || 0).toFixed(2)} ${t('common.hoursLabel').toLowerCase()}`;
}

function calculateAvailabilityPercent(availableMinutes, maintenanceMinutes) {
  const totalMinutes = Number(availableMinutes || 0);

  if (!totalMinutes) {
    return 0;
  }

  return Number((((totalMinutes - Number(maintenanceMinutes || 0)) / totalMinutes) * 100).toFixed(1));
}

function calculateClosedCount(item) {
  return Math.max(0, Number(item?.count || 0) - Number(item?.openCount || 0));
}

function buildTotalSegments(summary, t, language) {
  const byClassification = new Map(summary.byClassification.map((item) => [item.classification, item]));
  const orderedKeys = [
    ['OPERAÇÃO', t('dashboard.series.operation')],
    ['MANUTENÇÃO', t('dashboard.series.maintenance')],
    ['OCIOSIDADE', t('dashboard.series.idle')],
    ['OUTROS', t('dashboard.series.other')],
  ];

  const segments = orderedKeys
    .map(([classification, label]) => {
      const item = byClassification.get(classification);

      if (!item || !Number(item.minutes || 0)) {
        return null;
      }

      return {
        key: classification,
        label,
        value: item.minutes,
        detail: `${formatDuration(item.minutes, language)} · ${t('dashboard.labels.events', { count: item.count || 0 })}`,
        color: SEGMENT_COLORS[classification],
      };
    })
    .filter(Boolean);

  summary.byClassification.forEach((item) => {
    if (!item || !Number(item.minutes || 0) || segments.some((segment) => segment.key === item.classification)) {
      return;
    }

    segments.push({
      key: item.classification,
      label: item.classification,
      value: item.minutes,
      detail: `${formatDuration(item.minutes, language)} · ${t('dashboard.labels.events', { count: item.count || 0 })}`,
      color: SEGMENT_COLORS[item.classification],
    });
  });

  return segments;
}

function buildEquipmentSegments(item, language, t) {
  return item.segments.map((segment) => ({
    ...segment,
    color: SEGMENT_COLORS[segment.key],
    detail: `${formatDuration(segment.minutes, language)} · ${t('dashboard.labels.events', { count: segment.count || 0 })}`,
  }));
}

function buildKpiMetrics({ openCount, closedCount, availabilityPercent, utilizationPercent }, t) {
  return [
    { label: t('dashboard.cards.open'), value: String(openCount || 0), detail: t('dashboard.cards.openSub') },
    { label: t('dashboard.cards.closed'), value: String(closedCount || 0), detail: t('dashboard.cards.closedSub') },
    {
      label: t('dashboard.cards.physicalAvailability'),
      value: formatUtilization(availabilityPercent),
      detail: t('dashboard.cards.physicalAvailabilitySub'),
    },
    { label: t('dashboard.cards.fleetIU'), value: formatUtilization(utilizationPercent), detail: t('dashboard.cards.fleetIUSub') },
  ];
}

function getActivityFootnote(activityName, t) {
  const value = String(activityName || '').trim();
  return value && value !== '-' ? value : t('common.noActivity');
}

function getAvailabilityMinutes(item, summary) {
  const availableMinutes = Number(item?.availableMinutes || summary.periodAvailableMinutes || 0);
  const maintenanceMinutes = Number(item?.maintenanceMinutes || 0);
  return Math.max(0, availableMinutes - maintenanceMinutes);
}

function getRestMinutes(item, summary) {
  const availableMinutes = Number(item?.availableMinutes || summary.periodAvailableMinutes || 0);
  const operationMinutes = Number(item?.operationMinutes || 0);
  return Math.max(0, availableMinutes - operationMinutes);
}

function buildAvailabilitySegments(item, summary, language, t) {
  const availableMinutes = getAvailabilityMinutes(item, summary);
  const maintenanceMinutes = Number(item?.maintenanceMinutes || 0);

  return [
    {
      key: 'available',
      label: t('dashboard.series.available'),
      value: availableMinutes,
      detail: formatDuration(availableMinutes, language),
      color: SEGMENT_COLORS.available,
    },
    {
      key: 'maintenance',
      label: t('dashboard.series.maintenance'),
      value: maintenanceMinutes,
      detail: formatDuration(maintenanceMinutes, language),
      color: SEGMENT_COLORS.maintenance,
    },
  ];
}

function buildUtilizationSegments(item, summary, language, t) {
  const operationMinutes = Number(item?.operationMinutes || 0);
  const restMinutes = getRestMinutes(item, summary);

  return [
    {
      key: 'operation',
      label: t('dashboard.series.operation'),
      value: operationMinutes,
      detail: formatDuration(operationMinutes, language),
      color: SEGMENT_COLORS.operation,
    },
    {
      key: 'rest',
      label: t('dashboard.series.rest'),
      value: restMinutes,
      detail: formatDuration(restMinutes, language),
      color: SEGMENT_COLORS.rest,
    },
  ];
}

function buildAvailabilityMetrics(item, summary, t) {
  return [
    { label: t('dashboard.series.available'), value: formatHours(getAvailabilityMinutes(item, summary) / 60, t) },
    { label: t('dashboard.series.maintenance'), value: formatHours(Number(item?.maintenanceMinutes || 0) / 60, t) },
  ];
}

function buildUtilizationMetrics(item, summary, t) {
  return [
    { label: t('dashboard.series.operation'), value: formatHours(Number(item?.operationMinutes || 0) / 60, t) },
    { label: t('dashboard.series.rest'), value: formatHours(getRestMinutes(item, summary) / 60, t) },
  ];
}

function AvailabilityUtilizationByEquipment({ summary }) {
  const { language, t } = useApp();
  const equipmentCards = useMemo(
    () => summary.equipmentMetrics.filter((item) => Number(item.totalMinutes || 0) > 0),
    [summary.equipmentMetrics],
  );

  return (
    <section className="card dashboard-block dashboard-kpi-graphs__group dashboard-availability-group">
      <div className="card__head">
        <div>
          <p className="eyebrow">{t('dashboard.sections.availabilityAndUtilizationByEquipment')}</p>
          <h2>{t('dashboard.sections.availabilityAndUtilizationByEquipment')}</h2>
        </div>
      </div>

      {!equipmentCards.length ? <p className="empty-state">{t('dashboard.empty.available')}</p> : null}

      <div className="dashboard-availability-grid">
        {equipmentCards.map((item) => {
          const availableMinutes = Number(item.availableMinutes || summary.periodAvailableMinutes || 0);
          const availabilityMinutes = getAvailabilityMinutes(item, summary);
          const availabilityPercent = availableMinutes > 0 ? Number(((availabilityMinutes / availableMinutes) * 100).toFixed(1)) : 0;
          const utilizationPercent = Number(item.utilizationPercent || 0);
          const utilizationTone = utilizationPercent >= 75 ? 'success' : utilizationPercent >= 50 ? 'warning' : 'danger';

          return (
            <article key={item.equipmentId} className="card dashboard-block dashboard-availability-card">
              <div className="dashboard-availability-card__head">
                <div>
                  <p className="eyebrow">{item.code}</p>
                  <h3>{item.plate}</h3>
                </div>
                <StatusChip tone={utilizationTone}>{formatUtilization(utilizationPercent)}</StatusChip>
              </div>

              <p className="dashboard-availability-card__copy">{item.currentActivityName || t('common.noActivity')}</p>

              <div className="dashboard-availability-card__charts">
                <PieChartCard
                  eyebrow={t('dashboard.sections.physicalIndicators')}
                  title={t('dashboard.cards.physicalAvailability')}
                  subtitle={`${t('dashboard.series.available')} x ${t('dashboard.series.maintenance')}`}
                  centerValue={formatUtilization(availabilityPercent)}
                  centerLabel={item.code}
                  segments={buildAvailabilitySegments(item, summary, language, t)}
                  metrics={buildAvailabilityMetrics(item, summary, t)}
                  showLegend={false}
                  className="pie-chart-card--compact pie-chart-card--micro"
                />

                <PieChartCard
                  eyebrow={t('dashboard.sections.availabilityAndUtilization')}
                  title={t('dashboard.cards.utilization')}
                  subtitle={`${t('dashboard.series.operation')} x ${t('dashboard.series.rest')}`}
                  centerValue={formatUtilization(utilizationPercent)}
                  centerLabel={item.code}
                  segments={buildUtilizationSegments(item, summary, language, t)}
                  metrics={buildUtilizationMetrics(item, summary, t)}
                  showLegend={false}
                  className="pie-chart-card--compact pie-chart-card--micro"
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function DashboardKpiCharts({ summary }) {
  const { language, t } = useApp();
  const equipmentById = useMemo(
    () => new Map(summary.equipmentMetrics.map((item) => [item.equipmentId, item])),
    [summary.equipmentMetrics],
  );

  const activeEquipmentBreakdowns = useMemo(
    () => summary.equipmentBreakdowns.filter((item) => Number(item.totalMinutes || 0) > 0),
    [summary.equipmentBreakdowns],
  );

  const totalSegments = useMemo(
    () => buildTotalSegments(summary, t, language),
    [language, summary, t],
  );

  const totalMetrics = useMemo(
    () => buildKpiMetrics(
      {
        openCount: summary.openCount,
        closedCount: summary.closedCount,
        availabilityPercent: summary.physicalAvailabilityPercent,
        utilizationPercent: summary.physicalUtilizationPercent,
      },
      t,
    ),
    [summary.closedCount, summary.openCount, summary.physicalAvailabilityPercent, summary.physicalUtilizationPercent, t],
  );

  return (
    <div className="dashboard-kpi-graphs">
      <PieChartCard
        eyebrow={t('dashboard.sections.kpisOverview')}
        title={t('dashboard.labels.total')}
        subtitle={t('dashboard.labels.records', { count: summary.totalRecords })}
        centerValue={formatHours(summary.totalHours, t)}
        centerLabel={t('common.hoursLabel')}
        segments={totalSegments}
        metrics={totalMetrics}
        emptyMessage={t('dashboard.empty.selectedPeriod')}
        footnote={`${summary.periodDays} d · ${formatDuration(summary.periodAvailableMinutes, language)}`}
        className="pie-chart-card--hero"
      />

      <section className="card dashboard-block dashboard-kpi-graphs__group">
        <div className="card__head">
          <div>
            <p className="eyebrow">{t('dashboard.sections.kpisByEquipment')}</p>
            <h2>{t('dashboard.sections.kpisByEquipment')}</h2>
          </div>
        </div>

        {!activeEquipmentBreakdowns.length ? <p className="empty-state">{t('dashboard.empty.selectedPeriod')}</p> : null}

        <div className="dashboard-pie-grid dashboard-pie-grid--kpi">
          {activeEquipmentBreakdowns.map((item) => {
            const equipment = equipmentById.get(item.equipmentId);
            const availabilityPercent = calculateAvailabilityPercent(equipment?.availableMinutes || summary.periodAvailableMinutes, equipment?.maintenanceMinutes);
            const closedCount = calculateClosedCount(equipment);

            return (
              <PieChartCard
                key={item.key}
                eyebrow={`UMR ${item.label}`}
                title={item.label}
                subtitle={`${equipment?.plate || item.subtitle || t('common.noPlate')} · ${t('dashboard.labels.records', { count: equipment?.count || 0 })}`}
                centerValue={formatHours(item.totalHours || 0, t)}
                centerLabel={t('common.hoursLabel')}
                segments={buildEquipmentSegments(item, language, t)}
                metrics={buildKpiMetrics(
                  {
                    openCount: equipment?.openCount || 0,
                    closedCount,
                    availabilityPercent,
                    utilizationPercent: equipment?.utilizationPercent || 0,
                  },
                  t,
                )}
                footnote={getActivityFootnote(equipment?.currentActivityName, t)}
                emptyMessage={t('dashboard.empty.available')}
                className="pie-chart-card--compact"
              />
            );
          })}
        </div>
      </section>

      <AvailabilityUtilizationByEquipment summary={summary} />
    </div>
  );
}
