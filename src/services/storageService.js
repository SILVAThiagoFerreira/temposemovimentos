import { initialActivityTypes } from '../data/initialActivityTypes';
import { initialEquipments } from '../data/initialEquipments';
import { initialShifts } from '../data/initialShifts';
import { initialUsers } from '../data/initialUsers';
import { createId } from '../utils/id';
import { differenceMinutes, minutesToHours, nowIso } from './timeService';

const DB_KEY = 'temposemovimentos-db';
const SESSION_KEY = 'temposemovimentos-session';
const DB_VERSION = 1;

function cloneItems(items) {
  return items.map((item) => ({ ...item }));
}

function mergeMissingSeedUsers(users) {
  const existingIds = new Set(users.map((user) => user.id));
  const missingUsers = initialUsers.filter((user) => !existingIds.has(user.id));
  return [...cloneItems(missingUsers), ...users];
}

function createInitialDatabase() {
  return {
    version: DB_VERSION,
    operators: cloneItems(initialUsers),
    equipments: cloneItems(initialEquipments),
    activityTypes: cloneItems(initialActivityTypes),
    shifts: cloneItems(initialShifts),
    movementRecords: [],
    settings: {
      storageMode: 'LOCAL',
      defaultShiftId: initialShifts[0]?.id ?? null,
      userCatalogSeeded: true,
      updatedAt: nowIso(),
    },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

function safeReadJson(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeWriteJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function emitChange(detail = {}) {
  window.dispatchEvent(
    new CustomEvent('temposemovimentos:state-changed', {
      detail: {
        at: nowIso(),
        ...detail,
      },
    }),
  );
}

function normalizeOperator(operator = {}) {
  const shiftName =
    String(operator.shiftName || '').trim() ||
    initialShifts.find((shift) => shift.id === operator.shiftId)?.name ||
    '';

  return {
    id: operator.id || createId('op'),
    name: String(operator.name || '').trim(),
    registration: String(operator.registration || '').trim(),
    role: String(operator.role || 'OPERADOR').trim().toUpperCase(),
    password: String(operator.password ?? '1234').trim(),
    shiftId: operator.shiftId || null,
    shiftName,
    active: operator.active !== false,
    createdAt: operator.createdAt || nowIso(),
    updatedAt: operator.updatedAt || operator.createdAt || nowIso(),
  };
}

function normalizeEquipment(equipment = {}) {
  return {
    id: equipment.id || createId('eq'),
    plate: String(equipment.plate || '').trim().toUpperCase(),
    code: String(equipment.code || '').trim().toUpperCase(),
    description: String(equipment.description || '').trim(),
    active: equipment.active !== false,
    createdAt: equipment.createdAt || nowIso(),
    updatedAt: equipment.updatedAt || equipment.createdAt || nowIso(),
  };
}

function normalizeActivityType(activityType = {}) {
  return {
    id: activityType.id || createId('act'),
    code: String(activityType.code || '').trim(),
    name: String(activityType.name || '').trim(),
    classification: String(activityType.classification || 'OUTROS').trim().toUpperCase(),
    defaultLocation: activityType.defaultLocation || null,
    active: activityType.active !== false,
    createdAt: activityType.createdAt || nowIso(),
    updatedAt: activityType.updatedAt || activityType.createdAt || nowIso(),
  };
}

function normalizeShift(shift = {}) {
  const startTime = String(shift.startTime || '').trim();
  const endTime = String(shift.endTime || '').trim();

  return {
    id: shift.id || createId('shift'),
    name: String(shift.name || '').trim(),
    startTime,
    endTime,
    availableMinutes:
      Number.isFinite(Number(shift.availableMinutes)) && Number(shift.availableMinutes) > 0
        ? Number(shift.availableMinutes)
        : 480,
    active: shift.active !== false,
    createdAt: shift.createdAt || nowIso(),
    updatedAt: shift.updatedAt || shift.createdAt || nowIso(),
  };
}

function normalizeSettings(settings = {}) {
  return {
    storageMode: String(settings.storageMode || 'LOCAL').toUpperCase(),
    defaultShiftId: settings.defaultShiftId || initialShifts[0]?.id || null,
    userCatalogSeeded: settings.userCatalogSeeded === true,
    updatedAt: settings.updatedAt || nowIso(),
  };
}

function normalizeRecord(record = {}) {
  const startDateTime = record.startDateTime || nowIso();
  const endDateTime = record.endDateTime || null;
  const hasEnd = Boolean(endDateTime);
  const status = hasEnd ? 'ENCERRADO' : record.status === 'ENCERRADO' ? 'ENCERRADO' : 'ABERTO';
  const durationMinutes = hasEnd
    ? record.durationMinutes != null
      ? Number(record.durationMinutes)
      : differenceMinutes(startDateTime, endDateTime)
    : record.durationMinutes != null
      ? Number(record.durationMinutes)
      : null;

  return {
    id: record.id || createId('mov'),
    operatorId: record.operatorId || null,
    operatorName: String(record.operatorName || '').trim(),
    registration: String(record.registration || '').trim(),
    shiftId: record.shiftId || null,
    shiftName: String(record.shiftName || '').trim(),
    equipmentId: record.equipmentId || null,
    plate: String(record.plate || '').trim().toUpperCase(),
    equipmentCode: String(record.equipmentCode || '').trim().toUpperCase(),
    location: record.location || null,
    activityTypeId: record.activityTypeId || null,
    activityCode: String(record.activityCode || '').trim(),
    activityName: String(record.activityName || '').trim(),
    classification: String(record.classification || 'OUTROS').trim().toUpperCase(),
    failureDescription: String(record.failureDescription || '').trim(),
    correctiveAction: String(record.correctiveAction || '').trim(),
    notes: String(record.notes || '').trim(),
    startDateTime,
    endDateTime,
    durationMinutes,
    durationHours:
      durationMinutes == null ? null : Number(minutesToHours(durationMinutes).toFixed(2)),
    manualEntry: Boolean(record.manualEntry),
    status,
    createdAt: record.createdAt || nowIso(),
    updatedAt: record.updatedAt || record.createdAt || nowIso(),
    editedAt: record.editedAt || null,
    editedBy: record.editedBy || null,
  };
}

function normalizeDatabase(raw) {
  if (!raw) {
    return createInitialDatabase();
  }

  const database = {
    ...createInitialDatabase(),
    ...raw,
  };

  database.settings = normalizeSettings(raw.settings || {});

  if (Array.isArray(raw.operators)) {
    const normalizedOperators = raw.operators.map(normalizeOperator);
    database.operators = database.settings.userCatalogSeeded
      ? normalizedOperators
      : mergeMissingSeedUsers(normalizedOperators);
    database.settings.userCatalogSeeded = true;
  } else if (database.settings.userCatalogSeeded) {
    database.operators = [];
  } else {
    database.operators = cloneItems(initialUsers);
    database.settings.userCatalogSeeded = true;
  }

  database.equipments = Array.isArray(raw.equipments)
    ? raw.equipments.map(normalizeEquipment)
    : cloneItems(initialEquipments);
  database.activityTypes = Array.isArray(raw.activityTypes)
    ? raw.activityTypes.map(normalizeActivityType)
    : cloneItems(initialActivityTypes);
  database.shifts = Array.isArray(raw.shifts)
    ? raw.shifts.map(normalizeShift)
    : cloneItems(initialShifts);
  database.movementRecords = Array.isArray(raw.movementRecords)
    ? raw.movementRecords.map(normalizeRecord)
    : [];
  database.version = DB_VERSION;
  database.updatedAt = nowIso();

  return database;
}

function readDatabase() {
  const raw = safeReadJson(DB_KEY);
  const normalized = normalizeDatabase(raw);

  if (!raw) {
    safeWriteJson(DB_KEY, normalized);
  }

  return normalized;
}

function writeDatabase(database, reason = 'database-write') {
  const normalized = normalizeDatabase(database);
  safeWriteJson(DB_KEY, normalized);
  emitChange({ reason, scope: 'database' });
  return normalized;
}

function readSession() {
  const raw = safeReadJson(SESSION_KEY);

  if (!raw) {
    return null;
  }

  return {
    operatorId: raw.operatorId || null,
    operatorName: String(raw.operatorName || '').trim(),
    registration: String(raw.registration || '').trim(),
    role: String(raw.role || 'OPERADOR').trim().toUpperCase(),
    shiftId: raw.shiftId || null,
    shiftName: String(raw.shiftName || '').trim(),
    loggedAt: raw.loggedAt || nowIso(),
  };
}

function writeSession(session) {
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    emitChange({ reason: 'session-clear', scope: 'session' });
    return null;
  }

  const normalized = {
    operatorId: session.operatorId || null,
    operatorName: String(session.operatorName || '').trim(),
    registration: String(session.registration || '').trim(),
    role: String(session.role || 'OPERADOR').trim().toUpperCase(),
    shiftId: session.shiftId || null,
    shiftName: String(session.shiftName || '').trim(),
    loggedAt: session.loggedAt || nowIso(),
  };

  safeWriteJson(SESSION_KEY, normalized);
  emitChange({ reason: 'session-save', scope: 'session' });
  return normalized;
}

function findEntityById(collection, id) {
  return collection.find((item) => item.id === id) || null;
}

function upsertById(collection, entity, normalizer) {
  const next = collection.map((item) => ({ ...item }));
  const normalized = normalizer(entity);
  const index = next.findIndex((item) => item.id === normalized.id);

  if (index >= 0) {
    next[index] = {
      ...next[index],
      ...normalized,
      createdAt: next[index].createdAt || normalized.createdAt || nowIso(),
      updatedAt: nowIso(),
    };
  } else {
    next.unshift(normalized);
  }

  return {
    collection: next,
    item: normalized,
  };
}

function saveSection(section, value) {
  const database = readDatabase();
  const next = {
    ...database,
    [section]: value,
    updatedAt: nowIso(),
  };

  return writeDatabase(next, `${section}-save`);
}

function updateRecordTimestamps(record, patch = {}) {
  const next = normalizeRecord({ ...record, ...patch });

  if (patch.startDateTime || patch.endDateTime || patch.status) {
    if (next.status === 'ENCERRADO' && next.endDateTime) {
      next.durationMinutes = differenceMinutes(next.startDateTime, next.endDateTime);
      next.durationHours = Number(minutesToHours(next.durationMinutes).toFixed(2));
    } else if (next.status === 'ABERTO') {
      next.endDateTime = null;
      next.durationMinutes = null;
      next.durationHours = null;
    }
  }

  return next;
}

export function loadAppState() {
  return {
    ...readDatabase(),
    session: readSession(),
  };
}

export function getDatabase() {
  return readDatabase();
}

export function getSession() {
  return readSession();
}

export function saveSession(session) {
  return writeSession(session);
}

export function clearSession() {
  return writeSession(null);
}

export function getOperators() {
  return readDatabase().operators;
}

export function saveOperator(operator) {
  const database = readDatabase();
  const { collection: nextOperators, item } = upsertById(database.operators, operator, normalizeOperator);
  saveSection('operators', nextOperators);
  return item;
}

export function authenticateOperator(operatorId, password) {
  const database = readDatabase();
  const existing = findEntityById(database.operators, operatorId);

  if (!existing || existing.active === false) {
    throw new Error('Usuário inativo ou não encontrado');
  }

  if (String(existing.password || '') !== String(password || '')) {
    throw new Error('Senha inválida');
  }

  return existing;
}

export function updateOperator(id, patch) {
  const database = readDatabase();
  const existing = findEntityById(database.operators, id);

  if (!existing) {
    throw new Error('Operador não encontrado');
  }

  const nextCandidate = normalizeOperator({ ...existing, ...patch, id });
  const activeManagers = database.operators.filter((user) => user.role === 'GERENTE' && user.active !== false).length;

  if (
    existing.role === 'GERENTE' &&
    activeManagers <= 1 &&
    (nextCandidate.role !== 'GERENTE' || nextCandidate.active === false)
  ) {
    throw new Error('Não é permitido remover o último gerente ativo');
  }

  return saveOperator({ ...existing, ...patch, id });
}

export function deleteOperator(id) {
  const database = readDatabase();
  const existing = findEntityById(database.operators, id);

  if (!existing) {
    throw new Error('Operador não encontrado');
  }

  const activeManagers = database.operators.filter((user) => user.role === 'GERENTE' && user.active !== false).length;

  if (existing.role === 'GERENTE' && activeManagers <= 1) {
    throw new Error('Não é permitido excluir o último gerente ativo');
  }

  const next = database.operators.filter((operator) => operator.id !== id);
  saveSection('operators', next);
}

export function getEquipments() {
  return readDatabase().equipments;
}

export function saveEquipment(equipment) {
  const database = readDatabase();
  const { collection: next, item } = upsertById(database.equipments, equipment, normalizeEquipment);
  saveSection('equipments', next);
  return item;
}

export function updateEquipment(id, patch) {
  const database = readDatabase();
  const existing = findEntityById(database.equipments, id);

  if (!existing) {
    throw new Error('Equipamento não encontrado');
  }

  return saveEquipment({ ...existing, ...patch, id });
}

export function deleteEquipment(id) {
  const database = readDatabase();
  const next = database.equipments.filter((equipment) => equipment.id !== id);
  saveSection('equipments', next);
}

export function getActivityTypes() {
  return readDatabase().activityTypes;
}

export function saveActivityType(activityType) {
  const database = readDatabase();
  const { collection: next, item } = upsertById(database.activityTypes, activityType, normalizeActivityType);
  saveSection('activityTypes', next);
  return item;
}

export function updateActivityType(id, patch) {
  const database = readDatabase();
  const existing = findEntityById(database.activityTypes, id);

  if (!existing) {
    throw new Error('Atividade/parada não encontrada');
  }

  return saveActivityType({ ...existing, ...patch, id });
}

export function deleteActivityType(id) {
  const database = readDatabase();
  const next = database.activityTypes.filter((activityType) => activityType.id !== id);
  saveSection('activityTypes', next);
}

export function getShifts() {
  return readDatabase().shifts;
}

export function saveShift(shift) {
  const database = readDatabase();
  const { collection: next, item } = upsertById(database.shifts, shift, normalizeShift);
  saveSection('shifts', next);
  return item;
}

export function updateShift(id, patch) {
  const database = readDatabase();
  const existing = findEntityById(database.shifts, id);

  if (!existing) {
    throw new Error('Turno não encontrado');
  }

  return saveShift({ ...existing, ...patch, id });
}

export function deleteShift(id) {
  const database = readDatabase();
  const next = database.shifts.filter((shift) => shift.id !== id);
  saveSection('shifts', next);
}

export function getSettings() {
  return readDatabase().settings;
}

export function updateSettings(patch) {
  const database = readDatabase();
  const next = {
    ...database.settings,
    ...patch,
    updatedAt: nowIso(),
  };

  return saveSection('settings', next).settings;
}

export function getRecords() {
  return [...readDatabase().movementRecords].sort((left, right) => {
    const leftStamp = new Date(left?.updatedAt || left?.createdAt || left?.startDateTime || 0).getTime();
    const rightStamp = new Date(right?.updatedAt || right?.createdAt || right?.startDateTime || 0).getTime();
    return rightStamp - leftStamp;
  });
}

export function getActiveRecords() {
  return getRecords().filter((record) => record.status === 'ABERTO');
}

export function saveRecord(record) {
  const database = readDatabase();
  const normalized = normalizeRecord(record);
  const next = database.movementRecords.filter((item) => item.id !== normalized.id);
  next.unshift(normalized);
  return saveSection('movementRecords', next).movementRecords.find((item) => item.id === normalized.id) || null;
}

export function updateRecord(id, patch) {
  const database = readDatabase();
  const existing = findEntityById(database.movementRecords, id);

  if (!existing) {
    throw new Error('Registro não encontrado');
  }

  const merged = updateRecordTimestamps(existing, {
    ...patch,
    id,
    editedAt: nowIso(),
    updatedAt: nowIso(),
  });

  const next = database.movementRecords.map((item) => (item.id === id ? merged : item));
  return saveSection('movementRecords', next).movementRecords.find((item) => item.id === id) || null;
}

export function deleteRecord(id) {
  const database = readDatabase();
  const next = database.movementRecords.filter((record) => record.id !== id);
  saveSection('movementRecords', next);
}

export function createMovementRecord(payload) {
  const database = readDatabase();
  const operator = findEntityById(database.operators, payload.operatorId);
  const equipment = findEntityById(database.equipments, payload.equipmentId);
  const activityType = findEntityById(database.activityTypes, payload.activityTypeId);
  const shift = findEntityById(database.shifts, payload.shiftId || database.settings.defaultShiftId);

  if (!operator) {
    throw new Error('Operador não encontrado');
  }

  if (!equipment) {
    throw new Error('Equipamento não encontrado');
  }

  if (!activityType) {
    throw new Error('Código de atividade/parada inválido');
  }

  const openRecords = database.movementRecords.filter((record) => record.status === 'ABERTO');
  if (openRecords.some((record) => record.operatorId === operator.id)) {
    throw new Error('Este operador já possui apontamento em aberto');
  }

  if (openRecords.some((record) => record.equipmentId === equipment.id)) {
    throw new Error('Este equipamento já possui apontamento em aberto');
  }

  const endDateTime = payload.manualEntry ? payload.endDateTime || null : null;
  const status = endDateTime ? 'ENCERRADO' : 'ABERTO';
  const durationMinutes = endDateTime ? differenceMinutes(payload.startDateTime, endDateTime) : null;

  if (endDateTime && durationMinutes <= 0) {
    throw new Error('Hora final deve ser maior que a inicial');
  }

  const record = normalizeRecord({
    ...payload,
    operatorName: payload.operatorName || operator.name,
    registration: payload.registration || operator.registration || '',
    shiftId: shift?.id || payload.shiftId || null,
    shiftName: payload.shiftName || shift?.name || '',
    plate: payload.plate || equipment.plate,
    equipmentCode: payload.equipmentCode || equipment.code,
    activityCode: payload.activityCode || activityType.code,
    activityName: payload.activityName || activityType.name,
    classification: payload.classification || activityType.classification,
    location: payload.location || activityType.defaultLocation || null,
    startDateTime: payload.startDateTime || nowIso(),
    endDateTime,
    durationMinutes,
    durationHours: durationMinutes == null ? null : Number(minutesToHours(durationMinutes).toFixed(2)),
    status,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  const next = [record, ...database.movementRecords];
  saveSection('movementRecords', next);
  return record;
}

export function closeMovementRecord(recordId, payload = {}) {
  const database = readDatabase();
  const existing = findEntityById(database.movementRecords, recordId);

  if (!existing) {
    throw new Error('Registro não encontrado');
  }

  if (existing.status !== 'ABERTO') {
    throw new Error('O apontamento já está encerrado');
  }

  const endDateTime = payload.endDateTime || nowIso();
  const durationMinutes = differenceMinutes(existing.startDateTime, endDateTime);

  if (durationMinutes <= 0) {
    throw new Error('Hora final deve ser maior que a inicial');
  }

  const updated = {
    ...existing,
    endDateTime,
    status: 'ENCERRADO',
    durationMinutes,
    durationHours: Number(minutesToHours(durationMinutes).toFixed(2)),
    updatedAt: nowIso(),
    editedAt: nowIso(),
    editedBy: payload.editedBy || existing.operatorName,
  };

  const next = database.movementRecords.map((record) => (record.id === recordId ? updated : record));
  saveSection('movementRecords', next);
  return updated;
}

export function getOpenRecordByOperator(operatorId) {
  return getRecords().find((record) => record.status === 'ABERTO' && record.operatorId === operatorId) || null;
}

export function getOpenRecordByEquipment(equipmentId) {
  return getRecords().find((record) => record.status === 'ABERTO' && record.equipmentId === equipmentId) || null;
}

export function exportData() {
  const database = readDatabase();

  return {
    version: database.version,
    exportedAt: nowIso(),
    operators: cloneItems(database.operators),
    equipments: cloneItems(database.equipments),
    activityTypes: cloneItems(database.activityTypes),
    shifts: cloneItems(database.shifts),
    movementRecords: cloneItems(database.movementRecords),
    settings: { ...database.settings },
  };
}

export function importData(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Arquivo JSON inválido');
  }

  const imported = normalizeDatabase(payload);
  imported.updatedAt = nowIso();
  saveSection('operators', imported.operators);
  saveSection('equipments', imported.equipments);
  saveSection('activityTypes', imported.activityTypes);
  saveSection('shifts', imported.shifts);
  saveSection('movementRecords', imported.movementRecords);
  saveSection('settings', imported.settings);
  emitChange({ reason: 'import', scope: 'database' });
  return loadAppState();
}

export function resetDatabase() {
  const fresh = createInitialDatabase();
  safeWriteJson(DB_KEY, fresh);
  clearSession();
  emitChange({ reason: 'reset', scope: 'database' });
  return loadAppState();
}

export function getEquipmentSummary(equipmentId) {
  const records = getRecords().filter((record) => record.equipmentId === equipmentId);
  const openRecord = records.find((record) => record.status === 'ABERTO') || null;

  return {
    total: records.length,
    open: Boolean(openRecord),
    openRecord,
  };
}

export function isDatabaseEmpty() {
  const database = readDatabase();
  return (
    !database.operators.length &&
    !database.equipments.length &&
    !database.activityTypes.length &&
    !database.movementRecords.length
  );
}
