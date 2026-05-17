import { StatusChip } from './StatusChip';
import { useApp } from '../context/AppContext';

export function EquipmentCard({ equipment, selected, openRecord, onSelect }) {
  const { t } = useApp();
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
          {isBusy ? t('equipmentCard.open') : equipment.active ? t('equipmentCard.active') : t('equipmentCard.inactive')}
        </StatusChip>
      </div>

      <p className="equipment-card__description">{equipment.description}</p>

      <div className="equipment-card__meta">
        <span>{isBusy ? openRecord.activityName : t('equipmentCard.available')}</span>
        <small>{isBusy ? openRecord.operatorName : t('equipmentCard.ready')}</small>
      </div>
    </button>
  );
}
