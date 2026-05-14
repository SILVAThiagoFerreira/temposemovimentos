import { StatusChip } from './StatusChip';
import { formatDuration } from '../services/timeService';
import { formatUtilization } from '../services/calculationService';
import { PieChartCard } from './PieChartCard';

function formatHours(value) {
  return `${Number(value || 0).toFixed(2)} h`;
}

function BarList({ title, items, emptyMessage }) {
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
                <strong>{item.label || item.classification || item.name || item.code || 'Sem título'}</strong>
                <small>{item.subtitle || item.code || item.classification || item.name || ''}</small>
              </div>
              <div className="bar-list__track">
                <span style={{ width: `${width}%` }} />
              </div>
              <div className="bar-list__value">
                <strong>{formatHours(item.hours ?? (item.minutes || 0) / 60)}</strong>
                <small>{item.count ? `${item.count} eventos` : `${item.minutes || 0} min`}</small>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StackedBarList({ title, items, emptyMessage }) {
  const max = Math.max(...items.map((item) => item.totalMinutes || 0), 0);

  return (
    <section className="card dashboard-block dashboard-block--wide">
      <div className="card__head">
        <div>
          <p className="eyebrow">{title}</p>
          <h2>Detalhe por UMR</h2>
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
                  <strong>{item.label || 'Sem código'}</strong>
                  <small>{item.subtitle || 'Sem placa'}</small>
                </div>
                <div className="stacked-list__value">
                  <strong>{formatHours(item.totalHours || totalMinutes / 60)}</strong>
                  <small>Gap principal: {item.mainGapLabel || '-'}</small>
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
                      title={`${segment.label}: ${formatDuration(segment.minutes)}`}
                    />
                  ) : null;
                })}
              </div>

              <div className="stacked-list__meta">
                {item.segments.map((segment) => (
                  <span key={segment.key}>
                    <strong>{segment.label}</strong>
                    <small>{formatDuration(segment.minutes)}</small>
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

function TargetBarList({ title, items, emptyMessage, targetLabel = 'Meta' }) {
  const max = Math.max(...items.map((item) => item.targetMinutes || 60), 60);

  return (
    <section className="card dashboard-block">
      <div className="card__head">
        <div>
          <p className="eyebrow">{title}</p>
          <h2>Aderência à refeição</h2>
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
                <strong>{item.label || 'Sem título'}</strong>
                <small>{item.subtitle || `${targetLabel} ${formatDuration(targetMinutes)}`}</small>
              </div>
              <div className="target-list__track">
                <span style={{ width: `${Math.min(100, width)}%` }} />
              </div>
              <div className="target-list__value">
                <strong>{formatDuration(item.minutes || 0)}</strong>
                <small>{targetLabel} {formatDuration(targetMinutes)}</small>
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
  const utilizationAverage = summary.equipmentMetrics.length
    ? summary.equipmentMetrics.reduce((sum, item) => sum + Number(item.utilizationPercent || 0), 0) / summary.equipmentMetrics.length
    : 0;

  return (
    <div className="dashboard-layout">
      <section className="stats-grid">
        <article className="card stat-card stat-card--success">
          <p>Apontamentos em aberto</p>
          <strong>{summary.activeEquipmentCount}</strong>
          <small>no período selecionado</small>
        </article>
        <article className="card stat-card">
          <p>Total de horas no período</p>
          <strong>{summary.totalHours.toFixed(2)} h</strong>
          <small>{summary.totalRecords} registros</small>
        </article>
        <article className="card stat-card stat-card--danger">
          <p>Tempo parado</p>
          <strong>{summary.stopHours.toFixed(2)} h</strong>
          <small>manutenção + ociosidade</small>
        </article>
        <article className="card stat-card stat-card--warning">
          <p>Tempo de manutenção</p>
          <strong>{summary.maintenanceHours.toFixed(2)} h</strong>
          <small>eventos críticos</small>
        </article>
        <article className="card stat-card">
          <p>Registros encerrados</p>
          <strong>{summary.closedCount}</strong>
          <small>no período selecionado</small>
        </article>
        <article className="card stat-card">
          <p>Disponibilidade física</p>
          <strong>{formatUtilization(summary.physicalAvailabilityPercent)}</strong>
          <small>consolidada do período</small>
        </article>
        <article className="card stat-card stat-card--info">
          <p>IU médio da frota</p>
          <strong>{utilizationAverage.toFixed(1)}%</strong>
          <small>no período selecionado</small>
        </article>
      </section>

      <section className="card dashboard-block">
        <div className="card__head">
          <div>
            <p className="eyebrow">Equipamentos e atividade</p>
            <h2>Atividade por UMR</h2>
          </div>
        </div>

        {!summary.equipmentMetrics.length ? <p className="empty-state">Sem dados disponíveis.</p> : null}

        <div className="equipment-status-list">
          {summary.equipmentMetrics.map((item) => (
            <article key={item.equipmentId} className="equipment-status-item">
              <div>
                <strong>{item.code}</strong>
                <p>{item.plate}</p>
              </div>
              <div>
                <small>Atividade atual</small>
                <p>{item.currentActivityName || '-'}</p>
              </div>
              <div>
                <small>Horas</small>
                <p>{formatHours(item.hours ?? item.minutes / 60)}</p>
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
            <p className="eyebrow">Indicadores físicos</p>
            <h2>Disponibilidade e utilização</h2>
          </div>
        </div>

        <div className="dashboard-pie-grid dashboard-pie-grid--two">
          <PieChartCard
            eyebrow="Disponibilidade física"
            title="Disponibilidade física"
            subtitle="Disponível x manutenção"
            centerValue={formatUtilization(summary.physicalAvailabilityPercent)}
            centerLabel="do período"
            segments={summary.physicalAvailabilitySegments}
            footnote={`Base de ${summary.periodDays} dia(s) e ${summary.periodAvailableMinutes} min disponíveis.`}
          />

          <PieChartCard
            eyebrow="Utilização física"
            title="Utilização física"
            subtitle="Operação x demais tempos"
            centerValue={formatUtilization(summary.physicalUtilizationPercent)}
            centerLabel="do período"
            segments={summary.physicalUtilizationSegments}
            footnote={`Base de ${summary.periodDays} dia(s) e ${summary.periodAvailableMinutes} min disponíveis.`}
          />
        </div>
      </section>

      <section className="card dashboard-block">
        <div className="card__head">
          <div>
            <p className="eyebrow">Códigos por UMR</p>
            <h2>Quantidade e percentual por código</h2>
          </div>
        </div>

        {!summary.codeDistributionByEquipment.length ? <p className="empty-state">Sem dados no período selecionado.</p> : null}

        <div className="dashboard-pie-grid">
          {summary.codeDistributionByEquipment.map((item) => (
            <PieChartCard
              key={item.key}
              eyebrow={`UMR ${item.label}`}
              title={item.label}
              subtitle={item.subtitle}
              centerValue={String(item.totalCount)}
              centerLabel="registros"
              segments={item.segments}
              emptyMessage="Sem registros no período selecionado."
              footnote="Quantidade e percentual de cada código no período selecionado."
              className="pie-chart-card--compact"
            />
          ))}
        </div>
      </section>

      <div className="dashboard-columns">
        <BarList
          title="Manutenção por UMR"
          items={summary.maintenanceByEquipment}
          emptyMessage="Sem manutenção registrada."
        />

        <BarList
          title="Manutenção por atividade"
          items={summary.maintenanceByActivity}
          emptyMessage="Sem manutenção registrada."
        />
      </div>

      <div className="dashboard-columns">
        <TargetBarList
          title="Refeição diária (1h)"
          items={summary.mealAdherenceByEquipment}
          emptyMessage="Sem refeição registrada no período."
          targetLabel="Meta"
        />

        <BarList
          title="Gaps críticos"
          items={summary.criticalGapActivities}
          emptyMessage="Sem gaps críticos no período."
        />
      </div>
    </div>
  );
}
