/// <reference path="../pb_data/types.d.ts" />
// PADELBOARD — endpoints de pago (Stripe, pago único) sobre PocketBase.

// Prueba de que los hooks cargan.
routerAdd("GET", "/api/pro/ping", (e) => {
  return e.json(200, { ok: true, service: "padelboard-pro" });
});

// POST /api/pro/checkout  (requiere sesión) -> crea Checkout Session y devuelve la URL.
routerAdd("POST", "/api/pro/checkout", (e) => {
  const user = e.auth;
  if (!user) return e.json(401, { error: "No autenticado" });

  const sk = $os.getenv("STRIPE_SECRET_KEY");
  if (!sk) return e.json(500, { error: "Stripe no configurado" });

  // Precio y moneda parametrizables por entorno (sin tocar codigo).
  const amount = ($os.getenv("PRO_PRICE_CENTS") || "999").trim();     // 9,99 EUR por defecto
  const currency = ($os.getenv("PRO_CURRENCY") || "eur").trim().toLowerCase();

  // Origen de retorno: lo envia el cliente; validado contra lista blanca.
  const allowed = ["https://padel-jdlq10.mywire.org", "http://127.0.0.1:5500", "http://localhost:5500"];
  let origin = allowed[0];
  try { const b = e.requestInfo().body; if (b && b.origin && allowed.indexOf(b.origin) >= 0) origin = b.origin; } catch (_) {}

  const params = [
    "mode=payment",
    "success_url=" + encodeURIComponent(origin + "/?pro=ok"),
    "cancel_url=" + encodeURIComponent(origin + "/?pro=cancel"),
    "client_reference_id=" + encodeURIComponent(user.id),
    "customer_email=" + encodeURIComponent(user.email()),
    "line_items[0][quantity]=1",
    "line_items[0][price_data][currency]=" + encodeURIComponent(currency),
    "line_items[0][price_data][unit_amount]=" + encodeURIComponent(amount),
    "line_items[0][price_data][product_data][name]=" + encodeURIComponent("PADELBOARD Pro"),
    "metadata[user_id]=" + encodeURIComponent(user.id),
  ].join("&");

  const res = $http.send({
    url: "https://api.stripe.com/v1/checkout/sessions",
    method: "POST",
    headers: {
      "Authorization": "Bearer " + sk,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
    timeout: 20,
  });

  if (res.statusCode >= 400) {
    return e.json(502, { error: "Stripe error", detail: res.json });
  }
  return e.json(200, { url: res.json.url });
}, $apis.requireAuth());

// POST /api/pro/webhook  -> Stripe avisa del pago; marcamos Pro.
// Verifica la firma Stripe-Signature (HMAC-SHA256 con STRIPE_WEBHOOK_SECRET)
// ANTES de conceder Pro. La verificacion va INLINE: en el JSVM de PocketBase
// las funciones top-level no estan en scope dentro del handler en tiempo de
// peticion (los handlers corren en un pool de runtimes).
routerAdd("POST", "/api/pro/webhook", (e) => {
  const secret = $os.getenv("STRIPE_WEBHOOK_SECRET");
  if (!secret) {
    console.log("webhook: STRIPE_WEBHOOK_SECRET no configurado");
    return e.json(500, { error: "webhook no configurado" });
  }

  // Cuerpo CRUDO exacto (necesario para la firma). No usar requestInfo() antes.
  let raw = "";
  try { raw = toString(e.request.body); } catch (_) { raw = ""; }
  const sigHeader = e.request.header.get("Stripe-Signature") || "";

  // --- Verificacion de firma: header "t=<ts>,v1=<hmac hex>" ---
  // firma = HMAC_SHA256( t + "." + payload, secret ), comparada en hex.
  let sigOK = false;
  if (raw && sigHeader) {
    let t = "";
    const v1 = [];
    const parts = sigHeader.split(",");
    for (let i = 0; i < parts.length; i++) {
      const kv = parts[i].split("=");
      if (kv.length < 2) continue;
      const k = kv[0].trim();
      const val = kv.slice(1).join("=").trim();
      if (k === "t") t = val;
      else if (k === "v1") v1.push(val);
    }
    if (t && v1.length > 0) {
      let freshOK = true;
      try {
        const now = Math.floor(Date.now() / 1000);
        const ts = parseInt(t, 10);
        if (ts && Math.abs(now - ts) > 300) freshOK = false; // anti-replay 5 min
      } catch (_) {}
      if (freshOK) {
        const expected = $security.hs256(t + "." + raw, secret);
        for (let i = 0; i < v1.length; i++) {
          if ($security.equal(v1[i], expected)) { sigOK = true; break; }
        }
      }
    }
  }
  if (!sigOK) {
    console.log("webhook: firma invalida");
    return e.json(400, { error: "firma invalida" });
  }

  let evt;
  try { evt = JSON.parse(raw); } catch (err) { return e.json(400, { error: "cuerpo invalido" }); }

  if (evt && evt.type === "checkout.session.completed") {
    const s = (evt.data && evt.data.object) || {};
    const userId = s.client_reference_id || (s.metadata && s.metadata.user_id);
    if (userId) {
      try {
        let rec;
        try {
          rec = $app.findFirstRecordByFilter("entitlements", "user = {:u}", { u: userId });
        } catch (_) {
          rec = null;
        }
        if (!rec) {
          const col = $app.findCollectionByNameOrId("entitlements");
          rec = new Record(col);
          rec.set("user", userId);
        }
        rec.set("pro", true);
        rec.set("source", "stripe");
        rec.set("stripe_session", s.id || "");
        $app.save(rec);
      } catch (err) {
        console.log("grantPro error:", err);
      }
    }
  }
  return e.json(200, { received: true });
});

// POST /api/pro/device/sync  (requiere sesión) — registra este dispositivo bajo la
// cuenta y aplica el límite de dispositivos Pro. Devuelve:
//   { pro:false }                        -> la cuenta no es Pro
//   { pro:true, active:true }            -> dispositivo dentro del cupo (usa Pro)
//   { pro:true, active:false, reason }   -> límite alcanzado (debe liberar uno)
// El alta/actualización va INLINE (los helpers top-level no están en scope aquí).
routerAdd("POST", "/api/pro/device/sync", (e) => {
  const user = e.auth;
  if (!user) return e.json(401, { error: "no auth" });

  let body = {};
  try { body = e.requestInfo().body || {}; } catch (_) {}
  const did = (body.device_id || "").toString().slice(0, 64);
  const name = (body.name || "").toString().slice(0, 80);
  const dtype = (body.dtype || "").toString().slice(0, 16);
  if (!did) return e.json(400, { error: "device_id requerido" });

  // ¿la cuenta es Pro?
  let pro = false;
  try {
    const ent = $app.findFirstRecordByFilter("entitlements", "user = {:u}", { u: user.id });
    pro = !!(ent && ent.getBool("pro"));
  } catch (_) { pro = false; }
  if (!pro) return e.json(200, { pro: false, active: false });

  const LIMIT = 3;

  // ¿este dispositivo ya está registrado? -> refresca y sigue activo
  let rec = null;
  try { rec = $app.findFirstRecordByFilter("devices", "user = {:u} && device_id = {:d}", { u: user.id, d: did }); } catch (_) { rec = null; }
  if (rec) {
    try { rec.set("name", name); rec.set("dtype", dtype); $app.save(rec); } catch (_) {}
    return e.json(200, { pro: true, active: true });
  }

  // dispositivo nuevo: contar los existentes de la cuenta
  let count = 0;
  try { count = $app.findRecordsByFilter("devices", "user = {:u}", "", 100, 0, { u: user.id }).length; } catch (_) { count = 0; }
  if (count >= LIMIT) {
    return e.json(200, { pro: true, active: false, reason: "limit", limit: LIMIT });
  }

  // dentro del cupo: registrar
  try {
    const col = $app.findCollectionByNameOrId("devices");
    const d = new Record(col);
    d.set("user", user.id); d.set("device_id", did); d.set("name", name); d.set("dtype", dtype);
    $app.save(d);
  } catch (err) { console.log("device create error:", err); return e.json(200, { pro: true, active: false, reason: "error" }); }
  return e.json(200, { pro: true, active: true });
}, $apis.requireAuth());
