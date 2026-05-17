import { StatusChip } from './StatusChip';
import { getRoleLabel } from '../utils/roles';

const enaexLogo = new URL('../assets/enaex-brasil.png', import.meta.url).href;

export function Header({
  title,
  subtitle,
  session,
  canInstallApp,
  onRefreshUpdate,
  onInstall,
  onLogout,
  currentStateLabel = 'MODO LOCAL',
}) {
  return (
    <header className="app-header card card--shell">
      <div className="brand-lockup">
        <div className="brand-mark">
          <img src={enaexLogo} alt="Enaex Brasil" />
        </div>
        <div>
          <p className="eyebrow">ENAEX // Sistema de Operações</p>
          <h1>{title}</h1>
          <p className="subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="header-actions">
        <StatusChip tone="info">{currentStateLabel}</StatusChip>
        {session ? (
          <div className="header-session card__inline">
            <strong>{session.operatorName}</strong>
            <span>{getRoleLabel(session.role)}</span>
          </div>
        ) : null}
        {session ? (
          <button className="button button--secondary" type="button" onClick={() => void onRefreshUpdate?.()}>
            Atualizar sistema
          </button>
        ) : null}
        {canInstallApp ? (
          <button className="button button--secondary" type="button" onClick={onInstall}>
            Instalar aplicativo
          </button>
        ) : null}
        {session ? (
          <button className="button button--ghost" type="button" onClick={onLogout}>
            Sair
          </button>
        ) : null}
      </div>
    </header>
  );
}
