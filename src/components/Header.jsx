import { StatusChip } from './StatusChip';

const enaexLogo = new URL('../assets/enaex-brasil.png', import.meta.url).href;

export function Header({
  title,
  subtitle,
  session,
  canInstallApp,
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
          <p className="eyebrow">Sistema de Tempos e Movimentos</p>
          <h1>{title}</h1>
          <p className="subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="header-actions">
        <StatusChip tone="info">{currentStateLabel}</StatusChip>
        {session ? (
          <div className="header-session card__inline">
            <strong>{session.operatorName}</strong>
            <span>{session.shiftName || 'Turno não informado'}</span>
          </div>
        ) : null}
        {canInstallApp ? (
          <button className="button button--secondary" type="button" onClick={onInstall}>
            Instalar app
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
