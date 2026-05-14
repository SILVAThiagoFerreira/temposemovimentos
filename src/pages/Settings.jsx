import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusChip } from '../components/StatusChip';
import { getRoleLabel, getRoleOrder } from '../utils/roles';

const integrationRoadmap = ['Firebase Firestore', 'Supabase', 'API própria', 'Power BI', 'Google Sheets', 'Banco SQL'];

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
    settings,
    storageMeta,
    updateSettings,
    saveOperator,
    updateOperator,
    deleteOperator,
    requestPersistentStorage,
    canInstallApp,
    installApp,
    isLocalMode,
  } = useApp();

  const isManager = session?.role === 'GERENTE';
  const [notice, setNotice] = useState('');
  const [userForm, setUserForm] = useState(() => createEmptyUserForm());

  const storageLabel = isLocalMode ? 'LOCAL / OFFLINE' : 'ONLINE';

  const storageState = useMemo(
    () => ({
      label: storageLabel,
      tone: isLocalMode ? 'success' : 'info',
    }),
    [isLocalMode, storageLabel],
  );

  async function handleEnablePersistence() {
    const granted = await requestPersistentStorage();
    setNotice(granted ? 'Armazenamento persistente ativado.' : 'O navegador não concedeu persistência total, mas o backup em IndexedDB continua ativo.');
  }

  const activeManagers = useMemo(
    () => operators.filter((user) => user.role === 'GERENTE' && user.active !== false).length,
    [operators],
  );

  const visibleUsers = useMemo(
    () =>
      [...operators].sort((left, right) => {
        return getRoleOrder(left.role) - getRoleOrder(right.role) || left.name.localeCompare(right.name, 'pt-BR');
      }),
    [operators],
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
      setNotice('Informe o nome do usuário.');
      return;
    }

    if (!password && !userForm.id) {
      setNotice('Informe a senha.');
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
        setNotice('Usuário atualizado.');
      } else {
        saveOperator(payload);
        setNotice('Usuário criado.');
      }

      setUserForm(createEmptyUserForm());
    } catch (error) {
      setNotice(error.message || 'Falha ao salvar usuário.');
    }
  }

  function handleToggleActive(user) {
    const nextActive = !user.active;

    try {
      updateOperator(user.id, { active: nextActive });
      setNotice(nextActive ? 'Usuário ativado.' : 'Usuário desativado.');
    } catch (error) {
      setNotice(error.message || 'Falha ao alterar status.');
    }
  }

  function handleDeleteUser(user) {
    if (!window.confirm(`Excluir o usuário ${user.name}?`)) {
      return;
    }

    try {
      deleteOperator(user.id);
      setNotice('Usuário excluído.');
      if (userForm.id === user.id) {
        setUserForm(createEmptyUserForm());
      }
    } catch (error) {
      setNotice(error.message || 'Falha ao excluir usuário.');
    }
  }

  if (!isManager) {
    return (
      <div className="page-stack">
        <section className="card page-banner">
          <div>
            <p className="eyebrow">Configurações</p>
            <h2>Acesso restrito</h2>
            <p>Somente usuários da classe Gerente podem alterar cadastros de usuários.</p>
          </div>
          <StatusChip tone="danger">SEM PERMISSÃO</StatusChip>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="card page-banner">
        <div>
          <p className="eyebrow">Configurações</p>
          <h2>Usuários e ambiente</h2>
          <p>Cadastros de usuários, PWA e base local.</p>
        </div>
        <StatusChip tone={storageState.tone}>{storageState.label}</StatusChip>
      </section>

      {notice ? <div className="alert alert--info">{notice}</div> : null}

      <section className="settings-grid">
        <article className="card settings-card settings-card--wide">
          <div className="card__head">
            <div>
              <p className="eyebrow">Usuários</p>
              <h2>Gerenciamento completo</h2>
            </div>
            <StatusChip tone="info">{operators.length} cadastrados</StatusChip>
          </div>

          <form className="user-admin-form" onSubmit={handleUserSubmit}>
            <div className="form-grid form-grid--two">
              <label>
                <span>Nome</span>
                <input
                  value={userForm.name}
                  onChange={(event) => setUserForm({ ...userForm, name: event.target.value })}
                  placeholder="Nome do usuário"
                />
              </label>

              <label>
                <span>Matrícula</span>
                <input
                  value={userForm.registration}
                  onChange={(event) => setUserForm({ ...userForm, registration: event.target.value })}
                  placeholder="Opcional"
                />
              </label>

              <label>
                <span>Classe</span>
                <select
                  value={userForm.role}
                  onChange={(event) => setUserForm({ ...userForm, role: event.target.value })}
                >
                  <option value="OPERADOR">Operador</option>
                  <option value="CLIENTE">Cliente</option>
                  <option value="GERENTE">Gerente</option>
                </select>
              </label>

              <label>
                <span>Senha</span>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(event) => setUserForm({ ...userForm, password: event.target.value })}
                  placeholder="Nova senha (opcional na edição)"
                />
              </label>

              <label className="toggle-field toggle-field--inline">
                <input
                  type="checkbox"
                  checked={userForm.active}
                  onChange={(event) => setUserForm({ ...userForm, active: event.target.checked })}
                />
                <span>Ativo</span>
              </label>
            </div>

            <div className="form-actions">
              <button className="button button--primary" type="submit">
                {userForm.id ? 'Salvar alteração' : 'Criar usuário'}
              </button>
              {userForm.id ? (
                <button className="button button--ghost" type="button" onClick={() => setUserForm(createEmptyUserForm())}>
                  Cancelar edição
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
                      {getRoleLabel(user.role)} • {user.active === false ? 'Inativo' : 'Ativo'}
                    </small>
                  </div>

                  <div className="entity-actions">
                    <button className="button button--ghost button--tiny" type="button" onClick={() => fillUserForm(user)}>
                      Editar
                    </button>
                    <button
                      className="button button--secondary button--tiny"
                      type="button"
                      onClick={() => handleToggleActive(user)}
                      disabled={canToggleManager}
                      title={canToggleManager ? 'É necessário manter ao menos um gerente ativo' : 'Alternar status'}
                    >
                      {user.active === false ? 'Ativar' : 'Desativar'}
                    </button>
                    <button
                      className="button button--danger button--tiny"
                      type="button"
                      onClick={() => handleDeleteUser(user)}
                      disabled={canDeleteManager}
                      title={canDeleteManager ? 'É necessário manter ao menos um gerente ativo' : 'Excluir usuário'}
                    >
                      Excluir
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
              <p className="eyebrow">PWA</p>
              <h2>Instalação no tablet</h2>
            </div>
          </div>
          <p>O app pode ser instalado como PWA e operar offline com cache básico.</p>
          {canInstallApp ? (
            <button className="button button--primary" type="button" onClick={installApp}>
              Instalar app
            </button>
          ) : (
            <StatusChip tone="neutral">Instalação será oferecida pelo navegador compatível</StatusChip>
          )}
        </article>

        <article className="card settings-card">
          <div className="card__head">
            <div>
              <p className="eyebrow">Armazenamento</p>
              <h2>Base sincronizada</h2>
            </div>
          </div>
          <p>Os dados são gravados em cache local, espelhados em `IndexedDB` e sincronizados com o Firestore. O navegador também é solicitado a manter esse armazenamento como persistente.</p>
          <div className="settings-rows">
            <div>
              <span>Status atual</span>
              <strong>{storageState.label}</strong>
            </div>
            <div>
              <span>Persistência do navegador</span>
              <strong>{storageMeta?.persistentStorageGranted ? 'Ativa' : 'Não confirmada'}</strong>
            </div>
            <div>
              <span>Backup secundário</span>
              <strong>{storageMeta?.indexedDbAvailable ? 'IndexedDB ativo' : 'Indisponível'}</strong>
            </div>
          </div>
          <div className="form-actions">
            <button className="button button--secondary" type="button" onClick={handleEnablePersistence}>
              Ativar armazenamento persistente
            </button>
          </div>
        </article>

        <article className="card settings-card settings-card--wide">
          <div className="card__head">
            <div>
              <p className="eyebrow">Fase 2</p>
              <h2>Integrações preparadas</h2>
            </div>
          </div>
          <div className="chip-grid">
            {integrationRoadmap.map((item) => (
              <div key={item} className="roadmap-chip">
                <strong>{item}</strong>
                <small>Pronto para adaptar a camada de storage.</small>
              </div>
            ))}
          </div>
        </article>

        <article className="card settings-card">
          <div className="card__head">
            <div>
              <p className="eyebrow">Resumo</p>
              <h2>Base carregada</h2>
            </div>
          </div>
          <div className="settings-rows">
            <div>
              <span>Usuários ativos</span>
              <strong>{operators.filter((user) => user.active !== false).length}</strong>
            </div>
            <div>
              <span>Gerentes ativos</span>
              <strong>{activeManagers}</strong>
            </div>
            <div>
              <span>Armazenamento local</span>
              <strong>{storageMeta?.indexedDbAvailable ? 'Sim' : 'Não'}</strong>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
