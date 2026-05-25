import assert from 'node:assert/strict';
import { buildMovementDraftKey, normalizeMovementDraft, pickLatestMovementDraft } from '../src/services/draftStorage.js';

const operatorDraftKey = buildMovementDraftKey({
  catalogVersion: 8,
  operatorId: 'usr-paulo',
  equipmentId: 'eq-beg-8a40',
  activityTypeId: 'act-01',
});

assert.equal(
  operatorDraftKey,
  'temposemovimentos-db:draft:v8:usr-paulo:eq-beg-8a40:act-01',
  'draft de operação deve usar chave estável por catálogo',
);

const recordDraftKey = buildMovementDraftKey({ catalogVersion: 8, recordId: 'mov-123' });

assert.equal(recordDraftKey, 'temposemovimentos-db:draft:v8:record:mov-123', 'draft de edição deve usar chave do registro');

const normalized = normalizeMovementDraft({
  operatorId: ' usr-paulo ',
  equipmentId: ' eq-beg-8a40 ',
  activityTypeId: ' act-01 ',
  notes: 123,
  manualEntry: true,
  startDateTime: '2026-05-24T10:00:00.000Z',
  endDateTime: null,
  savedAt: '2026-05-24T10:10:00.000Z',
});

assert.deepEqual(normalized, {
  operatorId: 'usr-paulo',
  equipmentId: 'eq-beg-8a40',
  activityTypeId: 'act-01',
  notes: '123',
  manualEntry: true,
  startDateTime: '2026-05-24T10:00:00.000Z',
  endDateTime: '',
  savedAt: '2026-05-24T10:10:00.000Z',
});

const latestDraft = pickLatestMovementDraft(
  { ...normalized, savedAt: '2026-05-24T10:10:00.000Z' },
  { ...normalized, savedAt: '2026-05-24T10:12:00.000Z', notes: 'mais recente' },
);

assert.equal(latestDraft?.notes, 'mais recente', 'draft mais recente deve vencer');

console.log('DRAFT_STORAGE_OK');
