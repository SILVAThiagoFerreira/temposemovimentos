import { useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { MovementForm } from '../components/MovementForm';
import { RecordsTable } from '../components/RecordsTable';
import { StatusChip } from '../components/StatusChip';
import { downloadCsv, downloadTextFile } from '../services/csvService';
import { isSameDay, toDateInputValue } from '../services/timeService';
import { translateErrorMessage } from '../i18n/errorMessages.js';

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
    language,
    t,
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
    setNotice(t('export.notices.csvSuccess'));
  }

  function handleJsonExport() {
    downloadTextFile(createBackupName(), JSON.stringify(exportData(), null, 2), 'application/json;charset=utf-8');
    setNotice(t('export.notices.jsonSuccess'));
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
      setNotice(t('export.notices.importSuccess'));
    } catch (error) {
      setNotice(translateErrorMessage(error, language));
    } finally {
      event.target.value = '';
    }
  }

  function handleReset() {
    if (!window.confirm(t('export.confirm.reset'))) {
      return;
    }

    resetDatabase();
    setEditingRecord(null);
    setNotice(t('export.notices.restored'));
  }

  function handleEdit(record) {
    setEditingRecord(record);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleUpdate(payload) {
    if (!editingRecord) {
      return;
    }

    try {
      updateRecord(editingRecord.id, payload);
      setEditingRecord(null);
      setNotice(t('export.notices.updated'));
    } catch (error) {
      setNotice(translateErrorMessage(error, language));
    }
  }

  function handleDelete(record) {
    if (!window.confirm(t('export.confirm.deleteRecord'))) {
      return;
    }

    try {
      deleteRecord(record.id);
      setNotice(t('export.notices.deleted'));
    } catch (error) {
      setNotice(translateErrorMessage(error, language));
    }
  }

  function handleClose(record) {
    if (!window.confirm(t('export.confirm.closeRecord'))) {
      return;
    }

    try {
      closeMovementRecord(record.id, {});
      setNotice(t('export.notices.closed'));
    } catch (error) {
      setNotice(translateErrorMessage(error, language));
    }
  }

  return (
    <div className="page-stack">
      <section className="card page-banner">
        <div>
          <p className="eyebrow">{t('export.banner.eyebrow')}</p>
          <h2>{t('export.banner.title')}</h2>
          <p>{t('export.banner.copy')}</p>
        </div>
        <StatusChip tone="info">{t('export.filteredCount', { count: filteredRecords.length })}</StatusChip>
      </section>

      {notice ? <div className="alert alert--info">{notice}</div> : null}

      <section className="card filters-card">
        <div className="filters-grid">
          <label>
            <span>{t('export.filters.date')}</span>
            <input type="date" value={filters.date} onChange={(event) => setFilters({ ...filters, date: event.target.value })} />
          </label>
          <label>
            <span>{t('export.filters.equipment')}</span>
            <select value={filters.equipmentId} onChange={(event) => setFilters({ ...filters, equipmentId: event.target.value })}>
              <option value="">{t('export.filters.all')}</option>
              {equipments.map((equipment) => (
                <option key={equipment.id} value={equipment.id}>
                  {equipment.plate} • {equipment.code}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t('export.filters.operator')}</span>
            <select value={filters.operatorId} onChange={(event) => setFilters({ ...filters, operatorId: event.target.value })}>
              <option value="">{t('export.filters.all')}</option>
              {operators.map((operator) => (
                <option key={operator.id} value={operator.id}>
                  {operator.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t('export.filters.code')}</span>
            <select value={filters.activityCode} onChange={(event) => setFilters({ ...filters, activityCode: event.target.value })}>
              <option value="">{t('export.filters.all')}</option>
              {activityTypes.map((activityType) => (
                <option key={activityType.id} value={activityType.code}>
                  {activityType.code} - {activityType.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t('export.filters.status')}</span>
            <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
              <option value="">{t('export.filters.all')}</option>
              <option value="ABERTO">{t('export.filters.open')}</option>
              <option value="ENCERRADO">{t('export.filters.closed')}</option>
            </select>
          </label>
        </div>

        <div className="export-actions">
          <button className="button button--primary" type="button" onClick={handleCsvExport}>
            {t('export.actions.csv')}
          </button>
          <button className="button button--secondary" type="button" onClick={handleJsonExport}>
            {t('export.actions.json')}
          </button>
          <button className="button button--ghost" type="button" onClick={() => fileInputRef.current?.click()}>
            {t('export.actions.importJson')}
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden-input" onChange={handleImportFile} />
          <button className="button button--danger" type="button" onClick={handleReset}>
            {t('export.actions.reset')}
          </button>
        </div>
      </section>

      <RecordsTable records={filteredRecords} onEdit={handleEdit} onDelete={handleDelete} onClose={handleClose} />

      {editingRecord ? (
        <MovementForm
          title={t('export.edit.title')}
          submitLabel={t('export.edit.submit')}
          cancelLabel={t('export.edit.cancel')}
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
