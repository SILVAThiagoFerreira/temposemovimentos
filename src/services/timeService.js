import { differenceMinutes, endOfDay, formatDate, formatDateTime, formatDuration, formatTime, isSameDay, minutesToHours, parseSafeDate, startOfDay, toDateInputValue, toDateTimeInputValue } from '../utils/dateUtils.js';

export {
  differenceMinutes,
  endOfDay,
  formatDate,
  formatDateTime,
  formatDuration,
  formatTime,
  isSameDay,
  minutesToHours,
  parseSafeDate,
  startOfDay,
  toDateInputValue,
  toDateTimeInputValue,
};

export function nowIso() {
  return new Date().toISOString();
}

export function nowDateTimeInputValue() {
  return toDateTimeInputValue(new Date());
}

export function nowDateInputValue() {
  return toDateInputValue(new Date());
}

export function toMinutesHoursLabel(minutes) {
  return `${minutesToHours(minutes).toFixed(2)} h`;
}
