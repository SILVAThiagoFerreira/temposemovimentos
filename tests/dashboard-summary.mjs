import assert from 'node:assert/strict';
import { summarizeDashboard } from '../src/services/calculationService.js';

const summary = summarizeDashboard({
  records: [
    {
      id: 'mov-live-1',
      operatorId: 'usr-paulo',
      operatorName: 'Paulo',
      registration: '',
      equipmentId: 'eq-1',
      plate: 'BEG-8A40',
      equipmentCode: 'UMR-1072',
      activityTypeId: 'act-01',
      activityCode: '01',
      activityName: 'Checklist',
      classification: 'OPERAÇÃO',
      startDateTime: '2026-05-15T11:59:50',
      endDateTime: null,
      durationMinutes: null,
      durationHours: null,
      manualEntry: false,
      status: 'ABERTO',
      createdAt: '2026-05-15T11:59:50',
      updatedAt: '2026-05-15T11:59:50',
      editedAt: null,
      editedBy: null,
    },
  ],
  equipments: [
    {
      id: 'eq-1',
      plate: 'BEG-8A40',
      code: 'UMR-1072',
      description: 'Perfuratriz',
      active: true,
      createdAt: '2026-05-15T00:00:00',
      updatedAt: '2026-05-15T00:00:00',
    },
  ],
  activityTypes: [
    {
      id: 'act-01',
      code: '01',
      name: 'Checklist',
      classification: 'OPERAÇÃO',
      active: true,
      createdAt: '2026-05-15T00:00:00',
      updatedAt: '2026-05-15T00:00:00',
    },
  ],
  shifts: [
    {
      id: 'shift-1',
      name: 'Turno único',
      startTime: '07:00',
      endTime: '17:00',
      availableMinutes: 480,
      active: true,
      createdAt: '2026-05-15T00:00:00',
      updatedAt: '2026-05-15T00:00:00',
    },
  ],
  periodStart: '2026-05-15',
  periodEnd: '2026-05-15',
  referenceDate: '2026-05-15T12:00:15',
});

assert.equal(summary.openCount, 1, 'apontamento em aberto deve ser contado no resumo');
assert.equal(summary.totalRecords, 1, 'o registro em aberto deve entrar no período');
assert.equal(summary.totalMinutes, 1, 'o resumo deve arredondar o apontamento aberto para 1 minuto');
assert.equal(summary.equipmentMetrics[0]?.minutes, 1, 'a UMR deve refletir o tempo ao vivo');

console.log('CALCULATION_SMOKE_OK');
