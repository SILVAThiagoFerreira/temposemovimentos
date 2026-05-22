import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { EquipmentCard } from '../components/EquipmentCard';
import { ActiveTimer } from '../components/ActiveTimer';
import { MovementForm } from '../components/MovementForm';
import { RecordsTable } from '../components/RecordsTable';
import { StatusChip } from '../components/StatusChip';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { isSameDay, nowIso } from '../services/timeService';
import { useDeviceLocation } from '../hooks/useDeviceLocation';

export function OperatorPanel({ standalone = false, onLogout, onRefreshUpdate }) {
  const { session, operators, equipments, records, activityTypes, storageMeta, startMovementRecord, closeMovementRecord, saveRecord, logout, t } = useApp();
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

  const syncLabel = storageMeta?.syncPending ? t('settings.sync.pending') : t('settings.sync.idle');
  const syncDelayLabel = storageMeta?.syncBackoffMs ? `${Math.round(storageMeta.syncBackoffMs / 1000)}s` : '0s';

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
    <div className="page-stack">
      {standalone ? (
        <section className="card operator-topbar card--shell">
          <div>
            <p className="eyebrow">{t('operator.topbar.eyebrow')}</p>
            <h2>{session.operatorName}</h2>
            <p>{session.role === 'GERENTE' ? t('operator.topbar.accessTotal') : t('operator.topbar.pointingOnly')}</p>
          </div>
          <div className="operator-topbar__actions">
            <LanguageSwitcher />
            <button className="button button--secondary" type="button" onClick={() => void onRefreshUpdate?.()}>
              {t('common.updateSystem')}
            </button>
            <button
              className="button button--ghost"
              type="button"
              onClick={() => {
                if (onLogout) {
                  onLogout();
                  return;
                }

                logout();
              }}
            >
              {t('common.logout')}
            </button>
          </div>
        </section>
      ) : null}

      <section className="hero-row">
        <article className="card hero-card">
          <p className="eyebrow">{t('operator.hero.operator')}</p>
          <h2>{session.operatorName}</h2>
          <p>{t('operator.hero.activeRecord')}</p>
          <StatusChip tone="info">{session.registration || t('operator.hero.noRegistration')}</StatusChip>
        </article>

        <article className="card hero-card hero-card--compact">
          <p className="eyebrow">{t('operator.hero.selectedEquipment')}</p>
          <h2>{selectedEquipment ? selectedEquipment.code : '-'}</h2>
          <p>{selectedEquipment ? `${selectedEquipment.plate} • ${selectedEquipment.description}` : t('operator.hero.chooseEquipment')}</p>
          {selectedEquipmentOpenRecord ? <StatusChip tone="danger">{t('operator.hero.openRecord')}</StatusChip> : <StatusChip tone="success">{t('operator.hero.free')}</StatusChip>}
        </article>

        <article className="card hero-card hero-card--compact">
          <p className="eyebrow">{t('operator.hero.openActivity')}</p>
          <h2>{operatorActiveRecord ? operatorActiveRecord.activityName : t('operator.hero.none')}</h2>
          <p>{operatorActiveRecord ? operatorActiveRecord.plate : t('operator.hero.noOpenMovement')}</p>
          {operatorActiveRecord ? <StatusChip tone="warning">{t('common.open')}</StatusChip> : <StatusChip tone="neutral">{t('operator.hero.noActivity')}</StatusChip>}
        </article>
      </section>

      <section className="card operator-live-bar">
        <div>
          <span>{t('settings.sync.state')}</span>
          <strong>{syncLabel}</strong>
        </div>
        <div>
          <span>{t('settings.sync.failures')}</span>
          <strong>{storageMeta?.syncFailureCount || 0}</strong>
        </div>
        <div>
          <span>{t('settings.sync.backoff')}</span>
          <strong>{syncDelayLabel}</strong>
        </div>
        <div>
          <span>{t('settings.storage.currentState')}</span>
          <strong>{storageMeta?.connectionState || 'OFFLINE'}</strong>
        </div>
      </section>

      <section className="equipment-grid">
        {equipments.map((equipment) => (
          <EquipmentCard
            key={equipment.id}
            equipment={equipment}
            selected={equipment.id === selectedEquipmentId}
            openRecord={records.find((record) => record.status === 'ABERTO' && record.equipmentId === equipment.id)}
            onSelect={setSelectedEquipmentId}
          />
        ))}
      </section>

      {operatorActiveRecord ? (
        <section className="card active-record-card">
          <div className="card__head">
            <div>
              <p className="eyebrow">{t('operator.hero.openActivity')}</p>
              <h2>{operatorActiveRecord.activityName}</h2>
            </div>
          </div>

          <div className="active-record-grid">
            <ActiveTimer startDateTime={operatorActiveRecord.startDateTime} title={t('operator.form.timer')} />
            <div className="record-summary-list">
              <div>
                <span>{t('operator.form.equipment')}</span>
                <strong>{operatorActiveRecord.plate}</strong>
              </div>
              <div>
                <span>{t('operator.form.activity')}</span>
                <strong>{operatorActiveRecord.activityCode || '-'} - {operatorActiveRecord.activityName}</strong>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {operatorActiveRecord ? (
        <div className="alert alert--info operator-flow-note">
          {t('operator.alerts.autoClose')}
        </div>
      ) : null}

      {selectedEquipmentOpenRecord && selectedEquipmentOpenRecord.operatorId !== session.operatorId ? (
        <section className="alert alert--warning">
          {t('operator.alerts.busyEquipment', { name: selectedEquipmentOpenRecord.operatorName })}
        </section>
      ) : null}

      <MovementForm
        title={t('operator.form.title')}
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

      <section className="card table-section">
        <div className="card__head">
          <div>
            <p className="eyebrow">{t('operator.form.history')}</p>
            <h2>{t('operator.form.count', { count: todayRecords.length })}</h2>
          </div>
        </div>

        <RecordsTable records={todayRecords} emptyMessage={t('operator.form.empty')} />
      </section>

      {operatorActiveRecord ? (
        <div className="operator-actions-footer">
          <button className="button button--primary operator-finish-button" type="button" onClick={handleCloseActive}>
            {t('operator.form.finish')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
