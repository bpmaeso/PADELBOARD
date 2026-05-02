// Pizarra Pádel — service worker
// v2 (2026-05-02): incluye todos los recursos críticos para PWA offline,
// fallback a index.html (la nueva entrada con HOME) y filtro de cross-origin
// para no romper Google Fonts cuando no hay red.
const CACHE = 'pizarra-padel-v2';
const ASSETS = [
  './',
  './index.html',
  './padel-board.html',
  './padel-3d.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Solo gestionamos GET; deja pasar POST/PUT etc. al navegador.
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => {
      // Solo damos fallback HTML para navegaciones, no para imágenes/fuentes.
      if (e.request.mode === 'navigate' || (e.request.headers.get('accept') || '').includes('text/html')) {
        return caches.match('./index.html');
      }
      return Response.error();
    }))
  );
});
