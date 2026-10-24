# Iconos F6 — Táctico / Estratega

Seis conceptos de icono para PADELBOARD orientados a **estrategia y táctica**, no al deporte como tal. La PWA es una pizarra para diseñar jugadas: estos iconos lo comunican.

## Lenguaje visual común

- **viewBox**: 512×512, esquinas `rx=96` (estilo iOS/Android adaptable).
- **Safe-zone**: contenido principal dentro del 80% central (52–460 px aprox.).
- **Paleta** (máx. 3 colores por icono):
  - Azul oscuro táctico `#0F1E3A` (fondo pizarra) / variante `#0B1530` (concepto 4).
  - Rojo equipo `#EF4444` (X, marcas de jugador rival, énfasis).
  - Amarillo táctico `#FACC15` (pelota, trazado de jugada, símbolos).
  - Blanco `#FFFFFF` (líneas de pista, fichas O, tiza).
- **Trazo**: linecap/linejoin `round` para sensación de rotulador/tiza.
- **Flechas**: definidas como `<marker>` reutilizable para que escalen limpias.

## Conceptos

### `concepto-1.svg` — Pista cenital con jugada
Vista aérea de la pista de pádel con sus líneas (perímetro, red discontinua, líneas de saque, central). Dos fichas azules (O) arriba, dos rojas (X) abajo y una **flecha amarilla curva** marcando el movimiento de la jugada. El más literal: "diseñar puntos sobre la pista".

### `concepto-2.svg` — Flecha protagonista + mini pista
Una **flecha amarilla enorme en forma de S** ocupa el centro como gesto principal del playbook. En la esquina inferior izquierda, una mini pista anclada y un punto rojo indica el origen del movimiento. Reconocible de un vistazo incluso a 32×32.

### `concepto-3.svg` — Playbook con flechas cruzadas
Cuatro jugadores (O blancas arriba, X rojas abajo) sobre cuadrícula sutil. **Tres flechas tácticas** se cruzan: amarilla, blanca y dos rojas de apoyo punteadas. Estética "playbook complejo" de entrenador NBA.

### `concepto-4.svg` — Pizarra de entrenador con tiza
Fondo pizarra con marco amarillo tipo marco de aula. Un **trazo blanco de tiza** dibuja una línea estratégica desde una X roja hasta una pelota amarilla. Manchas de tiza borrada añaden textura. El más "humano" y narrativo.

### `concepto-5.svg` — Triángulo de formación
Tres fichas O conectadas formando un **triángulo amarillo** con líneas internas rojas discontinuas (relaciones tácticas) y numeradas 1-2-3. Estética de diagrama de pizarra de entrenador, muy geométrico y legible.

### `concepto-6.svg` — Set play (emblema abstracto)
Una **X roja enorme** centrada (jugador clave) envuelta por una **flecha amarilla en arco** dentro de un anillo discontinuo. Funciona como sello/insignia de "set play". El más abstracto y memorable como icono de app.

## Cómo elegir

| Si buscas… | Mira… |
|---|---|
| Literal y descriptivo | 1 |
| Icónico y limpio a tamaño app | 2, 6 |
| Sensación de "playbook complejo" | 3 |
| Calidez/humanidad de entrenador | 4 |
| Esquema geométrico claro | 5 |

Todos cumplen el contrato técnico (viewBox 512×512, rx=96, safe-zone ≤80%, ≤3 colores) y son válidos para exportar a PNG en tamaños PWA (192, 512, maskable).
