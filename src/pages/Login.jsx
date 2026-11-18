import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getHomeRouteForRole, getRoleLabel, getRoleOrder } from '../utils/roles';
import { translateErrorMessage } from '../i18n/errorMessages.js';
import { Icon } from '../components/Icon';

const base = import.meta.env.BASE_URL;

export function Login({ navigate }) {
  const { operators, authenticateOperator, loginOperator, language, t } = useApp();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const activeUsers = useMemo(
    () =>
      [...operators]
        .filter((user) => user.active !== false)
        .sort((left, right) => {
          return getRoleOrder(left.role) - getRoleOrder(right.role) || left.name.localeCompare(right.name, language);
        }),
    [language, operators],
  );

  useEffect(() => {
    if (!activeUsers.some((user) => user.id === selectedUserId) && activeUsers[0]) {
      setSelectedUserId(activeUsers[0].id);
    }
  }, [activeUsers, selectedUserId]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedUserId) {
      setError(t('common.selectUser'));
      return;
    }

    if (!password.trim()) {
      setError(t('common.enterPassword'));
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
      setError(translateErrorMessage(authError, language) || t('login.errors.generic'));
    }
  }

  return (
    <section className="login-view">
      <form className="card login-form" onSubmit={handleSubmit}>
        <img className="login-logo" src={`${base}enaex-logo.png`} alt="Enaex" />

        {error ? (
          <div className="alert alert--danger" role="alert">
            {error}
          </div>
        ) : null}

        <label>
          <span>{t('login.form.title')}</span>
          {activeUsers.length ? (
            <select
              value={selectedUserId}
              onChange={(event) => {
                setSelectedUserId(event.target.value);
                setError('');
              }}
            >
              {activeUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} · {getRoleLabel(user.role, language)}
                </option>
              ))}
            </select>
          ) : (
            <p className="empty-state">{t('login.form.empty')}</p>
          )}
        </label>

        <label>
          <span>{t('login.form.password')}</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </label>

        <button className="button button--primary button--full login-submit" type="submit" disabled={!activeUsers.length}>
          {t('login.form.submit')}
          <Icon name="arrow" />
        </button>
      </form>
    </section>
  );
}
