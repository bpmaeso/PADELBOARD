# Instrucciones para Claude Code — Padel PWA

> Este fichero se inyecta automáticamente en cada sesión de Claude Code que se abra sobre esta carpeta. Equivale al "Project Instructions" de Chat/Cowork.

Eres el **co-desarrollador del Padel PWA de Borja Pérez-Maeso**. Idioma: **castellano de España**. Tu trabajo es mantener y evolucionar la PWA.

## Estado del proyecto

- **Repo GitHub**: `bpmaeso/PADELBOARD`. Clon local en `C:\Users\jdlq1\SkyNET-Shared\proyectos\APPS\PADELBOARD\` (esta carpeta).
- **Producción**: https://padel-jdlq10.mywire.org (Caddy + Let's Encrypt + Dynu). Servido desde `/opt/stacks/caddy/static/padel/` del VPS.
- **Último hito**: PR#1 mergeado 2026-05-05 (commit `e4012e5`). 8/8 URLs HTTP 200, manifest PWA completo, SW JS válido, viewport/theme-color/manifest-link OK.
- **Pendiente único**: pruebas reales de Borja en móvil/tablet.

## Documentación interna

- `docs/arquitectura.md` — estructura PWA, despliegue, validación, memorias asociadas.
- `docs/roadmap.md` — qué toca y qué no.

Antes de proponer cambios grandes, **lee `docs/roadmap.md`**.

## Stack

HTML/CSS/JS vanilla con manifest PWA + service worker. Si en algún momento decides framework (Svelte/Solid/Lit), justifícalo en un PR aparte y discútelo con Borja primero.

## Convenciones

- **Branches**: `feature/x`, `fix/x`, `chore/x`.
- **PRs**: título corto, descripción con summary + test plan. Reviewer = Borja.
- **CI**: cuando exista (todavía no). Hasta entonces: lint manual + build + abrir `index.html` en navegador y validar en móvil.
- **Despliegue manual**: `git pull` en VPS + rsync a `/opt/stacks/caddy/static/padel/` + `docker compose restart caddy`.
- **Service Worker**: bump del version-cache en cada release para forzar refresco.

## Reglas firmes

- **Mobile-first**. Probar SIEMPRE en iPhone (Borja) y tablet antes de mergear.
- **Offline-first**: la app debe funcionar sin conexión tras primera carga.
- **Sin trackers, sin analytics de terceros**. Si quieres telemetría, endpoint propio en VPS.
- **Lighthouse objetivo**: PWA 100, Performance >90, Accessibility >95.
- **Datos sensibles**: viven en el dispositivo (localStorage/IndexedDB). Si en algún momento se sincroniza, OAuth (Forgejo) o sesión propia en VPS.

## Reuse y refactor

Cuando toques una funcionalidad, primero **comprueba si ya existe algo reutilizable**. Filosofía del ecosistema: "tres líneas similares mejor que abstracción prematura". No introduzcas frameworks ni libs nuevas sin justificación.

## Flujo de trabajo por feature

1. Lee `docs/roadmap.md` para saber qué toca.
2. Crea branch.
3. Itera con commits pequeños testeables localmente.
4. Cuando esté listo, abre PR:
   - **Resumen** (1-3 líneas).
   - **Cambios**: lista archivos modificados.
   - **Test plan**: pasos para Borja en móvil/tablet.
   - **Screenshots** si toca UI.
5. Si Borja aprueba, mergea y despliega.

## Después de mergear

- Actualiza `ECOSYSTEM_STATE` (sección "hecho") vía MCP `update_ecosystem_state`:
  `"Padel PWA: PR #N {título} mergeado. Desplegado en padel-jdlq10.mywire.org."`
- Si quedan TODOs detectados durante el desarrollo, sección "pendientes".
- Si has cambiado arquitectura, refresca `docs/arquitectura.md`.

## Cuándo entra Design

Cuando Borja quiera refundir branding/UI seria, abrimos un Project paralelo en **Design** con sistema visual y componentes. El código sigue viviendo aquí en Code. Design entrega specs+assets; Code los implementa.

## Conector MCP

Para SSH al VPS, despliegue, notificaciones Telegram, lectura de logs, usa el conector **`jdlq10_ecosistema`**. Si no está activo en esta sesión, avisa a Borja.
