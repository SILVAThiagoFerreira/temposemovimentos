import { storageConfig } from '../config/runtimeConfig';
import {
  ensureFirebaseClient,
  isFirebaseConfigured,
  readRemoteDatabase as readFirestoreDatabase,
  subscribeRemoteDatabase as subscribeFirestoreDatabase,
  writeRemoteDatabase as writeFirestoreDatabase,
} from './firebaseClient';
import {
  isSheetsConfigured,
  readSheetsDatabase,
  subscribeSheetsDatabase,
  writeSheetsDatabase,
} from './sheetsClient';

// Seleciona o backend de persistência remota conforme config.json (storage.backend).
// "firestore" é o padrão; "sheets" usa o Apps Script sobre a planilha no Google Drive.

export function getRemoteBackend() {
  return storageConfig.backend === 'sheets' ? 'sheets' : 'firestore';
}

export function isRemoteConfigured() {
  return getRemoteBackend() === 'sheets' ? isSheetsConfigured() : isFirebaseConfigured();
}

export async function ensureRemoteClient() {
  if (getRemoteBackend() === 'firestore') {
    await ensureFirebaseClient();
  }
}

export function readRemoteDatabase() {
  return getRemoteBackend() === 'sheets' ? readSheetsDatabase() : readFirestoreDatabase();
}

export function writeRemoteDatabase(database) {
  return getRemoteBackend() === 'sheets' ? writeSheetsDatabase(database) : writeFirestoreDatabase(database);
}

export function subscribeRemoteDatabase(onChange) {
  return getRemoteBackend() === 'sheets' ? subscribeSheetsDatabase(onChange) : subscribeFirestoreDatabase(onChange);
}
