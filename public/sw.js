const CACHE_NAME = 'transport-monitor-v9-offline';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html'
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing... v9-offline');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
          console.log('Cache addAll error:', err);
          // Continue anyway
        });
      })
      .then(() => {
        console.log('Skip waiting - force activation...');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating... v9-offline');
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
        console.log('Claiming all clients...');
        return self.clients.claim();
      })
  );
});

// Fetch event - network first with cache fallback
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
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('✅ Serving from cache (offline):', event.request.url);
            return cachedResponse;
          }

          // For navigation requests, return cached index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html').then((indexResponse) => {
              if (indexResponse) {
                return indexResponse;
              }
              // Return offline page
              return new Response(
                `<!DOCTYPE html>
                <html>
                <head>
                  <title>Offline - Transport Monitor</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <style>
                    body { 
                      font-family: Arial, sans-serif; 
                      text-align: center; 
                      padding: 50px;
                      background: #f5f5f5;
                    }
                    .container {
                      background: white;
                      padding: 40px;
                      border-radius: 8px;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                      max-width: 400px;
                      margin: 0 auto;
                    }
                    h1 { color: #333; }
                    .offline { color: #666; }
                    button {
                      background: #4CAF50;
                      color: white;
                      border: none;
                      padding: 12px 24px;
                      border-radius: 4px;
                      cursor: pointer;
                      margin-top: 20px;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>Você está offline</h1>
                    <p class="offline">Conecte-se à internet para acessar o Transport Monitor</p>
                    <button onclick="location.reload()">Tentar novamente</button>
                  </div>
                </body>
                </html>`,
                {
                  headers: { 'Content-Type': 'text/html' }
                }
              );
            });
          }

          // For other requests, just fail
          return new Response('Offline', { status: 503 });
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