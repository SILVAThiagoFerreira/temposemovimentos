import { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Login } from './pages/Login';
import { OperatorPanel } from './pages/OperatorPanel';
import { Dashboard } from './pages/Dashboard';
import { Registrations } from './pages/Registrations';
import { DataExport } from './pages/DataExport';
import { Settings } from './pages/Settings';

const ROUTES = [
  { path: '/operador', label: 'Operador', helper: 'Apontamento rápido' },
  { path: '/dashboard', label: 'Dashboard', helper: 'Supervisão' },
  { path: '/cadastros', label: 'Cadastros', helper: 'Base sincronizada' },
  { path: '/dados', label: 'Dados', helper: 'Exportação' },
  { path: '/configuracoes', label: 'Configurações', helper: 'PWA e fase 2' },
];

const ROUTE_TITLES = {
  '/login': 'Identificação do operador',
  '/operador': 'Painel do operador',
  '/dashboard': 'Dashboard de supervisão',
  '/cadastros': 'Cadastros iniciais',
  '/dados': 'Dados e exportação',
  '/configuracoes': 'Configurações',
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

  return session.role === 'GERENTE' ? '/dashboard' : '/operador';
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
  const isManager = session?.role === 'GERENTE';

  if (!session) {
    return <Login navigate={navigate} />;
  }

  if (!isManager) {
    return (
      <div className="app-frame app-frame--operator">
        <OperatorPanel
          standalone
          onLogout={() => {
            logout();
            navigate('/login');
          }}
        />
      </div>
    );
  }

  const currentRoute = route === '/login' ? '/dashboard' : ROUTE_TITLES[route] ? route : '/dashboard';
  const title = ROUTE_TITLES[currentRoute] || 'Sistema de Tempos e Movimentos';

  const page = (() => {
    switch (currentRoute) {
      case '/login':
        return <Login navigate={navigate} />;
      case '/operador':
        return <OperatorPanel />;
      case '/dashboard':
        return <Dashboard />;
      case '/cadastros':
        return <Registrations />;
      case '/dados':
        return <DataExport />;
      case '/configuracoes':
        return <Settings />;
      default:
        return <Login navigate={navigate} />;
    }
  })();

  return (
    <div className="app-frame">
      <Header
        title={title}
        subtitle="Apontamento operacional sincronizado para UMBs e caminhões"
        session={session}
        canInstallApp={canInstallApp}
        onInstall={installApp}
        onLogout={() => {
          logout();
          navigate('/login');
        }}
        currentStateLabel={isLocalMode ? 'LOCAL / OFFLINE' : 'ONLINE'}
      />

      <div className="app-body">
        <Navigation items={ROUTES} currentPath={currentRoute} onNavigate={navigate} session={session} />
        <main className="app-main">{page}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
