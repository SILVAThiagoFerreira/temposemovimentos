const DEFAULT_UPDATE_INTERVAL_MS = 10 * 60 * 1000;

let controllerReloadScheduled = false;
let updateMonitorCleanup = null;

function scheduleReload() {
  if (controllerReloadScheduled || typeof window === 'undefined') {
    return;
  }

  controllerReloadScheduled = true;
  window.setTimeout(() => {
    window.location.reload();
  }, 250);
}

function activateWaitingWorker(registration) {
  const waitingWorker = registration?.waiting;

  if (waitingWorker) {
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    return true;
  }

  return false;
}

async function checkForApplicationUpdate() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || navigator.onLine === false) {
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();

  if (!registration) {
    return;
  }

  await registration.update();
  activateWaitingWorker(registration);
}

export async function refreshApplicationAssets() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();

      if (registration) {
        await registration.update();

        activateWaitingWorker(registration);

        const worker = registration.waiting || registration.installing;
        if (worker) {
          await new Promise((resolve) => {
            const timer = window.setTimeout(() => {
              worker.removeEventListener('statechange', handleStateChange);
              resolve();
            }, 1200);

            function handleStateChange() {
              if (worker.state === 'activated' || worker.state === 'redundant') {
                window.clearTimeout(timer);
                worker.removeEventListener('statechange', handleStateChange);
                resolve();
              }
            }

            worker.addEventListener('statechange', handleStateChange);
          });
        }
      }
    }
  } catch {
    // Mantém a experiência atual caso a atualização falhe.
  }

  window.location.reload();
}

export function startApplicationUpdateMonitor({ intervalMs = DEFAULT_UPDATE_INTERVAL_MS } = {}) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return () => undefined;
  }

  if (updateMonitorCleanup) {
    return updateMonitorCleanup;
  }

  const handleControllerChange = () => {
    if (navigator.onLine !== false) {
      scheduleReload();
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      void checkForApplicationUpdate().catch(() => undefined);
    }
  };

  const handleOnline = () => {
    void checkForApplicationUpdate().catch(() => undefined);
  };

  navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('online', handleOnline);

  const intervalId = window.setInterval(() => {
    void checkForApplicationUpdate().catch(() => undefined);
  }, intervalMs);

  void checkForApplicationUpdate().catch(() => undefined);

  updateMonitorCleanup = () => {
    window.clearInterval(intervalId);
    navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('online', handleOnline);
    updateMonitorCleanup = null;
  };

  return updateMonitorCleanup;
}
