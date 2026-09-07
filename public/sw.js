const CACHE_NAME = 'omnivenda-v4';
const ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/icon.svg',
  '/launchericon-192x192.png',
  '/launchericon-512x512.png',
  '/manifest.json'
];

// Instalação imediata do novo Service Worker sem ficar esperando
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((err) => {
        console.warn('Cache de assets iniciais PWA: ', err);
      });
    })
  );
});

// Ativação e limpeza imediata de qualquer cache antigo
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              console.log('Removendo cache obsoleto:', key);
              return caches.delete(key);
            }
          })
        );
      })
    ])
  );
});

// Listener para forçar atualização via mensagem do app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  // Apenas métodos GET de mesma origem
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // ESTRATÉGIA NETWORK-FIRST PARA DOCUMENTOS / NAVEGAÇÃO:
  // Garante que o app sempre busque a versão mais recente da Vercel quando estiver online!
  const isNavigation = event.request.mode === 'navigate' || 
                       event.request.destination === 'document' || 
                       url.pathname === '/' || 
                       url.pathname === '/index.html';

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Se estiver sem conexão (offline), recorre ao cache local
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/index.html') || caches.match('/');
          });
        })
    );
    return;
  }

  // Para recursos estáticos (ícones, manifest, assets com hash único do vite):
  // Stale-While-Revalidate ou Cache-First com atualização em background
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
