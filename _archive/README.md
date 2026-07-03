# _archive — funciones retiradas (no borradas)

Aquí vive lo que se retira de la app **a propósito**, conservándolo por si se
recupera. No es lo mismo que `_legacy/` (predecesores históricos de la app).

## `padel-3d.html` — Pizarra 3D (Three.js)

- **Archivado:** 2026-07-03, rama `feature/reorg-freemium`.
- **Motivo:** Borja descarta la vista 3D; la app se centra en la pizarra 2D
  (Gratis + Pro).
- **Qué era:** vista tridimensional de la pista con Three.js (r128) — rotación
  libre, cámaras y jugadores. Era una función Pro (integrada en el PR #14).
- **Cómo se enganchaba a la app:**
  - `index.html` → tarjeta del home con `onclick="location.href='padel-3d.html'"`.
  - `sw.js` → entrada `'./padel-3d.html'` en `CORE` + precache de `THREE_URL`
    (Three.js por CDN).
- **Para restaurarla:** devolver el fichero a la raíz, volver a añadir la tarjeta
  en el home y las dos entradas en `sw.js`, y subir la versión de caché del SW.
