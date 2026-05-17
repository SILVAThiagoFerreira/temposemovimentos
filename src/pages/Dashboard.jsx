import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { DashboardCards } from '../components/DashboardCards';
import { RecordsTable } from '../components/RecordsTable';
import { StatusChip } from '../components/StatusChip';
import { summarizeDashboard } from '../services/calculationService';
import { formatDate, toDateInputValue } from '../services/timeService';

export function Dashboard() {
  const { records, equipments, activityTypes, shifts } = useApp();
  const today = toDateInputValue(new Date());
  const [period, setPeriod] = useState(() => ({ startDate: today, endDate: today }));
  const [tick, setTick] = useState(() => Date.now());
  const isTodayRange = period.startDate === today && period.endDate === today;

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), isTodayRange ? 1000 : 60000);
    return () => window.clearInterval(timer);
  }, [isTodayRange]);

  useEffect(() => {
    if (isTodayRange) {
      setTick(Date.now());
    }
  }, [isTodayRange]);

  function updatePeriod(field, value) {
    setPeriod((current) => {
      const next = { ...current, [field]: value || today };

      if (next.startDate && next.endDate && next.endDate < next.startDate) {
        if (field === 'startDate') {
          next.endDate = next.startDate;
        } else {
          next.startDate = next.endDate;
        }
      }

      return next;
    });
  }

  function selectToday() {
    setPeriod({ startDate: today, endDate: today });
  }

  const periodLabel = useMemo(() => {
    const startLabel = formatDate(`${period.startDate}T00:00:00`);
    const endLabel = formatDate(`${period.endDate}T00:00:00`);

    if (period.startDate === period.endDate) {
      return startLabel;
    }

    return `${startLabel} a ${endLabel}`;
  }, [period.endDate, period.startDate]);

  const summary = useMemo(
    () =>
      summarizeDashboard({
        records,
        equipments,
        activityTypes,
        shifts,
        periodStart: period.startDate,
        periodEnd: period.endDate,
        referenceDate: new Date(tick),
      }),
    [activityTypes, equipments, period.endDate, period.startDate, records, shifts, tick],
  );

  const recentRecords = useMemo(
    () => [...summary.periodRecords].slice(0, 12),
    [summary.periodRecords],
  );

  return (
    <div className="page-stack">
      <section className="card page-banner">
        <div>
          <p className="eyebrow">Live operations</p>
          <h2>Fleet dashboard</h2>
          <p>Availability, utilization and downtime.</p>
        </div>
        <StatusChip tone={isTodayRange ? 'success' : 'info'}>{isTodayRange ? 'AO VIVO' : 'INTERVALO'}</StatusChip>
      </section>

      <section className="card card--shell dashboard-filters">
        <div className="card__head">
          <div className="dashboard-filters__title">
            <p className="eyebrow">Analysis window</p>
            <h2>{periodLabel}</h2>
          </div>
          <StatusChip tone={isTodayRange ? 'success' : 'info'}>{isTodayRange ? 'Today' : 'Range'}</StatusChip>
        </div>

        <div className="dashboard-filters__controls">
          <label>
            <span>Data inicial</span>
            <input type="date" value={period.startDate} onChange={(event) => updatePeriod('startDate', event.target.value)} />
          </label>

          <label>
            <span>Data final</span>
            <input type="date" value={period.endDate} onChange={(event) => updatePeriod('endDate', event.target.value)} />
          </label>

          <button className="button button--secondary" type="button" onClick={selectToday}>
            Hoje
          </button>
        </div>
      </section>

      <DashboardCards summary={summary} />

      <section className="card dashboard-recent">
        <div className="card__head">
          <div>
            <p className="eyebrow">Últimos apontamentos</p>
            <h2>Movimentação do período</h2>
          </div>
        </div>

        <RecordsTable records={recentRecords} emptyMessage="Sem registros para exibir." />
      </section>
    </div>
  );
}
