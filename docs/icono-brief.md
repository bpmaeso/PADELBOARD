# Brief del icono definitivo — Pizarra Pádel

> Documento de trabajo para reemplazar los iconos placeholder actuales (`icon-192.png`,
> `icon-512.png`) por un icono definitivo. Se mantienen 5 conceptos finalistas, se
> recomienda uno y se documenta el camino de rasterizado para producir los PNG.

## Contexto y briefing

- **Nombre**: "Pizarra Pádel" (short_name: "Pádel").
- **Personalidad**: deportivo, profesional, moderno. No infantil, no agresivo.
  Inspira "estrategia" más que "juego".
- **Paleta de la app**:
  - Fondo oscuro: `#0a0b0e`
  - Theme color: `#10131a`
  - Acento azul propuesto para el icono: `#1463d6` → `#3d8bff`
  - Acento amarillo (bola): `#f7d83a`
- **Convivencia**: el icono se ve sobre home dark (iOS dock, Android launcher) y en
  splash screen oscuro. No tiene que ser oscuro, pero no debe vibrar visualmente
  contra `#0a0b0e`.

## Reglas técnicas que cumplen todos los SVGs

- Viewport 512×512, esquinas redondeadas `rx=96` (24% del lado) para imitar el
  recorte por defecto que aplican los launchers.
- **Safe-zone maskable**: todo elemento informativo cae dentro del círculo de radio
  ~205 centrado en (256, 256), es decir 10% de margen por lado. Android adaptive
  icons recortan a círculo, supershape o squircle según launcher — esto es seguro.
- Trazos mínimos a 192 px renderizado (mínimo ~4 px en viewBox 512, o sea
  `stroke-width >= 6` en el SVG → ~2 px en 192 px reales).
- Sin imágenes embebidas, sin texto largo. Máximo 1-2 letras.
- Vectorial puro: gradientes lineales/radiales y patterns simples. Funcionan en
  cualquier renderer SVG2 (Chrome/Edge/Inkscape/rsvg/ImageMagick reciente).

## Los 5 conceptos

### Concepto 1 — Pista cenital con bola

Vista cenital de una pista de pádel sobre fondo azul degradado.
Líneas blancas de pista (marco + red + líneas de servicio) y una bolita
amarilla descansando en el cuadrante de servicio superior izquierdo.

Boceto ASCII (vista en safe-zone):

```
       +-------------------+
      / +-+-------+-+     /
     / o| |       | |    /
    /   +-+-------+-+   /
   /    |             |  /
   /    |=============| /   <- red (línea central gruesa)
  /     |             |/
 /      +-+-------+-+ /
/        | |       | |/
+--------+-+-------+-+
   (azul degradado fondo, líneas blancas, bola amarilla)
```

- **Paleta**: fondo `#1e63d6 → #0d3b8c`, líneas `#ffffff`, bola `#f7d83a`.
- **Pros**: 100% inequívoco "pádel". Estilo "schematic" encaja con
  "pizarra/táctica". Lectura instantánea.
- **Contras**: a 48-72 px (notificaciones, status bar) las líneas finas se
  empastan; obliga a respetar `stroke-width` generosos. La pista cenital es
  común en apps deportivas (puede parecer genérico).

### Concepto 2 — Monograma "P" con red de pádel

La barra horizontal de la P se sustituye por un parche de malla romboidal,
referenciando la red. La curva derecha de la P sigue siendo trazo sólido azul,
y bajo ella reposa una bola amarilla como acento.

Boceto ASCII:

```
+-------------------+
| ████              |
| █  █              |
| ██████  ◢◣◢◣      |  <- la cabeza de la P contiene la red en su hueco
| █     ◢◣◢◣◢◣      |
| ██████  ◢◣◢◣      |
| █                 |
| █                 |
| █          (o)    |  <- bola amarilla
+-------------------+
```

- **Paleta**: fondo `#0a0b0e → #16223d`, glifo `#3d8bff`, red `#e9eef7`, bola
  `#f7d83a`.
- **Pros**: monograma reconocible incluso a 48 px. El truco de la red dentro
  de la P es elegante y cuenta una historia.
- **Contras**: la sutileza de la red dentro del glifo puede perderse a
  tamaños pequeños y leerse "solo una P". Requiere segundo vistazo.

