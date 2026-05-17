import { useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { MovementForm } from '../components/MovementForm';
import { RecordsTable } from '../components/RecordsTable';
import { StatusChip } from '../components/StatusChip';
import { downloadCsv, downloadTextFile } from '../services/csvService';
import { isSameDay, toDateInputValue } from '../services/timeService';

function createBackupName() {
  return `temposemovimentos-backup-${new Date().toISOString().slice(0, 10)}.json`;
}

function createCsvName() {
  return `temposemovimentos-registros-${new Date().toISOString().slice(0, 10)}.csv`;
}

export function DataExport() {
  const {
    records,
    equipments,
    operators,
    activityTypes,
    exportData,
    importData,
    resetDatabase,
    updateRecord,
    deleteRecord,
    closeMovementRecord,
  } = useApp();

  const [filters, setFilters] = useState({
    date: toDateInputValue(new Date()),
    equipmentId: '',
    operatorId: '',
    activityCode: '',
    status: '',
  });
  const [editingRecord, setEditingRecord] = useState(null);
  const [notice, setNotice] = useState('');
  const fileInputRef = useRef(null);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesDate = filters.date ? isSameDay(record.startDateTime, `${filters.date}T00:00:00`) || isSameDay(record.endDateTime, `${filters.date}T00:00:00`) : true;
      const matchesEquipment = filters.equipmentId ? record.equipmentId === filters.equipmentId : true;
      const matchesOperator = filters.operatorId ? record.operatorId === filters.operatorId : true;
      const matchesActivity = filters.activityCode ? record.activityCode === filters.activityCode : true;
      const matchesStatus = filters.status ? record.status === filters.status : true;

      return matchesDate && matchesEquipment && matchesOperator && matchesActivity && matchesStatus;
    });
  }, [filters.activityCode, filters.date, filters.equipmentId, filters.operatorId, filters.status, records]);

  function handleCsvExport() {
    downloadCsv(createCsvName(), filteredRecords);
    setNotice('CSV exportado com sucesso.');
  }

  function handleJsonExport() {
    downloadTextFile(createBackupName(), JSON.stringify(exportData(), null, 2), 'application/json;charset=utf-8');
    setNotice('Backup JSON exportado.');
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      importData(parsed);
      setNotice('Backup importado com sucesso.');
    } catch (error) {
      setNotice(error.message || 'Falha ao importar JSON.');
    } finally {
      event.target.value = '';
    }
  }

  function handleReset() {
    if (!window.confirm('Limpar a base local e restaurar os dados iniciais?')) {
      return;
    }

    resetDatabase();
    setEditingRecord(null);
    setNotice('Base restaurada.');
  }

  function handleEdit(record) {
    setEditingRecord(record);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleUpdate(payload) {
    if (!editingRecord) {
      return;
    }

    updateRecord(editingRecord.id, payload);
    setEditingRecord(null);
    setNotice('Registro atualizado.');
  }

  function handleDelete(record) {
    if (!window.confirm('Excluir este registro?')) {
      return;
    }

    deleteRecord(record.id);
    setNotice('Registro excluído.');
  }

  function handleClose(record) {
    if (!window.confirm('Encerrar este apontamento agora?')) {
      return;
    }

    closeMovementRecord(record.id, {});
    setNotice('Apontamento encerrado.');
  }

  return (
    <div className="page-stack">
      <section className="card page-banner">
        <div>
          <p className="eyebrow">Exportação de dados</p>
          <h2>Controle de registros</h2>
          <p>Filtros, CSV, JSON e edições.</p>
        </div>
        <StatusChip tone="info">{filteredRecords.length} registros filtrados</StatusChip>
      </section>

      {notice ? <div className="alert alert--info">{notice}</div> : null}

      <section className="card filters-card">
        <div className="filters-grid">
          <label>
            <span>Data</span>
            <input type="date" value={filters.date} onChange={(event) => setFilters({ ...filters, date: event.target.value })} />
          </label>
          <label>
            <span>Equipamento</span>
            <select value={filters.equipmentId} onChange={(event) => setFilters({ ...filters, equipmentId: event.target.value })}>
              <option value="">Todos</option>
              {equipments.map((equipment) => (
                <option key={equipment.id} value={equipment.id}>
                  {equipment.plate} • {equipment.code}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Operador</span>
            <select value={filters.operatorId} onChange={(event) => setFilters({ ...filters, operatorId: event.target.value })}>
              <option value="">Todos</option>
              {operators.map((operator) => (
                <option key={operator.id} value={operator.id}>
                  {operator.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Código</span>
            <select value={filters.activityCode} onChange={(event) => setFilters({ ...filters, activityCode: event.target.value })}>
              <option value="">Todos</option>
              {activityTypes.map((activityType) => (
                <option key={activityType.id} value={activityType.code}>
                  {activityType.code} - {activityType.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Situação</span>
            <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
              <option value="">Todos</option>
              <option value="ABERTO">ABERTO</option>
              <option value="ENCERRADO">ENCERRADO</option>
            </select>
          </label>
        </div>

        <div className="export-actions">
          <button className="button button--primary" type="button" onClick={handleCsvExport}>
            Exportar CSV
          </button>
          <button className="button button--secondary" type="button" onClick={handleJsonExport}>
            Exportar JSON
          </button>
          <button className="button button--ghost" type="button" onClick={() => fileInputRef.current?.click()}>
            Importar JSON
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden-input" onChange={handleImportFile} />
          <button className="button button--danger" type="button" onClick={handleReset}>
            Limpar base local
          </button>
        </div>
      </section>

      <RecordsTable records={filteredRecords} onEdit={handleEdit} onDelete={handleDelete} onClose={handleClose} />

      {editingRecord ? (
        <MovementForm
          title="Editar registro"
          submitLabel="Salvar alteração"
          cancelLabel="Fechar edição"
          record={editingRecord}
          operators={operators}
          equipments={equipments}
          activityTypes={activityTypes}
          onSubmit={handleUpdate}
          onCancel={() => setEditingRecord(null)}
        />
      ) : null}
    </div>
  );
}
