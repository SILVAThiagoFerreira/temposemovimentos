import { storageConfig } from '../config/runtimeConfig.js';
import { nowIso } from './timeService.js';

const PERSISTENCE_DB_NAME = storageConfig.persistence.dbName;
const PERSISTENCE_DB_VERSION = storageConfig.persistence.version;
const PERSISTENCE_STORE = storageConfig.persistence.storeName;

let persistenceDbPromise = null;
let draftWriteQueue = Promise.resolve();

function enqueueDraftWrite(task) {
  draftWriteQueue = draftWriteQueue.then(task, task).catch(() => undefined);
  return draftWriteQueue;
}

function persistenceDbReady() {
  if (typeof indexedDB === 'undefined') {
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

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
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

function readLocalJson(key) {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocalJson(key, value) {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function removeLocalJson(key) {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function readMovementDraftStamp(draft) {
  const stamp = new Date(draft?.savedAt || draft?.updatedAt || draft?.createdAt || 0).getTime();
  return Number.isNaN(stamp) ? 0 : stamp;
}

export function buildMovementDraftKey({ catalogVersion = 0, operatorId = '', equipmentId = '', activityTypeId = '', recordId = null } = {}) {
  const versionTag = `v${Number(catalogVersion) || 0}`;

  if (recordId) {
    return `${storageConfig.keys.database}:draft:${versionTag}:record:${recordId}`;
  }

  return `${storageConfig.keys.database}:draft:${versionTag}:${operatorId || 'operator'}:${equipmentId || 'equipment'}:${activityTypeId || 'activity'}`;
}

export function normalizeMovementDraft(draft) {
  if (!draft || typeof draft !== 'object') {
    return null;
  }

  return {
    operatorId: String(draft.operatorId || '').trim(),
    equipmentId: String(draft.equipmentId || '').trim(),
    activityTypeId: String(draft.activityTypeId || '').trim(),
    notes: String(draft.notes || ''),
    manualEntry: Boolean(draft.manualEntry),
    startDateTime: String(draft.startDateTime || ''),
    endDateTime: draft.endDateTime ? String(draft.endDateTime) : '',
    savedAt: String(draft.savedAt || draft.updatedAt || nowIso()),
  };
}

export function readLocalMovementDraft(key) {
  return normalizeMovementDraft(readLocalJson(key));
}

export async function readIndexedMovementDraft(key) {
  await draftWriteQueue.catch(() => undefined);

  try {
    return normalizeMovementDraft(await idbGet(key));
  } catch {
    return null;
  }
}

export function pickLatestMovementDraft(localDraft, indexedDraft) {
  if (!localDraft && !indexedDraft) {
    return null;
  }

  if (!localDraft) {
    return normalizeMovementDraft(indexedDraft);
  }

  if (!indexedDraft) {
    return normalizeMovementDraft(localDraft);
  }

  return readMovementDraftStamp(indexedDraft) > readMovementDraftStamp(localDraft)
    ? normalizeMovementDraft(indexedDraft)
    : normalizeMovementDraft(localDraft);
}

export async function saveMovementDraft(key, draft) {
  const normalized = normalizeMovementDraft(draft);

  if (!normalized) {
    return false;
  }

  const localSaved = writeLocalJson(key, normalized);

  return enqueueDraftWrite(async () => {
    try {
      const indexedSaved = await idbSet(key, normalized);
      return localSaved || indexedSaved;
    } catch {
      return localSaved;
    }
  });
}

export async function clearMovementDraft(key) {
  const localCleared = removeLocalJson(key);

  return enqueueDraftWrite(async () => {
    try {
      const indexedCleared = await idbDelete(key);
      return localCleared || indexedCleared;
    } catch {
      return localCleared;
    }
  });
}
