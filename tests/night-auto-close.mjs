import assert from 'node:assert/strict';
import { toDateTimeInputValue } from '../src/utils/dateUtils.js';
import { getNightAutoCloseDeadline } from '../src/utils/nightAutoCloseWindow.js';

const schedule = {
  enabled: true,
  startTime: '19:00',
  endTime: '03:00',
};

assert.equal(toDateTimeInputValue(getNightAutoCloseDeadline('2026-05-15T18:30:00', schedule)), '2026-05-15T19:00', 'limite antes das 19h deve fechar às 19h');
assert.equal(toDateTimeInputValue(getNightAutoCloseDeadline('2026-05-15T20:00:00', schedule)), '2026-05-16T03:00', 'limite noturno deve fechar às 03h do dia seguinte');
assert.equal(toDateTimeInputValue(getNightAutoCloseDeadline('2026-05-16T02:00:00', schedule)), '2026-05-16T03:00', 'registro iniciado de madrugada deve fechar às 03h do mesmo dia');
assert.equal(toDateTimeInputValue(getNightAutoCloseDeadline('2026-05-16T03:00:00', schedule)), '2026-05-16T19:00', 'limite diurno deve voltar a fechar às 19h');
assert.equal(getNightAutoCloseDeadline('invalid-date', schedule), null, 'data inválida deve retornar null');

console.log('NIGHT_AUTO_CLOSE_OK');
