import { useEffect, useMemo, useState } from 'react';
import { formatDateTime, nowDateTimeInputValue, toDateTimeInputValue } from '../services/timeService';
import { StatusChip } from './StatusChip';
import { validateDateRange, validateRecordPayload } from '../utils/validators';

const CLASSIFICATIONS = ['OPERAÇÃO', 'MANUTENÇÃO', 'OCIOSIDADE', 'OUTROS'];
const LOCATIONS = [
  { value: '', label: 'Automático' },
  { value: 'CHASSI', label: 'C - Chassi' },
  { value: 'UNIDADE', label: 'U - Unidade' },
];

function buildInitialState({
  record,
  operators,
  equipments,
  activityTypes,
  shifts,
  defaultOperatorId,
  defaultEquipmentId,
  defaultActivityTypeId,
  defaultShiftId,
}) {
  const selectedOperator = operators.find((item) => item.id === defaultOperatorId) || operators[0] || null;
  const selectedEquipment = equipments.find((item) => item.id === defaultEquipmentId) || equipments[0] || null;
  const selectedActivity =
    activityTypes.find((item) => item.id === defaultActivityTypeId) || activityTypes[0] || null;
  const selectedShift =
    shifts.find((item) => item.id === defaultShiftId) ||
    (selectedOperator?.shiftId ? shifts.find((item) => item.id === selectedOperator.shiftId) : null) ||
    shifts[0] ||
    null;

  if (record) {
    return {
      operatorId: record.operatorId || selectedOperator?.id || '',
      equipmentId: record.equipmentId || selectedEquipment?.id || '',
      shiftId: record.shiftId || selectedShift?.id || '',
      activityTypeId: record.activityTypeId || selectedActivity?.id || '',
      activityCode: record.activityCode || selectedActivity?.code || '',
      activityName: record.activityName || selectedActivity?.name || '',
      classification: record.classification || selectedActivity?.classification || 'OUTROS',
      location: record.location || selectedActivity?.defaultLocation || '',
      failureDescription: record.failureDescription || '',
      correctiveAction: record.correctiveAction || '',
      notes: record.notes || '',
      manualEntry: true,
      startDateTime: record.startDateTime ? toDateTimeInputValue(record.startDateTime) : nowDateTimeInputValue(),
      endDateTime: record.endDateTime ? toDateTimeInputValue(record.endDateTime) : '',
    };
  }

  return {
    operatorId: selectedOperator?.id || '',
    equipmentId: selectedEquipment?.id || '',
    shiftId: selectedShift?.id || '',
    activityTypeId: selectedActivity?.id || '',
    activityCode: selectedActivity?.code || '',
    activityName: selectedActivity?.name || '',
    classification: selectedActivity?.classification || 'OUTROS',
    location: selectedActivity?.defaultLocation || '',
    failureDescription: '',
    correctiveAction: '',
    notes: '',
    manualEntry: false,
    startDateTime: nowDateTimeInputValue(),
    endDateTime: '',
  };
}

function buildPayload(form, { operators, equipments, activityTypes, shifts, record, defaultOperatorId, defaultEquipmentId, defaultShiftId }) {
  const selectedOperator = operators.find((item) => item.id === form.operatorId) || operators.find((item) => item.id === defaultOperatorId) || operators[0] || null;
  const selectedEquipment = equipments.find((item) => item.id === form.equipmentId) || equipments.find((item) => item.id === defaultEquipmentId) || equipments[0] || null;
  const selectedActivity = activityTypes.find((item) => item.id === form.activityTypeId) || activityTypes[0] || null;
  const selectedShift =
    shifts.find((item) => item.id === form.shiftId) ||
    shifts.find((item) => item.id === defaultShiftId) ||
    (selectedOperator?.shiftId ? shifts.find((item) => item.id === selectedOperator.shiftId) : null) ||
    shifts[0] ||
    null;

  const startDateTime = form.manualEntry || record ? new Date(form.startDateTime).toISOString() : new Date().toISOString();
  const endDateTime = form.manualEntry && form.endDateTime ? new Date(form.endDateTime).toISOString() : record?.endDateTime || null;

  return {
    id: record?.id,
    operatorId: selectedOperator?.id || '',
    operatorName: selectedOperator?.name || '',
    registration: selectedOperator?.registration || '',
    shiftId: selectedShift?.id || '',
    shiftName: selectedShift?.name || '',
    equipmentId: selectedEquipment?.id || '',
    plate: selectedEquipment?.plate || '',
    equipmentCode: selectedEquipment?.code || '',
    activityTypeId: selectedActivity?.id || '',
    activityCode: selectedActivity?.code || '',
    activityName: selectedActivity?.name || '',
    classification: form.classification || selectedActivity?.classification || 'OUTROS',
    location: form.location || selectedActivity?.defaultLocation || null,
    failureDescription: form.failureDescription,
    correctiveAction: form.correctiveAction,
    notes: form.notes,
    manualEntry: Boolean(form.manualEntry),
    startDateTime,
    endDateTime,
    status: endDateTime ? 'ENCERRADO' : 'ABERTO',
    createdAt: record?.createdAt,
    editedAt: record?.editedAt || null,
  };
}

