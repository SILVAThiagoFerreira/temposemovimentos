import { lazy, Suspense, useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { refreshApplicationAssets } from './services/updateService';
import { getHomeRouteForRole, isClientRole, isOperatorRole } from './utils/roles';

const LoginPage = lazy(() => import('./pages/Login').then((module) => ({ default: module.Login })));
const OperatorPanelPage = lazy(() => import('./pages/OperatorPanel').then((module) => ({ default: module.OperatorPanel })));
const DashboardPage = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const RegistrationsPage = lazy(() => import('./pages/Registrations').then((module) => ({ default: module.Registrations })));
const DataExportPage = lazy(() => import('./pages/DataExport').then((module) => ({ default: module.DataExport })));
const SettingsPage = lazy(() => import('./pages/Settings').then((module) => ({ default: module.Settings })));

const ROUTES = [
  { path: '/operador', icon: 'operator', labelKey: 'navigation.items.operator.label', roles: ['OPERADOR', 'GERENTE'] },
  { path: '/dashboard', icon: 'dashboard', labelKey: 'navigation.items.dashboard.label', roles: ['CLIENTE', 'GERENTE'] },
  { path: '/cadastros', icon: 'registrations', labelKey: 'navigation.items.registrations.label', roles: ['GERENTE'] },
  { path: '/dados', icon: 'export', labelKey: 'navigation.items.export.label', roles: ['GERENTE'] },
  { path: '/configuracoes', icon: 'settings', labelKey: 'navigation.items.settings.label', roles: ['GERENTE'] },
];

function normalizeRoute(hash) {
  const raw = String(hash || '').replace(/^#/, '').trim();
  if (!raw) {
    return '';
  }

  const route = raw.startsWith('/') ? raw : `/${raw}`;
  return route.split('?')[0];
}

function defaultRouteForSession(session) {
  if (!session) {
    return '/login';
  }

  return getHomeRouteForRole(session.role);
}

function getAccessibleRoutes(role) {
  const normalizedRole = String(role || '').trim().toUpperCase();
  return ROUTES.filter((route) => route.roles.includes(normalizedRole));
}

function useHashRoute(session) {
  const [route, setRoute] = useState(() => normalizeRoute(window.location.hash) || defaultRouteForSession(session) || '/login');

  useEffect(() => {
    const handleHashChange = () => {
      const next = normalizeRoute(window.location.hash);
      setRoute(next || defaultRouteForSession(session) || '/login');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [route, session]);

  useEffect(() => {
    const current = normalizeRoute(window.location.hash);
    if (!session && current !== '/login') {
      window.location.hash = '/login';
      setRoute('/login');
      return;
    }

    if (!current) {
      window.location.hash = defaultRouteForSession(session) || '/login';
    }
  }, [session]);

  const navigate = (nextRoute) => {
    const routeValue = nextRoute.startsWith('/') ? nextRoute : `/${nextRoute}`;
    if (window.location.hash !== `#${routeValue}`) {
      window.location.hash = routeValue;
    }
    setRoute(routeValue);
  };

  return [route, navigate];
}

function AppShell() {
  const { session, logout, isLocalMode, language, t } = useApp();
  const [route, navigate] = useHashRoute(session);
  const isOperator = isOperatorRole(session?.role);
  const isClient = isClientRole(session?.role);
  const loadingFallback = <div className="empty-state">{t('common.loading')}</div>;
  const statusLabel = isLocalMode ? t('connection.local') : t('connection.online');

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    document.title = t('app.name');
  }, [route, t]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  let content;

  if (!session) {
    content = <LoginPage navigate={navigate} />;
  } else if (isOperator) {
    content = (
      <div className="app-frame app-frame--operator">
        <Header session={session} onLogout={handleLogout} onRefresh={refreshApplicationAssets} isOnline={!isLocalMode} statusLabel={statusLabel} />
        <main className="app-main">
          <OperatorPanelPage
            standalone
            onRefreshUpdate={refreshApplicationAssets}
            onLogout={handleLogout}
          />
        </main>
      </div>
    );
  } else if (isClient) {
    content = (
      <div className="app-frame">
        <Header session={session} onLogout={handleLogout} onRefresh={refreshApplicationAssets} isOnline={!isLocalMode} statusLabel={statusLabel} />
        <main className="app-main">
          <DashboardPage />
        </main>
      </div>
    );
  } else {
    const accessibleRoutes = getAccessibleRoutes(session.role).map((item) => ({
      ...item,
      label: t(item.labelKey),
    }));
    const currentRoute = route === '/login' ? '/dashboard' : accessibleRoutes.some((item) => item.path === route) ? route : '/dashboard';

    const page = (() => {
      switch (currentRoute) {
        case '/login':
          return <LoginPage navigate={navigate} />;
        case '/operador':
          return <OperatorPanelPage />;
        case '/dashboard':
          return <DashboardPage />;
        case '/cadastros':
          return <RegistrationsPage />;
        case '/dados':
          return <DataExportPage />;
        case '/configuracoes':
          return <SettingsPage />;
        default:
          return <LoginPage navigate={navigate} />;
      }
    })();

    content = (
      <div className="app-frame">
        <Header session={session} onLogout={handleLogout} onRefresh={refreshApplicationAssets} isOnline={!isLocalMode} statusLabel={statusLabel} />
        <Navigation items={accessibleRoutes} currentPath={currentRoute} onNavigate={navigate} />
        <main className="app-main">{page}</main>
      </div>
    );
  }

  return <Suspense fallback={loadingFallback}>{content}</Suspense>;
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
