# Iconos F5 — Realista / Dimensional

Conjunto de 6 conceptos de icono para PADELBOARD en estilo **skeumorfismo contemporáneo** (volumen, gradientes combinados, luces y sombras suaves, proporciones realistas). Inspirado en la estética de iconos premium de iOS.

Todos los SVG comparten:

- `viewBox="0 0 512 512"` con esquinas redondeadas `rx=96`.
- Safe-zone aproximada del 80 % (el sujeto principal vive dentro de un cuadrado central de ~410 px).
- Sombras y luces simuladas con `<linearGradient>` y `<radialGradient>` (sin `feDropShadow`, máxima compatibilidad iOS/Android/PWA).
- Máximo 4 paradas por gradiente.
- Sin texto innecesario (excepto la placa del trofeo, que es decoración del propio objeto).

## Conceptos

| # | Fichero | Concepto |
|---|---|---|
| 1 | `concepto-1.svg` | Pala de pádel en ángulo 3/4 con grip texturado, agujeros con profundidad y sombra proyectada. Cuerpo cálido naranja-rojo sobre fondo navy. |
| 2 | `concepto-2.svg` | Bola amarilla esférica con sombreado real, costuras blancas curvas, pelusa de fieltro y sombra de contacto. Fondo verde oscuro (color de pista). |
| 3 | `concepto-3.svg` | Pista de pádel en perspectiva 3D, suelo azul, cristales traslúcidos laterales y de fondo, red con malla, marcos metálicos. |
| 4 | `concepto-4.svg` | Pizarra negra con marco de madera vetada y media pista dibujada a tiza, jugadas tácticas con flecha, polvo de tiza y bandeja con tiza. |
| 5 | `concepto-5.svg` | Trofeo dorado con asas curvas, anillos brillantes, estrella central y base de mármol con placa "PADEL". Resplandor radial detrás. |
| 6 | `concepto-6.svg` | Mano estilizada agarrando una pala azul (dedos envolviendo el grip, pulgar curvado). Vista frontal dimensional. |

## Recomendaciones de uso

- **App icon principal (1024 px)**: cualquiera renderiza nítido. El más legible a 48 px sigue siendo el 2 (bola) por su silueta circular y contraste; el 5 (trofeo) también funciona bien por la masa central dorada.
- **Pruebas obligatorias**: previsualizar en 1024 / 192 / 48 px y comprobar contraste contra wallpapers claros y oscuros del iPhone de Borja.
- **Manifest PWA**: usar la versión elegida como `any` y `maskable` (el `rx=96` ya cubre la safe-zone para máscaras circulares de Android).

## Notas técnicas

- Los iconos usan solo primitivas SVG estándar (`rect`, `circle`, `ellipse`, `path`) y gradientes — no hay `<image>`, ni patrones bitmap, ni filtros pesados.
- Peso aproximado por SVG: 4-8 KB, perfectamente cacheable por el service worker.
- Si Borja elige uno para producción, conviene exportarlo a PNG en 192/512/1024 con un script aparte (por ejemplo `resvg` o `sharp`) para evitar pintar SVG en runtime cuando el sistema pida bitmaps.
