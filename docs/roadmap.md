# Padel PWA — roadmap

## Inmediato (este sprint)

- [ ] **Pruebas reales móvil/tablet por Borja** — único pendiente formal del PR#1 ya mergeado. Cuando confirme, cerrar bloqueo en ECOSYSTEM_STATE.
- [ ] **CI mínima en GitHub Actions**: lint + build + Lighthouse en cada PR. Despliegue automático al merge en `main` (workflow `deploy.yml` con SSH al VPS).
- [ ] **Logo y favicon definitivos** — actualmente probable placeholder. Cuando lleguen los assets de Design, sustituir.

## Próximo (1-2 sprints)

- [ ] **Histórico de partidos** persistente en IndexedDB.
- [ ] **Estadísticas**: gráfica de victorias/derrotas por jugador y emparejamiento.
- [ ] **Modo "torneo round-robin"** para 4-8 jugadores con generación automática de cruces.
- [ ] **Compartir resultados** vía Web Share API + screenshot generado en cliente.

## Backlog

- [ ] **Sincronización multi-dispositivo** (decidir backend: Forgejo OAuth + endpoint propio en VPS vs. servicio comercial).
- [ ] **Notificaciones push** para recordar partido programado (Web Push API + service worker push).
- [ ] **Modo entrenador**: análisis de rendimiento por jugador, sugerencias.
- [ ] **Internacionalización**: castellano nativo, inglés para difusión.
- [ ] **Dark mode** sincronizado con `prefers-color-scheme`.

## Cuando entra Design

Trigger: Borja diga "vamos a hacer un rediseño". Entonces:

1. Abrir Project paralelo en **Design**: `Padel PWA — sistema visual`.
2. Crear: paleta, tipografía, sistema de componentes (botones, cards, inputs, modales), iconografía, ilustraciones de marca, mockups por pantalla.
3. Exportar a CSS variables + SVG sprites + componentes.
4. Volver a Code: implementar la nueva UI según specs.
5. PR de "refresh visual v2" con previews antes/después.

Mientras tanto, mantener UI minimalista y funcional. No invertir en UI bonita que se va a tirar.

## No-go (decisiones firmes)

- No introducir React/Vue/Angular salvo necesidad demostrada.
- No backend pesado: si crece, valorar Pocketbase o Supabase autohospedado en VPS antes que algo más complejo.
- No telemetría de terceros.
- No anuncios.