export function MovementForm({
  title = 'Novo apontamento',
  submitLabel = 'Salvar',
  cancelLabel = 'Cancelar',
  record = null,
  operators,
  equipments,
  activityTypes,
  shifts,
  defaultOperatorId,
  defaultEquipmentId,
  defaultActivityTypeId,
  defaultShiftId,
  hideOperatorSelect = false,
  hideEquipmentSelect = false,
  hideShiftSelect = false,
  onSubmit,
  onCancel,
}) {
  const initialState = useMemo(
    () =>
      buildInitialState({
        record,
        operators,
        equipments,
        activityTypes,
        shifts,
        defaultOperatorId,
        defaultEquipmentId,
        defaultActivityTypeId,
        defaultShiftId,
      }),
    [activityTypes, defaultActivityTypeId, defaultEquipmentId, defaultOperatorId, defaultShiftId, equipments, operators, record, shifts],
  );

  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(initialState);
    setErrors({});
  }, [initialState]);

  const selectedOperator = useMemo(
    () => operators.find((item) => item.id === form.operatorId) || operators.find((item) => item.id === defaultOperatorId) || operators[0] || null,
    [defaultOperatorId, form.operatorId, operators],
  );

  const selectedEquipment = useMemo(
    () => equipments.find((item) => item.id === form.equipmentId) || equipments.find((item) => item.id === defaultEquipmentId) || equipments[0] || null,
    [defaultEquipmentId, equipments, form.equipmentId],
  );

  const selectedActivity = useMemo(
    () => activityTypes.find((item) => item.id === form.activityTypeId) || activityTypes[0] || null,
    [activityTypes, form.activityTypeId],
  );

  const selectedShift = useMemo(
    () => shifts.find((item) => item.id === form.shiftId) || shifts.find((item) => item.id === defaultShiftId) || selectedOperator?.shiftId && shifts.find((item) => item.id === selectedOperator.shiftId) || shifts[0] || null,
    [defaultShiftId, form.shiftId, selectedOperator?.shiftId, shifts],
  );

  useEffect(() => {
    if (!selectedActivity) {
      return;
    }

    setForm((current) => {
      const next = {
        ...current,
        activityCode: selectedActivity.code,
        activityName: selectedActivity.name,
        classification: record ? current.classification : selectedActivity.classification,
        location: current.location || selectedActivity.defaultLocation || '',
      };

      if (!current.manualEntry && !record) {
        next.location = selectedActivity.defaultLocation || '';
      }

      return next;
    });
  }, [record, selectedActivity]);

  useEffect(() => {
    if (selectedOperator && !record) {
      setForm((current) => ({
        ...current,
        shiftId: current.shiftId || selectedOperator.shiftId || defaultShiftId || selectedShift?.id || '',
      }));
    }
  }, [defaultShiftId, record, selectedOperator, selectedShift?.id]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = buildPayload(form, {
      operators,
      equipments,
      activityTypes,
      shifts,
      record,
      defaultOperatorId,
      defaultEquipmentId,
      defaultShiftId,
    });

    const validation = validateRecordPayload({
      ...payload,
      manualEntry: form.manualEntry || Boolean(record),
      startDateTime: payload.startDateTime,
      endDateTime: payload.endDateTime,
    });

    if (form.manualEntry || record) {
      if (payload.endDateTime) {
        const rangeError = validateDateRange(payload.startDateTime, payload.endDateTime);
        if (rangeError) {
          validation.endDateTime = rangeError;
        }
      }
    }

    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    try {
      setIsSaving(true);
      await onSubmit(payload);

      if (!record) {
        setForm((current) => ({
          ...current,
          failureDescription: '',
          correctiveAction: '',
          notes: '',
          manualEntry: current.manualEntry,
          startDateTime: nowDateTimeInputValue(),
          endDateTime: '',
        }));
      }
    } catch (error) {
      setErrors({ form: error.message || 'Não foi possível salvar o apontamento' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      <div className="card__head">
        <div>
          <p className="eyebrow">Apontamento operacional</p>
          <h2>{title}</h2>
        </div>
        <StatusChip tone={form.manualEntry || record ? 'warning' : 'success'}>
          {form.manualEntry || record ? 'LANÇAMENTO MANUAL' : 'HORA AUTOMÁTICA'}
        </StatusChip>
      </div>

      {errors.form ? <div className="alert alert--danger">{errors.form}</div> : null}

      <div className="form-grid">
        {!hideOperatorSelect ? (
          <label>
            <span>Operador</span>
            <select value={form.operatorId} onChange={(event) => updateField('operatorId', event.target.value)}>
              {operators.map((operator) => (
                <option key={operator.id} value={operator.id}>
                  {operator.name}
                </option>
              ))}
            </select>
            {errors.operatorId ? <small className="field-error">{errors.operatorId}</small> : null}
          </label>
        ) : (
          <div className="readonly-pill">
            <span>Operador</span>
            <strong>{selectedOperator?.name || '-'}</strong>
          </div>
        )}

        {!hideEquipmentSelect ? (
          <label>
            <span>Equipamento</span>
            <select value={form.equipmentId} onChange={(event) => updateField('equipmentId', event.target.value)}>
              {equipments.map((equipment) => (
                <option key={equipment.id} value={equipment.id}>
                  {equipment.plate} • {equipment.code}
                </option>
              ))}
            </select>
            {errors.equipmentId ? <small className="field-error">{errors.equipmentId}</small> : null}
          </label>
        ) : (
          <div className="readonly-pill">
            <span>Equipamento</span>
            <strong>{selectedEquipment ? `${selectedEquipment.plate} • ${selectedEquipment.code}` : '-'}</strong>
          </div>
        )}

        {!hideShiftSelect ? (
          <label>
            <span>Turno</span>
            <select value={form.shiftId} onChange={(event) => updateField('shiftId', event.target.value)}>
              {shifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.name} ({shift.startTime} - {shift.endTime})
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="readonly-pill">
            <span>Turno</span>
            <strong>{selectedShift ? `${selectedShift.name}` : '-'}</strong>
          </div>
        )}

        <label>
          <span>Código da atividade/parada</span>
          <select
            value={form.activityTypeId}
            onChange={(event) => updateField('activityTypeId', event.target.value)}
          >
            {activityTypes.map((activityType) => (
              <option key={activityType.id} value={activityType.id}>
                {activityType.code} - {activityType.name}
              </option>
            ))}
          </select>
          {errors.activityTypeId ? <small className="field-error">{errors.activityTypeId}</small> : null}
        </label>

        <label>
          <span>Tipo / Classificação</span>
          <select value={form.classification} onChange={(event) => updateField('classification', event.target.value)}>
            {CLASSIFICATIONS.map((classification) => (
              <option key={classification} value={classification}>
                {classification}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Local</span>
          <select value={form.location} onChange={(event) => updateField('location', event.target.value)}>
            {LOCATIONS.map((location) => (
              <option key={location.value || 'auto'} value={location.value}>
                {location.label}
              </option>
            ))}
          </select>
        </label>

        <label className="toggle-field">
          <input
            type="checkbox"
            checked={form.manualEntry}
            onChange={(event) => updateField('manualEntry', event.target.checked)}
          />
          <span>Lançamento manual</span>
        </label>
      </div>

      <div className="form-grid form-grid--two">
        <label>
          <span>Descrição da falha</span>
          <textarea
            rows="3"
            value={form.failureDescription}
            onChange={(event) => updateField('failureDescription', event.target.value)}
            placeholder="Descreva o evento"
          />
        </label>

        <label>
          <span>Ação corretiva</span>
          <textarea
            rows="3"
            value={form.correctiveAction}
            onChange={(event) => updateField('correctiveAction', event.target.value)}
            placeholder="Ação executada ou prevista"
          />
        </label>
      </div>

      <label>
        <span>Observações</span>
        <textarea
          rows="3"
          value={form.notes}
          onChange={(event) => updateField('notes', event.target.value)}
          placeholder="Informações complementares"
        />
      </label>

      {form.manualEntry || record ? (
        <div className="form-grid form-grid--two">
          <label>
            <span>Data/hora inicial</span>
            <input
              type="datetime-local"
              value={form.startDateTime}
              onChange={(event) => updateField('startDateTime', event.target.value)}
            />
            {errors.startDateTime ? <small className="field-error">{errors.startDateTime}</small> : null}
          </label>

          <label>
            <span>Data/hora final</span>
            <input
              type="datetime-local"
              value={form.endDateTime}
              onChange={(event) => updateField('endDateTime', event.target.value)}
            />
            {errors.endDateTime ? <small className="field-error">{errors.endDateTime}</small> : null}
          </label>
        </div>
      ) : (
        <div className="form-note">
          <StatusChip tone="info">Data e hora serão gravadas automaticamente ao iniciar</StatusChip>
          <p>{formatDateTime(form.startDateTime)}</p>
        </div>
      )}

      <div className="form-actions">
        <button className="button button--primary" type="submit" disabled={isSaving}>
          {isSaving ? 'Salvando...' : submitLabel}
        </button>
        {onCancel ? (
          <button className="button button--ghost" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
        ) : null}
      </div>
    </form>
  );
}
