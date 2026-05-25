import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusChip } from '../components/StatusChip';
import { formatDateTime } from '../services/timeService';

function getClassificationLabel(value, t) {
  const normalized = String(value || 'OUTROS').trim().toUpperCase();
  const key = normalized === 'OPERAÇÃO' ? 'operation' : normalized === 'MANUTENÇÃO' ? 'maintenance' : normalized === 'OCIOSIDADE' ? 'idle' : 'other';
  return t(`classifications.${key}`);
}

function emptyEquipmentForm() {
  return { id: '', plate: '', code: '', description: '', active: true };
}

function emptyActivityForm() {
  return { id: '', code: '', name: '', classification: 'OPERAÇÃO', defaultLocation: '', active: true };
}

export function Registrations() {
  const {
    equipments,
    activityTypes,
    saveEquipment,
    updateEquipment,
    deleteEquipment,
    saveActivityType,
    updateActivityType,
    deleteActivityType,
    language,
    t,
  } = useApp();

  const [equipmentForm, setEquipmentForm] = useState(() => emptyEquipmentForm());
  const [activityForm, setActivityForm] = useState(() => emptyActivityForm());

  const stats = useMemo(
    () => [
      { label: t('registrations.stats.equipments'), value: equipments.length, tone: 'info' },
      { label: t('registrations.stats.codes'), value: activityTypes.length, tone: 'warning' },
    ],
    [activityTypes.length, equipments.length, t],
  );

  function handleEquipmentSubmit(event) {
    event.preventDefault();
    const payload = {
      ...equipmentForm,
      plate: equipmentForm.plate.trim().toUpperCase(),
      code: equipmentForm.code.trim().toUpperCase(),
      description: equipmentForm.description.trim(),
    };

    if (!payload.plate || !payload.code) {
      return;
    }

    if (payload.id) {
      updateEquipment(payload.id, payload);
    } else {
      saveEquipment(payload);
    }

    setEquipmentForm(emptyEquipmentForm());
  }

  function editEquipment(equipment) {
    setEquipmentForm({
      id: equipment.id,
      plate: equipment.plate,
      code: equipment.code,
      description: equipment.description,
      active: equipment.active !== false,
    });
  }

  function handleActivitySubmit(event) {
    event.preventDefault();
    const payload = {
      ...activityForm,
      code: activityForm.code.trim(),
      name: activityForm.name.trim(),
      classification: activityForm.classification,
      defaultLocation: activityForm.defaultLocation || null,
    };

    if (!payload.code || !payload.name) {
      return;
    }

    if (payload.id) {
      updateActivityType(payload.id, payload);
    } else {
      saveActivityType(payload);
    }

    setActivityForm(emptyActivityForm());
  }

  function editActivity(activityType) {
    setActivityForm({
      id: activityType.id,
      code: activityType.code,
      name: activityType.name,
      classification: activityType.classification,
      defaultLocation: activityType.defaultLocation || '',
      active: activityType.active !== false,
    });
  }

  return (
    <div className="page-stack">
      <section className="card page-banner">
        <div>
          <p className="eyebrow">{t('registrations.banner.eyebrow')}</p>
          <h2>{t('registrations.banner.title')}</h2>
          <p>{t('registrations.banner.copy')}</p>
        </div>
        <StatusChip tone="info">{formatDateTime(new Date(), language)}</StatusChip>
      </section>

      <section className="stats-grid stats-grid--compact">
        {stats.map((item) => (
          <article key={item.label} className={`card stat-card stat-card--${item.tone}`}>
            <p>{item.label}</p>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="registrations-grid">
        <article className="card registration-card">
          <div className="card__head">
            <div>
              <p className="eyebrow">{t('registrations.equipment.eyebrow')}</p>
              <h2>{t('registrations.equipment.title')}</h2>
            </div>
          </div>

          <form className="mini-form" onSubmit={handleEquipmentSubmit}>
            <input value={equipmentForm.plate} onChange={(event) => setEquipmentForm({ ...equipmentForm, plate: event.target.value })} placeholder={t('registrations.equipment.plate')} />
            <input value={equipmentForm.code} onChange={(event) => setEquipmentForm({ ...equipmentForm, code: event.target.value })} placeholder={t('registrations.equipment.code')} />
            <input value={equipmentForm.description} onChange={(event) => setEquipmentForm({ ...equipmentForm, description: event.target.value })} placeholder={t('registrations.equipment.description')} />
            <label className="toggle-field toggle-field--inline">
              <input type="checkbox" checked={equipmentForm.active} onChange={(event) => setEquipmentForm({ ...equipmentForm, active: event.target.checked })} />
              <span>{t('registrations.equipment.active')}</span>
            </label>
            <button className="button button--primary" type="submit">
              {equipmentForm.id ? t('registrations.equipment.update') : t('registrations.equipment.add')}
            </button>
          </form>

          <div className="entity-list">
            {equipments.map((equipment) => (
              <div key={equipment.id} className="entity-row">
                <div>
                  <strong>{equipment.plate}</strong>
                  <small>
                    {equipment.code} • {equipment.description}
                  </small>
                </div>
                <div className="entity-actions">
                  <button className="button button--ghost button--tiny" type="button" onClick={() => editEquipment(equipment)}>
                    {t('registrations.equipment.edit')}
                  </button>
                  <button
                    className="button button--danger button--tiny"
                    type="button"
                    onClick={() => {
                      if (window.confirm(t('registrations.equipment.confirmDelete'))) deleteEquipment(equipment.id);
                    }}
                  >
                    {t('registrations.equipment.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="card registration-card">
          <div className="card__head">
            <div>
              <p className="eyebrow">{t('registrations.activity.eyebrow')}</p>
              <h2>{t('registrations.activity.title')}</h2>
            </div>
          </div>

          <form className="mini-form" onSubmit={handleActivitySubmit}>
            <input value={activityForm.code} onChange={(event) => setActivityForm({ ...activityForm, code: event.target.value })} placeholder={t('registrations.activity.code')} />
            <input value={activityForm.name} onChange={(event) => setActivityForm({ ...activityForm, name: event.target.value })} placeholder={t('registrations.activity.description')} />
            <select value={activityForm.classification} onChange={(event) => setActivityForm({ ...activityForm, classification: event.target.value })}>
              <option value="OPERAÇÃO">{t('classifications.operation')}</option>
              <option value="MANUTENÇÃO">{t('classifications.maintenance')}</option>
              <option value="OCIOSIDADE">{t('classifications.idle')}</option>
              <option value="OUTROS">{t('classifications.other')}</option>
            </select>
            <select value={activityForm.defaultLocation} onChange={(event) => setActivityForm({ ...activityForm, defaultLocation: event.target.value })}>
              <option value="">{t('locations.automatic')}</option>
              <option value="CHASSI">{t('locations.chassis')}</option>
              <option value="UNIDADE">{t('locations.unit')}</option>
            </select>
            <label className="toggle-field toggle-field--inline">
              <input type="checkbox" checked={activityForm.active} onChange={(event) => setActivityForm({ ...activityForm, active: event.target.checked })} />
              <span>{t('registrations.activity.active')}</span>
            </label>
            <button className="button button--primary" type="submit">
              {activityForm.id ? t('registrations.activity.update') : t('registrations.activity.add')}
            </button>
          </form>

          <div className="entity-list">
            {activityTypes.map((activityType) => (
              <div key={activityType.id} className="entity-row">
                <div>
                  <strong>{activityType.code}</strong>
                  <small>
                    {activityType.name} • {getClassificationLabel(activityType.classification, t)}
                  </small>
                </div>
                <div className="entity-actions">
                  <button className="button button--ghost button--tiny" type="button" onClick={() => editActivity(activityType)}>
                    {t('registrations.activity.edit')}
                  </button>
                  <button
                    className="button button--danger button--tiny"
                    type="button"
                    onClick={() => {
                      if (window.confirm(t('registrations.activity.confirmDelete'))) deleteActivityType(activityType.id);
                    }}
                  >
                    {t('registrations.activity.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
