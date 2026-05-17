import { useEffect, useMemo, useState } from 'react';
import { formatDateTime, nowDateTimeInputValue, toDateTimeInputValue } from '../services/timeService';
import { StatusChip } from './StatusChip';
import { validateDateRange, validateRecordPayload } from '../utils/validators';
import { useApp } from '../context/AppContext';
import { translateErrorMessage } from '../i18n/errorMessages.js';

function buildInitialState({
  record,
  operators,
  equipments,
  activityTypes,
  defaultOperatorId,
  defaultEquipmentId,
  defaultActivityTypeId,
}) {
  const selectedOperator = operators.find((item) => item.id === defaultOperatorId) || operators[0] || null;
  const selectedEquipment = equipments.find((item) => item.id === defaultEquipmentId) || equipments[0] || null;
  const selectedActivity =
    activityTypes.find((item) => item.id === defaultActivityTypeId) || activityTypes[0] || null;

  if (record) {
    return {
      operatorId: record.operatorId || selectedOperator?.id || '',
      equipmentId: record.equipmentId || selectedEquipment?.id || '',
      activityTypeId: record.activityTypeId || selectedActivity?.id || '',
      notes: record.notes || '',
      manualEntry: true,
      startDateTime: record.startDateTime ? toDateTimeInputValue(record.startDateTime) : nowDateTimeInputValue(),
      endDateTime: record.endDateTime ? toDateTimeInputValue(record.endDateTime) : '',
    };
  }

  return {
    operatorId: selectedOperator?.id || '',
    equipmentId: selectedEquipment?.id || '',
    activityTypeId: selectedActivity?.id || '',
    notes: '',
    manualEntry: false,
    startDateTime: nowDateTimeInputValue(),
    endDateTime: '',
  };
}

function buildPayload(form, { operators, equipments, activityTypes, record, defaultOperatorId, defaultEquipmentId }) {
  const selectedOperator = operators.find((item) => item.id === form.operatorId) || operators.find((item) => item.id === defaultOperatorId) || operators[0] || null;
  const selectedEquipment = equipments.find((item) => item.id === form.equipmentId) || equipments.find((item) => item.id === defaultEquipmentId) || equipments[0] || null;
  const selectedActivity = activityTypes.find((item) => item.id === form.activityTypeId) || activityTypes[0] || null;

  const startDateTime = form.manualEntry || record ? new Date(form.startDateTime).toISOString() : new Date().toISOString();
  const endDateTime = form.manualEntry && form.endDateTime ? new Date(form.endDateTime).toISOString() : record?.endDateTime || null;

  return {
    id: record?.id,
    operatorId: selectedOperator?.id || '',
    operatorName: selectedOperator?.name || '',
    registration: selectedOperator?.registration || '',
    equipmentId: selectedEquipment?.id || '',
    plate: selectedEquipment?.plate || '',
    equipmentCode: selectedEquipment?.code || '',
    activityTypeId: selectedActivity?.id || '',
    activityCode: selectedActivity?.code || '',
    activityName: selectedActivity?.name || '',
    classification: selectedActivity?.classification || 'OUTROS',
    location: record ? record.location || null : null,
    failureDescription: record ? record.failureDescription || '' : '',
    correctiveAction: record ? record.correctiveAction || '' : '',
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
  title = '',
  submitLabel = '',
  cancelLabel = '',
  record = null,
  operators,
  equipments,
  activityTypes,
  defaultOperatorId,
  defaultEquipmentId,
  defaultActivityTypeId,
  hideOperatorSelect = false,
  hideEquipmentSelect = false,
  onSubmit,
  onCancel,
}) {
  const { language, t } = useApp();
  const initialState = useMemo(
    () =>
      buildInitialState({
        record,
        operators,
        equipments,
        activityTypes,
        defaultOperatorId,
        defaultEquipmentId,
        defaultActivityTypeId,
      }),
    [activityTypes, defaultActivityTypeId, defaultEquipmentId, defaultOperatorId, equipments, operators, record],
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
      record,
      defaultOperatorId,
      defaultEquipmentId,
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
          notes: '',
          manualEntry: current.manualEntry,
          startDateTime: nowDateTimeInputValue(),
          endDateTime: '',
        }));
      }
    } catch (error) {
      setErrors({ form: translateErrorMessage(error, language) || t('movement.errors.generic') });
    } finally {
      setIsSaving(false);
    }
  }

  const resolvedTitle = title || (record ? t('movement.editTitle') : t('movement.newTitle'));
  const resolvedSubmitLabel = submitLabel || t('movement.submit');
  const resolvedCancelLabel = cancelLabel || t('movement.cancel');

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      <div className="card__head">
        <div>
          <p className="eyebrow">{t('movement.title')}</p>
          <h2>{resolvedTitle}</h2>
        </div>
        <StatusChip tone={form.manualEntry || record ? 'warning' : 'success'}>
          {form.manualEntry || record ? t('movement.manual') : t('movement.automatic')}
        </StatusChip>
      </div>

      {errors.form ? <div className="alert alert--danger">{errors.form}</div> : null}

      <div className="form-grid">
        {!hideOperatorSelect ? (
          <label>
            <span>{t('movement.operator')}</span>
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
            <span>{t('movement.operator')}</span>
            <strong>{selectedOperator?.name || '-'}</strong>
          </div>
        )}

        {!hideEquipmentSelect ? (
          <label>
            <span>{t('movement.equipment')}</span>
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
            <span>{t('movement.equipment')}</span>
            <strong>{selectedEquipment ? `${selectedEquipment.plate} • ${selectedEquipment.code}` : '-'}</strong>
          </div>
        )}

        <label>
          <span>{t('movement.activityCode')}</span>
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

        <label className="toggle-field">
          <input
            type="checkbox"
            checked={form.manualEntry}
            onChange={(event) => updateField('manualEntry', event.target.checked)}
          />
          <span>{t('movement.manual')}</span>
        </label>
      </div>

      <label>
        <span>{t('movement.notes')}</span>
        <textarea
          rows="3"
          value={form.notes}
          onChange={(event) => updateField('notes', event.target.value)}
          placeholder={t('movement.notesPlaceholder')}
        />
      </label>

      {form.manualEntry || record ? (
        <div className="form-grid form-grid--two">
          <label>
            <span>{t('movement.startDateTime')}</span>
            <input
              type="datetime-local"
              value={form.startDateTime}
              onChange={(event) => updateField('startDateTime', event.target.value)}
            />
            {errors.startDateTime ? <small className="field-error">{errors.startDateTime}</small> : null}
          </label>

          <label>
            <span>{t('movement.endDateTime')}</span>
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
          <StatusChip tone="info">{t('movement.autoNote')}</StatusChip>
          <p>{formatDateTime(form.startDateTime, language)}</p>
        </div>
      )}

      <div className="form-actions">
        <button className="button button--primary" type="submit" disabled={isSaving}>
          {isSaving ? t('movement.saving') : resolvedSubmitLabel}
        </button>
        {onCancel ? (
          <button className="button button--ghost" type="button" onClick={onCancel}>
            {resolvedCancelLabel}
          </button>
        ) : null}
      </div>
    </form>
  );
}
