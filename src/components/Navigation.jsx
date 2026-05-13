import { StatusChip } from './StatusChip';

export function Navigation({ items, currentPath, onNavigate, session }) {
  return (
    <nav className="side-nav card card--shell">
      <div className="nav-top">
        <p className="nav-title">Navegação</p>
        {session ? <StatusChip tone="success">OPERADOR ATIVO</StatusChip> : <StatusChip tone="warning">ENTRAR</StatusChip>}
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
