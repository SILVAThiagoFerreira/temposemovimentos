import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { DashboardCards } from '../components/DashboardCards';
import { FleetMapCard } from '../components/FleetMapCard';
import { RecordsTable } from '../components/RecordsTable';
import { Icon } from '../components/Icon';
import { summarizeDashboard } from '../services/calculationService';
import { toDateInputValue } from '../services/timeService';

export function Dashboard() {
  const { records, equipments, activityTypes, shifts, language, t } = useApp();
  const today = toDateInputValue(new Date());
  const [period, setPeriod] = useState(() => ({ startDate: today, endDate: today }));
  const [tick, setTick] = useState(() => Date.now());
  const isLiveRange = period.startDate <= today && period.endDate >= today;

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), isLiveRange ? 1000 : 60000);
    return () => window.clearInterval(timer);
  }, [isLiveRange]);

  useEffect(() => {
    if (isLiveRange) {
      setTick(Date.now());
    }
  }, [isLiveRange]);

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
        locale: language,
      }),
    [activityTypes, equipments, language, period.endDate, period.startDate, records, shifts, tick],
  );

  const recentRecords = useMemo(() => [...summary.periodRecords].slice(0, 12), [summary.periodRecords]);

  return (
    <div className="page-stack">
      <section className="card dashboard-filters">
        <div className="dashboard-filters__controls">
          <label>
            <span>{t('dashboard.filters.startDate')}</span>
            <input type="date" value={period.startDate} onChange={(event) => updatePeriod('startDate', event.target.value)} aria-label={t('dashboard.filters.startDate')} />
          </label>

          <label>
            <span>{t('dashboard.filters.endDate')}</span>
            <input type="date" value={period.endDate} onChange={(event) => updatePeriod('endDate', event.target.value)} aria-label={t('dashboard.filters.endDate')} />
          </label>

          <button className="icon-button" type="button" onClick={selectToday} aria-label={t('dashboard.filters.today')} title={t('dashboard.filters.today')}>
            <Icon name="calendar" size={18} />
          </button>
        </div>
      </section>

      <FleetMapCard summary={summary} />

      <DashboardCards summary={summary} />

      <section className="card dashboard-recent">
        <RecordsTable records={recentRecords} emptyMessage={t('dashboard.recent.empty')} />
      </section>
    </div>
  );
}
