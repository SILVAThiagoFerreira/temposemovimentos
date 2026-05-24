import { createTranslator, DEFAULT_LOCALE } from '../i18n/messages.js';
import { endOfDay, formatDuration, minutesToHours, parseSafeDate, startOfDay } from './timeService.js';
import { getManagementChartColor } from '../constants/chartPalette.js';

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

function isWithinPeriod(date, periodStart, periodEnd) {
  const time = date.getTime();
  return time >= periodStart.getTime() && time <= periodEnd.getTime();
}

function sortRecordsByStartDesc(records) {
  return [...records].sort((left, right) => {
    const rightStamp = parseSafeDate(right.startDateTime)?.getTime() || 0;
    const leftStamp = parseSafeDate(left.startDateTime)?.getTime() || 0;
    return rightStamp - leftStamp;
  });
}

function calculateOverlapMinutes(record, periodStart, periodEnd, referenceDate = new Date()) {
  if (!record) {
    return 0;
  }

  const start = parseSafeDate(record.startDateTime);
  const end = parseSafeDate(record.endDateTime) || parseSafeDate(referenceDate);

  if (!start || !end) {
    return 0;
  }

  if (end.getTime() <= start.getTime()) {
    return end.getTime() === start.getTime() && isWithinPeriod(start, periodStart, periodEnd) ? 1 : 0;
  }

  const overlapStart = Math.max(start.getTime(), periodStart.getTime());
  const overlapEnd = Math.min(end.getTime(), periodEnd.getTime());

  if (overlapEnd <= overlapStart) {
    return 0;
  }

  // Keep a positive overlap visible immediately in live dashboards.
  return Math.max(1, Math.round((overlapEnd - overlapStart) / 60000));
}

function parseDashboardDateInput(value, boundary = 'start') {
  if (!value) {
    return null;
  }

  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return new Date(`${raw}T${boundary === 'end' ? '23:59:59.999' : '00:00:00'}`);
  }

  return parseSafeDate(raw);
}

