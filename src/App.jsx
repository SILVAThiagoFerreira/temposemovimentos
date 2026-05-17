import { lazy, Suspense, useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { refreshApplicationAssets } from './services/updateService';
import { getHomeRouteForRole, isClientRole, isManagerRole, isOperatorRole } from './utils/roles';

const LoginPage = lazy(() => import('./pages/Login').then((module) => ({ default: module.Login })));
const OperatorPanelPage = lazy(() => import('./pages/OperatorPanel').then((module) => ({ default: module.OperatorPanel })));
const DashboardPage = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const RegistrationsPage = lazy(() => import('./pages/Registrations').then((module) => ({ default: module.Registrations })));
const DataExportPage = lazy(() => import('./pages/DataExport').then((module) => ({ default: module.DataExport })));
const SettingsPage = lazy(() => import('./pages/Settings').then((module) => ({ default: module.Settings })));

const loadingFallback = <div className="empty-state">Carregando...</div>;

const ROUTES = [
  { path: '/operador', label: 'Apontar', helper: 'Registro de tempo', roles: ['OPERADOR', 'GERENTE'] },
  { path: '/dashboard', label: 'Painel', helper: 'Indicadores da frota', roles: ['CLIENTE', 'GERENTE'] },
  { path: '/cadastros', label: 'Base', helper: 'Dados operacionais', roles: ['GERENTE'] },
  { path: '/dados', label: 'Dados', helper: 'Exportações', roles: ['GERENTE'] },
  { path: '/configuracoes', label: 'Sistema', helper: 'Administração', roles: ['GERENTE'] },
];

const ROUTE_TITLES = {
  '/login': 'Sistema de Operações ENAEX',
  '/operador': 'Painel do operador',
  '/dashboard': 'Painel da frota',
  '/cadastros': 'Base operacional',
  '/dados': 'Dados e exportação',
  '/configuracoes': 'Administração do sistema',
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
  const { session, logout, canInstallApp, installApp, isLocalMode } = useApp();
  const [route, navigate] = useHashRoute(session);
  const isManager = isManagerRole(session?.role);
  const isOperator = isOperatorRole(session?.role);
  const isClient = isClientRole(session?.role);

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
          title="Painel da frota"
          subtitle="Operação de UMR em tempo real"
          session={session}
          canInstallApp={canInstallApp}
          onRefreshUpdate={refreshApplicationAssets}
          onInstall={installApp}
          onLogout={() => {
            logout();
            navigate('/login');
          }}
          currentStateLabel={isLocalMode ? 'LOCAL / SEM REDE' : 'CONECTADO'}
        />

        <div className="app-body app-body--client">
          <main className="app-main">
            <DashboardPage />
          </main>
        </div>
      </div>
    );
  } else {
    const accessibleRoutes = getAccessibleRoutes(session.role);
    const currentRoute = route === '/login' ? '/dashboard' : accessibleRoutes.some((item) => item.path === route) ? route : '/dashboard';
    const title = ROUTE_TITLES[currentRoute] || 'Sistema de Tempos e Movimentos';

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
          subtitle="Operação de UMR em tempo real"
          session={session}
          canInstallApp={canInstallApp}
          onRefreshUpdate={refreshApplicationAssets}
          onInstall={installApp}
          onLogout={() => {
            logout();
            navigate('/login');
          }}
          currentStateLabel={isLocalMode ? 'LOCAL / SEM REDE' : 'CONECTADO'}
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
