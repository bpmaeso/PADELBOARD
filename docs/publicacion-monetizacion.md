# Plan de publicación y monetización — Pizarra Pádel

> ⚠️ **ACTUALIZACIÓN 2026-07-03 — Decisión de Borja:** el modelo es **PAGO ÚNICO**
> (una sola compra desbloquea Pro para siempre), **NO suscripción**. Todo lo que este
> documento dice sobre suscripción mensual/anual, RevenueCat, renovaciones, *grace
> periods* y `expires_at` queda **sustituido** por: un pago único (Stripe `mode: payment`
> en web; **IAP no consumible** en tiendas) y un *entitlement* Pro booleano y permanente.
> El resto (auth, verificación en servidor, arquitectura general) sigue válido. Precio por definir.

> **Documento de consultoría técnica.** Plan para convertir la PWA "Pizarra Pádel"
> (HTML/CSS/JS vanilla, desplegada en https://padel-jdlq10.mywire.org vía Caddy en VPS
> Oracle) en una app **publicable en App Store / Play Store** y **monetizable** mediante
> funciones Pro (pizarra 3D, generador de pista, generador de secuencias, guardar pizarras).
>
> **Fecha:** 2026-05-21 · **Autor:** Claude (consultor técnico) · **Para:** Borja Pérez-Maeso
>
> ### Nota sobre la verificación de datos
> Las políticas de tiendas y los precios cambian con frecuencia. Los puntos **más
> críticos y volátiles** se han verificado contra fuentes oficiales en mayo de 2026:
> - **Apple Developer Program: 99 USD/año** — verificado en developer.apple.com.
> - **Reglas Apple App Review 3.1.1 / 3.1.3 / 4.2** (IAP obligatorio para contenido
>   digital, excepción de enlaces externos solo en la tienda de EE. UU., bloqueo en el
>   resto salvo *entitlements*, prohibición de meros "envoltorios web") — verificado en
>   developer.apple.com/app-store/review/guidelines.
> - **Google Play Billing** obligatorio para bienes digitales, con programas de
>   *alternative billing / user choice billing* y *external offers/links* (sobre todo EEE)
>   — verificado en developer.android.com/google/play/billing.
>
> Datos marcados con **(reconfirmar)** proceden de conocimiento estable a enero de 2026 y
> conviene revalidarlos justo antes de pagar/registrar, porque pueden haber variado:
> tarifa de Google Play (25 USD pago único), comisiones 15/30 %, programas Small
> Business / 15 % primer año de suscripción, *free tier* de RevenueCat y tiempos de
> revisión. Ninguno de estos suele cambiar de forma brusca, pero es buena higiene.

---

## 0. TL;DR (resumen ejecutivo)

- **Play Store es barato y viable ya**: empaquetar la PWA con **TWA** (Bubblewrap o
  PWABuilder). Coste: **25 USD una sola vez (reconfirmar)** + verificar Digital Asset
  Links. No hace falta Mac.
- **App Store es caro y burocrático**: requiere **Mac + Xcode**, cuenta Apple Developer
  (**99 USD/año, verificado**), envoltorio nativo con **Capacitor** (no TWA), y cuidar
  mucho la guía **4.2** (Apple rechaza "webviews" sin valor añadido).
- **El pago de Pro es el punto más delicado**: dentro de iOS, desbloquear funciones
  digitales **obliga a usar In-App Purchase de Apple** (comisión 15-30 %). Stripe/enlaces
  externos **no** valen para esto fuera de EE. UU. Lo mismo en Android con Google Play
  Billing. **Stripe sí se puede usar en la web/PWA.**
- **Recomendación de modelo**: suscripción **Pro mensual y anual**, con *entitlements*
  gestionados por un backend propio en el VPS. Usar **RevenueCat** como capa unificada
  para validar compras de Apple y Google y exponer un único flag "Pro" al cliente.
- **Camino realista**: empezar monetizando **solo en web (Stripe)** y como **PWA
  instalable**, luego **Play Store (TWA)**, y dejar **App Store + IAP** para el final
  (es lo más caro en dinero, tiempo y mantenimiento).

---

## 1. Vías de publicación

### 1.1 Play Store — PWA mediante TWA (Trusted Web Activity)

