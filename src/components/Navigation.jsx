import { StatusChip } from './StatusChip';
import { getRoleLabel } from '../utils/roles';
import { useApp } from '../context/AppContext';

export function Navigation({ items, currentPath, onNavigate, session }) {
  const { language, t } = useApp();
  const currentItem = items.find((item) => item.path === currentPath) || items[0] || null;
  const currentTitle = currentItem?.label || t('navigation.title');
  const currentHelper = currentItem?.helper || '';

  return (
    <nav className="side-nav card card--shell">
      <div className="nav-top">
        <div className="nav-brand-block">
          <p className="nav-title">{t('navigation.title')}</p>
          <strong>{currentTitle}</strong>
          <small>{currentHelper || t('navigation.login')}</small>
        </div>

        <div className="nav-meta">
          {session ? (
            <StatusChip tone="success">{t('navigation.active', { role: getRoleLabel(session.role, language).toUpperCase() })}</StatusChip>
          ) : (
            <StatusChip tone="warning">{t('navigation.login')}</StatusChip>
          )}
        </div>
      </div>

      <div className="nav-divider" aria-hidden="true" />

      <div className="nav-list" id="admin-navigation-list">
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
