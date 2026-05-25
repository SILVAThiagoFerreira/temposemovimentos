const formatterCache = new Map();

function getFormatter(locale, options) {
  const normalizedLocale = String(locale || 'pt-BR');
  const cacheKey = `${normalizedLocale}|${JSON.stringify(options)}`;

  if (!formatterCache.has(cacheKey)) {
    formatterCache.set(cacheKey, new Intl.DateTimeFormat(normalizedLocale, options));
  }

  return formatterCache.get(cacheKey);
}

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

export function formatDate(value, locale = 'pt-BR') {
  const date = parseSafeDate(value);
  return date ? getFormatter(locale, { dateStyle: 'short' }).format(date) : '-';
}

export function formatDateTime(value, locale = 'pt-BR') {
  const date = parseSafeDate(value);
  return date ? getFormatter(locale, { dateStyle: 'short', timeStyle: 'short' }).format(date) : '-';
}

export function formatTime(value, locale = 'pt-BR') {
  const date = parseSafeDate(value);
  return date ? getFormatter(locale, { timeStyle: 'short' }).format(date) : '-';
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

export function formatDuration(minutes, locale = 'pt-BR') {
  const total = Math.max(0, Math.round(Number(minutes || 0)));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  const normalizedLocale = String(locale || 'pt-BR');
  const hourLabel = normalizedLocale === 'zh-CN' ? '小时' : 'h';
  const minuteLabel = normalizedLocale === 'zh-CN' ? '分钟' : 'min';
  const compact = normalizedLocale === 'zh-CN';

  if (hours === 0) {
    return compact ? `${rest}${minuteLabel}` : `${rest} ${minuteLabel}`;
  }

  if (rest === 0) {
    return compact ? `${hours}${hourLabel}` : `${hours}${hourLabel}`;
  }

  return compact ? `${hours}${hourLabel}${rest}${minuteLabel}` : `${hours}${hourLabel} ${rest}${minuteLabel}`;
}

export function toCompactDateTime(value, locale = 'pt-BR') {
  const date = parseSafeDate(value);
  if (!date) {
    return '-';
  }

  return `${toDateInputValue(date)} ${formatTime(date, locale)}`;
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
