import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { DashboardCards } from '../components/DashboardCards';
import { FleetMapCard } from '../components/FleetMapCard';
import { RecordsTable } from '../components/RecordsTable';
import { StatusChip } from '../components/StatusChip';
import { summarizeDashboard } from '../services/calculationService';
import { formatDate, toDateInputValue } from '../services/timeService';

export function Dashboard() {
  const { records, equipments, activityTypes, shifts, purchases, language, t } = useApp();
  const today = toDateInputValue(new Date());
  const [period, setPeriod] = useState(() => ({ startDate: today, endDate: today }));
  const [tick, setTick] = useState(() => Date.now());
  const isTodayRange = period.startDate === today && period.endDate === today;
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

  const periodLabel = useMemo(() => {
    const startLabel = formatDate(`${period.startDate}T00:00:00`, language);
    const endLabel = formatDate(`${period.endDate}T00:00:00`, language);
    const rangeConnector = { 'pt-BR': 'a', 'en-US': 'to', 'zh-CN': '至' }[language] || '-';

    if (period.startDate === period.endDate) {
      return startLabel;
    }

    return `${startLabel} ${rangeConnector} ${endLabel}`;
  }, [language, period.endDate, period.startDate]);

  const summary = useMemo(
    () =>
      summarizeDashboard({
        records,
        equipments,
        activityTypes,
        shifts,
        purchases,
        periodStart: period.startDate,
        periodEnd: period.endDate,
        referenceDate: new Date(tick),
        locale: language,
      }),
    [activityTypes, equipments, language, period.endDate, period.startDate, purchases, records, shifts, tick],
  );

  const recentRecords = useMemo(
    () => [...summary.periodRecords].slice(0, 12),
    [summary.periodRecords],
  );

  return (
    <div className="page-stack">
      <section className="card page-banner">
        <div>
          <p className="eyebrow">{t('dashboard.banner.eyebrow')}</p>
          <h2>{t('dashboard.banner.title')}</h2>
          <p>{t('dashboard.banner.copy')}</p>
        </div>
        <StatusChip tone={isLiveRange ? 'success' : 'info'}>{isLiveRange ? t('dashboard.filters.live').toUpperCase() : t('dashboard.filters.interval').toUpperCase()}</StatusChip>
      </section>

      <section className="card card--shell dashboard-filters">
        <div className="card__head">
          <div className="dashboard-filters__title">
            <p className="eyebrow">{t('dashboard.filters.eyebrow')}</p>
            <h2>{periodLabel}</h2>
          </div>
          <StatusChip tone={isLiveRange ? 'success' : 'info'}>{isTodayRange ? t('dashboard.filters.today') : isLiveRange ? t('dashboard.filters.live') : t('dashboard.filters.interval')}</StatusChip>
        </div>

        <div className="dashboard-filters__controls">
          <label>
            <span>{t('dashboard.filters.startDate')}</span>
            <input type="date" value={period.startDate} onChange={(event) => updatePeriod('startDate', event.target.value)} />
          </label>

          <label>
            <span>{t('dashboard.filters.endDate')}</span>
            <input type="date" value={period.endDate} onChange={(event) => updatePeriod('endDate', event.target.value)} />
          </label>

          <button className="button button--secondary" type="button" onClick={selectToday}>
            {t('dashboard.filters.today')}
          </button>
        </div>

        {!isTodayRange ? (
          <div className="filter-chips" aria-label={t('dashboard.filters.eyebrow')}>
            <span className="filter-chip">
              <strong>{t('dashboard.filters.eyebrow')}</strong>
              {periodLabel}
              <button
                type="button"
                className="filter-chip__clear"
                onClick={selectToday}
                aria-label={t('dashboard.filters.today')}
              >
                ×
              </button>
            </span>
          </div>
        ) : null}
      </section>

      <FleetMapCard summary={summary} />

      <DashboardCards summary={summary} />

      <section className="card dashboard-recent">
        <div className="card__head">
          <div>
            <p className="eyebrow">{t('dashboard.recent.eyebrow')}</p>
            <h2>{t('dashboard.recent.title')}</h2>
          </div>
        </div>

        <RecordsTable records={recentRecords} emptyMessage={t('dashboard.recent.empty')} />
      </section>
    </div>
  );
}
