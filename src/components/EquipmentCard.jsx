import { useApp } from '../context/AppContext';

export function EquipmentCard({ equipment, selected, openRecord, onSelect }) {
  const { t } = useApp();
  const isBusy = Boolean(openRecord);
  const label = `${equipment.code} · ${equipment.plate} · ${isBusy ? t('equipmentCard.open') : t('equipmentCard.available')}`;

  return (
    <button
      type="button"
      className={`equipment-card card ${selected ? 'is-selected' : ''} ${isBusy ? 'is-busy' : ''}`}
      onClick={() => onSelect(equipment.id)}
      aria-pressed={selected}
      aria-label={label}
      title={label}
    >
      <span className="equipment-card__plate">{equipment.plate}</span>
      <h3>{equipment.code}</h3>
    </button>
  );
}
