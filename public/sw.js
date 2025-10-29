const CACHE_NAME = 'transport-monitor-v7-routes';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/pages/Index.tsx',
  '/src/index.css',
  '/src/lib/storage.ts',
  '/src/components/',
  // Cache all static assets for offline use
  '/assets/',
  '/static/'
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing... v7-routes');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('Skip waiting - force activation...');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating... v7-routes');
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
        console.log('Claiming all clients - forcing refresh...');
        return self.clients.claim();
      })
      .then(() => {
        // Force refresh all clients
        return self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => {
            console.log('Notifying client to reload:', client.url);
            client.postMessage({ type: 'RELOAD' });
          });
        });
      })
  );
});

// Fetch event - cache first strategy for full offline support
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
      event.request.url.includes('__vite') ||
      event.request.url.includes('node_modules')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Always try cache first for better offline experience
        if (cachedResponse) {
          console.log('✅ Serving from cache:', event.request.url);
          
          // For network resources, update cache in background
          if (!event.request.url.includes('localhost') && navigator.onLine) {
            fetch(event.request)
              .then((networkResponse) => {
                if (networkResponse.status === 200) {
                  caches.open(CACHE_NAME)
                    .then((cache) => {
                      cache.put(event.request, networkResponse.clone());
                    });
                }
              })
              .catch(() => {
                // Ignore network errors in background updates
              });
          }
          
          return cachedResponse;
        }

        // For navigation requests (HTML pages), return the main index.html
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html')
            .then((response) => {
              if (response) {
                console.log('📄 Serving index.html for navigation:', event.request.url);
                return response;
              }
              // If no cached index.html, try network
              return fetch(event.request)
                .then((networkResponse) => {
                  // Cache the response
                  caches.open(CACHE_NAME)
                    .then((cache) => {
                      cache.put(event.request, networkResponse.clone());
                    });
                  return networkResponse;
                })
                .catch(() => {
                  // Return a basic offline page
                  return new Response(
                    `<!DOCTYPE html>
                    <html>
                    <head>
                      <title>Offline - Transport Monitor</title>
                      <meta name="viewport" content="width=device-width, initial-scale=1">
                      <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        .offline { color: #666; }
                      </style>
                    </head>
                    <body>
                      <h1>Você está offline</h1>
                      <p class="offline">Conecte-se à internet para acessar o Transport Monitor</p>
                      <button onclick="location.reload()">Tentar novamente</button>
                    </body>
                    </html>`,
                    {
                      headers: { 'Content-Type': 'text/html' }
                    }
                  );
                });
            });
        }

        // For other requests, try network first, then provide fallback
        console.log('🌐 Fetching from network:', event.request.url);
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
            console.log('❌ Network fetch failed:', error);
            
            // For navigation requests, return cached index.html as fallback
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html')
                .then((response) => {
                  if (response) {
                    return response;
                  }
                  // Return basic offline page
                  return new Response(
                    `<!DOCTYPE html>
                    <html>
                    <head><title>Offline</title></head>
                    <body>
                      <h1>Aplicativo Offline</h1>
                      <p>Conecte-se à internet e recarregue a página</p>
                    </body>
                    </html>`,
                    { headers: { 'Content-Type': 'text/html' } }
                  );
                });
            }
            
            // For other requests, just fail
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