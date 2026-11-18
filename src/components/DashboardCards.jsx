import { StatusChip } from './StatusChip';
import { formatDuration } from '../services/timeService';
import { formatUtilization } from '../services/calculationService';
import { useApp } from '../context/AppContext';

// Cores Enaex para composição: vermelho no maior destaque, cinzas para o restante.
const MIX_COLORS = ['#E20613', '#38424B', '#8B949E', '#C5CAD0', '#6C7680', '#E8A3A8', '#2D5F8B', '#E3E6EA'];

// Cores com significado nas rosquinhas: disponível/operação em cinza ou vermelho, o resto em cinza claro.
const SEGMENT_COLORS = {
  available: '#38424B',
  maintenance: '#E20613',
  operation: '#E20613',
  rest: '#D5DAE0',
};

function segmentColor(segment, index) {
  return SEGMENT_COLORS[segment.key] || MIX_COLORS[index % MIX_COLORS.length];
}

function hoursOf(minutes) {
  return `${(Number(minutes || 0) / 60).toFixed(2)} h`;
}

function stopMinutesOf(item) {
  return Number(item.maintenanceMinutes || 0) + Number(item.idleMinutes || 0) + Number(item.otherMinutes || 0);
}

function availabilityOf(item, fallbackAvailable) {
  const available = Number(item.availableMinutes || fallbackAvailable || 0);
  if (!available) {
    return 0;
  }
  return Math.max(0, ((available - Number(item.maintenanceMinutes || 0)) / available) * 100);
}

function utilizationTone(percent) {
  if (percent >= 75) return 'success';
  if (percent >= 50) return 'warning';
  return 'danger';
}

function Panel({ title, children, className = '' }) {
  return (
    <section className={`card panel ${className}`.trim()}>
      {title ? (
        <header className="panel__head">
          <h2>{title}</h2>
        </header>
      ) : null}
      {children}
    </section>
  );
}

function KpiStrip({ summary, t }) {
  const utilizationAverage = summary.equipmentMetrics.length
    ? summary.equipmentMetrics.reduce((sum, item) => sum + Number(item.utilizationPercent || 0), 0) / summary.equipmentMetrics.length
    : 0;

  const tiles = [
    { key: 'open', label: t('dashboard.cards.open'), value: String(summary.openCount) },
    { key: 'hours', label: t('dashboard.cards.totalHours'), value: `${Number(summary.totalHours || 0).toFixed(2)} h` },
    { key: 'stop', label: t('dashboard.cards.stop'), value: `${Number(summary.stopHours || 0).toFixed(2)} h`, tone: 'danger' },
    { key: 'maintenance', label: t('dashboard.cards.maintenance'), value: `${Number(summary.maintenanceHours || 0).toFixed(2)} h` },
    { key: 'closed', label: t('dashboard.cards.closed'), value: String(summary.closedCount) },
    { key: 'availability', label: t('dashboard.cards.physicalAvailability'), value: formatUtilization(summary.physicalAvailabilityPercent) },
    { key: 'iu', label: t('dashboard.cards.fleetIU'), value: `${utilizationAverage.toFixed(1)}%` },
  ];

  return (
    <section className="kpi-strip" aria-label={t('dashboard.sections.kpisOverview')}>
      {tiles.map((tile) => (
        <article key={tile.key} className={`kpi ${tile.tone ? `kpi--${tile.tone}` : ''}`.trim()}>
          <span className="kpi__label">{tile.label}</span>
          <strong className="kpi__value">{tile.value}</strong>
        </article>
      ))}
    </section>
  );
}

