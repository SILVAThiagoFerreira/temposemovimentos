const ROLE_LABELS = {
  OPERADOR: 'Operador',
  CLIENTE: 'Cliente',
  GERENTE: 'Gerente',
};

const ROLE_ORDER = {
  OPERADOR: 0,
  CLIENTE: 1,
  GERENTE: 2,
};

const ROLE_HOME_ROUTES = {
  OPERADOR: '/operador',
  CLIENTE: '/dashboard',
  GERENTE: '/dashboard',
};

export function normalizeUserRole(role) {
  const normalized = String(role || 'OPERADOR').trim().toUpperCase();
  return ROLE_LABELS[normalized] ? normalized : 'OPERADOR';
}

export function getRoleLabel(role) {
  return ROLE_LABELS[normalizeUserRole(role)] || 'Operador';
}

export function getRoleOrder(role) {
  return ROLE_ORDER[normalizeUserRole(role)] ?? 0;
}

export function isOperatorRole(role) {
  return normalizeUserRole(role) === 'OPERADOR';
}

export function isClientRole(role) {
  return normalizeUserRole(role) === 'CLIENTE';
}

export function isManagerRole(role) {
  return normalizeUserRole(role) === 'GERENTE';
}

export function getHomeRouteForRole(role) {
  return ROLE_HOME_ROUTES[normalizeUserRole(role)] || '/login';
}
