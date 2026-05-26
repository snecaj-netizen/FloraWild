const CACHE_NAME = 'florawild-v3'; // Changed version to bust cache and install new SW rules

self.addEventListener('install', event => {
  self.skipWaiting(); // Force active
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            return caches.delete(cacheName); // Clear everything
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', event => {
  // 1. Skip non-GET requests (e.g., POST requests like /api/identify, /api/search, or Auth / Firestore POSTs)
  if (event.request.method !== 'GET') {
    return;
  }

  // 2. Skip local API routes
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 3. Skip external domains (e.g., Firebase Authentication, Firestore, or external asset domains)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Network-first approach during dev/troubleshooting
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
