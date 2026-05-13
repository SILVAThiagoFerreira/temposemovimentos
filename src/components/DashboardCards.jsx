import { StatusChip } from './StatusChip';

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

export function DashboardCards({ summary }) {
  const utilizationAverage = summary.equipmentMetrics.length
    ? summary.equipmentMetrics.reduce((sum, item) => sum + Number(item.utilizationPercent || 0), 0) / summary.equipmentMetrics.length
    : 0;

  return (
    <div className="dashboard-layout">
      <section className="stats-grid">
        <article className="card stat-card stat-card--success">
          <p>Equipamentos ativos agora</p>
          <strong>{summary.activeEquipmentCount}</strong>
          <small>apontamentos em aberto</small>
        </article>
        <article className="card stat-card">
          <p>Total de horas no dia</p>
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
          <p>Eventos em aberto</p>
          <strong>{summary.openCount}</strong>
          <small>precisam de encerramento</small>
        </article>
        <article className="card stat-card">
          <p>Eventos encerrados hoje</p>
          <strong>{summary.closedCount}</strong>
          <small>acompanhamento diário</small>
        </article>
        <article className="card stat-card stat-card--info">
          <p>IU médio da frota</p>
          <strong>{utilizationAverage.toFixed(1)}%</strong>
          <small>com base nos turnos</small>
        </article>
      </section>

      <div className="dashboard-columns">
        <BarList title="Horas por equipamento" items={summary.hoursByEquipment} emptyMessage="Nenhum apontamento para o período." />

        <section className="card dashboard-block">
          <div className="card__head">
            <div>
              <p className="eyebrow">Equipamentos e atividade atual</p>
              <h2>Status ao vivo</h2>
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
      </div>

      <div className="dashboard-columns dashboard-columns--three">
        <BarList title="Tempo por classificação" items={summary.byClassification} emptyMessage="Sem classificações registradas." />
        <BarList title="Tempo por atividade/parada" items={summary.byActivity} emptyMessage="Sem atividades registradas." />
        <BarList title="Ranking de causas" items={summary.topCauses} emptyMessage="Sem causas de parada no período." />
      </div>
    </div>
  );
}
