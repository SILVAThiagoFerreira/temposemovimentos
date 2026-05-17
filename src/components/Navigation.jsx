import { StatusChip } from './StatusChip';
import { getRoleLabel } from '../utils/roles';
import { useApp } from '../context/AppContext';

export function Navigation({ items, currentPath, onNavigate, session }) {
  const { language, t } = useApp();

  return (
    <nav className="side-nav card card--shell">
      <div className="nav-top">
        <p className="nav-title">{t('navigation.title')}</p>
        {session ? (
          <StatusChip tone="success">{t('navigation.active', { role: getRoleLabel(session.role, language).toUpperCase() })}</StatusChip>
        ) : (
          <StatusChip tone="warning">{t('navigation.login')}</StatusChip>
        )}
      </div>

      <div className="nav-list">
        {items.map((item) => (
          <button
            key={item.path}
            type="button"
            className={`nav-item ${currentPath === item.path ? 'is-active' : ''}`}
            onClick={() => onNavigate(item.path)}
          >
            <span>{item.label}</span>
            <small>{item.helper}</small>
          </button>
        ))}
      </div>
    </nav>
  );
}
