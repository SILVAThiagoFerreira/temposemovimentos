import { initialActivityTypes } from '../data/initialActivityTypes';
import { initialEquipments } from '../data/initialEquipments';
import { initialShifts } from '../data/initialShifts';
import { initialUsers } from '../data/initialUsers';
import { authConfig, storageConfig } from '../config/runtimeConfig';
import { ensureFirebaseClient, isFirebaseConfigured, readRemoteDatabase, subscribeRemoteDatabase, writeRemoteDatabase } from './firebaseClient';
import { createId } from '../utils/id';
import { differenceMinutes, minutesToHours, nowIso } from './timeService';

const DB_KEY = storageConfig.keys.database;
const SESSION_KEY = storageConfig.keys.session;
const DB_VERSION = 1;
const PERSISTENCE_DB_NAME = storageConfig.persistence.dbName;
const PERSISTENCE_DB_VERSION = storageConfig.persistence.version;
const PERSISTENCE_STORE = storageConfig.persistence.storeName;

let persistenceDbPromise = null;
let persistenceQueue = Promise.resolve();
let remoteSyncQueue = Promise.resolve();
let remoteListenerUnsubscribe = null;
let memoryDatabaseSnapshot = null;
let memorySessionSnapshot = null;
const storageMeta = {
  persistentStorageGranted: false,
  indexedDbAvailable: false,
  backendConfigured: false,
  backendAvailable: false,
  connectionState: 'OFFLINE',
  lastRemoteSyncAt: null,
  lastRemoteSyncError: null,
  bootstrappedAt: null,
};

function cloneItems(items) {
  return items.map((item) => ({ ...item }));
}

function cloneSnapshot(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value;
}

function enqueuePersistence(task) {
  persistenceQueue = persistenceQueue.then(task, task).catch(() => undefined);
  return persistenceQueue;
}

function readTimeStamp(value, fallbackField = 'updatedAt') {
  const stamp = new Date(value?.[fallbackField] || value?.createdAt || value?.startDateTime || value?.loggedAt || 0).getTime();
  return Number.isNaN(stamp) ? 0 : stamp;
}

function chooseNewestSnapshot(localSnapshot, remoteSnapshot, fallbackSnapshot, comparatorField = 'updatedAt') {
  const localStamp = localSnapshot ? readTimeStamp(localSnapshot, comparatorField) : 0;
  const remoteStamp = remoteSnapshot ? readTimeStamp(remoteSnapshot, comparatorField) : 0;

  if (!localSnapshot && !remoteSnapshot) {
    return fallbackSnapshot;
  }

  if (!localSnapshot) {
    return remoteSnapshot;
  }

  if (!remoteSnapshot) {
    return localSnapshot;
  }

  return remoteStamp > localStamp ? remoteSnapshot : localSnapshot;
}

function setLocalSnapshot(key, value) {
  if (value == null) {
    window.localStorage.removeItem(key);
    return;
  }

  safeWriteJson(key, value);
}

function requestPersistentStoragePermission() {
  if (!navigator?.storage?.persist) {
    return Promise.resolve(false);
  }

  return navigator.storage.persist().catch(() => false);
}

function persistenceDbReady() {
  if (typeof indexedDB === 'undefined') {
    storageMeta.indexedDbAvailable = false;
    return Promise.resolve(null);
  }

  if (!persistenceDbPromise) {
    persistenceDbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(PERSISTENCE_DB_NAME, PERSISTENCE_DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(PERSISTENCE_STORE)) {
          db.createObjectStore(PERSISTENCE_STORE);
        }
      };

      request.onsuccess = () => {
        storageMeta.indexedDbAvailable = true;
        resolve(request.result);
      };

      request.onerror = () => {
        storageMeta.indexedDbAvailable = false;
        reject(request.error);
      };
    });
  }

  return persistenceDbPromise;
}

