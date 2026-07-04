import assert from 'node:assert/strict';
import { getSeedPurchases } from '../src/config/runtimeConfig.js';
import { summarizeDashboard } from '../src/services/calculationService.js';

const baseCatalog = {
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
    {
      id: 'act-02',
      code: '02',
      name: 'Perfuracao',
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
};

function buildSummary(records, referenceDate = '2026-05-15T12:00:15') {
  return summarizeDashboard({
    ...baseCatalog,
    records,
    periodStart: '2026-05-15',
    periodEnd: '2026-05-15',
    referenceDate,
  });
}

const summary = buildSummary([
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
]);

assert.equal(summary.openCount, 1, 'apontamento em aberto deve ser contado no resumo');
assert.equal(summary.totalRecords, 1, 'o registro em aberto deve entrar no período');
assert.equal(summary.totalMinutes, 1, 'o resumo deve arredondar o apontamento aberto para 1 minuto');
assert.equal(summary.equipmentMetrics[0]?.minutes, 1, 'a UMR deve refletir o tempo ao vivo');

const sameDayFutureClosed = buildSummary([
  {
    id: 'mov-closed-later',
    operatorId: 'usr-paulo',
    operatorName: 'Paulo',
    equipmentId: 'eq-1',
    plate: 'BEG-8A40',
    equipmentCode: 'UMR-1072',
    activityTypeId: 'act-01',
    activityCode: '01',
    activityName: 'Checklist',
    classification: 'OPERAÇÃO',
    startDateTime: '2026-05-15T14:00:00',
    endDateTime: '2026-05-15T15:00:00',
    durationMinutes: 60,
    durationHours: 1,
    manualEntry: true,
    status: 'ENCERRADO',
  },
]);

assert.equal(sameDayFutureClosed.totalRecords, 1, 'datas iguais devem considerar o dia completo selecionado');
assert.equal(sameDayFutureClosed.totalMinutes, 60, 'registro do mesmo dia não deve ser cortado pelo horário atual');
assert.equal(new Date(sameDayFutureClosed.periodEnd).getHours(), 23, 'data final igual deve terminar no fim do dia local');

const zeroDurationClosed = buildSummary([
  {
    id: 'mov-zero',
    operatorId: 'usr-paulo',
    operatorName: 'Paulo',
    equipmentId: 'eq-1',
    plate: 'BEG-8A40',
    equipmentCode: 'UMR-1072',
    activityTypeId: 'act-01',
    activityCode: '01',
    activityName: 'Checklist',
    classification: 'OPERAÇÃO',
    startDateTime: '2026-05-15T10:00:00',
    endDateTime: '2026-05-15T10:00:00',
    durationMinutes: 0,
    durationHours: 0,
    manualEntry: true,
    status: 'ENCERRADO',
  },
]);

assert.equal(zeroDurationClosed.totalRecords, 1, 'registro de duração zero no dia deve continuar visível no intervalo');
assert.equal(zeroDurationClosed.totalMinutes, 1, 'registro de duração zero deve aparecer com mínimo de 1 minuto');

const justStartedLive = buildSummary([
  {
    id: 'mov-just-started',
    operatorId: 'usr-paulo',
    operatorName: 'Paulo',
    equipmentId: 'eq-1',
    plate: 'BEG-8A40',
    equipmentCode: 'UMR-1072',
    activityTypeId: 'act-01',
    activityCode: '01',
    activityName: 'Checklist',
    classification: 'OPERAÇÃO',
    startDateTime: '2026-05-15T12:00:15',
    endDateTime: null,
    durationMinutes: null,
    durationHours: null,
    manualEntry: false,
    status: 'ABERTO',
  },
]);

assert.equal(justStartedLive.totalRecords, 1, 'apontamento recém-iniciado deve aparecer imediatamente no ao vivo');
assert.equal(justStartedLive.totalMinutes, 1, 'apontamento recém-iniciado deve contar pelo menos 1 minuto no ao vivo');

const timeWeightedCodeDistribution = buildSummary([
  {
    id: 'mov-short-1',
    operatorId: 'usr-paulo',
    operatorName: 'Paulo',
    equipmentId: 'eq-1',
    plate: 'BEG-8A40',
    equipmentCode: 'UMR-1072',
    activityTypeId: 'act-01',
    activityCode: '01',
    activityName: 'Checklist',
    classification: 'OPERAÇÃO',
    startDateTime: '2026-05-15T08:00:00',
    endDateTime: '2026-05-15T08:10:00',
    durationMinutes: 10,
    durationHours: 0.17,
    manualEntry: true,
    status: 'ENCERRADO',
  },
  {
    id: 'mov-short-2',
    operatorId: 'usr-paulo',
    operatorName: 'Paulo',
    equipmentId: 'eq-1',
    plate: 'BEG-8A40',
    equipmentCode: 'UMR-1072',
    activityTypeId: 'act-01',
    activityCode: '01',
    activityName: 'Checklist',
    classification: 'OPERAÇÃO',
    startDateTime: '2026-05-15T08:20:00',
    endDateTime: '2026-05-15T08:30:00',
    durationMinutes: 10,
    durationHours: 0.17,
    manualEntry: true,
    status: 'ENCERRADO',
  },
  {
    id: 'mov-long-1',
    operatorId: 'usr-paulo',
    operatorName: 'Paulo',
    equipmentId: 'eq-1',
    plate: 'BEG-8A40',
    equipmentCode: 'UMR-1072',
    activityTypeId: 'act-02',
    activityCode: '02',
    activityName: 'Perfuracao',
    classification: 'OPERAÇÃO',
    startDateTime: '2026-05-15T09:00:00',
    endDateTime: '2026-05-15T10:20:00',
    durationMinutes: 80,
    durationHours: 1.33,
    manualEntry: true,
    status: 'ENCERRADO',
  },
]);

const codeSegments = timeWeightedCodeDistribution.codeDistributionByEquipment[0]?.segments || [];
assert.equal(codeSegments[0]?.key, '02', 'distribuição por código deve ordenar pela maior duração coletada');
assert.equal(codeSegments[0]?.value, 80, 'valor do gráfico por código deve ser o tempo coletado');
assert.equal(codeSegments[0]?.percent, 80, 'percentual por código deve usar minutos, não quantidade de apontamentos');
assert.equal(codeSegments[1]?.percent, 20, 'código com dois apontamentos curtos deve representar apenas seu tempo total');

const purchaseSummary = summarizeDashboard({
  ...baseCatalog,
  records: [],
  purchases: getSeedPurchases(),
  periodStart: '2026-07-31',
  periodEnd: '2026-07-31',
  referenceDate: '2026-07-31T12:00:00Z',
});

assert.equal(purchaseSummary.purchaseWindowMonths, 6, 'o resumo de compras deve usar a janela configurada');
assert.equal(purchaseSummary.purchaseCount, 12, 'todas as compras seed devem entrar no resumo');
assert.equal(purchaseSummary.blastbagCount, 6, 'as compras blastbag devem ser classificadas corretamente');
assert.deepEqual(
  purchaseSummary.monthlyPurchaseCount.map((item) => item.value),
  [2, 2, 2, 2, 2, 2],
  'as compras mensais devem ser agregadas por mês',
);
assert.deepEqual(
  purchaseSummary.monthlyBlastbagQuantity.map((item) => item.value),
  [120, 140, 160, 100, 180, 150],
  'a quantidade mensal de blastbags deve seguir os seeds',
);
assert.equal(purchaseSummary.purchaseComposition[0]?.key, 'blastbag', 'o mix de compras deve destacar blastbags primeiro');
assert.equal(purchaseSummary.purchaseComposition[0]?.value, 6, 'o mix de compras deve contar blastbags');

console.log('CALCULATION_SMOKE_OK');
