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
const backupTemplate = readJson(resolve(root, 'input/backup-template.json'));
const seedUsers = Array.isArray(config?.seed?.users) ? config.seed.users : [];
const seedActivityTypes = Array.isArray(config?.seed?.activityTypes) ? config.seed.activityTypes : [];

assert(config?.meta?.name, 'config.json sem meta.name');
assert(config?.storage?.keys?.database, 'config.json sem storage.keys.database');
assert(config?.storage?.keys?.session, 'config.json sem storage.keys.session');
assert(config?.storage?.keys?.uiLanguage, 'config.json sem storage.keys.uiLanguage');
assert(config?.firebase?.webConfig?.apiKey, 'config.json sem firebase.webConfig.apiKey');
assert(config?.firebase?.stateCollection, 'config.json sem firebase.stateCollection');
assert(config?.firebase?.stateDocument, 'config.json sem firebase.stateDocument');
assert(config?.auth?.roles?.client === 'CLIENTE', 'config.json sem auth.roles.client');
assert(Number(config?.seed?.catalogVersion) >= 6, 'config.json sem seed.catalogVersion atualizado');
assert(seedUsers.length === 6, 'config.json com quantidade incorreta de usuários iniciais');
assert(seedUsers.filter((user) => user.role === 'OPERADOR').length === 4, 'config.json com quantidade incorreta de operadores');
assert(seedUsers.filter((user) => user.role === 'CLIENTE').length === 1, 'config.json com quantidade incorreta de clientes');
assert(seedUsers.some((user) => user.role === 'GERENTE'), 'config.json sem gerente inicial');
assert(seedUsers.some((user) => user.name === 'Mineração Vale Verde'), 'config.json sem cliente Mineração Vale Verde');
assert(
  seedUsers.some((user) => user.id === 'usr-jose-wilkinson' && user.name === 'Administrador - US Vale Verde' && user.password === '0987' && user.syncPassword === true),
  'config.json sem gerente sincronizado atualizado',
);
assert(seedUsers.every((user) => !user.shiftId && !user.shiftName), 'config.json ainda expõe turnos nos usuários iniciais');
assert(seedActivityTypes.length >= 15, 'config.json sem os códigos iniciais esperados');
assert(Array.isArray(config?.seed?.equipments) && config.seed.equipments.length === 2, 'config.json com quantidade incorreta de equipamentos iniciais');
assert(config.seed.equipments.some((equipment) => equipment.code === 'UMR-1072'), 'config.json sem UMR-1072');
assert(config.seed.equipments.some((equipment) => equipment.code === 'UMR-1123'), 'config.json sem UMR-1123');
assert(seedActivityTypes.some((activity) => activity.code === '04' && activity.name === 'Reabastecimento de Emulsão'), 'config.json sem renomeação do código 04');
assert(seedActivityTypes.some((activity) => activity.id === 'act-13'), 'config.json sem atividade act-13');
assert(seedActivityTypes.some((activity) => activity.name === 'Retirada de Material no Paiol'), 'config.json sem Retirada de Material no Paiol');
assert(seedActivityTypes.some((activity) => activity.name === 'Aguardando Detonação'), 'config.json sem Aguardando Detonação');
assert(Array.isArray(config?.seed?.shifts) && config.seed.shifts.length === 1, 'config.json deve manter apenas um turno interno');
assert(Number(backupTemplate?.settings?.catalogVersion) === Number(config?.seed?.catalogVersion), 'backup-template.json fora de sincronia com catalogVersion');

console.log('SMOKE_OK');
