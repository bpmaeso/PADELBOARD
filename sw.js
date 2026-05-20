// Pizarra Pádel — service worker
// v3 (2026-05-21): arregla el offline-first de las tipografías. Antes se
// precacheaba una URL de Google Fonts distinta a la que pide index.html y
// nunca se cacheaban los .woff2 de fonts.gstatic.com, así que offline la
// fuente caía a sans-serif. Ahora el CSS se precachea con la URL real y
// tanto el CSS como los .woff2 se sirven con stale-while-revalidate.
const CACHE = 'pizarra-padel-v9';
const FONT_CACHE = 'pizarra-padel-fonts-v3';

// App shell local.
const CORE = [
  './',
  './index.html',
  './padel-board.html',
  './padel-3d.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// URL EXACTA de Google Fonts que pide index.html (debe coincidir al carácter).
const FONT_CSS = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Bebas+Neue&display=swap';

self.addEventListener('install', e => {
  e.waitUntil(
    Promise.all([
      caches.open(CACHE).then(c => c.addAll(CORE)),
      // Tolerante a fallo de red: si el primer install es offline, la fuente
      // caerá a sans-serif sin romper la instalación del resto del shell.
      caches.open(FONT_CACHE).then(c => c.add(FONT_CSS).catch(() => {}))
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE && k !== FONT_CACHE).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

function isFont(url) {
  return url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
}

self.addEventListener('fetch', e => {
  // Solo gestionamos GET; deja pasar POST/PUT etc. al navegador.
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Google Fonts (CSS + .woff2): stale-while-revalidate en cache propia.
  // El CSS ya viene precacheado; los .woff2 se cachean en la primera carga
  // con red, quedando disponibles offline después.
  if (isFont(url)) {
    e.respondWith(
      caches.open(FONT_CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          const network = fetch(e.request).then(resp => {
            if (resp && resp.status === 200) cache.put(e.request, resp.clone());
            return resp;
          }).catch(() => cached);
          return cached || network;
        })
      )
    );
    return;
  }

  // Resto: cache-first con fallback a index.html para navegaciones.
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => {
      if (e.request.mode === 'navigate' || (e.request.headers.get('accept') || '').includes('text/html')) {
        return caches.match('./index.html');
      }
      return Response.error();
    }))
  );
});
