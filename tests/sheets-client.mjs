// Cliente Sheets: leitura, gravação, erros, tempo esgotado e polling com relógio controlado.
import assert from 'node:assert/strict';
import { createSheetsClient } from '../src/services/sheetsClient.js';

const URL_BASE = 'https://script.google.com/macros/s/TEST/exec';
const SNAPSHOT = { version: 1, updatedAt: 'A', operators: [{ id: 'usr-paulo' }], movementRecords: [] };

function jsonResponse(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body) };
}

function fakeTimers() {
  const pending = [];
  return {
    pending,
    setTimer: (callback, ms) => {
      const handle = { callback, ms };
      pending.push(handle);
      return handle;
    },
    clearTimer: (handle) => {
      const index = pending.indexOf(handle);
      if (index >= 0) pending.splice(index, 1);
    },
    runNext() {
      const handle = pending.shift();
      assert.ok(handle, 'há um agendamento pendente');
      handle.callback();
    },
  };
}

async function settle() {
  for (let i = 0; i < 10; i++) {
    await new Promise((resolve) => setImmediate(resolve));
  }
}

// 1) Leitura usa GET ?action=snapshot e devolve o snapshot.
{
  const calls = [];
  const client = createSheetsClient({
    url: URL_BASE,
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return jsonResponse({ ok: true, snapshot: SNAPSHOT, updatedAt: 'A' });
    },
  });
  const snapshot = await client.read();
  assert.deepEqual(snapshot, SNAPSHOT);
  assert.equal(calls[0].url, `${URL_BASE}?action=snapshot`);
  assert.equal(calls[0].init.method, 'GET');
}

// 2) Planilha vazia devolve null (o app então grava o cadastro inicial).
{
  const client = createSheetsClient({
    url: URL_BASE,
    fetchImpl: async () => jsonResponse({ ok: true, snapshot: null, updatedAt: null }),
  });
  assert.equal(await client.read(), null);
}

// 3) Gravação usa POST text/plain (sem preflight) com action save e o snapshot no corpo.
{
  let captured = null;
  const client = createSheetsClient({
    url: URL_BASE,
    fetchImpl: async (url, init) => {
      captured = { url, init };
      return jsonResponse({ ok: true, updatedAt: 'B' });
    },
  });
  const returned = await client.write(SNAPSHOT);
  assert.equal(returned, SNAPSHOT);
  assert.equal(captured.url, URL_BASE);
  assert.equal(captured.init.method, 'POST');
  assert.equal(captured.init.headers['Content-Type'], 'text/plain;charset=utf-8');
  const body = JSON.parse(captured.init.body);
  assert.equal(body.action, 'save');
  assert.deepEqual(body.snapshot, SNAPSHOT);
}

// 4) Erros: HTTP, ok:false, resposta que não é JSON e tempo esgotado viram exceções claras.
{
  const httpError = createSheetsClient({ url: URL_BASE, fetchImpl: async () => jsonResponse({}, 500) });
  await assert.rejects(httpError.read(), /HTTP 500/);

  const logicError = createSheetsClient({
    url: URL_BASE,
    fetchImpl: async () => jsonResponse({ ok: false, error: 'Gravação recusada: snapshot sem usuários' }),
  });
  await assert.rejects(logicError.write(SNAPSHOT), /sem usuários/);

  const htmlPage = createSheetsClient({
    url: URL_BASE,
    fetchImpl: async () => ({ ok: true, status: 200, text: async () => '<html>Entrar</html>' }),
  });
  await assert.rejects(htmlPage.read(), /não é JSON/);

  const timers = fakeTimers();
  const hanging = createSheetsClient({
    url: URL_BASE,
    timeoutMs: 50,
    setTimer: timers.setTimer,
    clearTimer: timers.clearTimer,
    fetchImpl: (url, init) =>
      new Promise((resolve, reject) => {
        init.signal.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      }),
  });
  const pendingRead = assert.rejects(hanging.read(), /Tempo esgotado/);
  timers.runNext();
  await pendingRead;
  assert.equal(timers.pending.length, 0, 'temporizador de requisição é limpo');
}

// 5) Polling: consulta só a versão; busca o snapshot apenas quando muda; avisa uma vez por falha contínua.
{
  const timers = fakeTimers();
  const log = [];
  let version = 'A';
  let failNext = false;
  const client = createSheetsClient({
    url: URL_BASE,
    pollMs: 30000,
    setTimer: timers.setTimer,
    clearTimer: timers.clearTimer,
    fetchImpl: async (url) => {
      if (url.includes('action=version')) {
        log.push('version');
        if (failNext) throw new TypeError('network down');
        return jsonResponse({ ok: true, updatedAt: version });
      }
      log.push('snapshot');
      return jsonResponse({ ok: true, snapshot: { ...SNAPSHOT, updatedAt: version }, updatedAt: version });
    },
  });

  const received = [];
  const unsubscribe = client.subscribe((snapshot, error) => received.push({ snapshot, error }));
  await settle();
  assert.deepEqual(log, ['version', 'snapshot'], 'primeira leitura traz o snapshot');
  assert.equal(received.length, 1);
  assert.equal(received[0].snapshot.updatedAt, 'A');
  assert.equal(timers.pending.length, 1, 'próxima consulta agendada');
  assert.equal(timers.pending[0].ms, 30000);

  timers.runNext();
  await settle();
  assert.deepEqual(log, ['version', 'snapshot', 'version'], 'sem mudança: só a versão');
  assert.equal(received.length, 1, 'nada entregue sem mudança');

  version = 'B';
  timers.runNext();
  await settle();
  assert.deepEqual(log.slice(-2), ['version', 'snapshot'], 'mudou: busca o snapshot');
  assert.equal(received.length, 2);
  assert.equal(received[1].snapshot.updatedAt, 'B');

  failNext = true;
  timers.runNext();
  await settle();
  assert.equal(received.length, 3);
  assert.ok(received[2].error instanceof Error, 'falha entregue como erro');
  assert.equal(received[2].snapshot, null);

  timers.runNext();
  await settle();
  assert.equal(received.length, 3, 'falhas seguidas não repetem o aviso');

  failNext = false;
  version = 'C';
  timers.runNext();
  await settle();
  assert.equal(received.length, 4, 'recuperação traz a mudança');
  assert.equal(received[3].snapshot.updatedAt, 'C');

  unsubscribe();
  assert.equal(timers.pending.length, 0, 'cancelar limpa o agendamento');
  log.length = 0;
  await settle();
  assert.equal(log.length, 0, 'sem chamadas depois de cancelar');
}

// 6) Erro lançado dentro de onChange não interrompe o polling.
{
  const timers = fakeTimers();
  const client = createSheetsClient({
    url: URL_BASE,
    setTimer: timers.setTimer,
    clearTimer: timers.clearTimer,
    fetchImpl: async (url) =>
      url.includes('action=version')
        ? jsonResponse({ ok: true, updatedAt: 'Z' })
        : jsonResponse({ ok: true, snapshot: { ...SNAPSHOT, updatedAt: 'Z' }, updatedAt: 'Z' }),
  });
  client.subscribe(() => {
    throw new Error('erro na tela');
  });
  await settle();
  assert.equal(timers.pending.length, 1, 'polling continua agendado');
}

// 7) Sem URL, o cliente não é criado.
{
  assert.throws(() => createSheetsClient({ url: '' }), /URL do Apps Script não configurada/);
}

console.log('SHEETS_CLIENT_OK');
