# Padel PWA — roadmap

> Última actualización: 2026-05-21.

## Hecho ✅

- **Pizarra 2D** (Gratis): pista realista (cristal con juntas, reja, puerta, líneas oficiales), 8 herramientas, 6 colores, 3 grosores, 4 fichas arrastrables, goma fina + **borrador 3 dedos**, zoom/paneo con clamp, captura PNG, barra compacta agrupada, orientación fijada en vertical con letras que rotan.
- **Generador de pista** (Pro): edición de colores/medidas, vista previa, "usar en pizarra", export SVG.
- **Generador de secuencias** (Pro): frames, reproducción animada (velocidad/bucle) + **pantalla completa** inmersiva.
- **Mis pizarras** (Pro): guardar/cargar/borrar jugadas (localStorage).
- **Pizarra 3D** (Pro): visor Three.js con cámaras.
- **PWA/SW**: offline-first (app + fuentes + Three.js), SW v13.
- **Documentación**: `arquitectura.md`, `desarrollo.md`, `publicacion-monetizacion.md`.

## Inmediato (pendiente de Borja)

- [ ] **Pruebas reales en iPhone/tablet** de todas las funciones (sobre todo: borrador 3 dedos, sliders táctiles, rendimiento 3D, gestos zoom).
- [ ] **Decisiones de producto/negocio** para publicar y monetizar → ver `docs/publicacion-monetizacion.md` (cuentas Apple/Google/Stripe, precio Pro, branding, política de privacidad + términos).
- [ ] **Logo y favicon definitivos** (hoy placeholder).

## Producto — siguientes (cuando Borja decida)

- [ ] **Login / cuentas de usuario** (auth propia en VPS / PocketBase; "Sign in with Apple" obligatorio en iOS si hay social login).
- [ ] **Suscripción Pro** y *paywall* (Stripe en web; RevenueCat + IAP al entrar en tiendas).
- [ ] **Publicación**: PWA web primero → Play Store (TWA) → App Store (Capacitor).
- [ ] **Sincronización en la nube** de pizarras y secuencias (hoy solo localStorage del dispositivo).
- [ ] **Exportar vídeo** de las secuencias (hoy solo reproducción en pantalla; export MP4/GIF pendiente).
- [ ] **Añadir/quitar fichas** (más jugadores, pelota, numeración) — hoy son 4 fijas.

## Backlog

- [ ] Histórico de partidos + estadísticas. Modo torneo round-robin. Compartir (Web Share API).
- [ ] Notificaciones push. Internacionalización (ES/EN). Dark/light según `prefers-color-scheme`.
- [ ] CI en GitHub Actions (lint + Lighthouse + deploy automático al merge en `main`).

## No-go (decisiones firmes)

- No frameworks (React/Vue/Angular) salvo necesidad demostrada. No backend pesado (valorar PocketBase/Supabase autoalojado antes que algo complejo). No telemetría de terceros. No anuncios.
