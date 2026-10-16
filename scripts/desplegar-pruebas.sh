#!/usr/bin/env bash
# Despliega PADELBOARD en la copia de PRUEBAS (https://padel-jdlq10.mywire.org/beta/),
# sin tocar la app real. Sirve para probar en el móvil antes de publicar.
#
#   bash scripts/desplegar-pruebas.sh [ref]      (por defecto: HEAD)
#
# En /beta/ la app entra sola en modo pruebas: interruptor «PRUEBAS · Pro» para
# alternar Gratis/Pro sin pagar, datos guardados aparte (padelbeta.*) y cachés
# propias del service worker. Las cuentas y /api/ son las reales (Stripe en test).
set -euo pipefail
REF="${1:-HEAD}"
CLAVE="${JDLQ10_SSH_KEY:-C:/Users/jdlq1/Desktop/jdlq10_server/SSH_privada_jdlq10.key}"
VPS="ubuntu@143.47.33.174"
WEB="/opt/stacks/caddy/static/padel-beta"
URL="https://padel-jdlq10.mywire.org/beta/"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO"
COMMIT=$(git rev-parse --short "$REF")
echo "Desplegando $REF ($COMMIT) en PRUEBAS: $URL"
TAR="${TEMP:-/tmp}/padelboard-pruebas.tar"
# Solo lo que sirve la web (mismo criterio que desplegar.sh).
git archive --format=tar -o "$TAR" "$REF" -- index.html sw.js manifest.json padel-board.html icon-*.png
scp -q -i "$CLAVE" "$TAR" "$VPS:/tmp/padelboard-pruebas.tar"
ssh -i "$CLAVE" "$VPS" "
set -e
sudo rm -rf $WEB.new && sudo mkdir -p $WEB.new
sudo tar -xf /tmp/padelboard-pruebas.tar -C $WEB.new
# Nombre distinto al instalarla en la pantalla de inicio.
sudo sed -i 's/\"name\": \"PADELBOARD\"/\"name\": \"PADELBOARD pruebas\"/; s/\"short_name\": \"PADELBOARD\"/\"short_name\": \"PB pruebas\"/' $WEB.new/manifest.json
sudo rm -rf $WEB.old; [ -d $WEB ] && sudo mv $WEB $WEB.old; sudo mv $WEB.new $WEB
sudo rm -rf $WEB.old /tmp/padelboard-pruebas.tar
"
rm -f "$TAR"
echo "Comprobando:"
echo "   página    $(curl -s -o /dev/null -w '%{http_code}' $URL)"
echo "   $(curl -s ${URL}sw.js | grep -m1 'const CACHE')"
echo "   manifest  $(curl -s ${URL}manifest.json | grep -o '"short_name": "[^"]*"')"
echo "Listo: abre $URL en el móvil."
