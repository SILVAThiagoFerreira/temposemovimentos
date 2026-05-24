import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatDuration } from '../services/timeService';
import { formatUtilization } from '../services/calculationService';
import { PieChartCard } from './PieChartCard';

const SEGMENT_COLORS = {
  OPERAÇÃO: '#ed0016',
  MANUTENÇÃO: '#b97909',
  OCIOSIDADE: '#6e7d92',
  OUTROS: '#2f6da8',
  operation: '#ed0016',
  maintenance: '#b97909',
  meal: '#168255',
  gaps: '#9e0012',
  idle: '#6e7d92',
  other: '#2f6da8',
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
    </div>
  );
}
