import { useEffect, useMemo, useState } from 'react';
import { differenceMinutes, formatDateTime, formatDuration } from '../services/timeService';

export function ActiveTimer({ startDateTime, endDateTime, title = 'Tempo decorrido', tone = 'success' }) {
  const [tick, setTick] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const minutes = useMemo(
    () => differenceMinutes(startDateTime, endDateTime || new Date(tick)),
    [endDateTime, startDateTime, tick],
  );

  return (
    <div className={`timer-card timer-card--${tone}`}>
      <p>{title}</p>
      <strong>{formatDuration(minutes)}</strong>
      <small>
        {endDateTime ? `Encerrado em ${formatDateTime(endDateTime)}` : `Iniciado em ${formatDateTime(startDateTime)}`}
      </small>
    </div>
  );
}
