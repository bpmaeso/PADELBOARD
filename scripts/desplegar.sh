#!/usr/bin/env bash
# Despliega PADELBOARD en producción (https://padel-jdlq10.mywire.org) desde esta máquina,
# sin pasar por GitHub: el código viaja en un git bundle por scp y el clon del VPS avanza
# en fast-forward. El clon sigue siendo un checkout git real con los mismos commits que
# tendrá GitHub, así que el `git pull --ff-only origin main` de siempre seguirá encajando.
#
#   bash scripts/desplegar.sh [rama]      (por defecto: main)
#
# Requisitos: la clave SSH del VPS en la ruta de abajo y el árbol de trabajo limpio.
set -euo pipefail

RAMA="${1:-main}"
CLAVE="${JDLQ10_SSH_KEY:-C:/Users/jdlq1/Desktop/jdlq10_server/SSH_privada_jdlq10.key}"
VPS="ubuntu@143.47.33.174"
APP="/opt/stacks/padel-pwa/app"
WEB="/opt/stacks/caddy/static/padel"
URL="https://padel-jdlq10.mywire.org"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$REPO"
[ -z "$(git status --porcelain --untracked-files=no)" ] || { echo "ABORTA: hay cambios sin commitear."; exit 1; }
COMMIT=$(git rev-parse --short "$RAMA")
echo "Desplegando $RAMA ($COMMIT) en $URL"

# El service worker cachea el index: si no sube de versión, el móvil sigue con el viejo.
echo "   SW: $(grep -m1 "const CACHE" sw.js)"

BUNDLE="${TEMP:-/tmp}/padelboard-deploy.bundle"
git bundle create "$BUNDLE" "$RAMA" >/dev/null 2>&1
scp -q -i "$CLAVE" "$BUNDLE" "$VPS:/tmp/padelboard-deploy.bundle"

ssh -i "$CLAVE" "$VPS" "
set -e
sudo cp -a $WEB $WEB.bak-\$(date +%Y%m%d-%H%M)
sudo git -C $APP fetch -q /tmp/padelboard-deploy.bundle $RAMA
sudo git -C $APP merge --ff-only FETCH_HEAD
# --delete-excluded es obligatorio: sin él, lo excluido se queda en la carpeta servida
# (así se publicó /.git/ desde mayo hasta el 30-09-2026). Ver docs/desarrollo.md.
sudo rsync -a --delete --delete-excluded \
  --exclude='.git' --exclude='.gitignore' --exclude='.claude' --exclude='docs' --exclude='CLAUDE.md' \
  --exclude='_archive' --exclude='backend' --exclude='README.md' --exclude='scripts' \
  $APP/ $WEB/
rm -f /tmp/padelboard-deploy.bundle
"
rm -f "$BUNDLE"

echo "Comprobando producción:"
echo "   home      $(curl -s -o /dev/null -w '%{http_code}' $URL/)"
echo "   $(curl -s $URL/sw.js | grep -m1 'const CACHE')"
echo "   .git      $(curl -s -o /dev/null -w '%{http_code}' $URL/.git/config)  (tiene que ser 404)"
echo "Listo. Copia de la versión anterior en el VPS: $WEB.bak-*"
