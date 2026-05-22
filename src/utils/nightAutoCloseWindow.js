const DEFAULT_NIGHT_AUTO_CLOSE_WINDOW = Object.freeze({
  enabled: true,
  startTime: '19:00',
  endTime: '03:00',
});

function parseClockMinutes(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(value || '').trim());

  if (!match) {
    return null;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

function formatClockTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function startOfLocalDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function buildLocalDateTime(date, minutesOfDay) {
  const next = new Date(date);
  next.setHours(Math.floor(minutesOfDay / 60), minutesOfDay % 60, 0, 0);
  return next;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function normalizeNightAutoCloseWindow(window = DEFAULT_NIGHT_AUTO_CLOSE_WINDOW) {
  const startMinutes = parseClockMinutes(window?.startTime) ?? parseClockMinutes(DEFAULT_NIGHT_AUTO_CLOSE_WINDOW.startTime);
  const endMinutes = parseClockMinutes(window?.endTime) ?? parseClockMinutes(DEFAULT_NIGHT_AUTO_CLOSE_WINDOW.endTime);

  return {
    enabled: window?.enabled !== false,
    startTime: formatClockTime(startMinutes),
    endTime: formatClockTime(endMinutes),
  };
}

export function getNightAutoCloseDeadline(startDateTime, window = DEFAULT_NIGHT_AUTO_CLOSE_WINDOW) {
  const startDate = new Date(startDateTime);

  if (Number.isNaN(startDate.getTime())) {
    return null;
  }

  const normalized = normalizeNightAutoCloseWindow(window);

  if (!normalized.enabled) {
    return null;
  }

  const startMinutes = parseClockMinutes(normalized.startTime);
  const endMinutes = parseClockMinutes(normalized.endTime);

  if (startMinutes === null || endMinutes === null || startMinutes === endMinutes) {
    return null;
  }

  const clockMinutes = startDate.getHours() * 60 + startDate.getMinutes();
  const dayStart = startOfLocalDay(startDate);

  if (startMinutes < endMinutes) {
    if (clockMinutes < startMinutes) {
      return buildLocalDateTime(dayStart, startMinutes);
    }

    if (clockMinutes < endMinutes) {
      return buildLocalDateTime(dayStart, endMinutes);
    }

    return buildLocalDateTime(addDays(dayStart, 1), startMinutes);
  }

  if (clockMinutes >= startMinutes) {
    return buildLocalDateTime(addDays(dayStart, 1), endMinutes);
  }

  if (clockMinutes < endMinutes) {
    return buildLocalDateTime(dayStart, endMinutes);
  }

  return buildLocalDateTime(dayStart, startMinutes);
}
