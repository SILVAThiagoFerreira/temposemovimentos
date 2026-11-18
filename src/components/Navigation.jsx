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
          >
            <Icon name={item.icon} size={20} />
            <span className="nav-item__label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
