const ptBrDateTime = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

const ptBrDate = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
});

function pad(value) {
  return String(value).padStart(2, '0');
}

export function parseSafeDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toDateInputValue(value = new Date()) {
  const date = parseSafeDate(value) ?? new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toDateTimeInputValue(value = new Date()) {
  const date = parseSafeDate(value) ?? new Date();

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function formatDate(value) {
  const date = parseSafeDate(value);
  return date ? ptBrDate.format(date) : '-';
}

export function formatDateTime(value) {
  const date = parseSafeDate(value);
  return date ? ptBrDateTime.format(date) : '-';
}

export function formatTime(value) {
  const date = parseSafeDate(value);
  return date
    ? `${pad(date.getHours())}:${pad(date.getMinutes())}`
    : '-';
}

export function isSameDay(left, right = new Date()) {
  const leftDate = parseSafeDate(left);
  const rightDate = parseSafeDate(right);

  if (!leftDate || !rightDate) {
    return false;
  }

  return (
    leftDate.getFullYear() === rightDate.getFullYear() &&
    leftDate.getMonth() === rightDate.getMonth() &&
    leftDate.getDate() === rightDate.getDate()
  );
}

export function differenceMinutes(start, end = new Date()) {
  const startDate = parseSafeDate(start);
  const endDate = parseSafeDate(end);

  if (!startDate || !endDate) {
    return 0;
  }

  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
}

export function minutesToHours(minutes) {
  return Number((Number(minutes || 0) / 60).toFixed(2));
}

export function formatDuration(minutes) {
  const total = Math.max(0, Math.round(Number(minutes || 0)));
  const hours = Math.floor(total / 60);
  const rest = total % 60;

  if (hours === 0) {
    return `${rest} min`;
  }

  if (rest === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${rest}min`;
}

export function toCompactDateTime(value) {
  const date = parseSafeDate(value);
  if (!date) {
    return '-';
  }

  return `${toDateInputValue(date)} ${formatTime(date)}`;
}

export function startOfDay(value = new Date()) {
  const date = parseSafeDate(value) ?? new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function endOfDay(value = new Date()) {
  const date = parseSafeDate(value) ?? new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}
