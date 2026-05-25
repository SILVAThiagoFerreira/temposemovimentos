import assert from 'node:assert/strict';
import { createTranslator, SUPPORTED_LOCALES } from '../src/i18n/messages.js';
import { getRoleLabel } from '../src/utils/roles.js';

const requiredKeys = [
  'dashboard.map.activeCount',
  'dashboard.map.visibleCount',
  'dashboard.map.missingGps',
  'dashboard.map.livePoint',
  'dashboard.map.noGps',
];

for (const locale of SUPPORTED_LOCALES) {
  const t = createTranslator(locale);

  assert(!getRoleLabel('GERENTE', locale).includes('roles.'), `perfil GERENTE sem tradução em ${locale}`);
  assert(!getRoleLabel('OPERADOR', locale).includes('roles.'), `perfil OPERADOR sem tradução em ${locale}`);
  assert(!getRoleLabel('CLIENTE', locale).includes('roles.'), `perfil CLIENTE sem tradução em ${locale}`);

  for (const key of requiredKeys) {
    const label = t(key, { count: 2 });
    assert(!label.includes(key), `${key} sem tradução em ${locale}`);
    assert(!label.includes('dashboard.'), `${key} expôs chave técnica em ${locale}`);
  }
}

console.log('I18N_LABELS_OK');
