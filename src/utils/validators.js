import { DEFAULT_LOCALE, createTranslator } from '../i18n/messages.js';
import { differenceMinutes, parseSafeDate } from './dateUtils';

export function isFilled(value) {
  return String(value ?? '').trim().length > 0;
}

function resolveTranslator(translate) {
  return typeof translate === 'function' ? translate : createTranslator(DEFAULT_LOCALE);
}

export function validateRequiredFields(payload, fields, translate) {
  const t = resolveTranslator(translate);
  const errors = {};

  fields.forEach((field) => {
    if (!isFilled(payload[field])) {
      errors[field] = t('movement.errors.requiredField');
    }
  });

  return errors;
}

export function validateDateRange(startDateTime, endDateTime, translate) {
  const t = resolveTranslator(translate);
  const start = parseSafeDate(startDateTime);
  const end = parseSafeDate(endDateTime);

  if (!start) {
    return t('movement.errors.invalidStartDateTime');
  }

  if (!end) {
    return t('movement.errors.invalidEndDateTime');
  }

  if (end.getTime() <= start.getTime()) {
    return t('movement.errors.endAfterStart');
  }

  return null;
}

export function validateRecordPayload(payload, translate) {
  const errors = validateRequiredFields(payload, [
    'operatorId',
    'equipmentId',
    'activityTypeId',
    'activityCode',
    'activityName',
    'startDateTime',
  ], translate);

  if (payload.manualEntry && payload.endDateTime) {
    const rangeError = validateDateRange(payload.startDateTime, payload.endDateTime, translate);
    if (rangeError) {
      errors.endDateTime = rangeError;
    }
  }

  return errors;
}

export function validateShift(payload, translate) {
  const t = resolveTranslator(translate);
  const errors = validateRequiredFields(payload, ['name', 'startTime', 'endTime'], translate);

  if (!errors.startTime && !errors.endTime) {
    const [startHour, startMinute] = payload.startTime.split(':').map(Number);
    const [endHour, endMinute] = payload.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const available = endMinutes > startMinutes ? endMinutes - startMinutes : 24 * 60 - startMinutes + endMinutes;

    if (available <= 0) {
      errors.endTime = t('movement.errors.invalidShift');
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
