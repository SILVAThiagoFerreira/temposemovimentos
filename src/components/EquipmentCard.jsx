import { StatusChip } from './StatusChip';

export function EquipmentCard({ equipment, selected, openRecord, onSelect }) {
  const isBusy = Boolean(openRecord);

  return (
    <button
      type="button"
      className={`equipment-card card ${selected ? 'is-selected' : ''} ${isBusy ? 'is-busy' : ''}`}
      onClick={() => onSelect(equipment.id)}
    >
      <div className="equipment-card__head">
        <div>
          <p className="equipment-card__plate">{equipment.plate}</p>
          <h3>{equipment.code}</h3>
        </div>
        <StatusChip tone={isBusy ? 'danger' : equipment.active ? 'success' : 'neutral'}>
          {isBusy ? 'ABERTO' : equipment.active ? 'ATIVO' : 'INATIVO'}
        </StatusChip>
      </div>

      <p className="equipment-card__description">{equipment.description}</p>

      <div className="equipment-card__meta">
        <span>{isBusy ? openRecord.activityName : 'Disponível para apontamento'}</span>
        <small>{isBusy ? openRecord.operatorName : 'Pronto para operação'}</small>
      </div>
    </button>
  );
}
