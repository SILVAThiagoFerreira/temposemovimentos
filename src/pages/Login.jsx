import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusChip } from '../components/StatusChip';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { getHomeRouteForRole, getRoleLabel, getRoleOrder } from '../utils/roles';
import { translateErrorMessage } from '../i18n/errorMessages.js';

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
      <div className="login-hero">
        <div className="login-hero__toolbar">
          <LanguageSwitcher />
        </div>
        <div className="login-hero__brand">
          <img className="login-logo" src={`${base}openblast-logo.png`} alt="OpenBlast" />
        </div>
        <h1>{t('login.hero.title')}</h1>
        <p className="login-copy">{t('login.hero.copy')}</p>

        <div className="login-stats">
          <article>
            <strong>{activeUsers.filter((user) => user.role === 'OPERADOR').length}</strong>
            <span>{t('login.hero.stats.operators')}</span>
          </article>
          <article>
            <strong>{activeUsers.filter((user) => user.role === 'CLIENTE').length}</strong>
            <span>{t('login.hero.stats.clients')}</span>
          </article>
          <article>
            <strong>{activeUsers.filter((user) => user.role === 'GERENTE').length}</strong>
            <span>{t('login.hero.stats.managers')}</span>
          </article>
          <article>
            <strong>{activeUsers.length}</strong>
            <span>{t('login.hero.stats.active')}</span>
          </article>
        </div>
      </div>

      <form className="card login-form" onSubmit={handleSubmit}>
        <div className="card__head">
          <div>
            <p className="eyebrow">{t('login.form.eyebrow')}</p>
            <h2>{t('login.form.title')}</h2>
          </div>
          <StatusChip tone="neutral">{t('login.form.status')}</StatusChip>
        </div>

        {error ? <div className="alert alert--danger">{error}</div> : null}

        <label className="login-user-select">
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
                  {user.name} - {getRoleLabel(user.role, language)}
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
            placeholder={t('login.form.passwordPlaceholder')}
            autoComplete="current-password"
          />
        </label>

        <button className="button button--primary button--full" type="submit" disabled={!activeUsers.length}>
          {t('login.form.submit')}
        </button>
      </form>
    </section>
  );
}
