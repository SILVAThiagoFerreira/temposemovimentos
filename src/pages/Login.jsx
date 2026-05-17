import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusChip } from '../components/StatusChip';
import { getHomeRouteForRole, getRoleLabel, getRoleOrder } from '../utils/roles';

const enaexLogo = new URL('../assets/enaex-brasil.png', import.meta.url).href;

function roleTone(role) {
  return role === 'OPERADOR' ? 'success' : 'info';
}

export function Login({ navigate }) {
  const { operators, authenticateOperator, loginOperator } = useApp();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const activeUsers = useMemo(
    () =>
      [...operators]
        .filter((user) => user.active !== false)
        .sort((left, right) => {
          return getRoleOrder(left.role) - getRoleOrder(right.role) || left.name.localeCompare(right.name, 'pt-BR');
        }),
    [operators],
  );

  useEffect(() => {
    if (!activeUsers.some((user) => user.id === selectedUserId) && activeUsers[0]) {
      setSelectedUserId(activeUsers[0].id);
    }
  }, [activeUsers, selectedUserId]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedUserId) {
      setError('Selecione um usuário.');
      return;
    }

    if (!password.trim()) {
      setError('Informe a senha.');
      return;
    }

    try {
      const user = await authenticateOperator(selectedUserId, password.trim());

      loginOperator({
        operatorId: user.id,
        operatorName: user.name,
        registration: user.registration || '',
        role: user.role,
        loggedAt: new Date().toISOString(),
        accessToken: user.accessToken || null,
        expiresAt: user.expiresAt || null,
        sessionId: user.sessionId || null,
      });

      navigate(getHomeRouteForRole(user.role));
    } catch (authError) {
      setError(authError.message || 'Falha ao entrar.');
    }
  }

  return (
    <section className="login-view">
      <div className="login-hero card card--shell">
        <div className="login-hero__brand">
          <img className="login-logo" src={enaexLogo} alt="Enaex Brasil" />
          <span>Sistema de Operações</span>
        </div>
        <p className="eyebrow">ENAEX // Controle de Campo</p>
        <h1>Tempo da frota, sem ruído.</h1>
        <p className="login-copy">Selecione o perfil. Confirme a senha. Siga a operação.</p>

        <div className="login-points">
          <StatusChip tone="success">Perfis por função</StatusChip>
          <StatusChip tone="info">Sincronização ativa</StatusChip>
          <StatusChip tone="warning">Opera sem rede</StatusChip>
        </div>

        <div className="login-stats">
          <article>
            <strong>{activeUsers.filter((user) => user.role === 'OPERADOR').length}</strong>
            <span>operadores</span>
          </article>
          <article>
            <strong>{activeUsers.filter((user) => user.role === 'CLIENTE').length}</strong>
            <span>clientes</span>
          </article>
          <article>
            <strong>{activeUsers.filter((user) => user.role === 'GERENTE').length}</strong>
            <span>gerentes</span>
          </article>
          <article>
            <strong>{activeUsers.length}</strong>
            <span>ativos</span>
          </article>
        </div>
      </div>

      <form className="card login-form card--shell" onSubmit={handleSubmit}>
        <div className="card__head">
          <div>
            <p className="eyebrow">Entrada segura</p>
            <h2>Escolha o perfil</h2>
          </div>
          <StatusChip tone="neutral">Acesso autorizado</StatusChip>
        </div>

        {error ? <div className="alert alert--danger">{error}</div> : null}

        <div className="user-picker">
          {activeUsers.length ? (
            activeUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                className={`login-user-card ${selectedUserId === user.id ? 'is-selected' : ''}`}
                onClick={() => {
                  setSelectedUserId(user.id);
                  setError('');
                }}
              >
                <div>
                  <strong>{user.name}</strong>
                </div>
                <StatusChip tone={roleTone(user.role)}>{getRoleLabel(user.role)}</StatusChip>
              </button>
              ))
          ) : (
            <p className="empty-state">Nenhum usuário ativo disponível.</p>
          )}
        </div>

        <label>
          <span>Senha</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Digite a senha"
            autoComplete="current-password"
          />
        </label>

        <button className="button button--primary button--full" type="submit" disabled={!activeUsers.length}>
          Entrar no sistema
        </button>
      </form>
    </section>
  );
}
