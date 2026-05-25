const CACHE_NAME = 'florawild-v2'; // Changed version to bust cache

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
  // Network-first approach during dev/troubleshooting
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
