const CACHE_NAME = 'transport-monitor-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('Skip waiting...');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Claiming clients...');
        return self.clients.claim();
      })
  );
});

// Fetch event - cache first strategy with network fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip Chrome extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Skip hot reload requests in development
  if (event.request.url.includes('/@vite/') || 
      event.request.url.includes('/@fs/') ||
      event.request.url.includes('__vite')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // For navigation requests (HTML pages), return the main index.html
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html')
            .then((response) => {
              if (response) {
                console.log('Serving index.html for navigation:', event.request.url);
                return response;
              }
              return fetch(event.request);
            });
        }

        // For other requests, try network first, then cache
        console.log('Fetching from network:', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            // Clone the response before caching
            const responseToCache = networkResponse.clone();
            
            // Cache successful responses
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            
            return networkResponse;
          })
          .catch((error) => {
            console.log('Network fetch failed:', error);
            
            // For navigation requests, return cached index.html as fallback
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            throw error;
          });
      })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});