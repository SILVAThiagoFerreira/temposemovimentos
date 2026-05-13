export function StatusChip({ tone = 'neutral', children, className = '' }) {
  return <span className={`status-chip status-chip--${tone} ${className}`.trim()}>{children}</span>;
}
