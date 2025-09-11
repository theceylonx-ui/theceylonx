// Ceylon Expand Service Worker - Progressive Web App
const CACHE_NAME = 'ceylon-expand-v1.1.0';
const OFFLINE_URL = '/offline.html';
const API_CACHE_NAME = 'ceylon-expand-api-v1.0.0';

// Define which URLs to cache
const urlsToCache = [
  '/',
  '/offline.html',
  '/browse-trips',
  '/community',
  '/manifest.json',
  '/assets/5_1756417819316.png', // Logo
  '/pwa-icon-192x192.png',
  '/pwa-icon-512x512.png'
];

// Cache strategies for different types of requests
const cacheStrategies = {
  // Static assets - Cache first
  static: [
    /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
    /\/assets\//,
    /\/src\//,
    /manifest\.json$/
  ],
  
  // API calls - Network first with cache fallback
  api: [
    /\/api\//
  ],
  
  // Pages - Network first with cache fallback
  pages: [
    /\/(browse-trips|community|post|auth|profile|help)/
  ]
};

// Install event - Cache static resources
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - Handle different caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Determine cache strategy based on request
  const strategy = getCacheStrategy(request);

  switch (strategy) {
    case 'static':
      event.respondWith(cacheFirst(request));
      break;
    case 'api':
      event.respondWith(networkFirstWithCacheFallback(request, API_CACHE_NAME));
      break;
    case 'pages':
      event.respondWith(networkFirstWithOfflineFallback(request));
      break;
    default:
      event.respondWith(networkFirst(request));
  }
});

// Cache strategies implementation

// Cache first - for static assets
function cacheFirst(request) {
  return caches.match(request)
    .then((response) => {
      if (response) {
        return response;
      }
      
      return fetch(request).then((response) => {
        // Don't cache if not a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(request, responseToCache);
          });

        return response;
      });
    });
}

// Network first with cache fallback - for API calls
function networkFirstWithCacheFallback(request, cacheName) {
  return fetch(request)
    .then((response) => {
      // Cache successful API responses
      if (response.status === 200) {
        const responseToCache = response.clone();
        caches.open(cacheName)
          .then((cache) => {
            cache.put(request, responseToCache);
          });
      }
      
      return response;
    })
    .catch(() => {
      // Network failed, try cache
      return caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          
          // If it's a critical API call, return a JSON error response
          if (request.url.includes('/api/')) {
            return new Response(JSON.stringify({
              error: 'Network unavailable',
              message: 'This feature is not available offline',
              offline: true
            }), {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          throw new Error('No cached response available');
        });
    });
}

// Network first with offline page fallback - for navigation
function networkFirstWithOfflineFallback(request) {
  return fetch(request)
    .then((response) => {
      // Cache successful page responses
      if (response.status === 200) {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(request, responseToCache);
          });
      }
      
      return response;
    })
    .catch(() => {
      // Network failed, try cache first
      return caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          
          // For navigation requests, show offline page
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          
          throw new Error('No cached response available');
        });
    });
}

// Network first - default strategy
function networkFirst(request) {
  return fetch(request)
    .catch(() => {
      return caches.match(request);
    });
}

// Determine cache strategy based on request
function getCacheStrategy(request) {
  const url = new URL(request.url);
  
  // Check for static assets
  for (const pattern of cacheStrategies.static) {
    if (pattern.test(url.pathname)) {
      return 'static';
    }
  }
  
  // Check for API calls
  for (const pattern of cacheStrategies.api) {
    if (pattern.test(url.pathname)) {
      return 'api';
    }
  }
  
  // Check for pages
  for (const pattern of cacheStrategies.pages) {
    if (pattern.test(url.pathname)) {
      return 'pages';
    }
  }
  
  return 'default';
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);
  
  switch (event.tag) {
    case 'trip-post':
      event.waitUntil(syncTripPosts());
      break;
    case 'user-actions':
      event.waitUntil(syncUserActions());
      break;
    default:
      console.log('[ServiceWorker] Unknown sync tag:', event.tag);
  }
});

// Sync offline trip posts
async function syncTripPosts() {
  try {
    const cache = await caches.open('offline-actions');
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('offline-trip-post')) {
        const response = await cache.match(request);
        const data = await response.json();
        
        // Attempt to post the trip
        try {
          await fetch('/api/trips', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
          });
          
          // Remove from offline cache on success
          await cache.delete(request);
          
          // Notify user of successful sync
          self.registration.showNotification('Trip Posted!', {
            body: 'Your trip has been posted successfully.',
            icon: '/pwa-icon-192x192.png',
            badge: '/pwa-icon-96x96.png',
            tag: 'trip-posted'
          });
        } catch (error) {
          console.log('[ServiceWorker] Failed to sync trip post:', error);
        }
      }
    }
  } catch (error) {
    console.log('[ServiceWorker] Background sync failed:', error);
  }
}

// Sync other user actions
async function syncUserActions() {
  try {
    // Implementation for syncing other offline actions
    console.log('[ServiceWorker] Syncing user actions...');
  } catch (error) {
    console.log('[ServiceWorker] Failed to sync user actions:', error);
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push Received.');
  
  let notificationData = {
    title: 'Ceylon Expand',
    body: 'You have a new notification',
    icon: '/pwa-icon-192x192.png',
    badge: '/pwa-icon-96x96.png',
    tag: 'general',
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'View'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.log('[ServiceWorker] Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click received.');
  
  event.notification.close();

  const action = event.action;
  const notification = event.notification;
  
  if (action === 'dismiss') {
    return;
  }

  // Handle notification click
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Try to focus existing window
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window if no existing window found
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  console.log('[ServiceWorker] Unhandled promise rejection:', event.reason);
  event.preventDefault();
});