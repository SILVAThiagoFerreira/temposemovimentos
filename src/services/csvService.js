import { createTranslator, DEFAULT_LOCALE } from '../i18n/messages.js';
import { formatDate, formatDateTime, formatTime } from './timeService';

function escapeCsv(value) {
  const text = String(value ?? '');
  const escaped = text.replace(/"/g, '""');

  if (/[",\n;]/.test(escaped)) {
    return `"${escaped}"`;
  }

  return escaped;
}

export function recordsToCsv(records = [], locale = DEFAULT_LOCALE) {
  const t = createTranslator(locale);
  const headers = [
    t('csv.headers.id'),
    t('csv.headers.operator'),
    t('csv.headers.plate'),
    t('csv.headers.equipment'),
    t('csv.headers.code'),
    t('csv.headers.activity'),
    t('csv.headers.startDate'),
    t('csv.headers.startTime'),
    t('csv.headers.endDate'),
    t('csv.headers.endTime'),
    t('csv.headers.durationMinutes'),
    t('csv.headers.durationHours'),
    t('csv.headers.notes'),
    t('csv.headers.status'),
    t('csv.headers.createdAt'),
    t('csv.headers.updatedAt'),
  ];

  const rows = records.map((record) => [
    record.id,
    record.operatorName || '-',
    record.plate || '-',
    record.equipmentCode || '-',
    record.activityCode || '-',
    record.activityName || '-',
    formatDate(record.startDateTime, locale),
    formatTime(record.startDateTime, locale),
    record.endDateTime ? formatDate(record.endDateTime, locale) : '-',
    record.endDateTime ? formatTime(record.endDateTime, locale) : '-',
    record.durationMinutes ?? '-',
    record.durationHours ?? '-',
    record.notes || '-',
    record.status || '-',
    formatDateTime(record.createdAt, locale),
    formatDateTime(record.updatedAt, locale),
  ]);

  return [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\r\n');
}

export function downloadTextFile(filename, content, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadCsv(filename, records = [], locale = DEFAULT_LOCALE) {
  const csv = recordsToCsv(records, locale);
  downloadTextFile(filename, csv, 'text/csv;charset=utf-8');
}
