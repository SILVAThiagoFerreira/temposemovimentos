import { sheetsConfig } from '../config/runtimeConfig.js';

// Cliente do backend em Google Sheets (Apps Script web app).
// Requisições GET sem cabeçalhos especiais e POST com text/plain, para evitar preflight CORS,
// que o Apps Script não responde.

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_POLL_MS = 30000;

export function createSheetsClient({
  url,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  pollMs = DEFAULT_POLL_MS,
  fetchImpl = (...args) => globalThis.fetch(...args),
  setTimer = (callback, ms) => globalThis.setTimeout(callback, ms),
  clearTimer = (handle) => globalThis.clearTimeout(handle),
} = {}) {
  if (!url) {
    throw new Error('URL do Apps Script não configurada');
  }

  async function request(requestUrl, init) {
    const controller = new AbortController();
    const timer = setTimer(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(requestUrl, { ...init, signal: controller.signal });
      const text = await response.text();

      if (!response.ok) {
        throw new Error(`Planilha respondeu HTTP ${response.status}`);
      }

      let payload;
      try {
        payload = JSON.parse(text);
      } catch {
        throw new Error('Resposta da planilha não é JSON: confira a implantação do Apps Script');
      }

      if (!payload || payload.ok !== true) {
        throw new Error(payload?.error || 'Resposta inválida da planilha');
      }

      return payload;
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new Error('Tempo esgotado ao falar com a planilha');
      }
      throw error;
    } finally {
      clearTimer(timer);
    }
  }

  const actionUrl = (action) => `${url}?action=${encodeURIComponent(action)}`;

  return {
    async read() {
      const payload = await request(actionUrl('snapshot'), { method: 'GET' });
      return payload.snapshot ?? null;
    },

    async write(database) {
      await request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'save', snapshot: database }),
      });
      return database;
    },

    // Polling leve: a cada intervalo consulta só a versão; o snapshot completo vem apenas se mudou.
    // Entrega erros uma vez por sequência de falhas, para não inundar o app.
    subscribe(onChange) {
      let stopped = false;
      let timer = null;
      let lastUpdatedAt = null;
      let failing = false;

      const schedule = () => {
        if (!stopped) {
          timer = setTimer(tick, pollMs);
        }
      };

      const deliver = (event) => {
        if (stopped) return;
        try {
          if (event.error) {
            onChange(null, event.error);
          } else {
            onChange(event.snapshot, null);
          }
        } catch (error) {
          console.warn('Falha ao processar atualização da planilha', error);
        }
      };

      const tick = async () => {
        timer = null;
        let event = null;

        try {
          const version = await request(actionUrl('version'), { method: 'GET' });
          failing = false;

          if ((version.updatedAt ?? null) !== lastUpdatedAt) {
            const full = await request(actionUrl('snapshot'), { method: 'GET' });
            lastUpdatedAt = full.updatedAt ?? null;
            if (full.snapshot) {
              event = { snapshot: full.snapshot };
            }
          }
        } catch (error) {
          if (!failing) {
            failing = true;
            event = { error };
          }
        }

        if (event) {
          deliver(event);
        }
        schedule();
      };

      void tick();

      return () => {
        stopped = true;
        if (timer) {
          clearTimer(timer);
          timer = null;
        }
      };
    },
  };
}

let defaultClient = null;

function getDefaultClient() {
  if (!defaultClient) {
    defaultClient = createSheetsClient({
      url: sheetsConfig.webAppUrl,
      timeoutMs: Number(sheetsConfig.requestTimeoutMs) || DEFAULT_TIMEOUT_MS,
      pollMs: (Number(sheetsConfig.pollIntervalSeconds) || DEFAULT_POLL_MS / 1000) * 1000,
    });
  }
  return defaultClient;
}

export function isSheetsConfigured() {
  return Boolean(sheetsConfig.webAppUrl);
}

export function readSheetsDatabase() {
  return getDefaultClient().read();
}

export function writeSheetsDatabase(database) {
  return getDefaultClient().write(database);
}

export function subscribeSheetsDatabase(onChange) {
  return getDefaultClient().subscribe(onChange);
}
