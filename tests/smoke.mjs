import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function fileExistsAndNonEmpty(relativePath) {
  const fullPath = resolve(root, relativePath);
  assert(existsSync(fullPath), `Arquivo ausente: ${relativePath}`);
  assert(statSync(fullPath).size > 0, `Arquivo vazio: ${relativePath}`);
}

const requiredFiles = [
  'README.md',
  'AGENTS.md',
  'TASK.md',
  'SPEC.md',
  'CHECKLIST.md',
  'PROMPT.md',
  'PIPELINE.md',
  'DATA_SCHEMA.md',
  'config.json',
  'src/main.jsx',
  'src/services/firebaseClient.js',
  'input/README.md',
  'input/backup-template.json',
  'output/README.md',
  'logs/README.md',
  'tests/README.md',
  'firebase.json',
  '.firebaserc',
  'firestore.rules',
];

requiredFiles.forEach(fileExistsAndNonEmpty);

const config = readJson(resolve(root, 'config.json'));

assert(config?.meta?.name, 'config.json sem meta.name');
assert(config?.storage?.keys?.database, 'config.json sem storage.keys.database');
assert(config?.storage?.keys?.session, 'config.json sem storage.keys.session');
assert(config?.firebase?.webConfig?.apiKey, 'config.json sem firebase.webConfig.apiKey');
assert(config?.firebase?.stateCollection, 'config.json sem firebase.stateCollection');
assert(config?.firebase?.stateDocument, 'config.json sem firebase.stateDocument');
assert(Array.isArray(config?.seed?.users) && config.seed.users.length >= 5, 'config.json sem usuários iniciais');
assert(Array.isArray(config?.seed?.equipments) && config.seed.equipments.length >= 3, 'config.json sem equipamentos iniciais');
assert(Array.isArray(config?.seed?.activityTypes) && config.seed.activityTypes.length >= 12, 'config.json sem códigos iniciais');
assert(Array.isArray(config?.seed?.shifts) && config.seed.shifts.length >= 3, 'config.json sem turnos iniciais');

console.log('SMOKE_OK');
