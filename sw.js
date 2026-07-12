const CACHE_NAME = 'temposemovimentos-v2.5.0';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg', './favicon.svg'];

async function putIfCacheable(cache, request, response) {
  if (!response || !response.ok || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  await cache.put(request, response.clone());
}

async function networkFirst(request, fallbackRequest = request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    await putIfCacheable(cache, fallbackRequest, response);
    return response;
  } catch {
    const cached = await cache.match(fallbackRequest);
    return cached || Response.error();
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, new Request(new URL('./index.html', self.location.href))));
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const response = await fetch(event.request);
        await putIfCacheable(cache, event.request, response);
        return response;
      } catch {
        const cached = await cache.match(event.request);
        return cached || Response.error();
      }
    }),
  );
});