### Concepto 3 — Pala cruzada con bola

Pala estilizada en silueta plana, ligeramente rotada, con su clásico patrón
perforado en el plano de golpeo. Una bola amarilla con líneas en S la
acompaña.

Boceto ASCII:

```
+-------------------+
|    ▄▄▄▄▄▄▄        |
|  ▄█▒▒▒▒▒▒█▄       |
| █▒○○○○○○○▒█      |
| █▒○○○○○○○▒█  ●●  |
| █▒○○○○○○○▒█ (●)  |  <- bola
|  ▀█▒▒▒▒▒▒█▀  ●●  |
|     ║║║║║         |
|     ║║║║║         |  <- grip con tape
|     ║║║║║         |
+-------------------+
```

- **Paleta**: fondo `#1463d6 → #0a2a66`, pala marco `#0f1218`, plano
  `#f3f6fb` con perforaciones, borde acento `#3d8bff`, bola `#f7d83a`.
- **Pros**: 100% asociado a "pádel"; la pala es el icono universal del
  deporte. Familiar.
- **Contras**: es el camino más obvio (cualquier app de pádel hace esto).
  No transmite "pizarra/táctica/estrategia". Borja podría perder
  diferenciación frente a competidores.

### Concepto 4 — Flecha táctica sobre pista — **RECOMENDADO**

Pista esquematizada al fondo en azul desaturado (baja opacidad), y por
encima una flecha curva ancha (gradiente azul→amarillo) que nace de una bola
amarilla y traza una jugada hacia la red. Es literalmente "una jugada en una
pizarra".

Boceto ASCII:

```
+-------------------+
| ┌───────────────┐ |   <- pista al fondo (baja opacidad)
| │       ╱  ─►─  │ |   <- punta de flecha amarilla
| │     ╱         │ |
| │   ╱           │ |
| │═╱═════════════│ |   <- red
| │╱              │ |
| ╱│              │ |
|(●)              │ |   <- bola origen
| │               │ |
| └───────────────┘ |
+-------------------+
```

- **Paleta**: fondo `#0a0b0e → #14213d`, pista `#5fa0ff` 32% opacidad,
  flecha gradiente `#3d8bff → #f7d83a`, bola `#f7d83a`.
- **Pros**: ÚNICO de los 5 que comunica "pizarra de jugadas" — la propuesta
  de valor exacta de la app. Combina los tres símbolos (pista, bola,
  movimiento). Visualmente distintivo frente a competidores.
- **Contras**: composición un poco más densa; requiere validar que la
  flecha+bola lean limpio a 72 px. La pista al 32% puede desaparecer a
  tamaños muy pequeños — pero esto es OK: la flecha+bola siguen contando la
  historia solas.

### Concepto 5 — Monograma "PB" geométrico

Tipografía geométrica blanca sobre azul. Las letras P y B comparten el trazo
vertical, formando un glifo sólido. Una bolita amarilla en la esquina
inferior derecha como acento de marca (Pizarra + Pádel/Borja).

Boceto ASCII:

```
+-------------------+
| ████              |
| █  █              |
| ████              |
| █                 |
| ████              |
| █  █              |
| ████        (o)   |  <- bola acento
+-------------------+
```

- **Paleta**: fondo `#1463d6 → #062055`, glifo `#ffffff`, bola `#f7d83a`.
- **Pros**: el más minimal y sereno. Legible incluso a 32 px. Premium feel.
- **Contras**: completamente abstracto, no comunica "pádel". Funciona si la
  marca ya tiene tracción; aún no.

## Recomendación

**Concepto 4 — Flecha táctica sobre pista**.

Razones:

1. Es el único que comunica los **tres pilares simultáneamente**:
   pista (pádel) + flecha (estrategia/jugada) + bola (deporte). Los otros
   eligen un solo eje.
2. Cuenta literalmente lo que hace la app: **una jugada dibujada sobre la
   pista**. Coincidencia 1:1 con el value-prop "pizarra táctica".
3. Diferenciación competitiva: el espacio de apps de pádel está saturado de
   palas+bolas (Concepto 3). Una jugada táctica sale del clúster visual.
4. Aguanta el test maskable: pista y flecha caen dentro del círculo del 80%.
5. Aguanta el test grayscale: el gradiente azul→amarillo mantiene contraste
   suficiente en escala de grises gracias a las luminancias de los stops.

