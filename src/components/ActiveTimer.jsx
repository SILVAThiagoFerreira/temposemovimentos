import { useEffect, useMemo, useState } from 'react';
import { differenceMinutes, formatDuration } from '../services/timeService';
import { useApp } from '../context/AppContext';

export function ActiveTimer({ startDateTime, endDateTime }) {
  const { language } = useApp();
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
    <div className="timer-card">
      <strong>{formatDuration(minutes, language)}</strong>
    </div>
  );
}
