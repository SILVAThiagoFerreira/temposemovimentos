import { formatDuration, isSameDay, minutesToHours } from './timeService';

const MEAL_ACTIVITY_CODE = '05';
const CRITICAL_GAP_CODES = new Set(['07', '08', '09']);

function normalizeClassification(value) {
  return String(value || 'OUTROS').toUpperCase();
}

function calculateRecordMinutes(record, referenceDate = new Date()) {
  if (!record) {
    return 0;
  }

  if (record.status === 'ENCERRADO' && record.durationMinutes != null) {
    return Number(record.durationMinutes || 0);
  }

  if (record.status !== 'ABERTO' && record.durationMinutes != null) {
    return Number(record.durationMinutes || 0);
  }

  const start = new Date(record.startDateTime);
  const end = record.endDateTime ? new Date(record.endDateTime) : referenceDate;

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return Number(record.durationMinutes || 0);
  }

  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}

function ensureStat(map, key, factory) {
  if (!map.has(key)) {
    map.set(key, factory());
  }

  return map.get(key);
}

function sortByMinutesDesc(items) {
  return [...items].sort((left, right) => right.minutes - left.minutes);
}

export function summarizeDashboard({
  records = [],
  equipments = [],
  activityTypes = [],
  shifts = [],
  referenceDate = new Date(),
}) {
  const equipmentById = new Map(equipments.map((equipment) => [equipment.id, equipment]));
  const shiftById = new Map(shifts.map((shift) => [shift.id, shift]));
  const activityByCode = new Map(activityTypes.map((activity) => [activity.code, activity]));

  const relevantRecords = records.filter(
    (record) =>
      isSameDay(record.startDateTime, referenceDate) ||
      isSameDay(record.endDateTime, referenceDate) ||
      record.status === 'ABERTO',
  );

  const byEquipment = new Map();
  const byActivity = new Map();
  const byClassification = new Map();
  const byCause = new Map();
  const availableMinutes = new Map();
  const latestByEquipment = new Map();
  const maintenanceByActivity = new Map();
  const criticalGapActivities = new Map();

  let totalMinutes = 0;
  let operationMinutes = 0;
  let maintenanceMinutes = 0;
  let idleMinutes = 0;
  let otherMinutes = 0;

  relevantRecords.forEach((record) => {
    const minutes = calculateRecordMinutes(record, referenceDate);
    const classification = normalizeClassification(record.classification);
    const equipment = equipmentById.get(record.equipmentId);
    const shift = shiftById.get(record.shiftId);
    const activityKey = record.activityCode || record.activityName || 'SEM CÓDIGO';

    totalMinutes += minutes;

    if (classification === 'OPERAÇÃO') {
      operationMinutes += minutes;
    } else if (classification === 'MANUTENÇÃO') {
      maintenanceMinutes += minutes;
    } else if (classification === 'OCIOSIDADE') {
      idleMinutes += minutes;
    } else {
      otherMinutes += minutes;
    }

    ensureStat(byClassification, classification, () => ({
      classification,
      minutes: 0,
      count: 0,
    }));
    byClassification.get(classification).minutes += minutes;
    byClassification.get(classification).count += 1;

    ensureStat(byEquipment, record.equipmentId, () => ({
      equipmentId: record.equipmentId,
      plate: equipment?.plate || record.plate || '-',
      code: equipment?.code || record.equipmentCode || '-',
      description: equipment?.description || 'Equipamento',
      minutes: 0,
      totalMinutes: 0,
      operationMinutes: 0,
      maintenanceMinutes: 0,
      mealMinutes: 0,
      criticalGapMinutes: 0,
      idleMinutes: 0,
      otherIdleMinutes: 0,
      otherMinutes: 0,
      count: 0,
      openCount: 0,
      availableMinutes: 0,
      utilizationPercent: 0,
      currentActivityName: '-',
      gapStats: new Map(),
    }));

    const equipmentStat = byEquipment.get(record.equipmentId);
    equipmentStat.minutes += minutes;
    equipmentStat.totalMinutes += minutes;
    equipmentStat.count += 1;
    if (classification === 'OPERAÇÃO') {
      equipmentStat.operationMinutes += minutes;
    } else if (classification === 'MANUTENÇÃO') {
      equipmentStat.maintenanceMinutes += minutes;
    } else if (classification === 'OCIOSIDADE') {
      equipmentStat.idleMinutes += minutes;
    } else {
      equipmentStat.otherMinutes += minutes;
    }

    if (record.activityCode === MEAL_ACTIVITY_CODE) {
      equipmentStat.mealMinutes += minutes;
    }

    if (CRITICAL_GAP_CODES.has(record.activityCode)) {
      equipmentStat.criticalGapMinutes += minutes;
      ensureStat(equipmentStat.gapStats, activityKey, () => ({
        key: activityKey,
        code: record.activityCode || '-',
        name: activityByCode.get(record.activityCode)?.name || record.activityName || '-',
        minutes: 0,
        count: 0,
      }));
      equipmentStat.gapStats.get(activityKey).minutes += minutes;
      equipmentStat.gapStats.get(activityKey).count += 1;
    } else if (classification === 'OCIOSIDADE' && record.activityCode !== MEAL_ACTIVITY_CODE) {
      equipmentStat.otherIdleMinutes += minutes;
    }

    if (record.status === 'ABERTO') {
      equipmentStat.openCount += 1;
    }

    ensureStat(byActivity, activityKey, () => ({
      code: record.activityCode || '-',
      name: activityByCode.get(record.activityCode)?.name || record.activityName || '-',
      classification,
      minutes: 0,
      count: 0,
    }));
    byActivity.get(activityKey).minutes += minutes;
    byActivity.get(activityKey).count += 1;

    if (classification === 'MANUTENÇÃO') {
      ensureStat(maintenanceByActivity, activityKey, () => ({
        key: activityKey,
        code: record.activityCode || '-',
        label: `${record.activityCode || '-'} - ${activityByCode.get(record.activityCode)?.name || record.activityName || '-'}`,
        subtitle: 'Manutenção',
        minutes: 0,
        count: 0,
      }));
      maintenanceByActivity.get(activityKey).minutes += minutes;
      maintenanceByActivity.get(activityKey).count += 1;
    }

    if (CRITICAL_GAP_CODES.has(record.activityCode)) {
      ensureStat(criticalGapActivities, activityKey, () => ({
        key: activityKey,
        code: record.activityCode || '-',
        label: `${record.activityCode || '-'} - ${activityByCode.get(record.activityCode)?.name || record.activityName || '-'}`,
        subtitle: 'Gaps críticos',
        minutes: 0,
        count: 0,
      }));
      criticalGapActivities.get(activityKey).minutes += minutes;
      criticalGapActivities.get(activityKey).count += 1;
    }

    const causeKey = record.failureDescription?.trim() || record.activityName || 'Sem descrição';
    ensureStat(byCause, causeKey, () => ({
      name: causeKey,
      minutes: 0,
      count: 0,
    }));
    byCause.get(causeKey).minutes += minutes;
    byCause.get(causeKey).count += 1;

    const shiftMinutes = shift?.availableMinutes || 0;
    if (record.shiftId && shiftMinutes > 0) {
      availableMinutes.set(record.shiftId, shiftMinutes);
    }

    const previousLatest = latestByEquipment.get(record.equipmentId);
    const currentStamp = new Date(record.updatedAt || record.createdAt || record.startDateTime || referenceDate).getTime();
    const previousStamp = previousLatest
      ? new Date(previousLatest.updatedAt || previousLatest.createdAt || previousLatest.startDateTime || referenceDate).getTime()
      : -1;

    if (!previousLatest || currentStamp >= previousStamp) {
      latestByEquipment.set(record.equipmentId, record);
    }
  });

  const equipmentMetrics = equipments.map((equipment) => {
    const stat = byEquipment.get(equipment.id) || {
      equipmentId: equipment.id,
      plate: equipment.plate,
      code: equipment.code,
      description: equipment.description,
      minutes: 0,
      totalMinutes: 0,
      operationMinutes: 0,
      maintenanceMinutes: 0,
      mealMinutes: 0,
      criticalGapMinutes: 0,
      idleMinutes: 0,
      otherIdleMinutes: 0,
      otherMinutes: 0,
      count: 0,
      openCount: 0,
      availableMinutes: 0,
      utilizationPercent: 0,
      currentActivityName: '-',
      gapStats: new Map(),
    };

    const recordsForEquipment = relevantRecords.filter((record) => record.equipmentId === equipment.id);
    const shiftIds = [...new Set(recordsForEquipment.map((record) => record.shiftId).filter(Boolean))];
    const minutesAvailable = shiftIds.length
      ? shiftIds.reduce((sum, shiftId) => sum + (shiftById.get(shiftId)?.availableMinutes || 480), 0)
      : 480;

    const latestRecord = latestByEquipment.get(equipment.id) || null;
    const currentActivityName = latestRecord
      ? latestRecord.status === 'ABERTO'
        ? latestRecord.activityName
        : latestRecord.activityName || '-'
      : '-';

    return {
      ...stat,
      availableMinutes: minutesAvailable,
      utilizationPercent: minutesAvailable > 0 ? Number(((stat.operationMinutes / minutesAvailable) * 100).toFixed(1)) : 0,
      currentActivityName,
      lastRecord: latestRecord,
    };
  });

  const equipmentBreakdowns = equipmentMetrics.map((equipment) => {
    const stat = byEquipment.get(equipment.equipmentId) || equipment;
    const gapItems = [...(stat.gapStats?.values() || [])].sort((left, right) => right.minutes - left.minutes);
    const mainGap = gapItems[0] || null;
    const totalMinutes = Number(stat.totalMinutes ?? stat.minutes ?? 0);

    return {
      key: equipment.equipmentId,
      label: equipment.code,
      subtitle: equipment.plate,
      totalMinutes,
      totalHours: minutesToHours(totalMinutes),
      operationMinutes: stat.operationMinutes || 0,
      maintenanceMinutes: stat.maintenanceMinutes || 0,
      mealMinutes: stat.mealMinutes || 0,
      criticalGapMinutes: stat.criticalGapMinutes || 0,
      otherIdleMinutes: stat.otherIdleMinutes || 0,
      otherMinutes: stat.otherMinutes || 0,
      segments: [
        { key: 'operation', label: 'Operação', minutes: stat.operationMinutes || 0 },
        { key: 'maintenance', label: 'Manutenção', minutes: stat.maintenanceMinutes || 0 },
        { key: 'meal', label: 'Refeição', minutes: stat.mealMinutes || 0 },
        { key: 'gaps', label: 'Gaps críticos', minutes: stat.criticalGapMinutes || 0 },
        { key: 'idle', label: 'Horas ociosas', minutes: stat.otherIdleMinutes || 0 },
        { key: 'other', label: 'Outros', minutes: stat.otherMinutes || 0 },
      ].filter((segment) => segment.minutes > 0),
      mainGapLabel: mainGap?.name || 'Sem gaps críticos',
      mainGapCode: mainGap?.code || '-',
      mainGapMinutes: mainGap?.minutes || 0,
      mainGapCount: mainGap?.count || 0,
      mainGapHours: minutesToHours(mainGap?.minutes || 0),
    };
  });

  const maintenanceByEquipment = equipmentBreakdowns
    .filter((item) => item.maintenanceMinutes > 0)
    .sort((left, right) => right.maintenanceMinutes - left.maintenanceMinutes)
    .map((item) => ({
      key: item.key,
      label: item.label,
      subtitle: item.subtitle,
      minutes: item.maintenanceMinutes,
      hours: minutesToHours(item.maintenanceMinutes),
    }));

  const mealAdherenceByEquipment = equipmentBreakdowns
    .map((item) => {
      const targetMinutes = 60;
      const adherencePercent = Number(((item.mealMinutes / targetMinutes) * 100).toFixed(1));

      return {
        key: item.key,
        label: item.label,
        subtitle: item.subtitle,
        minutes: item.mealMinutes,
        hours: minutesToHours(item.mealMinutes),
        targetMinutes,
        adherencePercent,
        tone: item.mealMinutes >= targetMinutes ? 'success' : item.mealMinutes >= targetMinutes * 0.8 ? 'warning' : 'danger',
      };
    })
    .sort((left, right) => left.adherencePercent - right.adherencePercent || right.minutes - left.minutes);

  const maintenanceByActivityItems = sortByMinutesDesc([...maintenanceByActivity.values()]).map((item) => ({
    ...item,
    subtitle: `${item.count} eventos`,
  }));

  const criticalGapItems = sortByMinutesDesc([...criticalGapActivities.values()]).map((item) => ({
    ...item,
    subtitle: `${item.count} eventos`,
  }));

  const openRecords = relevantRecords.filter((record) => record.status === 'ABERTO');
  const closedTodayRecords = relevantRecords.filter((record) => record.status === 'ENCERRADO');
  const totalOperationHours = minutesToHours(operationMinutes);
  const totalStopHours = minutesToHours(maintenanceMinutes + idleMinutes + otherMinutes);

  const summary = {
    totalMinutes,
    totalHours: minutesToHours(totalMinutes),
    operationMinutes,
    operationHours: totalOperationHours,
    maintenanceMinutes,
    maintenanceHours: minutesToHours(maintenanceMinutes),
    idleMinutes,
    idleHours: minutesToHours(idleMinutes),
    otherMinutes,
    otherHours: minutesToHours(otherMinutes),
    stopMinutes: maintenanceMinutes + idleMinutes + otherMinutes,
    stopHours: totalStopHours,
    openCount: openRecords.length,
    closedCount: closedTodayRecords.length,
    activeEquipmentCount: openRecords.length ? new Set(openRecords.map((record) => record.equipmentId)).size : 0,
    hoursByEquipment: sortByMinutesDesc(equipmentMetrics.map((equipment) => ({
      key: equipment.id,
      label: `${equipment.code}`,
      subtitle: equipment.plate,
      minutes: equipment.minutes,
      hours: minutesToHours(equipment.minutes),
    }))),
    byClassification: sortByMinutesDesc([...byClassification.values()]),
    byActivity: sortByMinutesDesc([...byActivity.values()]),
    topCauses: sortByMinutesDesc([...byCause.values()]).slice(0, 6),
    equipmentBreakdowns,
    maintenanceByEquipment,
    maintenanceByActivity: maintenanceByActivityItems,
    mealAdherenceByEquipment,
    criticalGapActivities: criticalGapItems,
    equipmentMetrics,
    openRecords,
    latestByEquipment,
    totalRecords: records.length,
  };

  return summary;
}

export function calculateDurationMinutes(record, referenceDate = new Date()) {
  return calculateRecordMinutes(record, referenceDate);
}

export function calculateUtilization(operationMinutes, availableMinutes) {
  if (!availableMinutes) {
    return 0;
  }

  return Number(((operationMinutes / availableMinutes) * 100).toFixed(1));
}

export function formatUtilization(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

export function formatMinutesAsHours(minutes) {
  return formatDuration(minutes);
}
