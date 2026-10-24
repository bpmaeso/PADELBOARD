# Iconos F3 — Tipográfico / Monograma

Familia F3 de iconos para PADELBOARD donde la **letra es el elemento principal**
y el detalle de pádel (red, bola, raqueta) actúa como acento secundario.

## Reglas comunes

- `viewBox="0 0 512 512"`, fondo cuadrado con `rx="96"` (esquinas redondeadas).
- Safe-zone maskable al 80% (margen 10% — todo lo importante vive entre 52 y 460).
- Letras dibujadas con `<path>` y `<rect>`, sin `<text>`, para que sean
  independientes del font del sistema.
- Máximo 3 colores por icono. Gradientes lineales/radiales sutiles declarados
  en `<defs>`.
- Pensados para ser reconocibles a 48 px.

## Conceptos

| # | Fichero | Descripción |
|---|---|---|
| 1 | `concepto-1.svg` | "P" mayúscula bold blanca sobre azul, con la **barra horizontal estilizada como red de pádel** (marcos dorados + líneas verticales blancas). |
| 2 | `concepto-2.svg` | Monograma **"PB" entrelazado** (Padelboard / Pérez-Maeso) en azul marino con P blanca y B dorada cruzándose en el centro. Bolita dorada como detalle inferior. |
| 3 | `concepto-3.svg` | **"P."** sobre verde pista, donde el punto es una **pelota amarilla** con costura tipo pádel. Tipografía geométrica condensada. |
| 4 | `concepto-4.svg` | Dos **"P" espejadas** (Pizarra Pádel) sobre violeta-azul, con una **bola amarilla en el eje de simetría** como punto focal. |
| 5 | `concepto-5.svg` | **"p" minúscula redonda** sobre azul. La cabeza circular evoca el aro de una raqueta con cuerdas sutiles; la barra inferior se prolonga como **mango con grip amarillo**. |
| 6 | `concepto-6.svg` | **"PB" gruesa en negativo** (letras blancas caladas sobre azul vibrante), con una **bolita amarilla** como apoyo tipográfico junto a la base de la B. |

## Cómo previsualizar

Abrir cualquier `.svg` en navegador o arrastrarlo a Figma/Inkscape.
Para validar a 48 px (tamaño icono móvil), reducir el zoom o exportar PNG 48×48.

## Cómo elegir candidato

1. Probar los 6 a 48 px y a 192 px (manifest).
2. Filtrar los que pierden legibilidad en pequeño.
3. Decidir entre **monograma serio** (2, 6) o **icono con guiño deportivo** (1, 3, 4, 5).
4. Validar contraste en tema claro y oscuro de iOS/Android.
