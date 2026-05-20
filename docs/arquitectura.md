# Padel PWA — arquitectura

## Repo

- **GitHub**: `bpmaeso/PADELBOARD` (owner: bpmaeso).
- **Local portátil**: `C:\Users\jdlq1\SkyNET-Shared\proyectos\APPS\PADELBOARD\` (Syncthing → torre).
- **Local VPS**: `/opt/stacks/padel-pwa/app/`.
- **Servido por Caddy**: `/opt/stacks/caddy/static/padel/`.

## Producción

| Campo | Valor |
|---|---|
| URL | https://padel-jdlq10.mywire.org |
| Cert | Let's Encrypt automático (Caddy) |
| DNS | Dynu `padel-jdlq10.mywire.org` → `143.47.33.174` |
| Caddy bloque | `padel-jdlq10.mywire.org { root * /usr/share/caddy/padel; file_server; encode gzip zstd; try_files {path} /index.html }` |

## Estructura real de la PWA

```
PADELBOARD/
├── index.html          # pantalla HOME
├── padel-board.html    # pizarra táctica 2D
├── padel-3d.html       # vista 3D
├── manifest.json
├── sw.js
├── icon-192.png        # iconos en la RAÍZ (no en icons/)
├── icon-512.png
├── docs/
├── CLAUDE.md
└── README.md
```

> Nota: CSS y JS van inline dentro de los `.html` (PWA vanilla, sin bundler). No hay carpetas `css/`, `js/` ni `assets/` por ahora.

## PWA requirements

- `manifest.json`: name, short_name, start_url=`./index.html`, scope=`./`, display=`fullscreen`, theme_color (`#10131a`), background_color (`#0a0b0e`), icons 192 + 512 (cada uno con `purpose: any` y `maskable`, rutas relativas en la raíz).
- `<link rel="manifest">` en `<head>`.
- `<meta name="theme-color">`.
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
- Service Worker registrado y precaching de la app shell.

## Validación manual

```bash
# URLs vivas
for path in / /index.html /padel-board.html /padel-3d.html /manifest.json /sw.js /icon-192.png /icon-512.png; do
  printf '%-40s ' "$path"; curl -s -o /dev/null -w '%{http_code}\n' "https://padel-jdlq10.mywire.org$path"
done
# Esperado: todos 200
```

Lighthouse desde Chrome DevTools — móvil + sin throttle + PWA category.

## Despliegue (proceso actual)

```bash
ssh ubuntu@vps "cd /opt/stacks/padel-pwa/app && git pull && \
  rsync -av --delete --exclude='.git' ./ /opt/stacks/caddy/static/padel/ && \
  cd /opt/stacks/caddy && docker compose restart caddy"
```

Cuando exista CI, esto desaparece.

## Memorias asociadas

- `laptop/project_padel_pwa.md`.
- `laptop/reference_subdominios_dynu.md` (DNS).
- `laptop/project_marathon_2026_05_02.md` (origen del proyecto).
