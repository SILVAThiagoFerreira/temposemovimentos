import { differenceMinutes, parseSafeDate } from './dateUtils';

export function isFilled(value) {
  return String(value ?? '').trim().length > 0;
}

export function validateRequiredFields(payload, fields) {
  const errors = {};

  fields.forEach((field) => {
    if (!isFilled(payload[field])) {
      errors[field] = 'Campo obrigatório';
    }
  });

  return errors;
}

export function validateDateRange(startDateTime, endDateTime) {
  const start = parseSafeDate(startDateTime);
  const end = parseSafeDate(endDateTime);

  if (!start) {
    return 'Data/hora inicial inválida';
  }

  if (!end) {
    return 'Data/hora final inválida';
  }

  if (end.getTime() <= start.getTime()) {
    return 'Hora final deve ser maior que a inicial';
  }

  return null;
}

export function validateRecordPayload(payload) {
  const errors = validateRequiredFields(payload, [
    'operatorId',
    'equipmentId',
    'activityTypeId',
    'activityCode',
    'activityName',
    'startDateTime',
  ]);

  if (payload.manualEntry && payload.endDateTime) {
    const rangeError = validateDateRange(payload.startDateTime, payload.endDateTime);
    if (rangeError) {
      errors.endDateTime = rangeError;
    }
  }

  return errors;
}

export function validateShift(payload) {
  const errors = validateRequiredFields(payload, ['name', 'startTime', 'endTime']);

  if (!errors.startTime && !errors.endTime) {
    const [startHour, startMinute] = payload.startTime.split(':').map(Number);
    const [endHour, endMinute] = payload.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const available = endMinutes > startMinutes ? endMinutes - startMinutes : 24 * 60 - startMinutes + endMinutes;

    if (available <= 0) {
      errors.endTime = 'Turno inválido';
    }
  }

  return errors;
}

export function validateNumericMinutes(minutes) {
  return Number.isFinite(Number(minutes)) ? Math.max(0, Number(minutes)) : 0;
}

export function sanitizeText(value) {
  return String(value ?? '').trim();
}

export function hasOpenConflict(records, { operatorId, equipmentId, ignoreRecordId = null }) {
  return records.some((record) => {
    if (ignoreRecordId && record.id === ignoreRecordId) {
      return false;
    }

    return (
      record.status === 'ABERTO' &&
      (record.operatorId === operatorId || record.equipmentId === equipmentId)
    );
  });
}

export function getRecordDurationMinutes(record) {
  if (!record?.startDateTime) {
    return 0;
  }

  if (record.status === 'ABERTO' && !record.endDateTime) {
    return differenceMinutes(record.startDateTime, new Date());
  }

  if (record.endDateTime) {
    return differenceMinutes(record.startDateTime, record.endDateTime);
  }

  return validateNumericMinutes(record.durationMinutes);
}
