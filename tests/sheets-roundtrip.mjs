// Round-trip do backend em Google Sheets: snapshot -> abas -> snapshot, usando o Apps Script real.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createAppsScriptHarness, createMemorySpreadsheet } from './support/apps-script-harness.mjs';

const config = JSON.parse(fs.readFileSync(new URL('../config.json', import.meta.url), 'utf8'));
const seed = config.seed;
const T0 = '2026-11-18T12:00:00.000Z';
const T1 = '2026-11-18T13:05:00.000Z';

function buildSnapshot() {
  const operators = seed.users.map((user) => ({
    id: user.id,
    name: user.name,
    registration: user.registration,
    role: user.role,
    password: user.password,
    shiftId: user.shiftId,
    shiftName: user.shiftName,
    active: user.active,
    createdAt: T0,
    updatedAt: T0,
  }));
  const equipments = seed.equipments.map((item) => ({
    id: item.id,
    plate: item.plate,
    code: item.code,
    description: item.description,
    active: item.active,
    createdAt: T0,
    updatedAt: T0,
  }));
  const activityTypes = seed.activityTypes.map((item) => ({
    id: item.id,
    code: item.code,
    name: item.name,
    classification: item.classification,
    defaultLocation: item.defaultLocation,
    active: item.active,
    createdAt: T0,
    updatedAt: T0,
  }));
  const shifts = seed.shifts.map((item) => ({
    id: item.id,
    name: item.name,
    startTime: item.startTime,
    endTime: item.endTime,
    availableMinutes: item.availableMinutes,
    active: item.active,
    createdAt: T0,
    updatedAt: T0,
  }));
  const openRecord = {
    id: 'mov-open-1',
    operatorId: 'usr-paulo',
    operatorName: 'Paulo',
    registration: '',
    equipmentId: 'eq-beg-8a40',
    plate: 'BEG-8A40',
    equipmentCode: 'UMR-1072',
    activityTypeId: 'act-01',
    activityCode: '01',
    activityName: 'Checklist',
    classification: 'OPERAÇÃO',
    notes: '',
    gps: { latitude: -6.123456, longitude: -35.123456, accuracyMeters: 12, capturedAt: T1, source: 'browser-geolocation' },
    startDateTime: T1,
    endDateTime: null,
    durationMinutes: null,
    durationHours: null,
    manualEntry: false,
    status: 'ABERTO',
    createdAt: T1,
    updatedAt: T1,
    editedAt: null,
    editedBy: null,
    shiftId: null,
    shiftName: '',
    location: null,
    failureDescription: '',
    correctiveAction: '',
  };
  const closedRecord = {
    id: 'mov-closed-2',
    operatorId: 'usr-gilmar',
    operatorName: 'Gilmar',
    registration: '1234',
    equipmentId: 'eq-sfo6d18',
    plate: 'SFO6D18',
    equipmentCode: 'UMR-1123',
    activityTypeId: 'act-05',
    activityCode: '05',
    activityName: 'Refeição',
    classification: 'OCIOSIDADE',
    notes: 'texto; com "aspas", acentos e ção',
    gps: null,
    startDateTime: T0,
    endDateTime: T1,
    durationMinutes: 65,
    durationHours: 1.08,
    manualEntry: true,
    status: 'ENCERRADO',
    createdAt: T0,
    updatedAt: T1,
    editedAt: T1,
    editedBy: 'SISTEMA',
    shiftId: 'shift-1',
    shiftName: 'Turno único',
    location: 'CHASSI',
    failureDescription: 'falha',
    correctiveAction: 'ação',
    campoFuturo: { a: 1, b: ['x'] },
  };
  return {
    version: 1,
    createdAt: T0,
    updatedAt: T1,
    operators,
    equipments,
    activityTypes,
    shifts,
    movementRecords: [openRecord, closedRecord],
    settings: {
      storageMode: 'ONLINE',
      defaultShiftId: 'shift-1',
      userCatalogSeeded: true,
      catalogVersion: seed.catalogVersion,
      updatedAt: T1,
    },
  };
}

const snapshot = buildSnapshot();

// 1) Planilha vazia: não há snapshot (o app então grava o cadastro inicial).
{
  const h = createAppsScriptHarness();
  const empty = h.get({ action: 'snapshot' });
  assert.deepEqual(empty, { ok: true, snapshot: null, updatedAt: null });
  assert.equal(h.lock.depth, 0, 'lock deve ser liberado');
}

// 2) Gravação e leitura devolvem o mesmo snapshot.
const h = createAppsScriptHarness();
{
  const saved = h.post({ action: 'save', snapshot });
  assert.deepEqual(saved, { ok: true, updatedAt: T1 });

  const read = h.get({ action: 'snapshot' });
  assert.equal(read.ok, true);
  assert.deepEqual(read.snapshot, snapshot);
  assert.equal(read.updatedAt, T1);
  assert.equal(h.lock.depth, 0, 'lock deve ser liberado após gravar');
}

