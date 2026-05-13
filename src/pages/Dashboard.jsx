import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DashboardCards } from '../components/DashboardCards';
import { RecordsTable } from '../components/RecordsTable';
import { StatusChip } from '../components/StatusChip';
import { summarizeDashboard } from '../services/calculationService';

export function Dashboard() {
  const { records, equipments, activityTypes, shifts } = useApp();

  const summary = useMemo(
    () =>
      summarizeDashboard({
        records,
        equipments,
        activityTypes,
        shifts,
        referenceDate: new Date(),
      }),
    [activityTypes, equipments, records, shifts],
  );

  const recentRecords = useMemo(
    () => [...records].slice(0, 12),
    [records],
  );

  return (
    <div className="page-stack">
      <section className="card page-banner">
        <div>
          <p className="eyebrow">Supervisão</p>
          <h2>Dashboard operacional</h2>
          <p>Atualiza automaticamente a cada novo apontamento.</p>
        </div>
        <StatusChip tone="info">Frota UMB / Caminhões</StatusChip>
      </section>

      <DashboardCards summary={summary} />

      <section className="card dashboard-recent">
        <div className="card__head">
          <div>
            <p className="eyebrow">Últimos apontamentos</p>
            <h2>Movimentação recente</h2>
          </div>
        </div>

        <RecordsTable records={recentRecords} emptyMessage="Sem registros para exibir." />
      </section>
    </div>
  );
}
