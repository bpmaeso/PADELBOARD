# Iconos F7 - Paletas alternativas

Mismo concepto base ("bola amarilla en cuadrante de pista cenital esquematizada") aplicado a 6 paletas para evaluar cuál resuena mejor con la marca PadelBoard.

## Concepto base (fijo en los 6)

- viewBox 512x512, esquinas rx=96.
- Pista cenital simplificada: rectangulo exterior (256x368), linea central horizontal, dos lineas de saque y eje vertical de servicio.
- Bola en el cuadrante superior-izquierdo (zona de saque).
- Safe-zone ~80% (margen 51 px aprox.).
- Solo cambia paleta y color de la bola entre versiones.

## Tabla de paletas

| # | Nombre            | Fichero               | Fondo     | Lineas pista | Bola      | Tono / lectura                              |
|---|-------------------|-----------------------|-----------|--------------|-----------|---------------------------------------------|
| 1 | Azul mar          | `azul-mar.svg`        | `#0b2545` | `#ffffff`    | `#f5e85a` | Deportivo, serio, marino. Apuesta segura.   |
| 2 | Verde cesped      | `verde-cesped.svg`    | `#1f6b3a` | `#fffbea`    | `#ffffff` | Natural, club, evoca cancha al aire libre.  |
| 3 | Naranja energia   | `naranja-energia.svg` | `#ff6b35` | `#ffffff`    | `#0a0b0e` | Vibrante, joven, alta visibilidad en home.  |
| 4 | Rosa fluor        | `rosa-fluor.svg`      | `#ff3d80` | `#ffffff`    | `#f5e85a` | Moderno, padel-femenino, descarado.         |
| 5 | Negro elegante    | `negro-elegante.svg`  | `#0a0b0e` | `#c2a25b`    | `#c2a25b` | Premium, oro/negro, version Pro.            |
| 6 | Blanco minimal    | `blanco-minimal.svg`  | `#ffffff` | `#0a1d4a`    | `#f5e85a` | Limpio, editorial, encaja en iOS claros.    |

## Notas para la decision

- En las paletas con fondo claro (Blanco minimal) o muy saturado (Rosa, Naranja), la bola lleva un fino borde para garantizar contraste y que no se "funda" con el fondo.
- En "Negro elegante" la bola es dorada para mantener una paleta bicolor (negro + dorado) coherente con la lectura premium.
- En "Verde cesped" la bola se vuelve blanca: contra el verde, una bola amarilla pierde lectura; el blanco evoca ademas la pelota oficial.
- Las paletas 1, 4 y 6 conservan la bola amarilla canonica; son las que mejor reflejan el concepto "padel" inmediato.
