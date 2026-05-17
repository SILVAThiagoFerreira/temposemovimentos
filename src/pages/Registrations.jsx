import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusChip } from '../components/StatusChip';
import { formatDateTime } from '../services/timeService';

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
  } = useApp();

  const [equipmentForm, setEquipmentForm] = useState(() => emptyEquipmentForm());
  const [activityForm, setActivityForm] = useState(() => emptyActivityForm());

  const stats = useMemo(
    () => [
      { label: 'Equipamentos', value: equipments.length, tone: 'info' },
      { label: 'Códigos', value: activityTypes.length, tone: 'warning' },
    ],
    [activityTypes.length, equipments.length],
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
          <p className="eyebrow">Cadastro mestre</p>
          <h2>Base operacional</h2>
          <p>Equipamentos e códigos.</p>
        </div>
        <StatusChip tone="info">{formatDateTime(new Date())}</StatusChip>
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
              <p className="eyebrow">Equipamentos</p>
              <h2>Placas e UMBs</h2>
            </div>
          </div>

          <form className="mini-form" onSubmit={handleEquipmentSubmit}>
            <input value={equipmentForm.plate} onChange={(event) => setEquipmentForm({ ...equipmentForm, plate: event.target.value })} placeholder="Placa" />
            <input value={equipmentForm.code} onChange={(event) => setEquipmentForm({ ...equipmentForm, code: event.target.value })} placeholder="UMB" />
            <input value={equipmentForm.description} onChange={(event) => setEquipmentForm({ ...equipmentForm, description: event.target.value })} placeholder="Descrição" />
            <label className="toggle-field toggle-field--inline">
              <input type="checkbox" checked={equipmentForm.active} onChange={(event) => setEquipmentForm({ ...equipmentForm, active: event.target.checked })} />
              <span>Ativo</span>
            </label>
            <button className="button button--primary" type="submit">
              {equipmentForm.id ? 'Atualizar' : 'Adicionar'}
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
                    Editar
                  </button>
                  <button
                    className="button button--danger button--tiny"
                    type="button"
                    onClick={() => {
                      if (window.confirm('Excluir equipamento?')) deleteEquipment(equipment.id);
                    }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="card registration-card">
          <div className="card__head">
            <div>
              <p className="eyebrow">Atividades e paradas</p>
              <h2>Códigos</h2>
            </div>
          </div>

          <form className="mini-form" onSubmit={handleActivitySubmit}>
            <input value={activityForm.code} onChange={(event) => setActivityForm({ ...activityForm, code: event.target.value })} placeholder="Código" />
            <input value={activityForm.name} onChange={(event) => setActivityForm({ ...activityForm, name: event.target.value })} placeholder="Descrição" />
            <select value={activityForm.classification} onChange={(event) => setActivityForm({ ...activityForm, classification: event.target.value })}>
              <option value="OPERAÇÃO">OPERAÇÃO</option>
              <option value="MANUTENÇÃO">MANUTENÇÃO</option>
              <option value="OCIOSIDADE">OCIOSIDADE</option>
              <option value="OUTROS">OUTROS</option>
            </select>
            <select value={activityForm.defaultLocation} onChange={(event) => setActivityForm({ ...activityForm, defaultLocation: event.target.value })}>
              <option value="">Automático</option>
              <option value="CHASSI">Chassi</option>
              <option value="UNIDADE">Unidade</option>
            </select>
            <label className="toggle-field toggle-field--inline">
              <input type="checkbox" checked={activityForm.active} onChange={(event) => setActivityForm({ ...activityForm, active: event.target.checked })} />
              <span>Ativo</span>
            </label>
            <button className="button button--primary" type="submit">
              {activityForm.id ? 'Atualizar' : 'Adicionar'}
            </button>
          </form>

          <div className="entity-list">
            {activityTypes.map((activityType) => (
              <div key={activityType.id} className="entity-row">
                <div>
                  <strong>{activityType.code}</strong>
                  <small>
                    {activityType.name} • {activityType.classification}
                  </small>
                </div>
                <div className="entity-actions">
                  <button className="button button--ghost button--tiny" type="button" onClick={() => editActivity(activityType)}>
                    Editar
                  </button>
                  <button
                    className="button button--danger button--tiny"
                    type="button"
                    onClick={() => {
                      if (window.confirm('Excluir atividade/parada?')) deleteActivityType(activityType.id);
                    }}
                  >
                    Excluir
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
