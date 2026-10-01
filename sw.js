// PADELBOARD — service worker
// v14 (2026-07-03): se archiva la Pizarra 3D. Se retira './padel-3d.html' del
// app shell y el precache de Three.js (THREE_URL). El resto (offline-first de
// tipografías con stale-while-revalidate) se mantiene igual que en v13.
// v22 (2026-09-29): versión unificada (mayo + julio). Las llamadas a /api/
// (cuentas y Pro) nunca se cachean.
// v24 (2026-09-30): goma que borra por donde pasa e icono con la bola amarilla.
// v25 (2026-09-30): la página va a red primero; antes un despliegue tardaba dos
// aperturas en verse. Los iconos y el manifest siguen cache-first.
// v26 (2026-09-30): los iconos pasan a ser el logo de la app (el mismo de la
// portada). icon-180 para «Añadir a pantalla de inicio» de iOS y un maskable
// aparte para Android, que recorta a círculo.
const CACHE = 'padelboard-v30';
const FONT_CACHE = 'pizarra-padel-fonts-v3';

// App shell local.
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png?v=2',
  './icon-192.png?v=2',
  './icon-512.png?v=2',
  './icon-maskable-512.png?v=2'
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
  // Cuentas y estado Pro: siempre a red, nunca desde caché.
  if (url.pathname.startsWith('/api/')) return;

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

  // La página: RED PRIMERO, caché de respaldo. Con cache-first, tras un despliegue
  // hacía falta abrir la app DOS veces para ver los cambios — la primera servía el
  // index viejo mientras el SW nuevo se instalaba por detrás — y parecía que el
  // despliegue no había entrado (le pasó a Borja el 30-09-2026 con la goma nueva).
  // Offline sigue igual: si no hay red, sale el index cacheado.
  const esPagina = e.request.mode === 'navigate' ||
                   (e.request.headers.get('accept') || '').includes('text/html');
  if (esPagina) {
    e.respondWith(
      fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          const copia = resp.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copia)).catch(() => {});
        }
        return resp;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Resto de ficheros del shell (iconos, manifest): caché primero.
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => Response.error()))
  );
});
