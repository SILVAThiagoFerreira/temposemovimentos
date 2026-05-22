import { useState } from 'react';
import { StatusChip } from './StatusChip';
import { getRoleLabel } from '../utils/roles';
import { useApp } from '../context/AppContext';

export function Navigation({ items, currentPath, onNavigate, session }) {
  const { language, t } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className={`side-nav card card--shell ${isOpen ? 'is-open' : 'is-collapsed'}`}>
      <div className="nav-top">
        <p className="nav-title">{t('navigation.title')}</p>
        <button type="button" className="nav-toggle" onClick={() => setIsOpen((current) => !current)}>
          {isOpen ? t('common.close') : t('common.open')}
        </button>
      </div>

      <div className="nav-meta">
        {session ? (
          <StatusChip tone="success">{t('navigation.active', { role: getRoleLabel(session.role, language).toUpperCase() })}</StatusChip>
        ) : (
          <StatusChip tone="warning">{t('navigation.login')}</StatusChip>
        )}
      </div>

      {isOpen ? (
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
      ) : (
        <div className="nav-collapsed-note">
          <span>{items.find((item) => item.path === currentPath)?.label || t('navigation.title')}</span>
          <small>{items.find((item) => item.path === currentPath)?.helper || ''}</small>
        </div>
      )}
    </nav>
  );
}
