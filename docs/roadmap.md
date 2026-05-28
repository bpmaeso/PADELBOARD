# Padel PWA — roadmap

> Última actualización: 2026-05-29.

## Hecho ✅

- **Pizarra 2D**: pista realista (cristal con juntas, reja, puerta, líneas oficiales), 8 herramientas, 6 colores, 3 grosores, 4 fichas arrastrables, goma fina + **borrador 3 dedos**, zoom/paneo con clamp, captura PNG, barra compacta agrupada, orientación fijada en vertical con letras que rotan.
- **Generador de pista**: edición de colores/medidas, vista previa, "usar en pizarra", export SVG.
- **Generador de secuencias**: frames, reproducción animada (velocidad/bucle) + **pantalla completa** inmersiva.
- **Mis pizarras**: guardar/cargar/borrar jugadas (localStorage).
- **Pizarra 3D**: visor Three.js con cámaras (en modo **mantenimiento, sin nuevo desarrollo** — ver pivote freemium).
- **PWA/SW**: offline-first (app + fuentes + Three.js), SW v13.
- **Documentación**: `arquitectura.md`, `desarrollo.md`, `publicacion-monetizacion.md`, `auditoria-2d.md`.

## Pivote freemium (en curso) 🎯

Borja pivota a un **modelo freemium 2D**, aparcando el desarrollo 3D. La 3D queda como función Pro **mantenida pero sin nuevo desarrollo**.

### Reparto Gratis vs Pro

| Aspecto | **Gratis** | **Pro** *(precio por decidir)* |
|---|---|---|
| Tema de pista | Fondo **blanco**, líneas **azul oscuro** | Tema realista actual (cristal, reja, puerta, etc.) |
| Lápiz libre | Sí — **negro fijo**, **1 grosor** | Sí + **6 colores** y **3 grosores** |
| Goma (1 dedo) | Sí | Sí |
| Borrador 3 dedos | Sí | Sí |
| Fichas arrastrables | 4 | 4 |
| Captura PNG | Sí | Sí |
| Vaciar | Sí | Sí |
| Herramientas extra | — | **7**: lápiz discontinuo, línea, flecha, rectángulo, punto, cruz *(la 8ª es la goma, ya en Gratis)* |
| Generador de pista | — | Sí |
| Generador de secuencias | — | Sí |
| Mis pizarras | — | Sí |
| **Pizarra 3D** | — | Sí (**mantenimiento, sin nuevo desarrollo**) |

### Comportamiento en HOME

- El botón **"Pizarra 3D"** se mantiene en HOME, pero al pulsarlo abre el **paywall Pro**.
- Igual que el resto de cards Pro (Generador de pista, Generador de secuencias, Mis pizarras), todas deben pasar por `showPro()` antes de abrir su pantalla.

### Tareas del pivote

- [ ] **Gate Pro en código**: cards Pro de HOME (incluida "Pizarra 3D") deben invocar `showPro()` antes de `openGenerator()` / `openSequence()` / `openBoards()` / navegar a `padel-3d.html`. Ver bug crítico #1 en `docs/auditoria-2d.md`.
- [ ] **Tema Gratis 2D**: pista blanca + líneas azul oscuro como tema por defecto en Gratis; tema realista bloqueado tras paywall.
- [ ] **Herramientas/colores/grosores en Gratis**: limitar a lápiz libre (negro, 1 grosor) + goma + borrador 3 dedos. Las 7 herramientas extra y la paleta completa quedan gated.
- [ ] **Tutorial onboarding 4-5 slides** dentro de la app: pintar, borrar con 3 dedos, ampliar/pinch, guardar captura. Mostrar solo en primer arranque (flag en `localStorage`).
- [ ] **Icono definitivo + favicon** (en marcha en otro agente). Maskable con safe-zone correcta para Android.
- [ ] **Auditoría 2D**: resolver críticos + altos prioritarios antes de publicar gratis (ver `docs/auditoria-2d.md`).

## Inmediato (pendiente de Borja)

- [ ] **Pruebas reales en iPhone/tablet** del set Gratis tras aplicar el pivote (sobre todo: borrador 3 dedos, sliders táctiles, gestos zoom).
- [ ] **Decisiones de producto/negocio** para publicar y monetizar → ver `docs/publicacion-monetizacion.md` (cuentas Apple/Google/Stripe, **precio Pro**, branding, política de privacidad + términos).
- [ ] **Logo y favicon definitivos** (hoy placeholder; ver tarea de icono dentro del pivote).

## Producto — siguientes (cuando Borja decida)

- [ ] **Login / cuentas de usuario** (auth propia en VPS / PocketBase; "Sign in with Apple" obligatorio en iOS si hay social login).
- [ ] **Suscripción Pro** y *paywall* real (Stripe en web; RevenueCat + IAP al entrar en tiendas). Hoy `showPro()` es solo modal informativo.
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
- **3D**: solo mantenimiento. No se desarrolla nada nuevo sobre `padel-3d.html` hasta nueva orden.
