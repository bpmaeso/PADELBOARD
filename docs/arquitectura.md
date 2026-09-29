# Padel PWA — arquitectura

> Última actualización: 2026-05-21. Refleja la app con todas las funciones Pro operativas (SW v13).

> **Nota 2026-05-29**: pivote a modelo freemium 2D, ver `roadmap.md`.

## Repo

- **GitHub**: `bpmaeso/PADELBOARD` (rama principal: `main`). **Fuente de verdad del código.**
- **Local portátil**: `C:\Users\jdlq1\SkyNET-Shared\proyectos\APPS\PADELBOARD\` (carpeta sincronizada con la Torre vía Syncthing).
- **Local VPS**: `/opt/stacks/padel-pwa/app/` (clon git, owner root → usar `sudo git`).
- **Servido por Caddy**: `/opt/stacks/caddy/static/padel/`.

> Para trabajar desde otra máquina (Torre), ver `docs/desarrollo.md`.

## Producción

| Campo | Valor |
|---|---|
| URL | https://padel-jdlq10.mywire.org |
| Cert | Let's Encrypt automático (Caddy) |
| DNS | Dynu `padel-jdlq10.mywire.org` → `143.47.33.174` |
| Caddy | bloque con `root /usr/share/caddy/padel; file_server; encode gzip zstd; try_files {path} /index.html` |

## Estructura de ficheros

```
PADELBOARD/
├── index.html          # APP COMPLETA: HOME + 4 pantallas (board, generador, mis pizarras) — CSS y JS inline
├── padel-3d.html       # Pizarra 3D (Three.js r128 desde CDN) — página propia, vuelve a index.html
├── padel-board.html    # LEGADO (pizarra 2D antigua standalone, no enlazada; conservada)
├── manifest.json       # PWA: display fullscreen, iconos 192/512 en la raíz
├── sw.js               # Service worker (cache v13 + FONT_CACHE + three.js)
├── icon-192.png        # iconos en la RAÍZ (no en icons/)
├── icon-512.png
├── docs/               # arquitectura.md, roadmap.md, desarrollo.md, publicacion-monetizacion.md
├── CLAUDE.md           # instrucciones del proyecto para Claude Code
└── README.md
```

> CSS y JS van **inline** dentro de los `.html` (PWA vanilla, sin framework ni bundler).

## Pantallas (todas en `index.html`, sistema `.screen` con clase `.active`)

| Pantalla | id | Se abre desde | Función |
|---|---|---|---|
| HOME | `#home` | inicio | Menú: sección Gratis + sección Pro |
| Pizarra 2D | `#board-screen` | `openBoard()` | Pizarra táctica (dibujo + fichas) |
| Generador de pista | `#gen-screen` | `openGenerator()` | Diseña la pista (colores/medidas), exporta SVG, "usar en pizarra" |
| Mis pizarras | `#boards-screen` | `openBoards()` | Guardar/cargar/borrar jugadas |
| Pizarra 3D | (página `padel-3d.html`) | `location.href` | Visor 3D Three.js |

El **generador de secuencias** no es una pantalla aparte: reusa `#board-screen` con el panel `#seq-panel` (`openSequence()`).

## Funcionalidades

### Pizarra 2D (Gratis)
- Pista realista dibujada en canvas: superficie + **paredes de cristal** (con juntas de placa cada 2 m) + **reja/mallazo** + **puerta** con jambas + líneas de saque/central/red. Medidas oficiales (100 u = 1 m; pista 1000×2000 u = 10×20 m).
- **8 herramientas**: lápiz, lápiz discontinuo, línea, flecha, rectángulo, punto, cruz, goma. **6 colores**, **3 grosores**.
- **4 fichas** de jugador (FIJAS: 2 azules D/R, 2 rojas R/D) arrastrables. Las letras rotan según la orientación del móvil.
- **Goma fina** (1 dedo con herramienta goma) y **borrador ancho** (arrastrar **3+ dedos**, estilo borrador de pizarra).
- **Zoom/paneo** con 2 dedos (pinch). `clampPan()` impide bordes negros; zoom-out mínimo = pista ajustada a pantalla.
- **Pista fijada en vertical** (no se reorienta al girar; `courtLand()` siempre `false`).
- **Captura PNG** (botón cámara) y **vaciar** (papelera).
- **Barra compacta** en una fila agrupada: izq Inicio+Captura · centro marcas · der Goma+Vaciar; 2ª fila colores+tamaños.