async function idbGet(key) {
  const db = await persistenceDbReady();

  if (!db) {
    return null;
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PERSISTENCE_STORE, 'readonly');
    const store = transaction.objectStore(PERSISTENCE_STORE);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function idbSet(key, value) {
  const db = await persistenceDbReady();

  if (!db) {
    return false;
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PERSISTENCE_STORE, 'readwrite');
    const store = transaction.objectStore(PERSISTENCE_STORE);
    const request = store.put(value, key);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

async function idbDelete(key) {
  const db = await persistenceDbReady();

  if (!db) {
    return false;
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PERSISTENCE_STORE, 'readwrite');
    const store = transaction.objectStore(PERSISTENCE_STORE);
    const request = store.delete(key);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

function persistSnapshot(key, value) {
  void enqueuePersistence(async () => {
    try {
      if (value == null) {
        await idbDelete(key);
      } else {
        await idbSet(key, value);
      }
    } catch {
      return undefined;
    }
  });
}

function mirrorDatabaseSnapshot(database) {
  persistSnapshot(DB_KEY, database);
}

function mirrorSessionSnapshot(session) {
  persistSnapshot(SESSION_KEY, session);
}

function markBackendStatus({ available, error = null, syncedAt = null } = {}) {
  storageMeta.backendConfigured = isFirebaseConfigured();
  if (typeof available === 'boolean') {
    storageMeta.backendAvailable = available;
    storageMeta.connectionState = available ? 'ONLINE' : 'OFFLINE';
  }
  if (error !== undefined) {
    storageMeta.lastRemoteSyncError = error;
  }
  if (syncedAt !== undefined) {
    storageMeta.lastRemoteSyncAt = syncedAt;
  }
}

function setDatabaseSettingsMode(database, mode) {
  return {
    ...database,
    settings: {
      ...database.settings,
      storageMode: mode,
      updatedAt: nowIso(),
    },
    updatedAt: nowIso(),
  };
}

async function bootstrapBackendSnapshot(database) {
  try {
    const response = await readRemoteDatabase();

    if (response) {
      markBackendStatus({ available: true, error: null, syncedAt: nowIso() });
      return response;
    }

    await writeRemoteDatabase(database);
    markBackendStatus({ available: true, error: null, syncedAt: nowIso() });
    return database;
  } catch (error) {
    markBackendStatus({ available: false, error: error?.message || 'Falha ao inicializar Firebase' });
    return null;
  }
}

async function syncBackendSnapshot(database) {
  try {
    await writeRemoteDatabase(database);
    markBackendStatus({ available: true, error: null, syncedAt: nowIso() });
    return database;
  } catch (error) {
    markBackendStatus({ available: false, error: error?.message || 'Falha ao sincronizar Firebase' });
    return null;
  }
}

function queueBackendSync(database, reason = 'database-sync') {
  if (!isFirebaseConfigured()) {
    return Promise.resolve(null);
  }

  remoteSyncQueue = remoteSyncQueue
    .then(async () => {
      const synced = await syncBackendSnapshot(database);

      if (!synced) {
        return null;
      }

      const normalized = normalizeDatabase(synced);
      memoryDatabaseSnapshot = cloneSnapshot(normalized);
      safeWriteJson(DB_KEY, normalized);
      persistSnapshot(DB_KEY, normalized);
      emitChange({ reason: `${reason}-remote`, scope: 'database' });
      return normalized;
    })
    .catch(() => null);

  return remoteSyncQueue;
}

async function attachRemoteListener() {
  if (!isFirebaseConfigured() || remoteListenerUnsubscribe) {
    return;
  }

  remoteListenerUnsubscribe = await subscribeRemoteDatabase((remoteDatabase, error) => {
    if (error) {
      markBackendStatus({ available: false, error: error.message || 'Falha ao ouvir Firebase' });
      return;
    }

    if (!remoteDatabase) {
      return;
    }

    const normalizedRemote = normalizeDatabase(remoteDatabase);
    const currentDatabase = memoryDatabaseSnapshot || readDatabase();

    if (readTimeStamp(normalizedRemote, 'updatedAt') <= readTimeStamp(currentDatabase, 'updatedAt')) {
      return;
    }

    memoryDatabaseSnapshot = cloneSnapshot(normalizedRemote);
    safeWriteJson(DB_KEY, normalizedRemote);
    persistSnapshot(DB_KEY, normalizedRemote);
    markBackendStatus({ available: true, error: null, syncedAt: nowIso() });
    emitChange({ reason: 'firebase-snapshot', scope: 'database' });
  });
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
      storageMode: storageConfig.defaultMode,
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
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
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
  const hasPasswordField = Object.prototype.hasOwnProperty.call(operator, 'password');

  return {
    id: operator.id || createId('op'),
    name: String(operator.name || '').trim(),
    registration: String(operator.registration || '').trim(),
    role: String(operator.role || authConfig.roles.operational).trim().toUpperCase(),
    password: hasPasswordField ? String(operator.password ?? '').trim() : '',
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
    storageMode: String(settings.storageMode || storageConfig.defaultMode).toUpperCase(),
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
  database.updatedAt = raw.updatedAt || nowIso();

  return database;
}

export async function bootstrapStorage() {
  storageMeta.bootstrappedAt = nowIso();
  storageMeta.backendConfigured = isFirebaseConfigured();
  storageMeta.backendAvailable = false;
  storageMeta.lastRemoteSyncError = null;
  storageMeta.persistentStorageGranted = storageConfig.requestPersistentStorage
    ? await requestPersistentStoragePermission()
    : false;

  try {
    const [localDatabase, localSession, indexedDatabase, indexedSession] = await Promise.all([
      Promise.resolve(safeReadJson(DB_KEY)),
      Promise.resolve(safeReadJson(SESSION_KEY)),
      idbGet(DB_KEY).catch(() => null),
      idbGet(SESSION_KEY).catch(() => null),
    ]);

    const freshDatabase = createInitialDatabase();
    const localSnapshot = localDatabase ? normalizeDatabase(localDatabase) : null;
    const indexedSnapshot = indexedDatabase ? normalizeDatabase(indexedDatabase) : null;
    const hasLocalSnapshot = Boolean(localSnapshot || indexedSnapshot);

    let resolvedDatabase = chooseNewestSnapshot(localSnapshot, indexedSnapshot, null, 'updatedAt');

    let resolvedSession = chooseNewestSnapshot(localSession, indexedSession, null, 'loggedAt');

    if (resolvedSession?.expiresAt && new Date(resolvedSession.expiresAt).getTime() <= Date.now()) {
      resolvedSession = null;
    }

    if (storageMeta.backendConfigured) {
      await ensureFirebaseClient();
      const remoteSnapshot = await bootstrapBackendSnapshot(setDatabaseSettingsMode(resolvedDatabase || freshDatabase, 'ONLINE'));

      if (remoteSnapshot) {
        const normalizedRemote = normalizeDatabase(remoteSnapshot);
        const chosenDatabase = hasLocalSnapshot
          ? chooseNewestSnapshot(resolvedDatabase, normalizedRemote, null, 'updatedAt')
          : normalizedRemote;
        resolvedDatabase = setDatabaseSettingsMode(chosenDatabase, 'ONLINE');
        storageMeta.backendAvailable = true;
        if (hasLocalSnapshot && readTimeStamp(chosenDatabase, 'updatedAt') > readTimeStamp(normalizedRemote, 'updatedAt')) {
          await writeRemoteDatabase(resolvedDatabase);
        }
        await attachRemoteListener();
      }
    }

    memoryDatabaseSnapshot = resolvedDatabase ? cloneSnapshot(resolvedDatabase) : freshDatabase;
    memorySessionSnapshot = resolvedSession ? { ...resolvedSession } : null;

    if (resolvedDatabase) {
      setLocalSnapshot(DB_KEY, resolvedDatabase);
      persistSnapshot(DB_KEY, resolvedDatabase);
    }

    if (resolvedSession) {
      setLocalSnapshot(SESSION_KEY, resolvedSession);
      persistSnapshot(SESSION_KEY, resolvedSession);
    } else {
      window.localStorage.removeItem(SESSION_KEY);
      persistSnapshot(SESSION_KEY, null);
    }

    if (!resolvedDatabase) {
      const fresh = setDatabaseSettingsMode(createInitialDatabase(), storageMeta.backendAvailable ? 'ONLINE' : 'LOCAL');
      memoryDatabaseSnapshot = cloneSnapshot(fresh);
      setLocalSnapshot(DB_KEY, fresh);
      persistSnapshot(DB_KEY, fresh);
    }

    if (storageMeta.backendConfigured && !remoteListenerUnsubscribe) {
      await attachRemoteListener();
    }
  } catch {
    const fallback = normalizeDatabase(safeReadJson(DB_KEY));
    memoryDatabaseSnapshot = fallback;
    setLocalSnapshot(DB_KEY, fallback);
  }

  return getStorageMeta();
}

function readDatabase() {
  if (memoryDatabaseSnapshot) {
    return cloneSnapshot(memoryDatabaseSnapshot);
  }

  const raw = safeReadJson(DB_KEY);
  const normalized = normalizeDatabase(raw);

  if (!raw) {
    safeWriteJson(DB_KEY, normalized);
  }

  memoryDatabaseSnapshot = normalized;

  return normalized;
}

function writeDatabase(database, reason = 'database-write') {
  const normalized = normalizeDatabase(database);
  normalized.updatedAt = nowIso();
  memoryDatabaseSnapshot = normalized;
  safeWriteJson(DB_KEY, normalized);
  mirrorDatabaseSnapshot(normalized);
  emitChange({ reason, scope: 'database' });
  void queueBackendSync(normalized, reason);
  return normalized;
}

function readSession() {
  if (memorySessionSnapshot) {
    return { ...memorySessionSnapshot };
  }

  const raw = safeReadJson(SESSION_KEY);

  if (!raw) {
    return null;
  }

  memorySessionSnapshot = {
    operatorId: raw.operatorId || null,
    operatorName: String(raw.operatorName || '').trim(),
    registration: String(raw.registration || '').trim(),
    role: String(raw.role || 'OPERADOR').trim().toUpperCase(),
    shiftId: raw.shiftId || null,
    shiftName: String(raw.shiftName || '').trim(),
    loggedAt: raw.loggedAt || nowIso(),
  };

  return { ...memorySessionSnapshot };
}

function writeSession(session) {
  if (!session) {
    memorySessionSnapshot = null;
    window.localStorage.removeItem(SESSION_KEY);
    mirrorSessionSnapshot(null);
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

  memorySessionSnapshot = normalized;
  safeWriteJson(SESSION_KEY, normalized);
  mirrorSessionSnapshot(normalized);
  emitChange({ reason: 'session-save', scope: 'session' });
  return normalized;
}

function findEntityById(collection, id) {
  return collection.find((item) => item.id === id) || null;
}

function authenticateOperatorFromDatabase(database, operatorId, password) {
  const existing = findEntityById(database.operators, operatorId);

  if (!existing || existing.active === false) {
    throw new Error('Usuário inativo ou não encontrado');
  }

  if (String(existing.password || '') !== String(password || '')) {
    throw new Error('Senha inválida');
  }

  return existing;
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
    storageMeta: getStorageMeta(),
  };
}

export function getStorageMeta() {
  return { ...storageMeta };
}

export async function requestPersistentStorage() {
  storageMeta.persistentStorageGranted = await requestPersistentStoragePermission();
  return storageMeta.persistentStorageGranted;
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

export async function authenticateOperator(operatorId, password) {
  return authenticateOperatorFromDatabase(readDatabase(), operatorId, password);
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
  const fresh = setDatabaseSettingsMode(createInitialDatabase(), storageMeta.backendAvailable ? 'ONLINE' : 'LOCAL');
  writeDatabase(fresh, 'reset');
  clearSession();
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
