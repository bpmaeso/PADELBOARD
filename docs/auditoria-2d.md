# Auditoría exhaustiva — Pizarra 2D

> Fecha: 2026-05-29.
> Auditoría realizada por agente automatizado, análisis estático de `index.html` v13.

## Resumen ejecutivo

La pizarra 2D de PADELBOARD está funcional pero tiene varios bugs reproducibles que se notan en uso normal, además de huecos serios para el pivote freemium.

- **3 críticos**
- **8 altos**
- **9 medios**
- **7 bajos**

**Recomendación**: NO publicar como gratuita hasta resolver al menos críticos y altos.

---

## Bugs detectados — Críticos

1. **Gate Pro inexistente**: cards "PRO" en HOME (líneas 235, 243, 251 de `index.html`) llaman a `openGenerator()` / `openSequence()` / `openBoards()` sin pasar por `showPro()`. El modal existe (líneas 263-278) pero nadie lo invoca.
2. **`resizeBoard` rompe zoom y centra fichas mal al rotar**: `PX=0; PY=0; ZM=1` en `orientationchange`. Si hay trazo en curso, el `live` queda descolocado.
3. **Secuencia colgada al borrar último frame durante reproducción**: `seqDelFrame` (línea 1052) no detiene `SEQ.playing` ni el `rAF`; `step()` accede a `SEQ.frames[seg+1]` inexistente → `TypeError`.

---

## Bugs detectados — Altos

4. **Pinch → wipe sin levantar dedos**: 3 dedos → levantar uno deja `S.wipe` "muerto" hasta soltar todo.
5. **`clampPan` / `fitCourt` divide por `SC=0`** con viewport extremo.
6. **Captura PNG con resolución dependiente del dispositivo** (móvil pequeño → PNG diminuto).
7. **Trazos con un solo punto se pierden silenciosamente** (`length > 1` estricto).
8. **`eraseAt` no interpola entre `pointermove`** → la goma falla a velocidad alta.
9. **La goma no borra trazos bajo fichas visualmente** aunque sí los borre realmente.
10. **`boardsLoad` hace `Object.assign(courtConfig, b.court)` sin persistir** → estado inconsistente al recargar.
11. **`seqApplyFrame` no maneja frames con distinto número de fichas** que el set actual.

---

## Bugs detectados — Medios

12. `pointermove` sin botón pulsado dispara `preventDefault` y bloquea scroll de hover.
13. Sin gestión de `QuotaExceededError`: catch silencioso en `boardsSet`, `seqSave`, `saveCourtConfig`.
14. `boardsAll` no valida la estructura JSON entrada por entrada.
15. `seqAddFrame` no limita el número de frames → riesgo de storage lleno.
16. El modo inmersivo no oculta el cursor `crosshair` en escritorio.
17. `touchmove` global con `preventDefault` aunque haya un input enfocado.
18. `boardsRender` escapa `name` pero no los contadores.
19. Botones `.tb` de 30 × 34 px (< 44 px Apple HIG).
20. SW sigue cacheando `padel-3d.html` si se pivota; `THREE_URL` es CDN externo.

---

## Bugs detectados — Bajos

21. `seqSpeed` no aplica hasta el siguiente frame.
22. Doble pinch rápido pierde el primer pinch.
23. Sin botón de reset de fichas.
24. Tap fuera del modal Pro no cierra.
25. Sin feedback al perder zoom en rotación.
26. Iconos PWA *maskable* sin safe-zone → recorte en Android.
27. `padel-board.html` (legado) sigue en `CORE` del SW.

---

## Edge cases sin manejar

- `localStorage` lleno: error silencioso en 3 sitios.
- JSON corrupto entrada-a-entrada en pizarras guardadas.
- Cargar pizarra con IDs de ficha inexistentes.
- Generador de pista con valores extremos: el clamp interno no refleja en el slider UI.
- Cambio de herramienta a mitad de trazo (improbable hoy, pero defensivamente).
- 3 dedos durante línea / flecha deja `live` residual hasta el siguiente `draw`.
- Pinch durante rectángulo a punto de cerrar pierde el rectángulo sin aviso.
- iOS Safari notch + `safe-area-inset` NO aplicados.
- Doble-tap accidental en canvas → dos `pointerdown`.
- SW v13 → v14 no invalida `FONT_CACHE` (intencional pero documentar).
- Caddy `try_files` devuelve `index.html` con *content-type* incorrecto en assets inexistentes.

---

## Mejoras sugeridas (no bloqueantes)

- Undo / redo.
- Auto-save.
- Botón de reset de fichas.
- Indicador de modo *wipe*.
- Snap de líneas a 0 / 45 / 90 grados.
- ARIA.
- Contraste de botones inactivos (3.0:1 falla WCAG AA).
- Tamaño táctil ≥ 44 px.
- Foco visible.
- Tap fuera del modal lo cierra.
- PNG con resolución fija.
- Export / import de secuencia en JSON.

---

## Recomendación final

Antes de publicar la versión gratuita, arreglar **sí o sí**:

- Los **3 críticos**.
- Los **altos 4, 5, 8, 10**.
- Edge cases: `localStorage` lleno + `safe-area-inset` iOS + tamaño táctil ≥ 40 px.
