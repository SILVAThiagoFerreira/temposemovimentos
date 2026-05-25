import assert from 'node:assert/strict';
import { buildActiveMapItems } from '../src/services/fleetMapService.js';

const t = (key) => key;

const summary = {
  equipmentMetrics: [
    {
      equipmentId: 'eq-1',
      code: 'UMR-1072',
      plate: 'BEG-8A40',
      lastRecord: {
        status: 'ABERTO',
        operatorName: 'Paulo',
        activityName: 'Checklist',
        gps: { latitude: -6.9, longitude: -38.1, capturedAt: '2026-05-17T12:00:00Z' },
      },
    },
    {
      equipmentId: 'eq-2',
      code: 'UMR-1123',
      plate: 'SFO6D18',
      lastRecord: {
        status: 'ENCERRADO',
        operatorName: 'Deyvis',
        activityName: 'Deslocamento',
        gps: { latitude: -6.8, longitude: -38.0, capturedAt: '2026-05-17T11:00:00Z' },
      },
    },
  ],
};

const items = buildActiveMapItems(summary, 'pt-BR', t);

assert.equal(items.length, 1, 'apenas apontamentos ativos devem entrar no mapa');
assert.equal(items[0].equipmentId, 'eq-1', 'somente o registro aberto deve ser mantido');
assert.equal(items[0].label, 'dashboard.map.livePoint', 'o rótulo do ativo deve ser o de ao vivo');

console.log('FLEET_MAP_OK');