Una **TWA** es un contenedor Android que abre tu PWA a pantalla completa usando el motor
de Chrome del dispositivo (sin barra de navegador, sin "Chrome custom tab" visible). A
efectos del usuario es una app nativa; por dentro es tu web. Es la vía **oficial y
recomendada por Google** para llevar una PWA a Play Store.

**Herramientas:**
- **Bubblewrap** (CLI de Google, `npm i -g @bubblewrap/cli`): genera el proyecto Android
  a partir de tu `manifest.json`, lo compila y firma. Control total, ideal para CI.
- **PWABuilder** (web de Microsoft, pwabuilder.com): mete la URL, valida el manifest y te
  genera el paquete Android (AAB) listo para subir. Más sencillo, menos control. Por
  dentro usa Bubblewrap.

**Requisitos:**
1. **PWA válida** (ya la tienes): `manifest.json` con `name`, `icons` 192 y 512, `start_url`,
   `display`, `theme_color`; service worker; servida por **HTTPS** (Caddy + Let's Encrypt, OK).
2. **Cuenta Google Play Console**: pago único de **25 USD (reconfirmar)**. Verificación de
   identidad obligatoria (documento + datos; para cuentas personales nuevas Google exige
   además, en algunos casos, **probar con un grupo cerrado de testers antes de producción**
   — *política de testing previo, reconfirmar*).
3. **Digital Asset Links** — el paso técnico clave. Para que la TWA arranque **sin la barra
   del navegador**, hay que demostrar que controlas el dominio:
   - Generar el SHA-256 del certificado de firma de la app.
   - Publicar en el dominio el fichero `https://padel-jdlq10.mywire.org/.well-known/assetlinks.json`
     con ese fingerprint. En tu caso: añadir el fichero a la raíz servida por Caddy
     (mismo sitio que `manifest.json`), accesible públicamente.
   - **Ojo con Play App Signing**: Google re-firma tu app con SU clave, así que el SHA-256
     que debe ir en `assetlinks.json` es el de la **clave de firma de Play**, no el de tu
     clave de subida. Si no, la TWA arranca con barra de URL (señal de que falla el link).
4. **Política de privacidad** (URL pública) y cumplimentar la sección **Data safety**.
5. **Activos de ficha**: icono 512×512, *feature graphic* 1024×500, capturas de pantalla,
   descripción.

**Tiempos de revisión:** la primera publicación de una cuenta nueva puede tardar
**varios días (hasta ~7)**; revisiones posteriores suelen ser de **horas a 1-2 días**
*(reconfirmar — Google ha endurecido la revisión de cuentas nuevas)*.

**Pros:** barato, sin Mac, reutiliza tu PWA tal cual, actualizas la web y la app se
actualiza sola (salvo cambios de versión nativa).
**Contras:** depende del Chrome del usuario; algunos *features* nativos requieren plugins.

---

### 1.2 App Store — por qué Apple no acepta la PWA directa

**Apple no tiene equivalente a la TWA.** No existe forma soportada de subir "una PWA"
a la App Store. Hay que **envolverla en una app nativa** que cargue tu web dentro de un
`WKWebView`. La herramienta recomendada hoy es **Capacitor** (de Ionic): crea un proyecto
Xcode que embebe tu web y te da acceso a APIs nativas vía plugins. (Alternativa histórica:
Cordova, en desuso; Capacitor es el estándar actual.)

**Requisitos:**
1. **Mac con Xcode** — **innegociable**. Compilar, firmar y subir a App Store Connect solo
   se puede desde macOS. Opciones si no tienes Mac: comprar un Mac (Mac mini es lo más
   barato), un *cloud Mac* (MacStadium, MacinCloud — alquiler mensual), o un servicio de
   build en la nube (Ionic Appflow, Codemagic, EAS si migraras a Expo). **Reconfirmar
   costes de cloud Mac; rondan 20-60 USD/mes.**
2. **Cuenta Apple Developer Program**: **99 USD/año (verificado)**. Renovación anual o la
   app desaparece de la tienda.
3. **Certificados y perfiles** de firma (los gestiona Xcode/App Store Connect; engorroso
   pero automatizable).
4. **Capacitor** envolviendo tu web (apuntando a la URL o empaquetando los HTML).
5. **App Privacy** ("nutrition labels") + política de privacidad pública.

**Tiempos de revisión:** normalmente **24-48 h** por envío *(reconfirmar; Apple publica
que >90 % se revisan en 24 h)*. Pero la **primera** suele llevar más idas y venidas.

**Motivos típicos de rechazo de "apps webview" (atención máxima):**
- **Guideline 4.2 (Minimum Functionality)** — *verificado en las guidelines actuales*:
  Apple rechaza apps que sean "un sitio web reempaquetado", "recortes web", agregadores o
  colecciones de enlaces. La app debe **"incluir características, contenido y UI que la
  eleven por encima de una web reempaquetada"** y ser "app-like". Una pizarra táctica
  interactiva con 3D, gestos, *offline* y guardado **tiene argumentos** para pasar, pero
  hay que **demostrarlo**: integrar capacidades nativas (notificaciones push, *share*
  nativo, *haptics*, almacenamiento offline real, icono y *splash* nativos) y que no
  parezca "abrí Safari dentro de una app".
- **Guideline 3.1.1** — si hay funciones de pago, **deben** ir por IAP (ver §3).
- Login: si ofreces login social de terceros, **Sign in with Apple es obligatorio** (§2).
- Enlaces a pago externo que incumplan 3.1.3 (ver §3).

> **Honesto:** la App Store es, con diferencia, **la parte más cara y frágil** del
> proyecto: Mac + 99 USD/año + riesgo real de rechazo por 4.2 + obligación de IAP con
> comisión. Para una app de nicho, plantéate si compensa de salida o si va al final.

---

### 1.3 Alternativa: seguir solo como PWA instalable (sin tiendas)

La PWA **ya es instalable** ("Añadir a pantalla de inicio") en Android e iOS y funciona
offline. Puedes monetizar Pro **con Stripe en la propia web**, sin tiendas.

**Pros:**
- **Coste cero** de cuentas de tienda (0 USD vs. 25 USD + 99 USD/año).
- **Sin comisiones de tienda**: con Stripe pagas ~1,5 % + 0,25 € (tarjeta europea) en vez
  de 15-30 %.
- **Sin revisiones ni riesgo de rechazo**; despliegas cuando quieras.
- Te lo controlas todo en tu ecosistema (VPS, Forgejo, Caddy).

**Contras:**
- **Sin escaparate**: nadie te "descubre" en las tiendas; el descubrimiento depende de ti.
- **iOS limita la PWA**: notificaciones push web funcionan en iOS pero solo si el usuario
  **instala** la PWA en pantalla de inicio; algunas APIs son más restringidas que en Android.
- Percepción: cierto público "confía más" en algo que está en la tienda.
- Onboarding de instalación en iOS es manual (Compartir → Añadir a pantalla de inicio),
  menos descubrible que un botón "Instalar".

**Recomendación:** **empieza por aquí**. Es la base sobre la que se montan las tiendas y
te permite validar si la gente paga por Pro **antes** de gastar en cuentas y Mac.

---

## 2. Login / autenticación

Hoy la app es 100 % local (localStorage/IndexedDB). Para monetizar Pro necesitas saber
**quién es** cada usuario y **qué ha comprado**, en cualquier dispositivo. Eso exige cuentas.

### 2.1 Opciones

| Opción | Pros | Contras |
|---|---|---|
| **Email + contraseña propio** (backend VPS) | Control total, sin terceros, encaja con tu ecosistema | Tienes que gestionar hashing, *reset* de contraseña, verificación de email, seguridad |
| **OAuth Google** | Sin contraseñas, conversión alta, gratis | Dependes de Google; en iOS dispara la obligación de Sign in with Apple |
| **Sign in with Apple** | **Obligatorio en iOS** si ofreces *otros* logins sociales (Google/Facebook); buena privacidad | Solo relevante por iOS; un *setup* extra |
| **Forgejo OAuth (tu ecosistema)** | Ya lo tienes; OAuth2 propio; cero coste | Tus usuarios no tienen cuenta Forgejo → mala UX para público general. Útil solo para ti/admin |

> **Regla Apple importante (App Review 4.8):** si tu app iOS ofrece **login con servicios
> sociales de terceros** (Google, Facebook…), **debe** ofrecer también **Sign in with
> Apple** como opción equivalente. Si solo ofreces email+contraseña propio, **no** es
> obligatorio. *(Conviene reconfirmar el alcance exacto de 4.8 antes de subir a iOS.)*

### 2.2 Recomendación de arquitectura mínima

Dos caminos sensatos, ambos autoalojados en tu VPS (encajan con tu filosofía "sin
terceros pesados"):

**Opción A — Servicio "BaaS" autoalojado (recomendado para velocidad): PocketBase.**
- Un único binario Go + SQLite. Te da **auth (email/password + OAuth Google/Apple),
  base de datos, reglas de acceso y API REST** out-of-the-box. Ligerísimo, perfecto para
  tu VPS y tu volumen.
- Levantas un contenedor Docker más en `/opt/stacks/` detrás de Caddy
  (p. ej. `auth-padel-jdlq10...`). Mantenimiento mínimo.
- Alternativa equivalente: **Supabase autoalojado** (Postgres + GoTrue). Más potente pero
  **mucho más pesado** (varios contenedores). Para esta app, **PocketBase gana**.

**Opción B — Auth propio a medida con JWT.**
- Un microservicio (Node/Express, Go, o incluso PHP) en el VPS que emite **JWT** firmados
  tras validar email+contraseña (hash con **Argon2id/bcrypt**) y verifica el JWT en cada
  petición protegida. Más trabajo, control total. Solo si PocketBase se te queda corto.

> Para empezar, **PocketBase**. Reduces semanas de trabajo de auth a un fin de semana.

### 2.3 Esquema de datos de usuario (mínimo)

```
users
  id              (uuid / pk)
  email           (único, verificado)
  password_hash   (argon2id; null si solo OAuth)
  display_name
  auth_provider   (email | google | apple)
  apple_user_id   (sub de Sign in with Apple, opaco)
  created_at
  updated_at

entitlements                 # qué tiene desbloqueado cada usuario
  id
  user_id        -> users.id
  product        ("pro")
  status         (active | expired | grace | trial | refunded)
  source         (stripe | apple | google)        # de dónde vino la compra
  platform       (web | ios | android)
  expires_at     (fecha fin del periodo de suscripción)
  store_txn_id   (id de transacción/suscripción en el store)
  updated_at

webhook_events               # idempotencia de notificaciones de pago
  id
  source         (stripe | apple | google | revenuecat)
  event_id       (único — evita procesar dos veces)
  payload_raw
  received_at
```

La tabla **`entitlements`** es el corazón de la monetización: el cliente solo necesita
preguntar "¿soy Pro?" y el backend responde mirando aquí (ver §3 y §4).

---

## 3. Pasarela de pago para Pro

Aquí está la regla que **condiciona todo el negocio**. Resumen sin rodeos:

> **Si una compra desbloquea contenido o funciones digitales DENTRO de la app de la
> tienda, esa compra debe pasar por la pasarela de la tienda (Apple IAP / Google Play
> Billing) y pagar su comisión. No puedes esquivarla con Stripe ni con un enlace externo
> (fuera de excepciones regionales muy concretas).**

### 3.1 Apple — In-App Purchase (lo más restrictivo)

*Verificado contra las App Review Guidelines actuales (mayo 2026):*
- **3.1.1**: para "desbloquear funciones o funcionalidad" (suscripciones, contenido
  premium, versión completa…) **debes usar In-App Purchase**. Cita literal: *"Apps may not
  use their own mechanisms to unlock content or functionality, such as license keys…"*.
  Tu **Pro** (3D, generador de pista, generador de secuencias, guardar) cae **de lleno**
  aquí.
- **Comisión**: **30 %** estándar; **15 %** para suscripciones tras **12 meses**
  continuados del mismo suscriptor, y **15 %** general si entras en el **App Store Small
  Business Program** (<1 M USD/año) *(reconfirmar requisitos y porcentajes)*.
- **3.1.3 (enlaces externos)** — matiz reciente y **crítico**, *verificado*:
  - En la **tienda de EE. UU.**, tras litigios (Epic v. Apple), Apple **permite** incluir
    botones/enlaces externos a un método de pago propio **sin necesidad de *entitlement***.
  - **En el resto de tiendas (incluida España/UE), esa práctica está prohibida** salvo
    *entitlements* específicos (apps "reader", música en regiones concretas, *External
    Purchase Link Entitlement* en algunos países). Una app de pizarra de pádel **no encaja**
    en esas categorías → **en la App Store española tendrás que usar IAP de Apple, punto.**
  - En la UE existe además la vía de la **DMA** (pasarelas/tiendas alternativas con tarifas
    de Apple propias), pero es compleja y **no compensa** para este caso.

> **Conclusión Apple:** si publicas en App Store, **Pro = IAP de Apple con comisión
> 15-30 %.** No hay atajo limpio en España.

### 3.2 Google — Google Play Billing

*Verificado contra developer.android.com/google/play/billing:*
- Para bienes digitales/suscripciones dentro de la app de Play, **Google Play Billing** es
  el sistema requerido. Comisiones análogas: **15 % para el primer 1 M USD/año** de cada
  desarrollador y **30 %** por encima; suscripciones al **15 %** *(reconfirmar tramos
  exactos vigentes)*.
- **Matices más abiertos que Apple**: Google ofrece programas de **alternative billing /
  user choice billing** (el usuario elige pasarela; reduce algo la comisión) y **external
  offers / external payment links**, sobre todo en el **EEE** por presión regulatoria.
  Aun así, para empezar lo simple y seguro es **usar Play Billing**.

### 3.3 Stripe y RevenueCat — cuándo se pueden usar

- **Stripe**: úsalo **en la web/PWA** (incluida la PWA instalada desde el navegador, **no**
  desde la app de tienda). Comisión ~**1,5 % + 0,25 €** (tarjetas europeas), muchísimo más
  barato que las tiendas. **Sin restricciones de tienda** porque no estás dentro de la
  app de tienda. **Esta es tu mejor pasarela mientras vivas en web/PWA.**
- **RevenueCat**: **capa unificada de suscripciones multiplataforma**. No es una pasarela;
  se sienta **encima** de Apple IAP y Google Play Billing (y opcionalmente Stripe Web),
  valida los recibos/transacciones contra cada store por ti, gestiona renovaciones,
  *grace periods*, *trials*, reembolsos, y te expone **un único concepto de "entitlement"**
  ("¿este usuario es Pro?"). Te ahorra escribir la verificación contra App Store Server API
  y Google Play Developer API a mano (que es trabajo delicado y propenso a errores).
  - **Precio**: tiene **plan gratuito** hasta cierto **MTR (Monthly Tracked Revenue)** y
    cobra un % por encima *(reconfirmar el umbral y el % actuales — históricamente el free
    tier cubría holgadamente a un proyecto que empieza)*.
  - **Cuándo entra**: en cuanto vendas Pro **en iOS y/o Android** (no antes; para solo-web
    con Stripe no lo necesitas).

### 3.4 Modelo de monetización recomendado

- **Producto**: una sola suscripción **"Pro"**, en dos periodicidades:
  - **Mensual**: ~**3,99 €/mes** *(orientativo)*.
  - **Anual**: ~**29,99 €/año** *(orientativo, ~37 % de descuento vs. mensual — incentiva
    el anual, que reduce comisiones de Apple a la mitad tras 12 meses)*.
  - Opcional: **prueba gratis** de 7 días para conversión.
- **Entitlement "pro"** desbloquea: **pizarra 3D**, **generador de pista**, **generador de
  secuencias** y **guardar pizarras** (n.º ilimitado; la versión Gratis podría permitir
  guardar 1-2). Todo lo demás (pizarra 2D táctica) sigue **gratis**.
- **Coherencia de precios entre plataformas**: el precio en web (Stripe) puede ser **más
  bajo** que en las tiendas para absorber tú la comisión y/o trasladarla. Decisión de
  Borja (§5).
- **Una compra, todas las plataformas**: como el *entitlement* vive en **tu backend**, si
  alguien paga en web, también es Pro en Android/iOS (y viceversa, vía RevenueCat). Esto es
  legal y deseable: lo que **no** puedes es **vender** en iOS por fuera de IAP; pero **sí**
  puedes **reconocer** una compra hecha en la web.

---

## 4. Arquitectura propuesta end-to-end

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTE (la misma PWA)                            │
│                                                                               │
│   PWA web (Stripe)        TWA Android (Play)          iOS Capacitor (App St.) │
│   navegador/instalada     contenedor Chrome           WKWebView + plugins     │
│        │                       │                            │                  │
│        │  compra Pro           │  compra Pro                │  compra Pro      │
│        │  por Stripe           │  por Play Billing          │  por Apple IAP   │
│        ▼                       ▼                            ▼                  │
│  ┌──────────┐           ┌──────────────┐            ┌──────────────┐          │
│  │ Stripe   │           │ Google Play  │            │ Apple IAP    │          │
│  │ Checkout │           │ Billing      │            │ StoreKit     │          │
│  └────┬─────┘           └──────┬───────┘            └──────┬───────┘          │
└───────┼────────────────────────┼──────────────────────────┼──────────────────┘
        │ webhook                 │  (SDK compra)             │  (SDK compra)
        │                         ▼                           ▼
        │                ┌─────────────────────────────────────────┐
        │                │           RevenueCat (opcional)          │
        │                │  valida recibos Apple/Google, unifica    │
        │                │  suscripciones → 1 webhook al backend    │
        │                └───────────────────┬─────────────────────┘
        │  webhook                            │ webhook (entitlement)
        ▼                                     ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                       BACKEND PROPIO EN EL VPS (Docker + Caddy)              │
│                                                                             │
│   ┌──────────────┐      ┌───────────────────────────────────────────┐      │
│   │  AUTH         │      │  SERVICIO DE ENTITLEMENTS                   │      │
│   │ (PocketBase)  │◄────►│  - recibe webhooks de Stripe / RevenueCat  │      │
│   │  email/OAuth  │      │  - (o llama App Store Server API +         │      │
│   │  emite JWT    │      │     Google Play Developer API directamente)│      │
│   └──────────────┘      │  - escribe/actualiza tabla `entitlements`  │      │
│                         │  - idempotencia vía `webhook_events`       │      │
│                         └────────────────────┬──────────────────────┘      │
│                                              │                              │
│                                              ▼                              │
│                              ┌───────────────────────────┐                 │
│                              │  GET /me/entitlements      │  (con JWT)      │
│                              │  → { pro: true, exp: ... }  │                 │
│                              └───────────────────────────┘                 │
└──────────────────────────────────────────┬────────────────────────────────┘
                                            │  respuesta { pro: true/false }
                                            ▼
                          El cliente activa/oculta funciones Pro
                          (3D, generador pista, secuencias, guardar)
                          + cachea el flag para funcionar OFFLINE
```

**Flujo resumido:**
1. Usuario inicia sesión → **Auth (PocketBase)** devuelve **JWT**.
2. Usuario compra Pro por la pasarela que toque según plataforma (Stripe en web, Play
   Billing en Android, Apple IAP en iOS).
3. La pasarela / RevenueCat notifica al **backend de entitlements** (webhook). El backend
   **verifica** la compra contra el store (directamente con App Store Server API / Google
   Play Developer API, **o** delegando esa verificación en RevenueCat) y marca
   `entitlements.status = active` con su `expires_at`.
4. El cliente pregunta `GET /me/entitlements` con su JWT → recibe `{ pro: true }`.
5. El cliente **cachea** el flag (firmado/con expiración) para seguir siendo Pro **offline**
   (coherente con tu requisito offline-first), revalidando al reconectar.

**Por qué la verificación va en el servidor:** nunca confíes en el cliente para decidir
"es Pro" (se manipula). La verdad vive en el VPS, validada contra el store.

---

## 5. Checklist de decisiones para Borja

Lista accionable. Cada ítem es una decisión o una compra que **solo puede hacer Borja**.

**Cuentas y costes (one-off / recurrentes):**
- [ ] **Google Play Console** — **25 USD pago único (reconfirmar)**. ¿Lo abrimos ya?
- [ ] **Apple Developer Program** — **99 USD/año (verificado)**. ¿Entramos en App Store o
      lo dejamos para más adelante / nunca?
- [ ] **¿Comprar/alquilar Mac para iOS?** — Mac mini (compra) vs. cloud Mac
      (~20-60 USD/mes, reconfirmar). **Sin Mac no hay App Store.**
- [ ] **Stripe** — alta gratuita; necesita datos fiscales (autónomo/empresa) y cuenta
      bancaria. ¿A nombre de quién factura?

**Decisiones de producto/arquitectura:**
- [ ] **Proveedor de auth**: ¿**PocketBase** autoalojado (recomendado) u otro?
- [ ] **Proveedor de pagos web**: ¿**Stripe** (recomendado)?
- [ ] **¿Usamos RevenueCat** cuando entremos en tiendas, o verificamos compras a mano?
- [ ] **Precio de Pro**: ¿**3,99 €/mes** y **29,99 €/año**? ¿Prueba gratis de 7 días?
- [ ] **Qué desbloquea Pro exactamente** y qué límites tiene el Gratis (¿guardar 1-2
      pizarras gratis?).
- [ ] **Estrategia de salida**: ¿solo web/PWA primero, luego Play, y App Store al final?
      (recomendado) ¿o todo a la vez? (más caro y arriesgado).

**Legal / branding (obligatorio para las tiendas):**
- [ ] **Nombre y branding definitivos** de la app (hoy "Pizarra Pádel"). Comprobar que no
      colisiona con marcas registradas y que el nombre está libre en ambas tiendas.
- [ ] **Política de privacidad** publicada en URL propia (obligatoria en ambas tiendas y
      por RGPD). Puede vivir en el VPS (`/privacidad`).
- [ ] **Términos y condiciones / EULA** publicados (obligatorio si hay suscripciones).
- [ ] **Datos de contacto de soporte** (email visible en la ficha).
- [ ] **RGPD**: tratamiento de email/datos de usuario; consentimiento; derecho de
      supresión (borrar cuenta — Apple **exige** opción de borrar cuenta en la app).
- [ ] **Fiscalidad de la suscripción**: IVA, facturación. Stripe ayuda (Stripe Tax); en
      tiendas, Apple/Google actúan como recaudadores en muchos países.
- [ ] **Iconos y capturas** finales por plataforma (Design entrega assets).

---

## 6. Roadmap por fases

Estimaciones de esfuerzo en **jornadas de desarrollo** (no calendario). "Yo solo" = lo
puedo hacer sin intervención de Borja; "Borja" = requiere su decisión/compra/Mac.

### Fase 1 — PWA pulida + cuentas (base)
**Objetivo:** dejar la PWA lista para "tienda" y abrir las cuentas baratas.
- Refactor mínimo para empaquetado: revisar `manifest.json` (nombre, categorías, *display*),
  iconos *maskable* correctos, *splash*, `theme_color`. **Yo solo** (~0,5-1 j).
- Auditar **Lighthouse PWA 100 / Perf >90 / A11y >95** y arreglar lo que falle. **Yo solo**
  (~1 j).
- Publicar **política de privacidad + términos** (borrador) en el VPS. **Yo solo** redacto;
  **Borja** valida/aprueba (~0,5 j).
- **Borja**: abrir **Google Play Console (25 USD)** y decidir Stripe. *(bloqueante, suyo)*
- **Resultado:** PWA instalable impecable + cuentas listas. *Esto se puede entregar ya.*

### Fase 2 — Autenticación
**Objetivo:** que existan cuentas de usuario.
- Levantar **PocketBase** en Docker tras Caddy (subdominio `auth-padel...`). **Yo solo**
  (~0,5 j).
- Integrar **login/registro** (email + Google OAuth) en la PWA; manejar JWT/sesión;
  pantalla "Mi cuenta"; borrar cuenta. **Yo solo** (~2-3 j).
- **Borja**: crear credenciales OAuth de Google (consola Google Cloud) y, si va a iOS,
  configurar Sign in with Apple. *(bloqueante parcial, suyo)*
- **Resultado:** usuarios pueden crear cuenta y entrar en cualquier dispositivo.

### Fase 3 — Pagos web (Stripe) + entitlements
**Objetivo:** **monetizar ya, en web, sin tiendas.** Es el primer dinero real.
- Servicio de **entitlements** en el VPS + tabla `entitlements` + webhook de Stripe con
  idempotencia. **Yo solo** (~2-3 j).
- **Stripe Checkout/Customer Portal** para suscripción mensual/anual; *gating* de funciones
  Pro en el cliente (3D, pista, secuencias, guardar) según `GET /me/entitlements`; caché
  offline del flag. **Yo solo** (~2-3 j).
- **Borja**: completar alta fiscal de Stripe, fijar precios, aprobar copy de la *paywall*.
- **Resultado:** Pro vendible **hoy** a coste de comisión mínimo. **Hito de validación:
  ¿paga la gente?** Si no, no merece la pena gastar en App Store.

### Fase 4 — Empaquetado en tiendas
**Objetivo:** presencia en escaparates.
- **Play Store (TWA)**: Bubblewrap/PWABuilder → AAB; **Digital Asset Links** (`assetlinks.json`
  con el SHA-256 de Play App Signing en Caddy); ficha, capturas, *data safety*; subir y
  pasar revisión. **Yo solo** el técnico (~1-2 j) + **Borja** la ficha/identidad.
- **App Store (Capacitor)** — **solo si Borja compra Mac + 99 USD/año**: proyecto
  Capacitor, certificados, *splash*/icono nativos, reforzar "app-likeness" para **4.2**
  (push, share nativo, haptics), ficha. **Yo solo** el técnico (~3-5 j, más fricción) +
  **Borja** Mac/cuenta/ficha. *(bloqueante duro: sin Mac no se hace)*.
- **Resultado:** app en Play (y opcionalmente App Store) **mostrando Pro como compra web**
  donde esté permitido, o como "gestiona tu suscripción en la web" *(ojo: en iOS esto roza
  los límites de 3.1.3 → ver Fase 5)*.

### Fase 5 — In-App Purchase (IAP) en las tiendas
**Objetivo:** vender Pro **dentro** de las apps de tienda cumpliendo sus reglas.
- Integrar **RevenueCat** (o IAP nativo) en Android (Play Billing) y, si aplica, iOS
  (StoreKit). Mapear productos Pro mensual/anual en App Store Connect y Play Console.
  **Yo solo** el técnico (~3-5 j) + **Borja** crea los productos/precios en cada consola.
- Conectar webhook de RevenueCat → backend de entitlements (unificar con Stripe). **Yo
  solo** (~1-2 j).
- **Resultado:** monetización completa multiplataforma, cumpliendo IAP de Apple y Play
  Billing, con un único concepto de "Pro" en tu backend.

### Resumen de qué bloquea a quién

| Fase | Lo hago sin Borja | Requiere a Borja (bloqueante) |
|---|---|---|
| 1 | Pulido PWA, Lighthouse, borrador legal | Pagar Play Console; alta Stripe; aprobar legal |
| 2 | Montar PocketBase + UI login | Credenciales OAuth Google / Apple |
| 3 | Backend entitlements + Stripe gating | Alta fiscal Stripe, precios, copy |
| 4 | TWA + assetlinks (Play) | Ficha/identidad; **Mac + 99 USD para iOS** |
| 5 | Integrar RevenueCat/IAP, webhooks | Crear productos/precios en las consolas |

---

## 7. Recomendación final (honesta)

1. **Haz Fases 1-3 ya**: pulir PWA + auth + **Stripe en web**. Coste casi cero (solo tu
   VPS), monetizas en semanas y **validas si hay mercado**.
2. **Luego Play Store (Fase 4 parcial)**: 25 USD, sin Mac, bajo riesgo.
3. **App Store + IAP (Fases 4-5) solo si los números acompañan.** Es donde se va el dinero
   (Mac + 99 USD/año + 15-30 % de comisión + mantenimiento + riesgo 4.2). No lo hagas "por
   estar"; hazlo cuando la web demuestre que la gente paga.

> **Mensaje clave:** la parte cara y burocrática (App Store, IAP) puede esperar. La parte
> que genera ingresos (Pro por Stripe en la PWA) **no depende de ninguna tienda** y la
> puedes tener funcionando pronto, dentro de tu propio ecosistema.
