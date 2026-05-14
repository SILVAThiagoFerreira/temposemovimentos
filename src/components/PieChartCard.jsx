import { useMemo } from 'react';

const DEFAULT_COLORS = ['#245f9e', '#1f8a57', '#c28a15', '#bf3d3d', '#6b7280', '#8b5cf6', '#0ea5e9', '#f97316'];

function getNumericValue(segment) {
  return Number(segment?.value ?? segment?.count ?? segment?.minutes ?? 0);
}

export function PieChartCard({
  eyebrow = 'Análise',
  title,
  subtitle = '',
  centerValue = '0',
  centerLabel = '',
  segments = [],
  emptyMessage = 'Sem dados no período.',
  footnote = '',
  className = '',
}) {
  const normalized = useMemo(() => {
    const values = segments.map((segment, index) => ({
      ...segment,
      value: getNumericValue(segment),
      color: segment?.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    }));
    const total = values.reduce((sum, segment) => sum + segment.value, 0);

    return values.map((segment) => ({
      ...segment,
      percent: total > 0 ? Number(((segment.value / total) * 100).toFixed(1)) : 0,
    }));
  }, [segments]);

  const total = normalized.reduce((sum, segment) => sum + segment.value, 0);
  const gradient = normalized
    .reduce(
      (accumulator, segment, index, array) => {
        const previous = accumulator.length ? accumulator[accumulator.length - 1].end : 0;
        const end = previous + (total > 0 ? (segment.value / total) * 100 : 0);
        if (segment.value > 0 || array.length === 1) {
          accumulator.push({ color: segment.color, start: previous, end });
        }
        return accumulator;
      },
      [],
    )
    .map((stop) => `${stop.color} ${stop.start}% ${stop.end}%`)
    .join(', ');

  return (
    <section className={`card dashboard-block pie-chart-card ${className}`.trim()}>
      <div className="card__head">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
      </div>

      {subtitle ? <p className="pie-chart-card__subtitle">{subtitle}</p> : null}

      {!total ? (
        <p className="empty-state">{emptyMessage}</p>
      ) : (
        <div className="pie-chart-card__body">
          <div className="pie-chart-card__figure">
            <div className="pie-chart-card__ring" style={{ background: `conic-gradient(from -90deg, ${gradient})` }}>
              <div className="pie-chart-card__center">
                <strong>{centerValue}</strong>
                <span>{centerLabel}</span>
              </div>
            </div>
          </div>

          <div className="pie-chart-card__legend">
            {normalized.map((segment) => (
              <div key={segment.key || segment.label || segment.name} className="pie-chart-card__legend-item">
                <span className="pie-chart-card__swatch" style={{ background: segment.color }} />
                <div className="pie-chart-card__legend-meta">
                  <strong>{segment.label || segment.name || segment.code || 'Sem título'}</strong>
                  <small>{segment.detail || segment.subtitle || `${segment.value}`}</small>
                </div>
                <span className="pie-chart-card__percent">{Number(segment.percent || 0).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {footnote ? <p className="pie-chart-card__footnote">{footnote}</p> : null}
    </section>
  );
}
