import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusChip } from '../components/StatusChip';

const enaexLogo = new URL('../assets/enaex-brasil.png', import.meta.url).href;

function roleLabel(role) {
  return role === 'GERENTE' ? 'Gerente' : 'Operacional';
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
          const leftRole = left.role === 'GERENTE' ? 1 : 0;
          const rightRole = right.role === 'GERENTE' ? 1 : 0;
          return leftRole - rightRole || left.name.localeCompare(right.name, 'pt-BR');
        }),
    [operators],
  );

  useEffect(() => {
    if (!activeUsers.some((user) => user.id === selectedUserId) && activeUsers[0]) {
      setSelectedUserId(activeUsers[0].id);
    }
  }, [activeUsers, selectedUserId]);

  function handleSubmit(event) {
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
      const user = authenticateOperator(selectedUserId, password.trim());
      const selectedShiftName = user.shiftName || '';

      loginOperator({
        operatorId: user.id,
        operatorName: user.name,
        registration: user.registration || '',
        role: user.role,
        shiftId: user.shiftId || null,
        shiftName: selectedShiftName,
        loggedAt: new Date().toISOString(),
      });

      navigate(user.role === 'GERENTE' ? '/dashboard' : '/operador');
    } catch (authError) {
      setError(authError.message || 'Falha ao entrar.');
    }
  }

  return (
    <section className="login-view">
      <div className="login-hero card card--shell">
        <img className="login-logo" src={enaexLogo} alt="Enaex Brasil" />
        <p className="eyebrow">Acesso local</p>
        <h1>SISTEMA DE TEMPOS E MOVIMENTOS</h1>
        <p className="login-copy">
          Selecione um usuário cadastrado e informe a senha para entrar. Os operadores acessam só o apontamento;
          o gerente acessa o sistema completo.
        </p>

        <div className="login-points">
          <StatusChip tone="success">Usuários fixos</StatusChip>
          <StatusChip tone="info">Operação / Gerência</StatusChip>
          <StatusChip tone="warning">Senha inicial 1234</StatusChip>
        </div>

        <div className="login-stats">
          <article>
            <strong>{activeUsers.filter((user) => user.role === 'OPERADOR').length}</strong>
            <span>operacionais</span>
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
            <p className="eyebrow">Selecionar usuário</p>
            <h2>Login</h2>
          </div>
          <StatusChip tone="neutral">Somente usuários criados</StatusChip>
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
                  <small>{user.shiftName || 'Sem turno'}</small>
                </div>
                <StatusChip tone={user.role === 'GERENTE' ? 'info' : 'success'}>{roleLabel(user.role)}</StatusChip>
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
          Entrar
        </button>

        <p className="login-footnote">Usuários operacionais: Paulo, Deyvis, Gilmar e Thiago Gama. Gerente: Jose Wilkinson.</p>
      </form>
    </section>
  );
}
