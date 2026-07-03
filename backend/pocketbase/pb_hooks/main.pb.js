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

  const amount = "999"; // 9,99 € (placeholder — cambiar al precio definitivo)
  // Origen de retorno: lo envía el cliente; validado contra lista blanca.
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
    "line_items[0][price_data][currency]=eur",
    "line_items[0][price_data][unit_amount]=" + amount,
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
// NOTA: en producción hay que verificar la firma (Stripe-Signature) con
// STRIPE_WEBHOOK_SECRET. En modo prueba lo dejamos abierto y se endurece
// antes de cobrar de verdad.
routerAdd("POST", "/api/pro/webhook", (e) => {
  let evt;
  try {
    evt = e.requestInfo().body;
  } catch (err) {
    return e.json(400, { error: "cuerpo inválido" });
  }
  if (evt && evt.type === "checkout.session.completed") {
    const s = evt.data.object || {};
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