function EquipmentKpiTable({ summary, t }) {
  const columns = [
    t('registrations.equipment.code'),
    t('registrations.equipment.plate'),
    t('dashboard.cards.open'),
    t('dashboard.cards.totalHours'),
    t('dashboard.cards.stop'),
    t('dashboard.cards.maintenance'),
    t('dashboard.cards.closed'),
    t('dashboard.cards.physicalAvailability'),
    t('dashboard.cards.fleetIU'),
  ];

  return (
    <Panel title={t('dashboard.sections.kpisByEquipment')}>
      <div className="table-wrap">
        <table className="records-table kpi-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summary.equipmentMetrics.map((item) => {
              const availability = availabilityOf(item, summary.periodAvailableMinutes);
              const utilization = Number(item.utilizationPercent || 0);

              return (
                <tr key={item.equipmentId}>
                  <td data-label={columns[0]}>
                    <strong>{item.code}</strong>
                  </td>
                  <td data-label={columns[1]}>{item.plate}</td>
                  <td data-label={columns[2]}>{item.openCount}</td>
                  <td data-label={columns[3]}>{hoursOf(item.totalMinutes)}</td>
                  <td data-label={columns[4]}>{hoursOf(stopMinutesOf(item))}</td>
                  <td data-label={columns[5]}>{hoursOf(item.maintenanceMinutes)}</td>
                  <td data-label={columns[6]}>{Math.max(0, Number(item.count || 0) - Number(item.openCount || 0))}</td>
                  <td data-label={columns[7]}>{availability.toFixed(1)}%</td>
                  <td data-label={columns[8]}>
                    <StatusChip tone={utilizationTone(utilization)}>{formatUtilization(item.utilizationPercent)}</StatusChip>
                  </td>
                </tr>
              );
            })}
            <tr className="kpi-table__total">
              <td data-label={columns[0]}>
                <strong>{t('dashboard.labels.total')}</strong>
              </td>
              <td data-label={columns[1]} />
              <td data-label={columns[2]}>
                <strong>{summary.openCount}</strong>
              </td>
              <td data-label={columns[3]}>
                <strong>{`${Number(summary.totalHours || 0).toFixed(2)} h`}</strong>
              </td>
              <td data-label={columns[4]}>
                <strong>{`${Number(summary.stopHours || 0).toFixed(2)} h`}</strong>
              </td>
              <td data-label={columns[5]}>
                <strong>{`${Number(summary.maintenanceHours || 0).toFixed(2)} h`}</strong>
              </td>
              <td data-label={columns[6]}>
                <strong>{summary.closedCount}</strong>
              </td>
              <td data-label={columns[7]}>
                <strong>{formatUtilization(summary.physicalAvailabilityPercent)}</strong>
              </td>
              <td data-label={columns[8]}>
                <strong>{formatUtilization(summary.physicalUtilizationPercent)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function CodeMix({ summary, t }) {
  const items = summary.codeDistributionByEquipment;

  return (
    <Panel title={t('dashboard.sections.codesByEquipment')}>
      {!items.length ? <p className="empty-state">{t('dashboard.empty.selectedPeriod')}</p> : null}
      <div className="mix-list">
        {items.map((item) => (
          <article key={item.key} className="mix-row">
            <div className="mix-row__id">
              <strong>{item.label}</strong>
              <span>{item.subtitle}</span>
            </div>
            <div className="mix-row__body">
              <div className="mix-bar" role="img" aria-label={item.label}>
                {item.segments.map((segment, index) => (
                  <span
                    key={segment.key}
                    style={{ flexGrow: Math.max(segment.value, 0.0001), background: MIX_COLORS[index % MIX_COLORS.length] }}
                    title={`${segment.label} · ${Number(segment.percent || 0).toFixed(1)}%`}
                  />
                ))}
              </div>
              <ul className="mix-legend">
                {item.segments.map((segment, index) => (
                  <li key={segment.key}>
                    <i style={{ background: MIX_COLORS[index % MIX_COLORS.length] }} />
                    <span>{segment.label}</span>
                    <b>{Number(segment.percent || 0).toFixed(1)}%</b>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mix-row__count">
              <strong>{item.totalCount}</strong>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function ActivityTable({ summary, t }) {
  const columns = [t('registrations.equipment.code'), t('registrations.equipment.plate'), t('common.operation'), t('common.hoursLabel'), t('dashboard.cards.fleetIU')];

  return (
    <Panel title={t('dashboard.sections.activityByEquipment')}>
      {!summary.equipmentMetrics.length ? <p className="empty-state">{t('dashboard.empty.available')}</p> : null}
      {summary.equipmentMetrics.length ? (
        <div className="table-wrap">
          <table className="records-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column} scope="col">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.equipmentMetrics.map((item) => {
                const utilization = Number(item.utilizationPercent || 0);
                return (
                  <tr key={item.equipmentId}>
                    <td data-label={columns[0]}>
                      <strong>{item.code}</strong>
                    </td>
                    <td data-label={columns[1]}>{item.plate}</td>
                    <td data-label={columns[2]}>{item.currentActivityName || '-'}</td>
                    <td data-label={columns[3]}>{hoursOf(item.totalMinutes)}</td>
                    <td data-label={columns[4]}>
                      <StatusChip tone={utilizationTone(utilization)}>{formatUtilization(utilization)}</StatusChip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </Panel>
  );
}

function Donut({ title, segments, centerValue, language }) {
  const total = segments.reduce((sum, segment) => sum + Number(segment.value || 0), 0);
  let cursor = 0;
  const stops = segments.map((segment, index) => {
    const share = total > 0 ? (Number(segment.value || 0) / total) * 100 : 0;
    const start = cursor;
    cursor += share;
    return `${segmentColor(segment, index)} ${start}% ${cursor}%`;
  });

  return (
    <div className="donut">
      <div className="donut__ring" style={{ background: total > 0 ? `conic-gradient(${stops.join(', ')})` : 'var(--surface-alt)' }} role="img" aria-label={title}>
        <div className="donut__center">
          <strong>{centerValue}</strong>
        </div>
      </div>
      <ul className="donut__legend">
        {segments.map((segment, index) => (
          <li key={segment.key}>
            <i style={{ background: segmentColor(segment, index) }} />
            <span>{segment.label}</span>
            <b>{segment.detail || formatDuration(segment.value, language)}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BarRows({ items, emptyMessage, language, labelOf, subOf, valueOf, maxOverride = null }) {
  const max = maxOverride || Math.max(...items.map((item) => valueOf(item)), 0);

  if (!items.length) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  return (
    <div className="bar-rows">
      {items.map((item) => {
        const value = valueOf(item);
        const width = max > 0 ? Math.max(3, (value / max) * 100) : 0;
        return (
          <div key={item.key || labelOf(item)} className="bar-row">
            <div className="bar-row__label">
              <strong>{labelOf(item)}</strong>
              {subOf(item) ? <span>{subOf(item)}</span> : null}
            </div>
            <div className="bar-row__track">
              <span style={{ width: `${width}%` }} />
            </div>
            <strong className="bar-row__value">{formatDuration(value, language)}</strong>
          </div>
        );
      })}
    </div>
  );
}

function MealRows({ items, emptyMessage, language, targetLabel }) {
  if (!items.length) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  return (
    <div className="bar-rows">
      {items.map((item) => {
        const target = Number(item.targetMinutes || 60);
        const width = Math.min(100, (Number(item.minutes || 0) / target) * 100);
        const tone = item.tone || (item.adherencePercent >= 100 ? 'success' : item.adherencePercent >= 80 ? 'warning' : 'danger');
        return (
          <div key={item.key || item.label} className="bar-row bar-row--meal">
            <div className="bar-row__label">
              <strong>{item.label}</strong>
              <span>{targetLabel} {formatDuration(target, language)}</span>
            </div>
            <div className="bar-row__track">
              <span className={`bar-row__fill bar-row__fill--${tone}`} style={{ width: `${width}%` }} />
            </div>
            <div className="bar-row__end">
              <strong>{formatDuration(item.minutes || 0, language)}</strong>
              <StatusChip tone={tone}>{Number(item.adherencePercent || 0).toFixed(0)}%</StatusChip>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DashboardCards({ summary }) {
  const { language, t } = useApp();
  const availabilitySegments = summary.physicalAvailabilitySegments;
  const utilizationSegments = summary.physicalUtilizationSegments;

  return (
    <div className="dashboard">
      <KpiStrip summary={summary} t={t} />

      <EquipmentKpiTable summary={summary} t={t} />

      <CodeMix summary={summary} t={t} />

      <ActivityTable summary={summary} t={t} />

      <Panel title={t('dashboard.sections.availabilityAndUtilization')}>
        <div className="donut-grid">
          <Donut
            title={t('dashboard.cards.physicalAvailability')}
            segments={availabilitySegments}
            centerValue={formatUtilization(summary.physicalAvailabilityPercent)}
            language={language}
          />
          <Donut
            title={t('dashboard.sections.availabilityAndUtilization')}
            segments={utilizationSegments}
            centerValue={formatUtilization(summary.physicalUtilizationPercent)}
            language={language}
          />
        </div>
      </Panel>

      <div className="dashboard-grid">
        <Panel title={t('dashboard.sections.maintenanceByEquipment')}>
          <BarRows
            items={summary.maintenanceByEquipment}
            emptyMessage={t('dashboard.empty.maintenance')}
            language={language}
            labelOf={(item) => item.label || t('common.noTitle')}
            subOf={(item) => item.subtitle || ''}
            valueOf={(item) => Number(item.minutes || 0)}
          />
        </Panel>

        <Panel title={t('dashboard.sections.maintenanceByActivity')}>
          <BarRows
            items={summary.maintenanceByActivity}
            emptyMessage={t('dashboard.empty.maintenance')}
            language={language}
            labelOf={(item) => item.label || item.classification || item.name || item.code || t('common.noTitle')}
            subOf={(item) => item.subtitle || ''}
            valueOf={(item) => Number(item.minutes || 0)}
          />
        </Panel>

        <Panel title={t('dashboard.sections.mealDaily')}>
          <MealRows
            items={summary.mealAdherenceByEquipment}
            emptyMessage={t('dashboard.empty.meal')}
            language={language}
            targetLabel={t('common.target')}
          />
        </Panel>

        <Panel title={t('dashboard.sections.criticalIntervals')}>
          <BarRows
            items={summary.criticalGapActivities}
            emptyMessage={t('dashboard.empty.critical')}
            language={language}
            labelOf={(item) => item.label || item.classification || item.name || item.code || t('common.noTitle')}
            subOf={(item) => item.subtitle || ''}
            valueOf={(item) => Number(item.minutes || 0)}
          />
        </Panel>
      </div>
    </div>
  );
}
