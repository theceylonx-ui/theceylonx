// HiBowan Service Worker - Progressive Web App
const CACHE_NAME = 'hibowan-v3.0.0';
const OFFLINE_URL = '/offline.html';

// Only cache true binary/static assets — never HTML or JS.
// HTML pages in a Vite SPA reference chunk hashes that change on every rebuild.
// Caching HTML or JS causes "Importing a module script failed" crashes after rebuilds.
const urlsToCache = [
  '/offline.html',
  '/manifest.json',
  '/assets/5_1756417819316.png',
  '/pwa-icon-192x192.png',
  '/pwa-icon-512x512.png'
];

// Vite dev-mode paths — always bypass the SW entirely
const VITE_DEV_PATHS = [
  /^\/@fs\//,
  /^\/@vite\//,
  /^\/@id\//,
  /^\/src\//,
  /\/node_modules\//
];

// Install — cache only binary assets, skip waiting immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
      .catch((err) => {
        // Don't block install if an asset is missing
        console.warn('[SW] Install cache error (non-fatal):', err);
        return self.skipWaiting();
      })
  );
});

// Activate — delete ALL old caches, claim all clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch — conservative strategy: only cache binary assets, pass everything else through
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== 'GET') return;

  // Skip cross-origin
  if (url.origin !== location.origin) return;

  // Skip Vite dev paths
  if (VITE_DEV_PATHS.some((p) => p.test(url.pathname))) return;

  // Skip API calls
  if (url.pathname.startsWith('/api/')) return;

  // Skip anything with Vite cache-busting params (dep chunks)
  if (url.searchParams.has('t') || url.searchParams.has('v')) return;

  // CRITICAL: Never cache HTML documents or JavaScript — they contain/reference
  // Vite chunk hashes that change on every rebuild. Serving stale ones causes
  // "Importing a module script failed" crashes.
  if (
    request.destination === 'document' ||
    request.destination === 'script' ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.jsx') ||
    url.pathname.endsWith('.html')
  ) {
    return; // Let the browser handle it directly — no SW interception
  }

  // Only use cache-first for true binary assets: images, fonts, icons, manifest
  const isBinaryAsset =
    /\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$/.test(url.pathname) ||
    url.pathname === '/manifest.json' ||
    url.pathname === '/offline.html';

  if (isBinaryAsset) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Everything else: network only (no caching)
});

// Cache-first for binary assets only
function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;

    return fetch(request).then((response) => {
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      return response;
    });
  });
}

// Push notification handler
self.addEventListener('push', (event) => {
  let data = {
    title: 'HiBowan',
    body: 'You have a new notification',
    icon: '/pwa-icon-192x192.png',
    badge: '/pwa-icon-96x96.png',
    tag: 'general',
  };

  if (event.data) {
    try { data = { ...data, ...event.data.json() }; } catch (_) {}
  }

  event.waitUntil(self.registration.showNotification(data.title, data));
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});

// Allow main thread to trigger skipWaiting
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
