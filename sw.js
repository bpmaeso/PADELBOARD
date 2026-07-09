// Pizarra Pádel — service worker
// v17 (2026-07-08): control de dispositivos Pro (máx 3 por cuenta) con pantalla
// "Mis dispositivos" y email de soporte; el acceso Pro ahora depende de que el
// dispositivo esté dentro del cupo verificado por el servidor.
// v16: menú Pro integrado, colores oficiales de pista, safe-areas en secuencias.
// v15: iconos con el logo real, pista tumbada en horizontal, safe-areas toolbar.
// v19 (2026-07-09): home sin cabecera (logo/nombre/subtítulo); icono de vaciar
// más limpio; borrador de 3 dedos/clic derecho más pequeño.
const CACHE = 'pizarra-padel-v19';
const FONT_CACHE = 'pizarra-padel-fonts-v3';

// App shell local.
const CORE = [
  './',
  './index.html',
  './padel-board.html',
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
