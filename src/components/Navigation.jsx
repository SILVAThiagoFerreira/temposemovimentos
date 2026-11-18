import { Icon } from './Icon';

export function Navigation({ items, currentPath, onNavigate }) {
  return (
    <nav className="side-nav">
      <div className="nav-list">
        {items.map((item) => (
          <button
            key={item.path}
            type="button"
            className={`nav-item ${currentPath === item.path ? 'is-active' : ''}`}
            onClick={() => onNavigate(item.path)}
            aria-current={currentPath === item.path ? 'page' : undefined}
            aria-label={item.label}
            title={item.label}
          >
            <Icon name={item.icon} size={20} />
          </button>
        ))}
      </div>
    </nav>
  );
}