export function summarizeDashboard({
  records = [],
  equipments = [],
  activityTypes = [],
  shifts = [],
  periodStart = null,
  periodEnd = null,
  referenceDate = new Date(),
  locale = DEFAULT_LOCALE,
}) {
  const t = createTranslator(locale);
  const resolvedReferenceDate = parseSafeDate(referenceDate) || new Date();
  const resolvedPeriodStart = startOfDay(parseDashboardDateInput(periodStart, 'start') || resolvedReferenceDate);
  const requestedPeriodEnd = parseDashboardDateInput(periodEnd, 'end') || resolvedReferenceDate;
  const resolvedPeriodEnd = endOfDay(requestedPeriodEnd);

  if (resolvedPeriodEnd.getTime() < resolvedPeriodStart.getTime()) {
    resolvedPeriodEnd.setTime(resolvedPeriodStart.getTime());
  }

  const periodDays =
    resolvedPeriodEnd.getTime() >= resolvedPeriodStart.getTime()
      ? Math.max(
          1,
          Math.floor((startOfDay(resolvedPeriodEnd).getTime() - startOfDay(resolvedPeriodStart).getTime()) / 86400000) + 1,
        )
      : 0;

  const primaryShift = shifts.find((shift) => shift.active !== false) || shifts[0] || null;
  const shiftMinutesPerDay = Number(primaryShift?.availableMinutes || 480);
  const periodAvailableMinutes = periodDays * shiftMinutesPerDay;

  const equipmentById = new Map(equipments.map((equipment) => [equipment.id, equipment]));
  const activityByCode = new Map(activityTypes.map((activity) => [activity.code, activity]));

  const relevantRecords = records.filter(
    (record) => calculateOverlapMinutes(record, resolvedPeriodStart, resolvedPeriodEnd, resolvedReferenceDate) > 0,
  );

  const byEquipment = new Map();
  const byActivity = new Map();
  const byClassification = new Map();
  const byCause = new Map();
  const latestByEquipment = new Map();
  const maintenanceByActivity = new Map();
  const criticalGapActivities = new Map();

  let totalMinutes = 0;
  let operationMinutes = 0;
  let maintenanceMinutes = 0;
  let idleMinutes = 0;
  let otherMinutes = 0;

  relevantRecords.forEach((record) => {
    const minutes = calculateOverlapMinutes(record, resolvedPeriodStart, resolvedPeriodEnd, resolvedReferenceDate);
    const activity = activityByCode.get(record.activityCode);
    const classification = normalizeClassification(record.classification || activity?.classification || 'OUTROS');
    const equipment = equipmentById.get(record.equipmentId);
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
      description: equipment?.description || t('common.noData'),
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
        subtitle: t('dashboard.series.maintenance'),
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
        subtitle: t('dashboard.series.gaps'),
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

    const currentStamp = new Date(record.updatedAt || record.createdAt || record.startDateTime || resolvedReferenceDate).getTime();
    const previousRecord = latestByEquipment.get(record.equipmentId);
    const previousStamp = previousRecord
      ? new Date(previousRecord.updatedAt || previousRecord.createdAt || previousRecord.startDateTime || resolvedReferenceDate).getTime()
      : -1;

    if (!previousRecord || currentStamp >= previousStamp) {
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

    const latestRecord = latestByEquipment.get(equipment.id) || null;
    const currentActivityName = latestRecord ? latestRecord.activityName || '-' : '-';

    return {
      ...stat,
      availableMinutes: periodAvailableMinutes,
      utilizationPercent: periodAvailableMinutes > 0 ? Number(((stat.operationMinutes / periodAvailableMinutes) * 100).toFixed(1)) : 0,
      currentActivityName,
      lastRecord: latestRecord,
    };
  });

  const equipmentBreakdowns = equipmentMetrics.map((equipment) => {
    const stat = byEquipment.get(equipment.equipmentId) || equipment;
      const gapItems = [...(stat.gapStats?.values() || [])].sort((left, right) => right.minutes - left.minutes);
    const mainGap = gapItems[0] || null;
    const totalMinutesForEquipment = Number(stat.totalMinutes ?? stat.minutes ?? 0);

    return {
      key: equipment.equipmentId,
        label: equipment.code,
        subtitle: equipment.plate,
        totalMinutes: totalMinutesForEquipment,
        totalHours: minutesToHours(totalMinutesForEquipment),
      operationMinutes: stat.operationMinutes || 0,
      maintenanceMinutes: stat.maintenanceMinutes || 0,
      mealMinutes: stat.mealMinutes || 0,
      criticalGapMinutes: stat.criticalGapMinutes || 0,
      otherIdleMinutes: stat.otherIdleMinutes || 0,
      otherMinutes: stat.otherMinutes || 0,
      segments: [
        { key: 'operation', label: t('dashboard.series.operation'), minutes: stat.operationMinutes || 0 },
        { key: 'maintenance', label: t('dashboard.series.maintenance'), minutes: stat.maintenanceMinutes || 0 },
        { key: 'meal', label: t('dashboard.series.meal'), minutes: stat.mealMinutes || 0 },
        { key: 'gaps', label: t('dashboard.series.gaps'), minutes: stat.criticalGapMinutes || 0 },
        { key: 'idle', label: t('dashboard.series.idle'), minutes: stat.otherIdleMinutes || 0 },
        { key: 'other', label: t('dashboard.series.other'), minutes: stat.otherMinutes || 0 },
      ].filter((segment) => segment.minutes > 0),
      mainGapLabel: mainGap?.name || t('dashboard.labels.noCriticalIntervals'),
      mainGapCode: mainGap?.code || '-',
      mainGapMinutes: mainGap?.minutes || 0,
      mainGapCount: mainGap?.count || 0,
      mainGapHours: minutesToHours(mainGap?.minutes || 0),
    };
  });

  const codeDistributionByEquipment = equipments
    .map((equipment) => {
      const recordsForEquipment = relevantRecords.filter((record) => record.equipmentId === equipment.id);

      if (!recordsForEquipment.length) {
        return null;
      }

      const byCode = new Map();

      recordsForEquipment.forEach((record) => {
        const activity = activityByCode.get(record.activityCode);
        const key = record.activityCode || record.activityName || 'SEM CÓDIGO';
        const classification = normalizeClassification(record.classification || activity?.classification || 'OUTROS');

        ensureStat(byCode, key, () => ({
          key,
          code: record.activityCode || '-',
          name: activity?.name || record.activityName || '-',
          classification,
          count: 0,
          minutes: 0,
        }));
        byCode.get(key).count += 1;
        byCode.get(key).minutes += calculateOverlapMinutes(record, resolvedPeriodStart, resolvedPeriodEnd, resolvedReferenceDate);
        byCode.get(key).classification = byCode.get(key).classification || classification;
      });

      const totalMinutesForEquipment = [...byCode.values()].reduce((sum, item) => sum + Number(item.minutes || 0), 0);

      return {
        key: equipment.id,
        equipmentId: equipment.id,
        label: equipment.code,
        subtitle: equipment.plate,
        totalCount: recordsForEquipment.length,
        totalMinutes: totalMinutesForEquipment,
        segments: sortByMinutesDesc([...byCode.values()]).map((item) => ({
          key: item.key,
          label: `${item.code} - ${item.name}`,
          value: item.minutes,
          minutes: item.minutes,
          count: item.count,
          classification: item.classification,
          color: getManagementChartColor(item.classification, item.count),
          detail: `${formatDuration(item.minutes, locale)} | ${t('dashboard.labels.records', { count: item.count })}`,
          percent: totalMinutesForEquipment > 0 ? Number(((item.minutes / totalMinutesForEquipment) * 100).toFixed(1)) : 0,
        })),
      };
    })
    .filter(Boolean);

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
    subtitle: t('dashboard.labels.events', { count: item.count }),
  }));

  const criticalGapItems = sortByMinutesDesc([...criticalGapActivities.values()]).map((item) => ({
    ...item,
    subtitle: t('dashboard.labels.events', { count: item.count }),
  }));

  const openRecords = relevantRecords.filter((record) => record.status === 'ABERTO');
  const closedRecords = relevantRecords.filter((record) => record.status === 'ENCERRADO');
  const totalStopMinutes = maintenanceMinutes + idleMinutes + otherMinutes;
  const operationBoundMinutes = Math.min(periodAvailableMinutes, operationMinutes);
  const maintenanceBoundMinutes = Math.min(periodAvailableMinutes, maintenanceMinutes);
  const availabilityMinutes = Math.max(0, periodAvailableMinutes - maintenanceBoundMinutes);
  const nonUtilizationMinutes = Math.max(0, periodAvailableMinutes - operationBoundMinutes);
  const physicalAvailabilityPercent = periodAvailableMinutes > 0 ? Number(((availabilityMinutes / periodAvailableMinutes) * 100).toFixed(1)) : 0;
  const physicalUtilizationPercent = periodAvailableMinutes > 0 ? Number(((operationBoundMinutes / periodAvailableMinutes) * 100).toFixed(1)) : 0;

  const summary = {
    periodStart: resolvedPeriodStart.toISOString(),
    periodEnd: resolvedPeriodEnd.toISOString(),
    periodDays,
    periodAvailableMinutes,
    physicalAvailabilityPercent,
    physicalUtilizationPercent,
    physicalAvailabilitySegments: [
      {
        key: 'available',
        label: t('dashboard.series.available'),
        value: availabilityMinutes,
        detail: formatDuration(availabilityMinutes, locale),
        color: getManagementChartColor('available'),
      },
      {
        key: 'maintenance',
        label: t('dashboard.series.maintenance'),
        value: maintenanceBoundMinutes,
        detail: formatDuration(maintenanceBoundMinutes, locale),
        color: getManagementChartColor('maintenance'),
      },
    ],
    physicalUtilizationSegments: [
      {
        key: 'operation',
        label: t('dashboard.series.inOperation'),
        value: operationBoundMinutes,
        detail: formatDuration(operationBoundMinutes, locale),
        color: getManagementChartColor('operation'),
      },
      {
        key: 'rest',
        label: t('dashboard.series.rest'),
        value: nonUtilizationMinutes,
        detail: formatDuration(nonUtilizationMinutes, locale),
        color: getManagementChartColor('rest'),
      },
    ],
    totalMinutes,
    totalHours: minutesToHours(totalMinutes),
    operationMinutes,
    operationHours: minutesToHours(operationMinutes),
    maintenanceMinutes,
    maintenanceHours: minutesToHours(maintenanceMinutes),
    idleMinutes,
    idleHours: minutesToHours(idleMinutes),
    otherMinutes,
    otherHours: minutesToHours(otherMinutes),
    stopMinutes: totalStopMinutes,
    stopHours: minutesToHours(totalStopMinutes),
    openCount: openRecords.length,
    closedCount: closedRecords.length,
    activeEquipmentCount: openRecords.length ? new Set(openRecords.map((record) => record.equipmentId)).size : 0,
    hoursByEquipment: sortByMinutesDesc(
      equipmentMetrics.map((equipment) => ({
        key: equipment.id,
        label: `${equipment.code}`,
        subtitle: equipment.plate,
        minutes: equipment.minutes,
        hours: minutesToHours(equipment.minutes),
      })),
    ),
    byClassification: sortByMinutesDesc([...byClassification.values()]),
    byActivity: sortByMinutesDesc([...byActivity.values()], locale),
    topCauses: sortByMinutesDesc([...byCause.values()], locale).slice(0, 6),
    equipmentBreakdowns,
    maintenanceByEquipment,
    maintenanceByActivity: maintenanceByActivityItems,
    mealAdherenceByEquipment,
    criticalGapActivities: criticalGapItems,
    codeDistributionByEquipment,
    equipmentMetrics,
    openRecords,
    periodRecords: sortRecordsByStartDesc(relevantRecords),
    latestByEquipment,
    totalRecords: relevantRecords.length,
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