### Generador de pista (Pro)
- Edita `courtConfig` (colores superficie/cristal/reja/líneas + medidas: grosor pared, cristal lateral, reja lateral, línea de saque) con vista previa en vivo (reusa `drawCourt`).
- **"Usar en pizarra"** (persiste en localStorage) y **"Descargar SVG"** (vectorial). Clamp defensivo conserva siempre la puerta.

### Generador de secuencias (Pro)
- Captura **frames** (posición de fichas + trazos), navega, borra, y **reproduce animación** interpolada (easing) con **velocidad** (0,5×–3×) y **bucle**.
- **Modo inmersivo**: la pista ocupa todo el dispositivo (`tbH()=0`); automático al reproducir. Persiste en localStorage.

### Mis pizarras (Pro)
- Guarda la jugada actual (trazos + fichas + `courtConfig`) con nombre/fecha; lista para cargar o borrar. localStorage.

### Pizarra 3D (Pro)
- `padel-3d.html`: Three.js r128, pista 3D completa, 4 jugadores, cámaras Iso/Cenital/Lateral/Fondo, captura, reset. Vuelve a `index.html`.

## Modelo de datos / estado (JS en `index.html`)

- `courtConfig` — config de la pista (colores, grosores, medidas). Default = pista realista. Persistencia: `localStorage['padel.courtConfig']`.
- `strokes` — array de trazos del lienzo. `PLAYERS` — 4 fichas `{id,label,color,cx,cy}`.
- `S` — estado de interacción (tool, color, stroke, punteros, pinch, selección, **wipe** 3 dedos).
- `SEQ` — `{frames:[], idx, playing, speed}`. Persistencia: `localStorage['padel.seq']`.
- Pizarras guardadas: `localStorage['padel.boards']` (array de `{name,date,strokes,players,court}`).
- `immersive` (bool) — modo pantalla completa. `tbH()` devuelve 0 en inmersivo, 88 normal.

## Service Worker (`sw.js`)

- `CACHE = 'pizarra-padel-v13'` (**subir versión en cada release** para refrescar clientes).
- App shell (`CORE`) + `FONT_CACHE` (Google Fonts CSS+woff2, stale-while-revalidate) + **Three.js** (precache tolerante, para 3D offline).
- Fetch: fuentes → cache propia; resto → cache-first con fallback a `index.html` en navegaciones.

## Validación rápida

```bash
for p in / /index.html /padel-3d.html /manifest.json /sw.js /icon-192.png /icon-512.png; do
  printf '%-22s ' "$p"; curl -s -o /dev/null -w '%{http_code}\n' "https://padel-jdlq10.mywire.org$p"
done   # esperado: todos 200
curl -s https://padel-jdlq10.mywire.org/sw.js | grep -m1 pizarra-padel-v   # versión SW desplegada
```

Auditoría funcional completa: ver `docs/desarrollo.md` (batería de pruebas en preview).

## Despliegue (manual, desde cualquier máquina con la clave SSH del VPS)

```bash
ssh -i <clave_jdlq10> ubuntu@143.47.33.174 "
  sudo git -C /opt/stacks/padel-pwa/app pull --ff-only origin main &&
  sudo rsync -a --delete --exclude='.git' --exclude='.claude' --exclude='docs' --exclude='CLAUDE.md' \
    /opt/stacks/padel-pwa/app/ /opt/stacks/caddy/static/padel/"
```

Caddy sirve estáticos al vuelo: **no hace falta reiniciarlo** para cambios de contenido. (Cuando exista CI, esto se automatiza.)

## Memorias asociadas

- `laptop/project_padel_pwa.md`, `laptop/reference_subdominios_dynu.md`, `laptop/project_marathon_2026_05_02.md`.
