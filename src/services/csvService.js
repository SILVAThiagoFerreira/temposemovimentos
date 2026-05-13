import { formatDate, formatDateTime, formatTime } from './timeService';

const CSV_HEADERS = [
  'ID',
  'Operador',
  'Turno',
  'Placa',
  'UMB',
  'Local',
  'Código',
  'Atividade',
  'Classificação',
  'Data inicial',
  'Hora inicial',
  'Data final',
  'Hora final',
  'Duração em minutos',
  'Duração em horas',
  'Falha',
  'Ação corretiva',
  'Observações',
  'Status',
  'Criado em',
  'Atualizado em',
];

function escapeCsv(value) {
  const text = String(value ?? '');
  const escaped = text.replace(/"/g, '""');

  if (/[",\n;]/.test(escaped)) {
    return `"${escaped}"`;
  }

  return escaped;
}

function localLocationLabel(value) {
  if (value === 'CHASSI') {
    return 'C - Chassi';
  }

  if (value === 'UNIDADE') {
    return 'U - Unidade';
  }

  return '-';
}

export function recordsToCsv(records = []) {
  const rows = records.map((record) => [
    record.id,
    record.operatorName || '-',
    record.shiftName || '-',
    record.plate || '-',
    record.equipmentCode || '-',
    localLocationLabel(record.location),
    record.activityCode || '-',
    record.activityName || '-',
    record.classification || '-',
    formatDate(record.startDateTime),
    formatTime(record.startDateTime),
    record.endDateTime ? formatDate(record.endDateTime) : '-',
    record.endDateTime ? formatTime(record.endDateTime) : '-',
    record.durationMinutes ?? '-',
    record.durationHours ?? '-',
    record.failureDescription || '-',
    record.correctiveAction || '-',
    record.notes || '-',
    record.status || '-',
    formatDateTime(record.createdAt),
    formatDateTime(record.updatedAt),
  ]);

  return [CSV_HEADERS, ...rows]
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

export function downloadCsv(filename, records = []) {
  const csv = recordsToCsv(records);
  downloadTextFile(filename, csv, 'text/csv;charset=utf-8');
}
