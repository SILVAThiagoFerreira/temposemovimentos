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
          <span>Operations OS</span>
        </div>
        <p className="eyebrow">ENAEX // Field Control</p>
        <h1>Fleet timing, without the noise.</h1>
        <p className="login-copy">Select profile. Confirm password. Keep the operation moving.</p>

        <div className="login-points">
          <StatusChip tone="success">Role based</StatusChip>
          <StatusChip tone="info">Online sync</StatusChip>
          <StatusChip tone="warning">Offline ready</StatusChip>
        </div>

        <div className="login-stats">
          <article>
            <strong>{activeUsers.filter((user) => user.role === 'OPERADOR').length}</strong>
            <span>operators</span>
          </article>
          <article>
            <strong>{activeUsers.filter((user) => user.role === 'CLIENTE').length}</strong>
            <span>clients</span>
          </article>
          <article>
            <strong>{activeUsers.filter((user) => user.role === 'GERENTE').length}</strong>
            <span>managers</span>
          </article>
          <article>
            <strong>{activeUsers.length}</strong>
            <span>active</span>
          </article>
        </div>
      </div>

      <form className="card login-form card--shell" onSubmit={handleSubmit}>
        <div className="card__head">
          <div>
            <p className="eyebrow">Secure access</p>
            <h2>Choose profile</h2>
          </div>
          <StatusChip tone="neutral">Authorized only</StatusChip>
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
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
            autoComplete="current-password"
          />
        </label>

        <button className="button button--primary button--full" type="submit" disabled={!activeUsers.length}>
          Enter console
        </button>
      </form>
    </section>
  );
}
