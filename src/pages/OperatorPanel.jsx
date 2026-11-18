import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { EquipmentCard } from '../components/EquipmentCard';
import { ActiveTimer } from '../components/ActiveTimer';
import { MovementForm } from '../components/MovementForm';
import { RecordsTable } from '../components/RecordsTable';
import { Icon } from '../components/Icon';
import { isSameDay, nowIso } from '../services/timeService';
import { useDeviceLocation } from '../hooks/useDeviceLocation';

export function OperatorPanel() {
  const { session, operators, equipments, records, activityTypes, startMovementRecord, closeMovementRecord, saveRecord, t } = useApp();
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const { location: deviceLocation } = useDeviceLocation();
  const lastSyncedLocationKey = useRef('');

  useEffect(() => {
    if (!selectedEquipmentId && equipments[0]) {
      setSelectedEquipmentId(equipments[0].id);
    }
  }, [equipments, selectedEquipmentId]);

  const selectedEquipment = useMemo(
    () => equipments.find((equipment) => equipment.id === selectedEquipmentId) || equipments[0] || null,
    [equipments, selectedEquipmentId],
  );

  const operatorActiveRecord = useMemo(
    () => records.find((record) => record.status === 'ABERTO' && record.operatorId === session?.operatorId) || null,
    [records, session?.operatorId],
  );

  useEffect(() => {
    lastSyncedLocationKey.current = '';
  }, [operatorActiveRecord?.id]);

  useEffect(() => {
    if (!operatorActiveRecord || !deviceLocation) {
      return;
    }

    const locationKey = `${deviceLocation.latitude.toFixed(4)}:${deviceLocation.longitude.toFixed(4)}`;

    if (lastSyncedLocationKey.current === locationKey) {
      return;
    }

    lastSyncedLocationKey.current = locationKey;

    try {
      saveRecord({
        ...operatorActiveRecord,
        gps: deviceLocation,
        updatedAt: nowIso(),
      });
    } catch {
      // GPS updates are best effort; the record itself must keep working offline.
    }
  }, [deviceLocation, operatorActiveRecord, saveRecord]);

  const selectedEquipmentOpenRecord = useMemo(
    () => records.find((record) => record.status === 'ABERTO' && record.equipmentId === selectedEquipmentId) || null,
    [records, selectedEquipmentId],
  );

  const todayRecords = useMemo(
    () => records.filter((record) => isSameDay(record.startDateTime, new Date()) || isSameDay(record.endDateTime, new Date()) || record.status === 'ABERTO'),
    [records],
  );

  async function handleStart(payload) {
    const equipment = equipments.find((item) => item.id === selectedEquipmentId) || selectedEquipment;
    if (!equipment) {
      throw new Error(t('common.selectEquipment'));
    }

    return startMovementRecord({
      ...payload,
      operatorId: session?.operatorId,
      operatorName: session?.operatorName,
      registration: session?.registration,
      equipmentId: equipment.id,
      plate: equipment.plate,
      equipmentCode: equipment.code,
      gps: deviceLocation || null,
    });
  }

  async function handleCloseActive() {
    if (!operatorActiveRecord) {
      return;
    }

    if (!window.confirm(t('operator.alerts.closePrompt'))) {
      return;
    }

    await closeMovementRecord(operatorActiveRecord.id, { editedBy: session?.operatorName, gps: deviceLocation || null });
  }

  if (!session) {
    return null;
  }

  return (
    <div className="page-stack operator">
      <section className="operator-section">
        <div className="section-label">{t('operator.hero.selectedEquipment')}</div>
        <div className="equipment-grid">
          {equipments.map((equipment) => (
            <EquipmentCard
              key={equipment.id}
              equipment={equipment}
              selected={equipment.id === selectedEquipmentId}
              openRecord={records.find((record) => record.status === 'ABERTO' && record.equipmentId === equipment.id)}
              onSelect={setSelectedEquipmentId}
            />
          ))}
        </div>
      </section>

      {selectedEquipmentOpenRecord && selectedEquipmentOpenRecord.operatorId !== session.operatorId ? (
        <div className="alert alert--warning" role="status">
          {t('operator.alerts.busyEquipment', { name: selectedEquipmentOpenRecord.operatorName })}
        </div>
      ) : null}

      <div className="operator-grid">
        <div className="stack">
          {operatorActiveRecord ? (
            <section className="card active-record-card">
              <div>
                <div className="section-label">{t('timer.title')}</div>
                <ActiveTimer startDateTime={operatorActiveRecord.startDateTime} />
              </div>
              <dl className="record-summary-list">
                <div>
                  <dt>{t('movement.equipment')}</dt>
                  <dd>{operatorActiveRecord.plate}</dd>
                </div>
                <div>
                  <dt>{t('table.headers.activity')}</dt>
                  <dd>
                    {operatorActiveRecord.activityCode ? `${operatorActiveRecord.activityCode} · ` : ''}
                    {operatorActiveRecord.activityName}
                  </dd>
                </div>
              </dl>
            </section>
          ) : null}

          <MovementForm
            compact
            operators={operators}
            equipments={equipments}
            activityTypes={activityTypes}
            defaultOperatorId={session.operatorId}
            defaultEquipmentId={selectedEquipmentId}
            hideOperatorSelect
            hideEquipmentSelect
            submitLabel={t('operator.form.submit')}
            onSubmit={handleStart}
          />
        </div>

        <section className="history">
          <header className="panel__head">
            <h2>{t('operator.form.history')}</h2>
            <span className="count-pill">{t('operator.form.count', { count: todayRecords.length })}</span>
          </header>
          <RecordsTable records={todayRecords} emptyMessage={t('operator.form.empty')} />
        </section>
      </div>

      {operatorActiveRecord ? (
        <div className="operator-actions-footer">
          <button
            className="button button--danger operator-finish-button"
            type="button"
            onClick={handleCloseActive}
          >
            <Icon name="stop" size={18} />
            {t('operator.form.finish')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