// 3) Polling leve: a ação version devolve apenas o updatedAt.
{
  assert.deepEqual(h.get({ action: 'version' }), { ok: true, updatedAt: T1 });
}

// 4) Formato na planilha: código com zero à esquerda continua texto; datas continuam ISO em texto.
{
  const activities = h.spreadsheet.getSheetByName('atividades');
  const codeCell = activities.getRange(2, 2).getValues()[0][0];
  assert.equal(codeCell, '01');
  const records = h.spreadsheet.getSheetByName('registros');
  const headers = records.getRange(1, 1, 1, records.getLastColumn()).getValues()[0];
  const inicioColumn = headers.indexOf('inicio') + 1;
  assert.equal(typeof records.getRange(2, inicioColumn).getValues()[0][0], 'string');
  assert.equal(records.getRange(2, inicioColumn).getValues()[0][0], T1);
  const extrasColumn = headers.indexOf('extras_json') + 1;
  assert.equal(records.getRange(3, extrasColumn).getValues()[0][0], '{"campoFuturo":{"a":1,"b":["x"]}}');
}

// 5) Gravação recusada sem usuários: o cadastro não pode ser apagado por engano.
{
  const bad = h.post({ action: 'save', snapshot: { ...snapshot, operators: [] } });
  assert.equal(bad.ok, false);
  assert.match(bad.error, /sem usuários/);
  assert.deepEqual(h.get({ action: 'snapshot' }).snapshot, snapshot);
}

// 6) Gravar menos registros remove as linhas antigas (nada sobra da gravação anterior).
{
  const shorter = { ...snapshot, movementRecords: [snapshot.movementRecords[0]] };
  assert.equal(h.post({ action: 'save', snapshot: shorter }).ok, true);
  const read = h.get({ action: 'snapshot' }).snapshot;
  assert.equal(read.movementRecords.length, 1);
  assert.deepEqual(read.movementRecords[0], snapshot.movementRecords[0]);
  h.post({ action: 'save', snapshot });
}

// 7) Colunas reordenadas pelo usuário na planilha não quebram a leitura.
{
  const sheet = h.spreadsheet.getSheetByName('usuarios');
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  const matrix = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const reordered = matrix.map((line) => {
    const copy = [...line];
    [copy[1], copy[2]] = [copy[2], copy[1]];
    return copy;
  });
  sheet.getRange(1, 1, lastRow, lastCol).setValues(reordered);
  assert.deepEqual(h.get({ action: 'snapshot' }).snapshot, snapshot);
}

// 8) Aba apagada pelo usuário é recriada na próxima gravação.
{
  h.spreadsheet.sheets.delete('turnos');
  assert.equal(h.post({ action: 'save', snapshot }).ok, true);
  assert.deepEqual(h.get({ action: 'snapshot' }).snapshot, snapshot);
}

// 9) criarAbas não apaga dados existentes.
{
  h.criarAbas();
  assert.deepEqual(h.get({ action: 'snapshot' }).snapshot, snapshot);
}

// 10) Planilha com abas vazias mas com cabeçalhos: ainda não há snapshot.
{
  const fresh = createAppsScriptHarness();
  fresh.criarAbas();
  assert.deepEqual(fresh.get({ action: 'snapshot' }), { ok: true, snapshot: null, updatedAt: null });
  assert.ok(fresh.spreadsheet.getSheetByName('registros'), 'aba registros criada');
}

// 11) Entradas inválidas são recusadas com mensagem, sem derrubar o script.
{
  assert.equal(h.get({ action: 'nada' }).ok, false);
  assert.equal(h.post({ action: 'save' }).ok, false);
  assert.equal(h.post({ action: 'save', snapshot: { operators: [] } }).ok, false);
  const badJson = JSON.parse(h.context.doPost({ postData: { contents: '{nao-json' } }).getContent());
  assert.equal(badJson.ok, false);
  assert.match(badJson.error, /JSON/);
  assert.equal(h.lock.depth, 0, 'lock liberado mesmo após erro');
}

// 12) Planilha separada (SPREADSHEET_ID) usa openById; o resultado é o mesmo.
{
  const other = createMemorySpreadsheet();
  const byId = createAppsScriptHarness({ spreadsheet: other, scriptProperties: { SPREADSHEET_ID: 'abc' } });
  assert.equal(byId.post({ action: 'save', snapshot }).ok, true);
  assert.deepEqual(byId.get({ action: 'snapshot' }).snapshot, snapshot);
}

console.log('SHEETS_ROUNDTRIP_OK');
