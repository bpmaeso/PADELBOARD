# Iconos F4 — Ilustrado moderno

Familia de 6 conceptos en estilo **flat 2D con personalidad** (referencias: Linear, Notion, Arc, Raycast). Todos comparten:

- viewBox `512x512` con esquinas redondeadas (`rx=96`).
- Safe-zone interior ~80% (composicion centrada con margenes).
- Gradientes lineales/radiales sutiles en `<defs>` para dar dimension sin caer en skeumorphism.
- Combinacion stroke + fill para legibilidad a tamano pequeno.
- Paleta vibrante pero refinada (azules profundos, verdes pista, magentas, amarillos calidos, cian electrico).

## Conceptos

| # | Fichero | Idea | Paleta dominante |
|---|---------|------|------------------|
| 1 | `concepto-1.svg` | Pista de padel en **perspectiva isometrica** + flecha de jugada en arco amarillo | Azul nocturno + verde pista + amarillo ambar |
| 2 | `concepto-2.svg` | **Bola de padel** con highlight, sombra suave y 3 lineas de movimiento | Cian profundo + amarillo-verde lima |
| 3 | `concepto-3.svg` | **Pala frontal** estilo "Apple icon" con grip texturizado, capuchon amarillo y patron de agujeros | Indigo nocturno + magenta-rosa |
| 4 | `concepto-4.svg` | **Tablero tactico** (pizarra) con pista dibujada en tiza + trayectoria punteada + lapiz diagonal | Slate oscuro + verde pizarra + ambar lapiz |
| 5 | `concepto-5.svg` | **Trofeo dorado** con estrella + bola de padel en la base (gamificacion / matches ganados) | Marron-burdeos + dorado calido + verde lima |
| 6 | `concepto-6.svg` | **Avatar jugador** en silueta blanca sobre disco morado con pala cian detras (estilo "team icon") | Violeta-indigo + cian electrico + blanco |

## Validacion rapida

```bash
# Abrir todos en navegador
start docs/icono-concepts-f4-ilustrado/concepto-1.svg
# ...
```

Validar a 48 px: cada concepto debe seguir siendo reconocible (una idea por icono).

## Siguiente paso

Borja elige favorito(s); luego generamos exports PNG 192/512 + maskable para integrar en `manifest.webmanifest`.
