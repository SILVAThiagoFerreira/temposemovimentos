import { useEffect, useMemo, useState } from 'react';
import { differenceMinutes, formatDateTime, formatDuration } from '../services/timeService';
import { useApp } from '../context/AppContext';

export function ActiveTimer({ startDateTime, endDateTime, title = '', tone = 'success' }) {
  const { language, t } = useApp();
  const [tick, setTick] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const minutes = useMemo(
    () => differenceMinutes(startDateTime, endDateTime || new Date(tick)),
    [endDateTime, startDateTime, tick],
  );
  const resolvedTitle = title || t('timer.title');

  return (
    <div className={`timer-card timer-card--${tone}`}>
      <p>{resolvedTitle}</p>
      <strong>{formatDuration(minutes, language)}</strong>
      <small>
        {endDateTime ? t('timer.ended', { value: formatDateTime(endDateTime, language) }) : t('timer.started', { value: formatDateTime(startDateTime, language) })}
      </small>
    </div>
  );
}
