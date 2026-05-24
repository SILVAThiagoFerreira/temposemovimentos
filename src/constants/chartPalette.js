export const MANAGEMENT_CHART_COLORS = {
  good: '#168255',
  goodAlt: '#2A9D68',
  goodDeep: '#0F6240',
  medium: '#b97909',
  mediumAlt: '#D79B10',
  mediumDeep: '#8B5B00',
  danger: '#c4162a',
  dangerAlt: '#E0485C',
  dangerDeep: '#9E0012',
};

export const MANAGEMENT_CHART_PALETTE = [
  MANAGEMENT_CHART_COLORS.good,
  MANAGEMENT_CHART_COLORS.medium,
  MANAGEMENT_CHART_COLORS.danger,
  MANAGEMENT_CHART_COLORS.goodAlt,
  MANAGEMENT_CHART_COLORS.mediumAlt,
  MANAGEMENT_CHART_COLORS.dangerAlt,
  MANAGEMENT_CHART_COLORS.goodDeep,
  MANAGEMENT_CHART_COLORS.mediumDeep,
  MANAGEMENT_CHART_COLORS.dangerDeep,
];

const MANAGEMENT_SEGMENT_COLORS = {
  OPERAÇÃO: MANAGEMENT_CHART_COLORS.good,
  MANUTENÇÃO: MANAGEMENT_CHART_COLORS.danger,
  OCIOSIDADE: MANAGEMENT_CHART_COLORS.medium,
  OUTROS: MANAGEMENT_CHART_COLORS.medium,
  operation: MANAGEMENT_CHART_COLORS.good,
  maintenance: MANAGEMENT_CHART_COLORS.danger,
  meal: MANAGEMENT_CHART_COLORS.medium,
  gaps: MANAGEMENT_CHART_COLORS.danger,
  idle: MANAGEMENT_CHART_COLORS.medium,
  other: MANAGEMENT_CHART_COLORS.medium,
  available: MANAGEMENT_CHART_COLORS.good,
  rest: MANAGEMENT_CHART_COLORS.medium,
  inOperation: MANAGEMENT_CHART_COLORS.good,
};

export function getManagementChartColor(key, fallbackIndex = 0) {
  const normalizedKey = String(key || '').trim();

  return (
    MANAGEMENT_SEGMENT_COLORS[normalizedKey] ||
    MANAGEMENT_SEGMENT_COLORS[normalizedKey.toUpperCase()] ||
    MANAGEMENT_SEGMENT_COLORS[normalizedKey.toLowerCase()] ||
    MANAGEMENT_CHART_PALETTE[fallbackIndex % MANAGEMENT_CHART_PALETTE.length]
  );
}
