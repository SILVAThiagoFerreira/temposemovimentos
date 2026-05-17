export async function refreshApplicationAssets() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();

      if (registration) {
        await registration.update();

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
