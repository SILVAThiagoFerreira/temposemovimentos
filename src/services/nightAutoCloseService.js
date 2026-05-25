import { automationConfig } from '../config/runtimeConfig';
import { closeOverdueOpenRecords, getActiveRecords } from './storageService';
import { getNightAutoCloseDeadline, normalizeNightAutoCloseWindow } from '../utils/nightAutoCloseWindow.js';

const DEFAULT_RECHECK_INTERVAL_MS = 5 * 60 * 1000;

let nightAutoCloseCleanup = null;
let nightAutoCloseTimer = null;
let nightAutoCloseIntervalMs = DEFAULT_RECHECK_INTERVAL_MS;
let nightAutoCloseSweepRunning = false;

function clearNightAutoCloseTimer() {
  if (nightAutoCloseTimer) {
    window.clearTimeout(nightAutoCloseTimer);
    nightAutoCloseTimer = null;
  }
}

function getNightAutoCloseSchedule() {
  return normalizeNightAutoCloseWindow(automationConfig?.nightAutoClose);
}

function findNextNightAutoCloseDeadline(schedule, referenceDate = new Date()) {
  const now = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  const deadlines = [];

  for (const record of getActiveRecords()) {
    const deadline = getNightAutoCloseDeadline(record.startDateTime, schedule);

    if (!deadline) {
      continue;
    }

    if (deadline.getTime() <= now.getTime()) {
      return { overdue: true, deadline };
    }

    deadlines.push(deadline);
  }

  deadlines.sort((left, right) => left.getTime() - right.getTime());

  return {
    overdue: false,
    deadline: deadlines[0] || null,
  };
}

function scheduleNextNightAutoClose(intervalMs = nightAutoCloseIntervalMs) {
  if (typeof window === 'undefined') {
    return;
  }

  clearNightAutoCloseTimer();

  const schedule = getNightAutoCloseSchedule();

  if (!schedule.enabled) {
    return;
  }

  const now = new Date();
  const { overdue, deadline } = findNextNightAutoCloseDeadline(schedule, now);

  if (overdue) {
    if (nightAutoCloseSweepRunning) {
      nightAutoCloseTimer = window.setTimeout(() => {
        runNightAutoCloseSweep('retry');
      }, intervalMs);
      return;
    }

    runNightAutoCloseSweep('overdue');
    return;
  }

  const delayMs = deadline ? Math.max(1_000, deadline.getTime() - now.getTime()) : intervalMs;

  nightAutoCloseTimer = window.setTimeout(() => {
    runNightAutoCloseSweep('timer');
  }, delayMs);
}

function runNightAutoCloseSweep(reason = 'night-auto-close') {
  if (nightAutoCloseSweepRunning) {
    return 0;
  }

  const schedule = getNightAutoCloseSchedule();

  if (!schedule.enabled) {
    scheduleNextNightAutoClose(nightAutoCloseIntervalMs);
    return 0;
  }

  nightAutoCloseSweepRunning = true;

  try {
    const closedCount = closeOverdueOpenRecords({ now: new Date(), schedule, reason });
    scheduleNextNightAutoClose(nightAutoCloseIntervalMs);
    return closedCount;
  } catch {
    scheduleNextNightAutoClose(nightAutoCloseIntervalMs);
    return 0;
  } finally {
    nightAutoCloseSweepRunning = false;
  }
}

export function startNightAutoCloseMonitor({ intervalMs = DEFAULT_RECHECK_INTERVAL_MS } = {}) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  if (nightAutoCloseCleanup) {
    return nightAutoCloseCleanup;
  }

  nightAutoCloseIntervalMs = intervalMs;

  const handleStateChange = (event) => {
    if (event?.detail?.scope === 'database') {
      scheduleNextNightAutoClose(nightAutoCloseIntervalMs);
    }
  };

  const handleStorage = () => {
    scheduleNextNightAutoClose(nightAutoCloseIntervalMs);
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      runNightAutoCloseSweep('visibility');
    }
  };

  const handleOnline = () => {
    runNightAutoCloseSweep('online');
  };

  window.addEventListener('temposemovimentos:state-changed', handleStateChange);
  window.addEventListener('storage', handleStorage);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('online', handleOnline);

  runNightAutoCloseSweep('startup');

  nightAutoCloseCleanup = () => {
    clearNightAutoCloseTimer();
    window.removeEventListener('temposemovimentos:state-changed', handleStateChange);
    window.removeEventListener('storage', handleStorage);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('online', handleOnline);
    nightAutoCloseCleanup = null;
  };

  return nightAutoCloseCleanup;
}
