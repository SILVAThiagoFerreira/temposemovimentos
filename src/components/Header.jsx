import { LanguageSwitcher } from './LanguageSwitcher';
import { Icon } from './Icon';
import { useApp } from '../context/AppContext';

const base = import.meta.env.BASE_URL;

function initialsOf(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function Header({ session, onLogout, onRefresh, isOnline = false, statusLabel = '' }) {
  const { t } = useApp();

  return (
    <header className="app-header">
      <div className="brand-lockup">
        <img className="brand-logo" src={`${base}enaex-logo.png`} alt="Enaex" />
      </div>

      <div className="header-actions">
        <span
          className={`connection-dot ${isOnline ? 'is-online' : ''}`.trim()}
          role="img"
          aria-label={statusLabel}
          title={statusLabel}
        />
        <LanguageSwitcher />
        <button className="button--header" type="button" onClick={() => void onRefresh?.()} aria-label={t('common.updateSystem')} title={t('common.updateSystem')}>
          <Icon name="refresh" size={18} />
        </button>
        {session ? (
          <span className="header-session" aria-label={session.operatorName} title={session.operatorName}>
            {initialsOf(session.operatorName)}
          </span>
        ) : null}
        {session ? (
          <button className="button--header" type="button" onClick={onLogout} aria-label={t('common.logout')} title={t('common.logout')}>
            <Icon name="logout" size={18} />
          </button>
        ) : null}
      </div>
    </header>
  );
}
