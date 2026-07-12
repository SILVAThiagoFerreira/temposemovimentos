import { StatusChip } from './StatusChip';
import { getRoleLabel } from '../utils/roles';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useApp } from '../context/AppContext';

const base = import.meta.env.BASE_URL;

export function Header({
  title,
  subtitle,
  session,
  canInstallApp,
  onRefreshUpdate,
  onInstall,
  onLogout,
  currentStateLabel = '',
}) {
  const { language, t } = useApp();
  const stateLabel = currentStateLabel || t('connection.local');
  const isOnline = currentStateLabel && !currentStateLabel.toLowerCase().includes('local');

  return (
    <header className="app-header">
      <div className="brand-lockup">
        <img className="brand-logo" src={`${base}openblast-logo.png`} alt="OpenBlast" />
      </div>

      <div className="header-center">
        <h1>{title}</h1>
      </div>

      <div className="header-actions">
        <StatusChip tone={isOnline ? 'success' : 'neutral'}>{stateLabel}</StatusChip>
        {session ? (
          <div className="header-session">
            <span>{session.operatorName}</span>
            <span className="header-role">{getRoleLabel(session.role, language)}</span>
          </div>
        ) : null}
        <LanguageSwitcher />
        {session ? (
          <button className="button button--header" type="button" onClick={onLogout}>
            {t('common.logout')}
          </button>
        ) : null}
      </div>
    </header>
  );
}
