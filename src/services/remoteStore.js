import { ensureSheetsClient, isSheetsConfigured, readSheetsDatabase, subscribeSheetsDatabase, writeSheetsDatabase } from './sheetsClient';

// Persistência remota única: planilha do Google Drive via Apps Script (ver apps-script/README.md).

export function isRemoteConfigured() {
  return isSheetsConfigured();
}

export async function ensureRemoteClient() {
  ensureSheetsClient();
}

export function readRemoteDatabase() {
  return readSheetsDatabase();
}

export function writeRemoteDatabase(database) {
  return writeSheetsDatabase(database);
}

export function subscribeRemoteDatabase(onChange) {
  return subscribeSheetsDatabase(onChange);
}