Fallback recomendado si el 4 no convence en pruebas reales: **Concepto 2**
(monograma P con red) — más memorable a largo plazo cuando la marca crezca.

## Entregables incluidos en este PR

- `docs/icono-concepts/concepto-1.svg` — pista cenital + bola
- `docs/icono-concepts/concepto-2.svg` — P con red
- `docs/icono-concepts/concepto-3.svg` — pala cruzada + bola
- `docs/icono-concepts/concepto-4.svg` — flecha táctica (RECOMENDADO)
- `docs/icono-concepts/concepto-5.svg` — monograma PB
- `docs/icono-brief.md` — este documento

## NO incluido (deliberado)

- `ganador-192.png` y `ganador-512.png`: el agente no pudo rasterizar porque
  los binarios `magick`, `rsvg-convert`, `inkscape` y `msedge --headless` no
  estaban accesibles desde su sandbox de ejecución. Se documenta abajo el
  comando exacto para que Borja (o un agente con permisos elevados) los
  produzca tras elegir el concepto ganador.
- Cambios en `icon-192.png`, `icon-512.png` y `manifest.json` en raíz: se
  esperan después de validación de Borja.

## Cómo rasterizar el SVG ganador a PNG

Una vez aprobado el concepto, ejecutar desde la raíz del repo. Cualquiera de
estas tres opciones funciona; elegir la que esté disponible.

### Opción A — Microsoft Edge headless (ya instalado en SkyNET_II)

```bash
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
SVG="file:///$(pwd -W)/docs/icono-concepts/concepto-4.svg"

"$EDGE" --headless --disable-gpu --hide-scrollbars \
  --default-background-color=00000000 \
  --window-size=512,512 \
  --screenshot="docs/icono-concepts/ganador-512.png" \
  "$SVG"

"$EDGE" --headless --disable-gpu --hide-scrollbars \
  --default-background-color=00000000 \
  --window-size=192,192 \
  --screenshot="docs/icono-concepts/ganador-192.png" \
  "$SVG"
```

Edge guarda el screenshot con fondo transparente cuando se pasa
`--default-background-color=00000000`. Funciona desde Edge 90+.

### Opción B — ImageMagick (si se instala)

```bash
magick -background none -density 384 \
  docs/icono-concepts/concepto-4.svg \
  -resize 512x512 docs/icono-concepts/ganador-512.png

magick -background none -density 144 \
  docs/icono-concepts/concepto-4.svg \
  -resize 192x192 docs/icono-concepts/ganador-192.png
```

`-density` alto previene aliasing del raster intermedio. Requiere
ImageMagick compilado con delegate RSVG (las builds Windows oficiales lo
incluyen).

### Opción C — rsvg-convert (más fiel para SVG, vía MSYS2 / WSL)

```bash
rsvg-convert -w 512 -h 512 -f png \
  -o docs/icono-concepts/ganador-512.png \
  docs/icono-concepts/concepto-4.svg

rsvg-convert -w 192 -h 192 -f png \
  -o docs/icono-concepts/ganador-192.png \
  docs/icono-concepts/concepto-4.svg
```

Es el renderer más fiel para SVG2 con gradientes y patterns.

## Próximos pasos (PR de seguimiento, no este)

Cuando Borja apruebe un concepto:

1. Rasterizar a 192 y 512 con la opción que toque.
2. Reemplazar `icon-192.png` y `icon-512.png` en la raíz.
3. Revisar `manifest.json`:
   - Ya declara `purpose: "any"` y `purpose: "maskable"` con los mismos
     archivos. **Acción recomendada**: separar en dos archivos distintos —
     `icon-512-any.png` (con safe-zone propia, ocupa toda la silueta) e
     `icon-512-maskable.png` (con padding extra del 10% para Android).
   - Alternativa minimalista: mantener un solo PNG por tamaño si el diseño
     ya respeta la safe-zone maskable del 80% (los 5 conceptos cumplen).
     Es el camino actual y vale para iconos no demasiado densos.
4. Bump del `CACHE_VERSION` en `sw.js` para forzar refresco en clientes ya
   instalados.
5. Probar instalación en iPhone (Borja) y un Android de prueba: home,
   splash, share sheet y notificación.
6. Lighthouse PWA: 100/100 mantenido.
