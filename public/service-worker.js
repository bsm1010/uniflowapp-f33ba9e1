// Fenncly Service Worker — handles Web Push + minimal navigation cache.
// Strategy: NetworkFirst for navigations (never trap users on stale HTML).

const CACHE_NAME = 'fennecly-v1';
const PRECACHE = ['/icons/icon-192.png', '/icons/icon-512.png', '/sounds/notification.mp3'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(PRECACHE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(req);
      } catch {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);
        return cached || new Response('Offline', { status: 503 });
      }
    })());
  }
});

// ---- Push notifications ----
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Fenncly', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Fenncly';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/icon-96.png',
    tag: data.tag || 'fennecly-notification',
    renotify: true,
    data: { url: data.url || '/dashboard', ...data.data },
    silent: false,
    vibrate: [120, 60, 120],
  };

  event.waitUntil((async () => {
    await self.registration.showNotification(title, options);
    // Play custom sound for any open Fenncly windows
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      client.postMessage({ type: 'PLAY_NOTIFICATION_SOUND' });
    }
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/dashboard';
  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of allClients) {
      if ('focus' in client) {
        client.navigate(url).catch(() => {});
        return client.focus();
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  })());
});
