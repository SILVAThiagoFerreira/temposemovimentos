import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusChip } from '../components/StatusChip';
import { getRoleLabel, getRoleOrder } from '../utils/roles';
import { translateErrorMessage } from '../i18n/errorMessages.js';

const integrationRoadmap = {
  'pt-BR': ['Firebase Firestore', 'Supabase', 'API própria', 'Power BI', 'Google Sheets', 'Banco SQL'],
  'en-US': ['Firebase Firestore', 'Supabase', 'Custom API', 'Power BI', 'Google Sheets', 'SQL database'],
  'zh-CN': ['Firebase Firestore', 'Supabase', '自定义 API', 'Power BI', 'Google Sheets', 'SQL 数据库'],
};

function createEmptyUserForm() {
  return {
    id: '',
    name: '',
    registration: '',
    role: 'OPERADOR',
    password: '1234',
    active: true,
  };
}

export function Settings() {
  const {
    session,
    operators,
    storageMeta,
    updateSettings,
    saveOperator,
    updateOperator,
    deleteOperator,
    requestPersistentStorage,
    canInstallApp,
    installApp,
    isLocalMode,
    language,
    t,
  } = useApp();

  const isManager = session?.role === 'GERENTE';
  const [notice, setNotice] = useState('');
  const [userForm, setUserForm] = useState(() => createEmptyUserForm());

  const storageLabel = isLocalMode ? t('settings.storage.local') : t('settings.storage.connected');

  const storageState = useMemo(
    () => ({
      label: storageLabel,
      tone: isLocalMode ? 'success' : 'info',
    }),
    [isLocalMode, storageLabel],
  );

  const syncStateLabel = storageMeta?.syncPending ? t('settings.sync.pending') : t('settings.sync.idle');
  const syncBackoffLabel = storageMeta?.syncBackoffMs ? `${Math.round(storageMeta.syncBackoffMs / 1000)}s` : '0s';
  const backupCount = storageMeta?.localBackupCount || 0;
  const backupLabel = storageMeta?.lastLocalBackupAt ? new Date(storageMeta.lastLocalBackupAt).toLocaleString(language) : t('common.none');
  const persistenceWarning = !storageMeta?.persistentStorageGranted ? t('settings.storage.warningPersistence') : t('settings.storage.persistenceGranted');

  async function handleEnablePersistence() {
    const granted = await requestPersistentStorage();
    setNotice(granted ? t('settings.storage.activated') : t('settings.storage.notGranted'));
  }

  const activeManagers = useMemo(
    () => operators.filter((user) => user.role === 'GERENTE' && user.active !== false).length,
    [operators],
  );

  const visibleUsers = useMemo(
    () =>
      [...operators].sort((left, right) => {
        return getRoleOrder(left.role) - getRoleOrder(right.role) || left.name.localeCompare(right.name, language);
      }),
    [language, operators],
  );

  function fillUserForm(user) {
    setUserForm({
      id: user.id,
      name: user.name || '',
      registration: user.registration || '',
      role: user.role || 'OPERADOR',
      password: '',
      active: user.active !== false,
    });
    setNotice('');
  }

  function handleUserSubmit(event) {
    event.preventDefault();

    const name = userForm.name.trim();
    const password = userForm.password.trim();

    if (!name) {
      setNotice(t('movement.errors.requiredField'));
      return;
    }

    if (!password && !userForm.id) {
      setNotice(t('movement.errors.requiredField'));
      return;
    }

    const payload = {
      id: userForm.id,
      name,
      registration: userForm.registration.trim(),
      role: userForm.role,
      shiftId: null,
      shiftName: '',
      active: userForm.active,
    };

    if (!userForm.id || password) {
      payload.password = password;
    }

    try {
      if (payload.id) {
        updateOperator(payload.id, payload);
        setNotice(t('settings.users.updated'));
      } else {
        saveOperator(payload);
        setNotice(t('settings.users.created'));
      }

      setUserForm(createEmptyUserForm());
    } catch (error) {
      setNotice(translateErrorMessage(error, language));
    }
  }

  function handleToggleActive(user) {
    const nextActive = !user.active;

    try {
      updateOperator(user.id, { active: nextActive });
      setNotice(nextActive ? t('settings.users.activated') : t('settings.users.deactivated'));
    } catch (error) {
      setNotice(translateErrorMessage(error, language));
    }
  }

  function handleDeleteUser(user) {
    if (!window.confirm(t('settings.users.confirmDelete', { name: user.name }))) {
      return;
    }

    try {
      deleteOperator(user.id);
      setNotice(t('settings.users.deleted'));
      if (userForm.id === user.id) {
        setUserForm(createEmptyUserForm());
      }
    } catch (error) {
      setNotice(translateErrorMessage(error, language));
    }
  }

  if (!isManager) {
    return (
      <div className="page-stack">
        <section className="card page-banner">
          <div>
            <p className="eyebrow">{t('settings.banner.eyebrow')}</p>
            <h2>{t('settings.access.restrictedTitle')}</h2>
            <p>{t('settings.access.restrictedCopy')}</p>
          </div>
          <StatusChip tone="danger">{t('settings.access.noPermission')}</StatusChip>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="card page-banner">
        <div>
          <p className="eyebrow">{t('settings.banner.eyebrow')}</p>
          <h2>{t('settings.banner.title')}</h2>
          <p>{t('settings.banner.copy')}</p>
        </div>
        <StatusChip tone={storageState.tone}>{storageState.label}</StatusChip>
      </section>

      {notice ? <div className="alert alert--info">{notice}</div> : null}
      <div className={`alert ${storageMeta?.persistentStorageGranted ? 'alert--info' : 'alert--warning'}`}>
        <strong>{persistenceWarning}</strong>
        <div className="settings-warning-grid">
          <span>{t('settings.storage.backupCount')}</span>
          <strong>{backupCount}</strong>
          <span>{t('settings.storage.backupLatest')}</span>
          <strong>{backupLabel}</strong>
        </div>
      </div>

      <section className="settings-grid">
        <article className="card settings-card settings-card--wide">
          <div className="card__head">
            <div>
              <p className="eyebrow">{t('settings.users.eyebrow')}</p>
              <h2>{t('settings.users.title')}</h2>
            </div>
            <StatusChip tone="info">{t('settings.users.registered', { count: operators.length })}</StatusChip>
          </div>

          <form className="user-admin-form" onSubmit={handleUserSubmit}>
            <div className="form-grid form-grid--two">
              <label>
                <span>{t('settings.users.name')}</span>
                <input
                  value={userForm.name}
                  onChange={(event) => setUserForm({ ...userForm, name: event.target.value })}
                />
              </label>

              <label>
                <span>{t('settings.users.registration')}</span>
                <input
                  value={userForm.registration}
                  onChange={(event) => setUserForm({ ...userForm, registration: event.target.value })}
                />
              </label>

              <label>
                <span>{t('settings.users.role')}</span>
                <select
                  value={userForm.role}
                  onChange={(event) => setUserForm({ ...userForm, role: event.target.value })}
                >
                  <option value="OPERADOR">{getRoleLabel('OPERADOR', language)}</option>
                  <option value="CLIENTE">{getRoleLabel('CLIENTE', language)}</option>
                  <option value="GERENTE">{getRoleLabel('GERENTE', language)}</option>
                </select>
              </label>

              <label>
                <span>{t('settings.users.password')}</span>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(event) => setUserForm({ ...userForm, password: event.target.value })}
                  placeholder={t('settings.users.passwordPlaceholder')}
                />
              </label>

              <label className="toggle-field toggle-field--inline">
                <input
                  type="checkbox"
                  checked={userForm.active}
                  onChange={(event) => setUserForm({ ...userForm, active: event.target.checked })}
                />
                <span>{t('settings.users.active')}</span>
              </label>
            </div>

            <div className="form-actions">
              <button className="button button--primary" type="submit">
                {userForm.id ? t('settings.users.save') : t('settings.users.create')}
              </button>
              {userForm.id ? (
                <button className="button button--ghost" type="button" onClick={() => setUserForm(createEmptyUserForm())}>
                  {t('settings.users.cancel')}
                </button>
              ) : null}
            </div>
          </form>

          <div className="entity-list user-list">
            {visibleUsers.map((user) => {
              const canDeleteManager = user.role === 'GERENTE' && activeManagers <= 1;
              const canToggleManager = user.role === 'GERENTE' && activeManagers <= 1 && user.active !== false;

              return (
                <div key={user.id} className={`entity-row ${user.active === false ? 'is-inactive' : ''}`}>
                  <div>
                    <strong>{user.name}</strong>
                    <small>
                      {getRoleLabel(user.role, language)} • {user.active === false ? t('settings.users.inactive') : t('settings.users.active')}
                    </small>
                  </div>

                  <div className="entity-actions">
                    <button className="button button--ghost button--tiny" type="button" onClick={() => fillUserForm(user)}>
                      {t('settings.users.edit')}
                    </button>
                    <button
                      className="button button--secondary button--tiny"
                      type="button"
                      onClick={() => handleToggleActive(user)}
                      disabled={canToggleManager}
                      title={canToggleManager ? t('settings.users.keepManager') : user.active === false ? t('settings.users.activate') : t('settings.users.deactivate')}
                    >
                      {user.active === false ? t('settings.users.activate') : t('settings.users.deactivate')}
                    </button>
                    <button
                      className="button button--danger button--tiny"
                      type="button"
                      onClick={() => handleDeleteUser(user)}
                      disabled={canDeleteManager}
                      title={canDeleteManager ? t('settings.users.keepManager') : t('settings.users.delete')}
                    >
                      {t('settings.users.delete')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="card settings-card">
          <div className="card__head">
            <div>
              <p className="eyebrow">{t('settings.pwa.eyebrow')}</p>
              <h2>{t('settings.pwa.title')}</h2>
            </div>
          </div>
          <p>{t('settings.pwa.copy')}</p>
          {canInstallApp ? (
            <button className="button button--primary" type="button" onClick={installApp}>
              {t('settings.pwa.install')}
            </button>
          ) : (
            <StatusChip tone="neutral">{t('settings.pwa.fallback')}</StatusChip>
          )}
        </article>

        <article className="card settings-card">
          <div className="card__head">
            <div>
              <p className="eyebrow">{t('settings.storage.eyebrow')}</p>
              <h2>{t('settings.storage.title')}</h2>
            </div>
          </div>
          <p>{t('settings.storage.copy')}</p>
          <div className="settings-rows">
            <div>
              <span>{t('settings.storage.currentState')}</span>
              <strong>{storageState.label}</strong>
            </div>
            <div>
              <span>{t('settings.storage.browserPersistence')}</span>
              <strong>{storageMeta?.persistentStorageGranted ? t('settings.storage.active') : t('settings.storage.notConfirmed')}</strong>
            </div>
            <div>
              <span>{t('settings.storage.secondaryBackup')}</span>
              <strong>{storageMeta?.indexedDbAvailable ? t('settings.storage.indexedDbActive') : t('settings.storage.unavailable')}</strong>
            </div>
            <div>
              <span>{t('settings.sync.state')}</span>
              <strong>{syncStateLabel}</strong>
            </div>
            <div>
              <span>{t('settings.sync.backoff')}</span>
              <strong>{syncBackoffLabel}</strong>
            </div>
            <div>
              <span>{t('settings.sync.failures')}</span>
              <strong>{storageMeta?.syncFailureCount || 0}</strong>
            </div>
          </div>
          <div className="form-actions">
            <button className="button button--secondary" type="button" onClick={handleEnablePersistence}>
              {t('settings.storage.enablePersistence')}
            </button>
          </div>
        </article>

        <article className="card settings-card settings-card--wide">
          <div className="card__head">
            <div>
              <p className="eyebrow">{t('settings.integrations.eyebrow')}</p>
              <h2>{t('settings.integrations.title')}</h2>
            </div>
          </div>
          <div className="chip-grid">
            {(integrationRoadmap[language] || integrationRoadmap['pt-BR']).map((item) => (
              <div key={item} className="roadmap-chip">
                <strong>{item}</strong>
                <small>{t('settings.integrations.copy')}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="card settings-card">
          <div className="card__head">
            <div>
              <p className="eyebrow">{t('settings.summary.eyebrow')}</p>
              <h2>{t('settings.summary.title')}</h2>
            </div>
          </div>
          <div className="settings-rows">
            <div>
              <span>{t('settings.summary.activeUsers')}</span>
              <strong>{operators.filter((user) => user.active !== false).length}</strong>
            </div>
            <div>
              <span>{t('settings.summary.activeManagers')}</span>
              <strong>{activeManagers}</strong>
            </div>
            <div>
              <span>{t('settings.summary.localStorage')}</span>
              <strong>{storageMeta?.indexedDbAvailable ? t('settings.summary.yes') : t('settings.summary.no')}</strong>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
