import { lazy, Suspense, useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { refreshApplicationAssets } from './services/updateService';
import { getHomeRouteForRole, isClientRole, isManagerRole, isOperatorRole } from './utils/roles';
import { metaConfig } from './config/runtimeConfig';

const LoginPage = lazy(() => import('./pages/Login').then((module) => ({ default: module.Login })));
const OperatorPanelPage = lazy(() => import('./pages/OperatorPanel').then((module) => ({ default: module.OperatorPanel })));
const DashboardPage = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const RegistrationsPage = lazy(() => import('./pages/Registrations').then((module) => ({ default: module.Registrations })));
const DataExportPage = lazy(() => import('./pages/DataExport').then((module) => ({ default: module.DataExport })));
const SettingsPage = lazy(() => import('./pages/Settings').then((module) => ({ default: module.Settings })));

const ROUTES = [
  { path: '/operador', labelKey: 'navigation.items.operator.label', helperKey: 'navigation.items.operator.helper', roles: ['OPERADOR', 'GERENTE'] },
  { path: '/dashboard', labelKey: 'navigation.items.dashboard.label', helperKey: 'navigation.items.dashboard.helper', roles: ['CLIENTE', 'GERENTE'] },
  { path: '/cadastros', labelKey: 'navigation.items.registrations.label', helperKey: 'navigation.items.registrations.helper', roles: ['GERENTE'] },
  { path: '/dados', labelKey: 'navigation.items.export.label', helperKey: 'navigation.items.export.helper', roles: ['GERENTE'] },
  { path: '/configuracoes', labelKey: 'navigation.items.settings.label', helperKey: 'navigation.items.settings.helper', roles: ['GERENTE'] },
];

const ROUTE_TITLES = {
  '/login': 'routeTitles.login',
  '/operador': 'routeTitles.operator',
  '/dashboard': 'routeTitles.dashboard',
  '/cadastros': 'routeTitles.registrations',
  '/dados': 'routeTitles.export',
  '/configuracoes': 'routeTitles.settings',
};

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
  }, [session]);

  useEffect(() => {
    const current = normalizeRoute(window.location.hash);
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
  const { session, logout, canInstallApp, installApp, isLocalMode, language, t } = useApp();
  const [route, navigate] = useHashRoute(session);
  const isManager = isManagerRole(session?.role);
  const isOperator = isOperatorRole(session?.role);
  const isClient = isClientRole(session?.role);
  const loadingFallback = <div className="empty-state">{t('common.loading')}</div>;

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const currentTitleKey = ROUTE_TITLES[route === '/login' ? '/login' : route] || 'routeTitles.default';
    document.title = `${t(currentTitleKey)} · ${t('app.name')}`;
  }, [route, t]);

  let content;

  if (!session) {
    content = <LoginPage navigate={navigate} />;
  } else if (isOperator) {
    content = (
      <div className="app-frame app-frame--operator">
        <OperatorPanelPage
          standalone
          onRefreshUpdate={refreshApplicationAssets}
          onLogout={() => {
            logout();
            navigate('/login');
          }}
        />
      </div>
    );
  } else if (isClient) {
    content = (
      <div className="app-frame">
        <Header
          title={t('routeTitles.dashboard')}
          subtitle={t('header.subtitle')}
          session={session}
          canInstallApp={canInstallApp}
          onRefreshUpdate={refreshApplicationAssets}
          onInstall={installApp}
          onLogout={() => {
            logout();
            navigate('/login');
          }}
          currentStateLabel={isLocalMode ? t('connection.local') : t('connection.online')}
        />

        <div className="app-body app-body--client">
          <main className="app-main">
            <DashboardPage />
          </main>
        </div>
      </div>
    );
  } else {
    const accessibleRoutes = getAccessibleRoutes(session.role).map((item) => ({
      ...item,
      label: t(item.labelKey),
      helper: t(item.helperKey),
    }));
    const currentRoute = route === '/login' ? '/dashboard' : accessibleRoutes.some((item) => item.path === route) ? route : '/dashboard';
    const title = t(ROUTE_TITLES[currentRoute] || 'routeTitles.default');

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
        <Header
          title={title}
          subtitle={t('header.subtitle')}
          session={session}
          canInstallApp={canInstallApp}
          onRefreshUpdate={refreshApplicationAssets}
          onInstall={installApp}
          onLogout={() => {
            logout();
            navigate('/login');
          }}
          currentStateLabel={isLocalMode ? t('connection.local') : t('connection.online')}
        />

        <div className="app-body">
          <Navigation items={accessibleRoutes} currentPath={currentRoute} onNavigate={navigate} session={session} />
          <main className="app-main">{page}</main>
        </div>
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
