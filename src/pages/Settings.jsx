import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StatusChip } from '../components/StatusChip';

const integrationRoadmap = [
  'Firebase Firestore',
  'Supabase',
  'API própria',
  'Power BI',
  'Google Sheets',
  'Banco SQL',
];

export function Settings() {
  const { settings, shifts, updateSettings, canInstallApp, installApp, isLocalMode } = useApp();

  const storageLabel = isLocalMode ? 'LOCAL / OFFLINE' : 'ONLINE';

  const storageState = useMemo(
    () => ({
      label: storageLabel,
      tone: isLocalMode ? 'success' : 'info',
    }),
    [isLocalMode, storageLabel],
  );

  return (
    <div className="page-stack">
      <section className="card page-banner">
        <div>
          <p className="eyebrow">Configurações</p>
          <h2>Ambiente do sistema</h2>
          <p>Preparado para a Fase 2 sem alterar as telas do operador.</p>
        </div>
        <StatusChip tone={storageState.tone}>{storageState.label}</StatusChip>
      </section>

      <section className="settings-grid">
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
              <h2>Base local</h2>
            </div>
          </div>
          <p>Hoje tudo fica no `localStorage` do tablet. Na fase online, o motor de persistência poderá ser trocado.</p>
          <div className="settings-rows">
            <div>
              <span>Status atual</span>
              <strong>{storageState.label}</strong>
            </div>
            <div>
              <span>Turno padrão</span>
              <select
                value={settings.defaultShiftId || ''}
                onChange={(event) => updateSettings({ defaultShiftId: event.target.value })}
              >
                {shifts.map((shift) => (
                  <option key={shift.id} value={shift.id}>
                    {shift.name}
                  </option>
                ))}
              </select>
            </div>
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
              <p className="eyebrow">Base carregada</p>
              <h2>Resumo</h2>
            </div>
          </div>
          <div className="settings-rows">
            <div>
              <span>Turnos</span>
              <strong>{shifts.length}</strong>
            </div>
            <div>
              <span>Modo</span>
              <strong>{settings.storageMode || 'LOCAL'}</strong>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
