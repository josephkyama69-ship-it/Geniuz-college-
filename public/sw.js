const CACHE_NAME = 'giniaz-college-cache-v2';
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

// Installs Service Worker and caches the essential shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching app shell...');
      // Use any to prevent install failures if some files aren't immediately present (like favicon)
      return Promise.allSettled(
        SHELL_ASSETS.map(url => {
          return cache.add(url).catch(err => {
            console.warn(`[Service Worker] Failed to precache ${url}:`, err);
          });
        })
      );
    })
  );
});

// Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercept fetch requests
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // We only intercept GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Ignore internal dev server connections (HMR hot updates, socket.io, etc)
  if (url.pathname.includes('__vite') || url.pathname.includes('hot-update') || url.port === '5173') {
    return;
  }

  // Do not cache API routes - they are either external or handled offline via IndexedDB
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // For navigating to pages (SPA routes like /mjasiriamali-plus, etc. or page refreshes)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If successful network response, keep a copy in the cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put('/', responseClone);
          });
          return response;
        })
        .catch(() => {
          // If offline, return the cached root '/' (index.html SPA shell)
          return caches.match('/').then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Caching strategy for static files, scripts, stylesheets, and fonts
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached response if found (Cache-First for assets, especially fonts and hashes)
      if (cachedResponse) {
        // Also fetch in background to refresh cache (Stale-While-Revalidate pattern)
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse);
            });
          }
        }).catch(() => {/* Ignore background sync failures offline */});
        
        return cachedResponse;
      }

      // If not in cache, fetch from network
      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && !url.host.includes('googleapis') && !url.host.includes('gstatic')) {
            return networkResponse;
          }

          // Dynamically cache valid responses
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // Return generic offline messages/fallbacks if needed, or let browser handle it
        });
    })
  );
});
