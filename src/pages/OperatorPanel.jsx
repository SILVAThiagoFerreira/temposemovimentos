import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { EquipmentCard } from '../components/EquipmentCard';
import { ActiveTimer } from '../components/ActiveTimer';
import { MovementForm } from '../components/MovementForm';
import { RecordsTable } from '../components/RecordsTable';
import { StatusChip } from '../components/StatusChip';
import { isSameDay } from '../services/timeService';

export function OperatorPanel({ standalone = false, onLogout, onRefreshUpdate }) {
  const { session, operators, equipments, records, activityTypes, startMovementRecord, closeMovementRecord, logout } = useApp();
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');

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
      throw new Error('Selecione um equipamento');
    }

    return startMovementRecord({
      ...payload,
      operatorId: session?.operatorId,
      operatorName: session?.operatorName,
      registration: session?.registration,
      equipmentId: equipment.id,
      plate: equipment.plate,
      equipmentCode: equipment.code,
    });
  }

  async function handleCloseActive() {
    if (!operatorActiveRecord) {
      return;
    }

    if (!window.confirm('Encerrar a atividade e finalizar o expediente?')) {
      return;
    }

    await closeMovementRecord(operatorActiveRecord.id, { editedBy: session?.operatorName });
  }

  if (!session) {
    return null;
  }

  return (
    <div className="page-stack">
      {standalone ? (
        <section className="card operator-topbar card--shell">
          <div>
            <p className="eyebrow">Modo operacional</p>
            <h2>{session.operatorName}</h2>
            <p>{session.role === 'GERENTE' ? 'Acesso total' : 'Somente apontamento'}</p>
          </div>
          <div className="operator-topbar__actions">
            <button className="button button--secondary" type="button" onClick={() => void onRefreshUpdate?.()}>
              Atualizar sistema
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
              Sair
            </button>
          </div>
        </section>
      ) : null}

      <section className="hero-row">
        <article className="card hero-card">
          <p className="eyebrow">Operador</p>
          <h2>{session.operatorName}</h2>
          <p>Apontamento ativo</p>
          <StatusChip tone="info">{session.registration || 'Sem matrícula'}</StatusChip>
        </article>

        <article className="card hero-card hero-card--compact">
          <p className="eyebrow">UMR selecionada</p>
          <h2>{selectedEquipment ? selectedEquipment.code : '-'}</h2>
          <p>{selectedEquipment ? `${selectedEquipment.plate} • ${selectedEquipment.description}` : 'Escolha um equipamento'}</p>
          {selectedEquipmentOpenRecord ? <StatusChip tone="danger">APONTAMENTO EM ABERTO</StatusChip> : <StatusChip tone="success">LIVRE</StatusChip>}
        </article>

        <article className="card hero-card hero-card--compact">
          <p className="eyebrow">Atividade aberta</p>
          <h2>{operatorActiveRecord ? operatorActiveRecord.activityName : 'Nenhum'}</h2>
          <p>{operatorActiveRecord ? operatorActiveRecord.plate : 'Sem movimentação em aberto'}</p>
          {operatorActiveRecord ? <StatusChip tone="warning">ABERTO</StatusChip> : <StatusChip tone="neutral">SEM ATIVIDADE</StatusChip>}
        </article>
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
              <p className="eyebrow">Atividade aberta</p>
              <h2>{operatorActiveRecord.activityName}</h2>
            </div>
          </div>

          <div className="active-record-grid">
            <ActiveTimer startDateTime={operatorActiveRecord.startDateTime} title="Cronômetro em tempo real" />
            <div className="record-summary-list">
              <div>
                <span>Equipamento</span>
                <strong>{operatorActiveRecord.plate}</strong>
              </div>
              <div>
                <span>Atividade</span>
                <strong>{operatorActiveRecord.activityCode || '-'} - {operatorActiveRecord.activityName}</strong>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {operatorActiveRecord ? (
        <div className="alert alert--info operator-flow-note">
          Ao iniciar a próxima atividade, a anterior será encerrada automaticamente.
        </div>
      ) : null}

      {selectedEquipmentOpenRecord && selectedEquipmentOpenRecord.operatorId !== session.operatorId ? (
        <section className="alert alert--warning">
          O equipamento selecionado já possui um apontamento aberto por {selectedEquipmentOpenRecord.operatorName}.
        </section>
      ) : null}

      <MovementForm
        title="Novo apontamento"
        operators={operators}
        equipments={equipments}
        activityTypes={activityTypes}
        defaultOperatorId={session.operatorId}
        defaultEquipmentId={selectedEquipmentId}
        hideOperatorSelect
        hideEquipmentSelect
        submitLabel="Iniciar atividade"
        onSubmit={handleStart}
      />

      <section className="card table-section">
        <div className="card__head">
          <div>
            <p className="eyebrow">Histórico do dia</p>
            <h2>{todayRecords.length} registros</h2>
          </div>
        </div>

        <RecordsTable records={todayRecords} emptyMessage="Nenhum registro lançado hoje." />
      </section>

      {operatorActiveRecord ? (
        <div className="operator-actions-footer">
          <button className="button button--primary operator-finish-button" type="button" onClick={handleCloseActive}>
            Encerrar a atividade
          </button>
        </div>
      ) : null}
    </div>
  );
}
