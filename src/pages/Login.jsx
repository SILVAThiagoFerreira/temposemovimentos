import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusChip } from '../components/StatusChip';

const enaexLogo = new URL('../assets/enaex-brasil.png', import.meta.url).href;

export function Login({ navigate }) {
  const { operators, shifts, equipments, activityTypes, session, saveOperator, loginOperator } = useApp();
  const [name, setName] = useState(session?.operatorName || '');
  const [registration, setRegistration] = useState(session?.registration || '');
  const [shiftId, setShiftId] = useState(session?.shiftId || shifts[0]?.id || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shiftId && shifts[0]) {
      setShiftId(shifts[0].id);
    }
  }, [shiftId, shifts]);

  const quickList = useMemo(() => operators.slice(0, 8), [operators]);

  function fillOperator(operator) {
    setName(operator.name);
    setRegistration(operator.registration || '');
    setShiftId(operator.shiftId || shifts[0]?.id || '');
    setError('');
  }

  function handleSubmit(event) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Informe o nome do operador.');
      return;
    }

    const selectedShift = shifts.find((item) => item.id === shiftId) || shifts[0] || null;
    const existing = operators.find((operator) => {
      const sameName = operator.name.trim().toLowerCase() === trimmedName.toLowerCase();
      const sameRegistration = registration.trim() ? operator.registration.trim() === registration.trim() : true;
      return sameName && sameRegistration;
    });

    const operator = existing
      ? saveOperator({
          ...existing,
          name: trimmedName,
          registration: registration.trim(),
          shiftId: selectedShift?.id || null,
          shiftName: selectedShift?.name || '',
        })
      : saveOperator({
          name: trimmedName,
          registration: registration.trim(),
          shiftId: selectedShift?.id || null,
          shiftName: selectedShift?.name || '',
        });

    loginOperator({
      operatorId: operator.id,
      operatorName: operator.name,
      registration: operator.registration,
      shiftId: selectedShift?.id || null,
      shiftName: selectedShift?.name || '',
      loggedAt: new Date().toISOString(),
    });

    navigate('/operador');
  }

  return (
    <section className="login-view">
      <div className="login-hero card card--shell">
        <img className="login-logo" src={enaexLogo} alt="Enaex Brasil" />
        <p className="eyebrow">MVP offline para GitHub Pages</p>
        <h1>SISTEMA DE TEMPOS E MOVIMENTOS</h1>
        <p className="login-copy">
          Apontamento rápido de caminhões e UMBs, com gravação local, exportação CSV/JSON e PWA para tablet.
        </p>

        <div className="login-points">
          <StatusChip tone="success">OFFLINE</StatusChip>
          <StatusChip tone="info">PWA</StatusChip>
          <StatusChip tone="warning">TABLET</StatusChip>
        </div>

        <div className="login-stats">
          <article>
            <strong>{equipments.length}</strong>
            <span>equipamentos</span>
          </article>
          <article>
            <strong>{activityTypes.length}</strong>
            <span>códigos ativos</span>
          </article>
          <article>
            <strong>{shifts.length}</strong>
            <span>turnos</span>
          </article>
        </div>
      </div>

      <form className="card login-form card--shell" onSubmit={handleSubmit}>
        <div className="card__head">
          <div>
            <p className="eyebrow">Acesso local</p>
            <h2>Operador</h2>
          </div>
          {session ? <StatusChip tone="success">SESSÃO ATIVA</StatusChip> : <StatusChip tone="neutral">NOVO ACESSO</StatusChip>}
        </div>

        {error ? <div className="alert alert--danger">{error}</div> : null}

        <label>
          <span>Nome do operador</span>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Digite seu nome" />
        </label>

        <label>
          <span>Matrícula (opcional)</span>
          <input
            value={registration}
            onChange={(event) => setRegistration(event.target.value)}
            placeholder="Ex.: 12345"
          />
        </label>

        <label>
          <span>Turno</span>
          <select value={shiftId} onChange={(event) => setShiftId(event.target.value)}>
            {shifts.map((shift) => (
              <option key={shift.id} value={shift.id}>
                {shift.name} ({shift.startTime} - {shift.endTime})
              </option>
            ))}
          </select>
        </label>

        <button className="button button--primary button--full" type="submit">
          Entrar
        </button>

        {session ? (
          <button className="button button--secondary button--full" type="button" onClick={() => navigate('/operador')}>
            Continuar com {session.operatorName}
          </button>
        ) : null}

        <div className="quick-operators">
          <p className="section-caption">Operadores locais</p>
          <div className="chip-grid">
            {quickList.length ? (
              quickList.map((operator) => (
                <button key={operator.id} type="button" className="quick-chip" onClick={() => fillOperator(operator)}>
                  <strong>{operator.name}</strong>
                  <small>{operator.shiftName || 'Sem turno'}</small>
                </button>
              ))
            ) : (
              <p className="empty-state">Nenhum operador cadastrado ainda.</p>
            )}
          </div>
        </div>
      </form>
    </section>
  );
}
