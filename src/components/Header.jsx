import { StatusChip } from './StatusChip';
import { getRoleLabel } from '../utils/roles';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useApp } from '../context/AppContext';

const openblastLogo = new URL('../assets/openblast-logo.png', import.meta.url).href;

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
        <div className="brand-mark">
          <img src={openblastLogo} alt="OpenBlast" />
        </div>
        <div>
          <h1>{title}</h1>
          <p className="subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="header-actions">
        <StatusChip tone={isOnline ? 'success' : 'info'}>{stateLabel}</StatusChip>
        {session ? (
          <div className="header-session">
            <strong>{session.operatorName}</strong>
            <span>{getRoleLabel(session.role, language)}</span>
          </div>
        ) : null}
        <LanguageSwitcher />
        {session ? (
          <button className="button button--ghost" type="button" onClick={onLogout}>
            {t('common.logout')}
          </button>
        ) : null}
      </div>
    </header>
  );
}
