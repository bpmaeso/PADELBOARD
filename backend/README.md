# PADELBOARD — Backend (cuentas + pago único Pro)

Backend de cuentas y desbloqueo **Pro** (pago único, no suscripción) montado sobre
**PocketBase** en el VPS `jdlq10`, detrás de Caddy.

## Arquitectura

```
App (padel-jdlq10.mywire.org)
        │  /api/*  (mismo dominio → sin CORS)
        ▼
     Caddy  ──reverse_proxy──►  pocketbase:8090   (red caddy_net)
                                   │
                     ┌─────────────┴──────────────┐
                     │ users (auth, registro público)
                     │ entitlements (pro, solo servidor escribe)
                     │ hooks: /api/pro/* (Stripe)
                     └────────────────────────────┘
```

- **PocketBase** vive en `/opt/stacks/pocketbase/` (stack Docker propio, red `caddy_net`).
- Se expone en **`https://padel-jdlq10.mywire.org/api/`** (bloque `padel` del Caddyfile,
  `handle /api/* → reverse_proxy pocketbase:8090`). La UI admin (`/_/`) **no** se expone
  públicamente (acceso por túnel SSH cuando haga falta).
- Versión PocketBase: **0.39.5** (imagen `ghcr.io/muchobien/pocketbase`).

## Colecciones

- **`users`** (auth): cuentas de usuario. Registro público permitido. Cada usuario solo
  ve/edita su propio registro.
- **`entitlements`** (base): el estado Pro.
  - `user` (relación → users, único), `pro` (bool), `source`, `stripe_session`.
  - **Reglas**: el usuario **lee** su propio entitlement; `create/update/delete = solo
    servidor** (superadmin/hooks). Así el Pro **no se puede falsear desde el cliente** y es
    **revocable** por el admin.

## Endpoints (hooks, `pb_hooks/main.pb.js`)

- `GET  /api/pro/ping` — comprobación.
- `POST /api/pro/checkout` (requiere sesión) — crea una **Stripe Checkout Session**
  (`mode=payment`, pago único) y devuelve `{ url }` para redirigir al pago.
- `POST /api/pro/webhook` — Stripe avisa del pago (`checkout.session.completed`) y el hook
  marca `entitlements.pro = true` para ese usuario.

## Stripe

- Modo **prueba** (claves `*_test_*`). Producto "PADELBOARD Pro" creado.
- Webhook registrado: `https://padel-jdlq10.mywire.org/api/pro/webhook`
  (`checkout.session.completed`).
- Precio actual: **placeholder 9,99 €** en el hook (`unit_amount=999`). Cambiar al definitivo.

## Gestión

- **Panel admin PocketBase**: `jdlq10@outlook.com` (contraseña en el gestor de Borja).
  Acceso a la UI: túnel `ssh -L 8090:pocketbase:8090 …` y abrir `http://localhost:8090/_/`.
- **Revocar Pro a un usuario**: en la colección `entitlements`, poner su `pro = false`
  (o borrar el registro). Efecto inmediato la próxima vez que su app consulte.
- **Ver quién es Pro**: colección `entitlements` filtrando `pro = true`.

## Pendiente antes de producción (cobrar de verdad)

- [ ] **Verificar la firma** del webhook (`Stripe-Signature` con `STRIPE_WEBHOOK_SECRET`).
      Ahora el webhook acepta sin verificar (vale para pruebas, NO para real).
- [ ] Fijar el **precio definitivo**.
- [ ] Claves **de producción** de Stripe (nunca por chat; directas en el `.env` del VPS).
- [ ] Activar la cuenta de Stripe (datos fiscales) + IVA (Stripe Tax) si aplica.
- [ ] Acceso admin seguro si se quiere exponer la UI (`/_/`) con protección.

## Ficheros

- `pocketbase/compose.yaml` — stack Docker (copia del que corre en el VPS).
- `pocketbase/pb_hooks/main.pb.js` — endpoints de pago.
- `.env.example` — plantilla de variables (el `.env` real vive solo en el VPS).
