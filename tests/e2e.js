// Batería de pruebas de extremo a extremo de PADELBOARD.
//
//   cd tests && npm install && node e2e.js            (todas)
//   node e2e.js secuencias                             (solo las que contengan «secuencias»)
//
// Abre la app en Chrome (playwright-core, canal «chrome») servida desde este repo,
// pulsa los botones de verdad y dibuja con el dedo (eventos táctiles CDP) o el ratón.
// La API de cuentas (/api/) va simulada. Deja capturas de los fallos en tests/out/.
const { chromium } = require('playwright-core');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const PORT = 5700 + Math.floor(Math.random() * 200);
const BASE = `http://127.0.0.1:${PORT}/index.html`;
const FILTRO = (process.argv[2] || '').toLowerCase();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]).replace(/^\/beta\//, '/'); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});

// ───────────────────────── mini marco de pruebas
const results = []; let browser;
function check(ok, msg) { if (!ok) throw new Error(msg); }
async function T(name, fn) {
  if (FILTRO && !name.toLowerCase().includes(FILTRO)) return;
  const t0 = Date.now(); let page = null;
  try { await fn((p) => (page = p)); results.push({ name, ok: true, ms: Date.now() - t0 }); process.stdout.write(`  ✔ ${name}\n`); }
  catch (e) {
    results.push({ name, ok: false, err: e.message.split('\n')[0] }); process.stdout.write(`  ✘ ${name}\n      → ${e.message.split('\n')[0]}\n`);
    if (page) { try { await page.screenshot({ path: path.join(OUT, name.replace(/[^\w]+/g, '_').slice(0, 60) + '.png') }); } catch (_) {} }
  }
}

// API de cuentas simulada (PocketBase): usuarios en memoria y Pro por usuario.
function apiMock(state) {
  return async (route) => {
    const req = route.request(), url = new URL(req.url()), p = url.pathname;
    const body = (() => { try { return JSON.parse(req.postData() || '{}'); } catch (_) { return {}; } })();
    const json = (status, o) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(o) });
    state.calls.push(req.method() + ' ' + p);
    if (p.endsWith('/collections/users/auth-with-password')) {
      const u = state.users[body.identity];
      return u && u.password === body.password ? json(200, { token: 'tok-' + u.id, record: { id: u.id, email: body.identity } }) : json(400, { message: 'Failed to authenticate.' });
    }
    if (p.endsWith('/collections/users/records') && req.method() === 'POST') {
      if (state.users[body.email]) return json(400, { code: 400, message: 'Failed to create record.', data: { email: { code: 'validation_not_unique', message: 'Value must be unique.' } } });
      const id = 'u' + (Object.keys(state.users).length + 1); state.users[body.email] = { id, password: body.password }; return json(200, { id, email: body.email });
    }
    if (p.endsWith('/collections/entitlements/records')) return json(200, { items: state.pro ? [{ pro: true }] : [] });
    if (p.endsWith('/pro/checkout')) return json(200, { url: BASE.replace('index.html', '') + 'index.html?pro=ok' });
    return json(404, {});
  };
}

async function abrir(opts = {}) {
  const o = Object.assign({ w: 390, h: 844, pro: false, touch: true, tut: true, dpr: 2, sw: false, storage: {}, ang: 0 }, opts);
  const ctx = await browser.newContext({ viewport: { width: o.w, height: o.h }, deviceScaleFactor: o.dpr, hasTouch: o.touch, isMobile: o.touch, serviceWorkers: o.sw ? 'allow' : 'block', acceptDownloads: true });
  await ctx.addInitScript(([o]) => {
    try {
      if (!sessionStorage.getItem('__init')) {
        sessionStorage.setItem('__init', '1');
        localStorage.setItem('padel.pro', o.pro ? '1' : '0');
        if (o.tut) localStorage.setItem('padel.tutDone', '1');
        for (const k in o.storage) localStorage.setItem(k, o.storage[k]);
      }
    } catch (e) {}
    window.__ang = o.ang;
    try { Object.defineProperty(screen, 'orientation', { configurable: true, get() { return { angle: window.__ang, type: 'x', addEventListener() {} }; } }); } catch (e) {}
  }, [o]);
  const page = await ctx.newPage();
  page.errores = [];
  page.on('pageerror', (e) => page.errores.push('JS: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_|net::/.test(m.text())) page.errores.push('consola: ' + m.text()); });
  page.dialogos = []; page.respuestaPrompt = null; page.respuestaConfirm = true;
  page.on('dialog', async (d) => {
    page.dialogos.push(d.type() + ': ' + d.message());
    if (d.type() === 'prompt') { page.respuestaPrompt === null ? await d.dismiss() : await d.accept(page.respuestaPrompt); }
    else if (d.type() === 'confirm') { page.respuestaConfirm ? await d.accept() : await d.dismiss(); }
    else await d.accept();
  });
  page.api = { users: {}, pro: false, calls: [] };
  await page.route('**/api/**', apiMock(page.api));
  await page.goto(BASE); await page.waitForTimeout(450);
  page.cdp = o.touch ? await ctx.newCDPSession(page) : null;
  page.touch = o.touch; page.ctx = ctx;
  return page;
}
const ev = (page, fn, arg) => page.evaluate(fn, arg);
async function cerrar(page) { const e = page.errores.slice(); await page.ctx.close(); check(e.length === 0, 'errores en la página: ' + e.join(' | ')); }

// Punto de la pista (unidades de pista) → píxel de pantalla.
async function px(page, x, y) { return ev(page, ([x, y]) => { const s = toScreen(x, y); return [s.x, s.y + CVTOP]; }, [x, y]); }
// Trazo con un dedo (o el ratón) por una lista de puntos de pista.
async function trazo(page, ptsCourt, opts = {}) {
  const pts = []; for (const [x, y] of ptsCourt) pts.push(await px(page, x, y));
  if (page.touch && !opts.raton) {
    const T = (type, p) => page.cdp.send('Input.dispatchTouchEvent', { type, touchPoints: p ? [{ x: p[0], y: p[1] }] : [] });
    await T('touchStart', pts[0]);
    for (let i = 1; i < pts.length; i++) for (let k = 1; k <= 4; k++) await T('touchMove', [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k / 4, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k / 4]);
    await T('touchEnd');
  } else {
    if (opts.shift) await page.keyboard.down('Shift');
    await page.mouse.move(pts[0][0], pts[0][1]); await page.mouse.down({ button: opts.boton || 'left' });
    for (let i = 1; i < pts.length; i++) await page.mouse.move(pts[i][0], pts[i][1], { steps: 5 });
    await page.mouse.up({ button: opts.boton || 'left' });
    if (opts.shift) await page.keyboard.up('Shift');
  }
  await page.waitForTimeout(60);
}
// Varios dedos a la vez moviéndose en paralelo (pellizco, borrador de 3 dedos).
async function dedos(page, inicio, fin, pasos = 8) {
  const T = (type, ps) => page.cdp.send('Input.dispatchTouchEvent', { type, touchPoints: ps.map((p, i) => ({ x: p[0], y: p[1], id: i })) });
  await T('touchStart', inicio);
  for (let k = 1; k <= pasos; k++) await T('touchMove', inicio.map((p, i) => [p[0] + (fin[i][0] - p[0]) * k / pasos, p[1] + (fin[i][1] - p[1]) * k / pasos]));
  await T('touchEnd', []); await page.waitForTimeout(120);
}
const st = (page) => ev(page, () => ({ n: strokes.length, tipos: strokes.map((s) => s.type), tool: S.tool, color: S.color, w: S.stroke, pro: IS_PRO, screen: currentScreen, zm: ZM, undo: !document.getElementById('btn-undo').disabled, redo: !document.getElementById('btn-redo').disabled }));
const visible = (page, sel) => ev(page, (sel) => { const e = document.querySelector(sel); if (!e) return false; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden'; }, sel);
const proAbierto = (page) => ev(page, () => document.getElementById('pro-modal').classList.contains('open'));
async function elegirHerramienta(page, t) {
  if (await visible(page, '#btn-tool-cur')) { await page.click('#btn-tool-cur'); await page.waitForTimeout(80); }
  await page.click('#btn-' + t); await page.waitForTimeout(60);
}
async function menuMas(page, etiqueta) {
  if (await visible(page, '#dd-more > .dd-btn')) { await page.click('#dd-more > .dd-btn'); await page.waitForTimeout(80); }
  await page.click(`#dd-more-menu .tb[aria-label="${etiqueta}"]`); await page.waitForTimeout(120);
}
const LINEA = [[150, 1500], [500, 1500], [850, 1500]];

// ───────────────────────── PRUEBAS
(async () => {
  await new Promise((r) => server.listen(PORT, r));
  browser = await chromium.launch({ channel: 'chrome' });
  console.log(`PADELBOARD · batería e2e (${new Date().toLocaleString('es-ES')})\n`);

  console.log('Carga y navegación');
  await T('carga limpia en gratis y en Pro, sin errores', async (cap) => {
    for (const pro of [false, true]) { const p = cap(await abrir({ pro })); check((await p.title()).includes('PADELBOARD'), 'título'); check(await visible(p, '#home'), 'no se ve el inicio'); await cerrar(p); }
  });
  await T('tutorial: sale la primera vez, 5 pantallas, Saltar lo cierra y no vuelve', async (cap) => {
    const p = cap(await abrir({ tut: false })); await p.waitForTimeout(900);
    check(await visible(p, '.tut-overlay.on'), 'no aparece el tutorial');
    for (let i = 0; i < 4; i++) { await p.click('[data-act="next"]'); await p.waitForTimeout(380); }
    check((await p.textContent('#tutPages')).trim() === '5 / 5', 'no llega a la 5/5');
    check((await p.textContent('[data-act="next"]')).trim() === 'Empezar', 'el último botón no dice Empezar');
    await p.click('[data-act="back"]'); await p.waitForTimeout(380);
    check((await p.textContent('#tutPages')).trim() === '4 / 5', 'Atrás no retrocede');
    await p.click('[data-act="skip"]'); await p.waitForTimeout(300);
    check(!(await visible(p, '.tut-overlay.on')), 'Saltar no lo cierra');
    await p.reload(); await p.waitForTimeout(900);
    check(!(await visible(p, '.tut-overlay.on')), 'reaparece tras recargar');
    await p.click('#btnTut'); await p.waitForTimeout(400);
    check(await visible(p, '.tut-overlay.on'), '«¿Cómo se usa?» no lo abre');
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    check(!(await visible(p, '.tut-overlay.on')), 'Escape no lo cierra');
    await cerrar(p);
  });
  await T('inicio: cada tarjeta abre su pantalla y «Inicio» vuelve', async (cap) => {
    const p = cap(await abrir({ pro: true }));
    const pasos = [['Pizarra 2D', 'board-screen'], ['Pizarras guardadas', 'boards-screen'], ['Generador de pista', 'gen-screen'], ['Configuración', 'config-screen']];
    for (const [t, scr] of pasos) {
      await p.click(`.feat-card:has-text("${t}")`); await p.waitForTimeout(200);
      check((await st(p)).screen === scr, `«${t}» no abre ${scr}`);
      if (scr === 'board-screen') await p.click('#board-tb .tb[aria-label="Volver al inicio"]'); else await p.click(`#${scr} .back-btn`);
      await p.waitForTimeout(200); check((await st(p)).screen === 'home', `no vuelve al inicio desde ${scr}`);
    }
    await p.click('.feat-card:has-text("Generador de secuencias")'); await p.waitForTimeout(250);
    check((await st(p)).screen === 'board-screen' && await visible(p, '#seq-panel.on'), 'secuencias no abre la barra');
    await cerrar(p);
  });
  await T('gratis: tarjetas Pro abren el muro Pro; «Ahora no» y tocar fuera lo cierran', async (cap) => {
    const p = cap(await abrir());
    for (const t of ['Generador de pista', 'Generador de secuencias']) {
      await p.click(`.feat-card:has-text("${t}")`); await p.waitForTimeout(150);
      check(await proAbierto(p), `«${t}» no abre el muro Pro`); check((await st(p)).screen === 'home', 'se ha ido del inicio');
      await p.click('.pro-btn-cancel'); await p.waitForTimeout(100); check(!(await proAbierto(p)), '«Ahora no» no cierra');
    }
    await p.click('#go-pro'); await p.waitForTimeout(100); check(await proAbierto(p), '«Hazte Pro» no abre');
    await p.mouse.click(195, 60); await p.waitForTimeout(100); check(!(await proAbierto(p)), 'tocar fuera no cierra');
    await cerrar(p);
  });
  await T('enlaces directos #board #boards #gen #seq', async (cap) => {
    const p = cap(await abrir({ pro: true }));
    for (const [h, scr] of [['board', 'board-screen'], ['boards', 'boards-screen'], ['gen', 'gen-screen'], ['seq', 'board-screen']]) {
      await p.goto(BASE + '#' + h); await p.reload(); await p.waitForTimeout(400); check((await st(p)).screen === scr, `#${h} no abre ${scr}`);
    }
    await cerrar(p);
  });
  await T('teclado: Enter en una tarjeta la activa', async (cap) => {
    const p = cap(await abrir()); await p.focus('.feat-card:has-text("Pizarras guardadas")'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    check((await st(p)).screen === 'boards-screen', 'Enter no abre'); await cerrar(p);
  });

  console.log('\nHerramientas de dibujo');
  await T('Pro: las 7 herramientas dibujan su tipo de trazo', async (cap) => {
    const p = cap(await abrir({ pro: true })); await ev(p, () => openBoard()); await p.waitForTimeout(250);
    const tipos = { pen: 'pen', pendash: 'pendash', line: 'line', arrow: 'arrow', rect: 'rect', dot: 'dot', cross: 'cross' };
    for (const t in tipos) {
      await elegirHerramienta(p, t); const s0 = await st(p); check(s0.tool === t, `no se selecciona ${t}`);
      const y = 300 + Object.keys(tipos).indexOf(t) * 200;
      await trazo(p, t === 'dot' || t === 'cross' ? [[500, y], [502, y]] : [[200, y], [500, y + 60], [800, y]]);
      const s1 = await st(p); check(s1.n === s0.n + 1 && s1.tipos[s1.n - 1] === tipos[t], `${t} no crea su trazo (${s1.tipos.join(',')})`);
    }
    const icono = await ev(p, () => document.getElementById('tool-cur-ic').innerHTML === document.querySelector('#btn-cross svg').outerHTML);
    check(icono, 'el botón del desplegable no muestra la herramienta elegida'); await cerrar(p);
  });
  await T('Pro: colores y grosores desde sus desplegables', async (cap) => {
    const p = cap(await abrir({ pro: true })); await ev(p, () => openBoard()); await p.waitForTimeout(250);
    for (const c of ['#ffffff', '#facc15', '#22c55e', '#ef4444', '#f97316', '#111111']) {
      await p.click('#dd-color > .dd-btn'); await p.waitForTimeout(60); await p.click(`#dd-color-menu .csw[data-c="${c}"]`); await p.waitForTimeout(60);
      check((await st(p)).color === c, 'color ' + c); check(!(await visible(p, '#dd-color.open')), 'el desplegable no se cierra');
    }
    for (const [id, w] of [['sw0', 2], ['sw2', 6], ['sw1', 3.5]]) { await p.click('#dd-stroke > .dd-btn'); await p.waitForTimeout(60); await p.click('#' + id); await p.waitForTimeout(60); check((await st(p)).w === w, 'grosor ' + w); }
    await p.click('#dd-color > .dd-btn'); await p.waitForTimeout(60); await p.click('#dd-stroke > .dd-btn'); await p.waitForTimeout(60);
    check(!(await visible(p, '#dd-color.open')) && await visible(p, '#dd-stroke.open'), 'abrir uno no cierra el otro');
    await p.mouse.click(195, 500); await p.waitForTimeout(80); check(!(await visible(p, '#dd-stroke.open')), 'tocar fuera no cierra el desplegable');
    await cerrar(p);
  });
  await T('gratis: lo bloqueado abre el muro Pro y no cambia nada; pista blanca', async (cap) => {
    const p = cap(await abrir()); await ev(p, () => openBoard()); await p.waitForTimeout(250);
    await p.click('#btn-tool-cur'); await p.waitForTimeout(80); await p.click('#btn-arrow'); await p.waitForTimeout(100);
    check(await proAbierto(p), 'herramienta Pro no abre el muro'); check((await st(p)).tool === 'pen', 'cambió la herramienta'); await p.click('.pro-btn-cancel');
    await p.click('#dd-color > .dd-btn'); await p.click('#dd-color-menu .csw[data-c="#ef4444"]'); await p.waitForTimeout(100);
    check(await proAbierto(p) && (await st(p)).color === '#111111', 'color Pro'); await p.click('.pro-btn-cancel');
    await p.click('#dd-stroke > .dd-btn'); await p.click('#sw2'); await p.waitForTimeout(100);
    check(await proAbierto(p) && (await st(p)).w === 3.5, 'grosor Pro'); await p.click('.pro-btn-cancel');
    await menuMas(p, 'Secuencia animada'); check(await proAbierto(p) && !(await visible(p, '#seq-panel.on')), 'REC en gratis'); await p.click('.pro-btn-cancel');
    const blanca = await ev(p, () => { const [x, y] = [toScreen(300, 700).x, toScreen(300, 700).y]; const d = ctx.getImageData(Math.round(x * DPR), Math.round(y * DPR), 1, 1).data; return d[0] > 240 && d[1] > 240 && d[2] > 240; });
    check(blanca, 'la pista gratis no es blanca'); await cerrar(p);
  });

  console.log('\nBorrar, deshacer y fichas');
  await T('goma: parte lápiz y flecha, borra el punto entero', async (cap) => {
    const p = cap(await abrir({ pro: true })); await ev(p, () => openBoard()); await p.waitForTimeout(250);
    await trazo(p, LINEA); await elegirHerramienta(p, 'arrow'); await trazo(p, [[150, 900], [850, 900]]);
    await elegirHerramienta(p, 'dot'); await trazo(p, [[500, 400], [501, 400]]);
    await p.click('#btn-eraser'); await p.waitForTimeout(60);
    await trazo(p, [[500, 1350], [500, 1650]]); await trazo(p, [[500, 750], [500, 1050]]); await trazo(p, [[500, 350], [500, 450]]);
    const s = await st(p); check(s.tipos.filter((t) => t === 'pen').length === 3, 'el lápiz no queda en 2 trozos (+1 del asta): ' + s.tipos);
    check(s.tipos.filter((t) => t === 'arrow').length === 1 && !s.tipos.includes('dot'), 'flecha/punto: ' + s.tipos); await cerrar(p);
  });
  await T('borrador de 3 dedos: solo por donde pasan', async (cap) => {
    const p = cap(await abrir({ pro: true })); await ev(p, () => openBoard()); await p.waitForTimeout(250);
    await trazo(p, LINEA); const a = await px(p, 450, 1300), b = await px(p, 550, 1300), c = await px(p, 500, 1300), fin = await px(p, 500, 1700);
    await dedos(p, [a, c, b], [[a[0], fin[1]], [c[0], fin[1]], [b[0], fin[1]]]);
    const s = await st(p); check(s.n === 2 && s.tipos.every((t) => t === 'pen'), '3 dedos no parte el trazo: ' + s.tipos); await cerrar(p);
  });
  await T('escritorio: botón derecho borra por donde pasa; Shift endereza a 45°', async (cap) => {
    const p = cap(await abrir({ pro: true, touch: false, w: 1280, h: 800 })); await ev(p, () => openBoard()); await p.waitForTimeout(250);
    await trazo(p, LINEA); await trazo(p, [[500, 1350], [500, 1650]], { boton: 'right' });
    check((await st(p)).n === 2, 'el botón derecho no parte el trazo');
    await elegirHerramienta(p, 'line'); await trazo(p, [[200, 300], [700, 380]], { shift: true });
    const ang = await ev(p, () => { const s = strokes[strokes.length - 1]; return Math.round(Math.atan2(s.y2 - s.y1, s.x2 - s.x1) * 180 / Math.PI); });
    check(ang % 45 === 0, 'Shift no endereza (ángulo ' + ang + '°)'); await cerrar(p);
  });
  await T('deshacer/rehacer: botones, estado activo y Ctrl+Z / Ctrl+Y', async (cap) => {
    const p = cap(await abrir({ pro: true, touch: false, w: 1280, h: 800 })); await ev(p, () => openBoard()); await p.waitForTimeout(250);
    let s = await st(p); check(!s.undo && !s.redo, 'arrancan activos');
    await trazo(p, LINEA); await trazo(p, [[150, 600], [850, 600]]); s = await st(p); check(s.n === 2 && s.undo && !s.redo, 'tras dibujar');
    await p.click('#btn-undo'); s = await st(p); check(s.n === 1 && s.redo, 'deshacer');
    await p.click('#btn-redo'); s = await st(p); check(s.n === 2 && !s.redo, 'rehacer');
    await p.keyboard.press('Control+z'); await p.keyboard.press('Control+z'); s = await st(p); check(s.n === 0 && !s.undo, 'Ctrl+Z');
    await p.keyboard.press('Control+y'); s = await st(p); check(s.n === 1, 'Ctrl+Y'); await cerrar(p);
  });
  await T('Más › Vaciar pizarra, y deshacer lo recupera', async (cap) => {
    const p = cap(await abrir({ pro: true })); await ev(p, () => openBoard()); await p.waitForTimeout(250);
    await trazo(p, LINEA); await trazo(p, [[150, 600], [850, 600]]); await menuMas(p, 'Vaciar pizarra');
    check((await st(p)).n === 0, 'no vacía'); await p.click('#btn-undo'); check((await st(p)).n === 2, 'deshacer no recupera'); await cerrar(p);
  });
  await T('fichas: se arrastran con el dedo y Más › Reiniciar fichas las devuelve', async (cap) => {
    const p = cap(await abrir()); await ev(p, () => openBoard()); await p.waitForTimeout(250);
    const p1 = await ev(p, () => ({ x: PLAYERS[0].cx, y: PLAYERS[0].cy }));
    await trazo(p, [[p1.x, p1.y], [400, 500], [500, 700]]);
    const mov = await ev(p, () => ({ x: Math.round(PLAYERS[0].cx), y: Math.round(PLAYERS[0].cy), n: strokes.length }));
    check(Math.abs(mov.x - 500) < 15 && Math.abs(mov.y - 700) < 15 && mov.n === 0, 'la ficha no sigue al dedo o dibuja: ' + JSON.stringify(mov));
    await menuMas(p, 'Reiniciar fichas'); const r = await ev(p, () => PLAYERS[0].cx + ',' + PLAYERS[0].cy);
    check(r === p1.x + ',' + p1.y, 'no vuelve a su sitio: ' + r); await cerrar(p);
  });
  await T('pellizco: amplía, nunca por debajo del tamaño completo, y no dibuja', async (cap) => {
    const p = cap(await abrir()); await ev(p, () => openBoard()); await p.waitForTimeout(250);
    const c = await px(p, 500, 1000); await dedos(p, [[c[0] - 30, c[1]], [c[0] + 30, c[1]]], [[c[0] - 120, c[1]], [c[0] + 120, c[1]]]);
    let s = await st(p); check(s.zm > 1.5 && s.n === 0, 'no amplía (ZM ' + s.zm + ') o dibujó');
    await dedos(p, [[c[0] - 150, c[1]], [c[0] + 150, c[1]]], [[c[0] - 10, c[1]], [c[0] + 10, c[1]]]);
    s = await st(p); check(s.zm >= 1 && s.zm < 1.05, 'reduce por debajo de 1 (ZM ' + s.zm + ')'); await cerrar(p);
  });

  console.log('\nGuardar y pizarras guardadas');
  await T('Más › Guardar jugada la añade a Pizarras guardadas', async (cap) => {
    const p = cap(await abrir()); await ev(p, () => openBoard()); await p.waitForTimeout(250); await trazo(p, LINEA);
    await menuMas(p, 'Guardar jugada'); await ev(p, () => goHome()); await p.click('.feat-card:has-text("Pizarras guardadas")'); await p.waitForTimeout(200);
    const items = await p.$$eval('.board-item .board-name', (e) => e.map((x) => x.textContent)); check(items.length === 1 && items[0].startsWith('Captura'), 'lista: ' + items); await cerrar(p);
  });
  await T('pizarras guardadas: guardar con nombre, cargar, renombrar, PNG y borrar', async (cap) => {
    const p = cap(await abrir()); await ev(p, () => openBoard()); await p.waitForTimeout(250); await trazo(p, LINEA);
    await ev(p, () => goHome()); await p.click('.feat-card:has-text("Pizarras guardadas")'); await p.fill('#board-name', 'Salida de saque'); await p.click('.boards-save .gen-btn-main'); await p.waitForTimeout(150);
    check((await p.textContent('.board-item .board-name')).includes('Salida de saque'), 'no aparece con su nombre');
    await ev(p, () => { strokes = []; }); await p.click('.board-item .board-act:has-text("Cargar")'); await p.waitForTimeout(250);
    let s = await st(p); check(s.screen === 'board-screen' && s.n === 1, 'cargar no restaura');
    await ev(p, () => openBoards()); p.respuestaPrompt = 'Bandeja y red';
    await p.click('.board-item .board-act[title="Renombrar"]'); await p.waitForTimeout(150);
    check((await p.textContent('.board-item .board-name')).includes('Bandeja y red'), 'no renombra');
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 4000 }), p.click('.board-item .board-act[title="Descargar imagen"]')]);
    const f = path.join(OUT, 'descarga.png'); await dl.saveAs(f); const sz = fs.statSync(f).size; fs.unlinkSync(f);
    check(dl.suggestedFilename() === 'Bandeja y red.png' && sz > 5000, 'PNG: ' + dl.suggestedFilename() + ' ' + sz + ' B');
    await p.click('.board-item .board-del'); await p.waitForTimeout(150);
    check((await p.$$('.board-item')).length === 0 && await visible(p, '.boards-empty'), 'no borra'); await cerrar(p);
  });
  await T('pizarras guardadas: una entrada dañada no rompe la lista', async (cap) => {
    const datos = JSON.stringify([{ name: 'Buena', date: Date.now(), strokes: [] }, { nombre: 'mala' }, null, { name: 'Seq rota', kind: 'seq', frames: 'x' }, { name: '<img src=x onerror=alert(1)>', date: Date.now(), strokes: [] }]);
    const p = cap(await abrir({ storage: { 'padel.boards': datos } })); await ev(p, () => openBoards()); await p.waitForTimeout(150);
    const items = await p.$$eval('.board-item .board-name', (e) => e.map((x) => x.textContent));
    check(items.length === 2 && items[0] === 'Buena', 'lista: ' + JSON.stringify(items));
    check(p.dialogos.length === 0 && (await p.$$('.board-name img')).length === 0, 'el nombre se interpreta como HTML'); await cerrar(p);
  });
  await T('sin espacio de almacenamiento: avisa y no se rompe', async (cap) => {
    const p = cap(await abrir()); await ev(p, () => openBoard()); await p.waitForTimeout(250); await trazo(p, LINEA);
    await ev(p, () => { const orig = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === 'padel.boards') { const e = new Error('lleno'); e.name = 'QuotaExceededError'; throw e; } return orig.call(this, k, v); }; });
    await menuMas(p, 'Guardar jugada'); const t = await p.textContent('#board-toast');
    check(/espacio/i.test(t), 'no avisa: «' + t + '»'); await cerrar(p);
  });

  console.log('\nSecuencias (Pro)');
  await T('secuencias: frames, anterior/siguiente, reproducir, bucle, velocidad, borrar', async (cap) => {
    const p = cap(await abrir({ pro: true })); await ev(p, () => openSequence()); await p.waitForTimeout(300);
    const pos = [[300, 400], [600, 800], [400, 1200]];
    for (const [x, y] of pos) { await ev(p, ([x, y]) => { PLAYERS[0].cx = x; PLAYERS[0].cy = y; draw(); }, [x, y]); await p.click('.seqb[title="Capturar frame"]'); await p.waitForTimeout(60); }
    check((await p.textContent('#seq-count')).trim() === '3/3', 'contador: ' + await p.textContent('#seq-count'));
    await p.click('.seqb[title="Frame anterior"]'); await p.waitForTimeout(60); check((await p.textContent('#seq-count')).trim() === '2/3', 'anterior');
    check((await ev(p, () => PLAYERS[0].cx)) === 600, 'anterior no coloca la ficha');
    await p.click('.seqb[title="Frame siguiente"]'); check((await p.textContent('#seq-count')).trim() === '3/3', 'siguiente');
    await p.fill('#seq-speed', '3'); await p.dispatchEvent('#seq-speed', 'input'); check((await ev(p, () => SEQ.speed)) === 3, 'velocidad');
    await p.click('#seq-play'); await p.waitForTimeout(100); check(await ev(p, () => SEQ.playing), 'no reproduce');
    await p.waitForTimeout(1300); check(!(await ev(p, () => SEQ.playing)) && (await ev(p, () => PLAYERS[0].cx)) === 400, 'no termina en el último frame');
    await p.check('#seq-loop'); await p.click('#seq-play'); await p.waitForTimeout(1500); check(await ev(p, () => SEQ.playing), 'el bucle se para'); await p.click('#seq-play');
    await p.click('.seqb.seq-del'); await p.waitForTimeout(80); check((await ev(p, () => SEQ.frames.length)) === 2, 'borrar frame');
    await p.click('.seqb.seq-x'); await p.waitForTimeout(150); check(!(await visible(p, '#seq-panel.on')), 'cerrar no oculta la barra'); await cerrar(p);
  });
  await T('secuencias: guardar en Pizarras guardadas y volver a abrirla; en gratis pide Pro', async (cap) => {
    const p = cap(await abrir({ pro: true })); await ev(p, () => openSequence()); await p.waitForTimeout(300);
    await p.click('.seqb[title="Capturar frame"]'); await ev(p, () => { PLAYERS[1].cx = 500; draw(); }); await p.click('.seqb[title="Capturar frame"]');
    p.respuestaPrompt = 'Globo y subida'; await p.click('.seqb[title="Guardar secuencia en Pizarras guardadas"]'); await p.waitForTimeout(100);
    await ev(p, () => { seqExit(); goHome(); openBoards(); }); await p.waitForTimeout(150);
    check((await p.textContent('.board-item')).includes('Secuencia'), 'no sale con la etiqueta Secuencia');
    await ev(p, () => { SEQ.frames = []; }); await p.click('.board-item .board-act:has-text("Abrir")'); await p.waitForTimeout(250);
    check(await visible(p, '#seq-panel.on') && (await ev(p, () => SEQ.frames.length)) === 2, 'no se reabre con sus frames');
    await ev(p, () => { seqExit(); setPro(false); openBoards(); }); await p.click('.board-item .board-act:has-text("Abrir")'); await p.waitForTimeout(150);
    check(await proAbierto(p), 'en gratis no pide Pro'); await cerrar(p);
  });
  await T('secuencias: tope de 50 frames y reproducir con menos de 2 avisa', async (cap) => {
    const p = cap(await abrir({ pro: true })); await ev(p, () => openSequence()); await p.waitForTimeout(250);
    await p.click('#seq-play'); check(/al menos 2/.test(await p.textContent('#board-toast')), 'no avisa con <2 frames');
    await ev(p, () => { for (let i = 0; i < 55; i++) seqAddFrame(); }); check((await ev(p, () => SEQ.frames.length)) === 50, 'pasa de 50'); await cerrar(p);
  });
  await T('escritorio: pantalla completa en secuencias y salir', async (cap) => {
    const p = cap(await abrir({ pro: true, touch: false, w: 1280, h: 800 })); await ev(p, () => openSequence()); await p.waitForTimeout(250);
    check(await visible(p, '#seq-fs'), 'no hay botón de pantalla completa'); await p.click('#seq-fs'); await p.waitForTimeout(150);
    check(!(await visible(p, '#board-tb')) && await visible(p, '#immersive-exit'), 'no entra en pantalla completa');
    await p.click('#immersive-exit'); await p.waitForTimeout(150); check(await visible(p, '#board-tb'), 'no sale'); await cerrar(p);
  });

  console.log('\nGenerador de pista (Pro)');
  await T('generador: colores, medidas, restablecer, usar en pizarra y SVG', async (cap) => {
    const p = cap(await abrir({ pro: true })); await ev(p, () => openGenerator()); await p.waitForTimeout(250);
    await p.$eval('#g-courtColor', (e) => { e.value = '#0a7f3f'; e.dispatchEvent(new Event('input')); });
    check((await ev(p, () => courtConfig.courtColor)) === '#0a7f3f', 'color de superficie');
    await p.$eval('#g-serviceOff', (e) => { e.value = '400'; e.dispatchEvent(new Event('input')); });
    check((await p.textContent('#g-serviceOff-v')).trim() === '4 m' && (await ev(p, () => { courtConfig.glassSide = 305; genLabel('glassSide'); return document.getElementById('g-glassSide-v').textContent; })) === '3,05 m', 'etiqueta de medida: ' + await p.textContent('#g-serviceOff-v'));
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 4000 }), p.click('.gen-btn-ghost:has-text("Descargar SVG")')]);
    const f = path.join(OUT, 'pista.svg'); await dl.saveAs(f); const svg = fs.readFileSync(f, 'utf8'); fs.unlinkSync(f);
    check(svg.startsWith('<svg') && svg.includes('#0a7f3f'), 'SVG no válido o sin el color');
    await p.click('.gen-btn-main:has-text("Usar en pizarra")'); await p.waitForTimeout(250);
    check((await st(p)).screen === 'board-screen', 'no vuelve a la pizarra');
    check((await ev(p, () => JSON.parse(localStorage.getItem('padel.courtConfig')).courtColor)) === '#0a7f3f', 'no guarda la pista');
    await ev(p, () => openGenerator()); await p.click('.gen-btn-ghost:has-text("Restablecer")');
    check((await ev(p, () => courtConfig.courtColor)) === '#3042c8', 'restablecer'); await cerrar(p);
  });

  console.log('\nConfiguración, cuenta y compra');
  await T('configuración: estado, tutorial y borrar datos (con confirmación)', async (cap) => {
    const p = cap(await abrir({ storage: { 'padel.boards': JSON.stringify([{ name: 'X', date: 1, strokes: [] }]) } })); await ev(p, () => openConfig()); await p.waitForTimeout(150);
    check((await p.textContent('#cfg-account-title')).trim() === 'Sin cuenta' && (await p.textContent('#cfg-pro-title')).trim() === 'Plan Gratis', 'estado inicial');
    await p.click('#cfg-pro-cta'); check(await proAbierto(p), '«Hazte Pro» no abre'); await p.click('.pro-btn-cancel');
    await p.click('.cfg-btn:has-text("Ver")'); await p.waitForTimeout(400); check(await visible(p, '.tut-overlay.on'), 'no abre el tutorial'); await p.keyboard.press('Escape');
    p.respuestaConfirm = false; await p.click('.cfg-btn-danger'); check((await ev(p, () => localStorage.getItem('padel.boards'))) !== null, 'borra aunque se cancele');
    p.respuestaConfirm = true; await p.click('.cfg-btn-danger'); check((await ev(p, () => localStorage.getItem('padel.boards'))) === null, 'no borra al aceptar');
    await cerrar(p);
  });
  await T('cuenta: validación, alta, sesión, cerrar sesión', async (cap) => {
    const p = cap(await abrir()); await ev(p, () => openConfig()); await p.click('#cfg-account-cta'); await p.waitForTimeout(100);
    check(await visible(p, '#account-modal.open'), 'no abre la cuenta');
    await p.fill('#acc-email', 'borja@ejemplo.es'); await p.fill('#acc-pass', 'corta'); await p.click('#account-modal .pro-btn-main');
    check(/mínimo 8/.test(await p.textContent('#acc-error')), 'no valida la contraseña');
    await p.fill('#acc-pass', 'segura1234'); await p.click('#account-modal .pro-btn-main'); await p.waitForTimeout(400);
    check(!(await visible(p, '#account-modal.open')), 'no cierra tras entrar'); check((await p.textContent('#cfg-account-title')).trim() === 'borja@ejemplo.es', 'no muestra el email');
    check(p.api.calls.some((c) => c.includes('users/records')), 'no crea la cuenta');
    await p.click('#cfg-account-cta'); await p.waitForTimeout(150); check((await p.textContent('#cfg-account-title')).trim() === 'Sin cuenta', 'no cierra sesión'); await cerrar(p);
  });
  await T('compra Pro: sin sesión pide cuenta, sigue al pago y al volver activa Pro', async (cap) => {
    const p = cap(await abrir()); p.api.users['ana@ejemplo.es'] = { id: 'u9', password: 'segura1234' };
    await p.click('#go-pro'); await p.click('.pro-btn-main'); await p.waitForTimeout(150);
    check(await visible(p, '#account-modal.open'), 'no pide cuenta');
    await p.fill('#acc-email', 'ana@ejemplo.es'); await p.fill('#acc-pass', 'segura1234'); p.api.pro = true;
    await Promise.all([p.waitForURL(/pro=ok/, { timeout: 5000 }), p.click('#account-modal .pro-btn-main')]);
    check(p.api.calls.some((c) => c.includes('/pro/checkout')), 'no llama al pago'); await p.waitForTimeout(2200);
    check((await st(p)).pro === true && !(await visible(p, '#go-pro')), 'al volver no queda en Pro'); await cerrar(p);
  });

  console.log('\nAutoguardado');
  await T('autoguardado: banner al volver, sobrevive a recargar, recuperar y descartar', async (cap) => {
    const p = cap(await abrir()); await ev(p, () => openBoard()); await p.waitForTimeout(250); await trazo(p, LINEA);
    await p.click('#board-tb .tb[aria-label="Volver al inicio"]'); await p.waitForTimeout(150);
    check(await visible(p, '#autosave-banner'), 'no sale el banner'); check(/1 trazo/.test(await p.textContent('#autosave-meta')), 'texto del banner');
    await p.reload(); await p.waitForTimeout(500); check(await visible(p, '#autosave-banner'), 'no sobrevive a recargar');
    await p.click('#autosave-banner'); await p.waitForTimeout(250); check((await st(p)).screen === 'board-screen' && (await st(p)).n === 1, 'recuperar');
    await ev(p, () => goHome()); await p.click('.as-dismiss'); await p.waitForTimeout(100); check(!(await visible(p, '#autosave-banner')), 'descartar'); await cerrar(p);
  });

  console.log('\nOrientación y pantallas');
  await T('pista fija: mismo sitio respecto al móvil en vertical y girado a cada lado', async (cap) => {
    const p = cap(await abrir({ pro: true })); await ev(p, () => { openBoard(); strokes = [{ type: 'dot', color: '#f00', w: 3.5, x1: 700, y1: 1300 }]; draw(); });
    const medir = (ang) => ev(p, (ang) => { const W = innerWidth, H = innerHeight, Wd = Math.min(W, H), Hd = Math.max(W, H); const d = (x, y) => { const s = toScreen(x, y), sy = s.y + CVTOP; return ang === 90 ? [Math.round(Wd - sy), Math.round(s.x)] : ang === 270 ? [Math.round(sy), Math.round(Hd - s.x)] : [Math.round(s.x), Math.round(sy)]; }; return JSON.stringify([d(700, 1300), PLAYERS.map((q) => d(q.cx, q.cy)), SC.toFixed(4)]); }, ang);
    const base = await medir(0);
    for (const ang of [90, 270]) { await ev(p, (a) => (window.__ang = a), ang); await p.setViewportSize({ width: 844, height: 390 }); await ev(p, () => dispatchEvent(new Event('resize'))); await p.waitForTimeout(200); check((await medir(ang)) === base, `se mueve al girar (${ang}°)`); const tb = await p.$eval('#board-tb', (e) => e.getBoundingClientRect().top); check(tb === 0, 'la barra no está arriba'); await p.setViewportSize({ width: 390, height: 844 }); await ev(p, () => { window.__ang = 0; dispatchEvent(new Event('resize')); }); }
    await cerrar(p);
  });
  await T('en horizontal el trazo cae bajo el dedo', async (cap) => {
    const p = cap(await abrir({ ang: 90, w: 844, h: 390 })); await ev(p, () => openBoard()); await p.waitForTimeout(250);
    await p.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 420, y: 230 }] });
    await p.cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 480, y: 230 }] });
    await p.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(80);
    const q = await ev(p, () => { const s = strokes[0].path[0], a = toScreen(s.x, s.y); return [Math.round(a.x), Math.round(a.y + CVTOP)]; });
    check(Math.abs(q[0] - 420) <= 1 && Math.abs(q[1] - 230) <= 1, 'cae en ' + q); await cerrar(p);
  });
  await T('barra en una fila y sin desbordar en 9 tamaños; sin scroll horizontal en ninguna pantalla', async (cap) => {
    for (const [w, h] of [[320, 568], [360, 740], [390, 844], [430, 932], [600, 960], [820, 1180], [1024, 1366], [844, 390], [1180, 820]]) {
      const p = cap(await abrir({ pro: true, w, h })); await ev(p, () => openBoard()); await p.waitForTimeout(200);
      const r = await ev(p, () => { const tb = document.getElementById('board-tb'); const kids = [...document.getElementById('board-r1').children].filter((e) => getComputedStyle(e).display !== 'none'); return { h: tb.offsetHeight, fuera: kids.some((e) => e.getBoundingClientRect().right > innerWidth + 0.5) }; });
      check(r.h <= 46 + 60 && !r.fuera, `${w}x${h}: barra de ${r.h}px o se sale`);
      for (const f of ['goHome', 'openBoards', 'openConfig']) { await ev(p, (f) => window[f](), f); const sc = await ev(p, () => document.querySelector('.screen.active').scrollWidth > innerWidth + 1); check(!sc, `${w}x${h}: scroll horizontal en ${f}`); }
      await cerrar(p);
    }
  });
  await T('accesibilidad: todos los botones de las barras tienen nombre', async (cap) => {
    const p = cap(await abrir({ pro: true })); const sin = await p.$$eval('#board-tb button, #seq-panel button, .back-btn', (bs) => bs.filter((b) => !(b.getAttribute('aria-label') || b.title || b.textContent.trim())).map((b) => b.outerHTML.slice(0, 60)));
    check(sin.length === 0, 'sin nombre: ' + sin.join(' | ')); await cerrar(p);
  });

  console.log('\nCasos límite');
  await T('goma: también parte línea, rectángulo y cruz', async (cap) => {
    const p = cap(await abrir({ pro: true })); await ev(p, () => openBoard()); await p.waitForTimeout(250);
    await elegirHerramienta(p, 'line'); await trazo(p, [[150, 400], [850, 400]]);
    await elegirHerramienta(p, 'rect'); await trazo(p, [[200, 800], [800, 1200]]);
    await elegirHerramienta(p, 'cross'); await trazo(p, [[500, 1600], [501, 1600]]);
    await p.click('#btn-eraser'); await trazo(p, [[500, 300], [500, 500]]); await trazo(p, [[500, 700], [500, 900]]); await trazo(p, [[500, 1580], [500, 1620]]);
    const s = await st(p); check(!s.tipos.includes('line') && !s.tipos.includes('rect') && s.tipos.every((t) => t === 'pen'), 'tipos tras borrar: ' + s.tipos);
    check(s.n >= 4, 'no deja los trozos de fuera: ' + s.n); await cerrar(p);
  });
  await T('historial: tope de 30 pasos y dibujar de nuevo anula «rehacer»', async (cap) => {
    const p = cap(await abrir({ pro: true })); await ev(p, () => openBoard()); await p.waitForTimeout(250);
    await ev(p, () => { for (let i = 0; i < 35; i++) { pushHistory(); strokes.push({ type: 'dot', color: '#000', w: 3, x1: 100 + i, y1: 100 }); } updateUndoUI(); });
    await ev(p, () => { for (let i = 0; i < 40; i++) undoStroke(); }); check((await st(p)).n === 5, 'deshace más de 30: quedan ' + (await st(p)).n);
    await p.click('#btn-redo'); await trazo(p, LINEA); check(!(await st(p)).redo, '«rehacer» sigue activo tras dibujar'); await cerrar(p);
  });
  await T('dos dedos durante un trazo: no deja el trazo a medias', async (cap) => {
    const p = cap(await abrir()); await ev(p, () => openBoard()); await p.waitForTimeout(250);
    const a = await px(p, 300, 1000), b = await px(p, 700, 1000);
    const T = (type, ps) => p.cdp.send('Input.dispatchTouchEvent', { type, touchPoints: ps.map((q, i) => ({ x: q[0], y: q[1], id: i })) });
    await T('touchStart', [a]); await T('touchMove', [[a[0] + 20, a[1]]]); await T('touchStart', [[a[0] + 20, a[1]], b]); await T('touchMove', [[a[0] + 10, a[1]], [b[0] + 40, b[1]]]); await T('touchEnd', []);
    await p.waitForTimeout(100); const s = await ev(p, () => ({ n: strokes.length, live: !!live, drawing: S.drawing }));
    check(!s.live && !s.drawing && s.n === 0, 'queda trazo vivo o se guardó: ' + JSON.stringify(s)); await cerrar(p);
  });
  await T('pizarras: cancelar renombrar o el nombre de la secuencia no cambia nada; nombre vacío = «Jugada N»', async (cap) => {
    const p = cap(await abrir({ pro: true })); await ev(p, () => openBoards()); await p.click('.boards-save .gen-btn-main'); await p.waitForTimeout(100);
    check((await p.textContent('.board-item .board-name')).trim() === 'Jugada 1', 'nombre por defecto');
    p.respuestaPrompt = null; await p.click('.board-item .board-act[title="Renombrar"]'); check((await p.textContent('.board-item .board-name')).trim() === 'Jugada 1', 'cancelar renombra');
    await ev(p, () => openSequence()); await p.waitForTimeout(200); await p.click('.seqb[title="Guardar secuencia en Pizarras guardadas"]'); check(/No hay frames/.test(await p.textContent('#board-toast')), 'guardar sin frames no avisa');
    await ev(p, () => { seqAddFrame(); seqAddFrame(); }); await p.click('.seqb[title="Guardar secuencia en Pizarras guardadas"]');
    check((await ev(p, () => boardsAll().length)) === 1, 'cancelar el nombre guarda igualmente');
    check((await p.getAttribute('#board-name', 'maxlength')) === '40', 'sin límite de longitud'); await cerrar(p);
  });
  await T('secuencias: borrar o salir en plena reproducción no la cuelga', async (cap) => {
    const p = cap(await abrir({ pro: true })); await ev(p, () => openSequence()); await p.waitForTimeout(250);
    await ev(p, () => { for (const x of [200, 500, 800]) { PLAYERS[0].cx = x; seqAddFrame(); } });
    await p.click('#seq-play'); await p.waitForTimeout(300); await p.click('.seqb.seq-del'); await p.waitForTimeout(400);
    check(!(await ev(p, () => SEQ.playing)), 'sigue reproduciendo tras borrar');
    await p.click('#seq-play'); await p.waitForTimeout(200); await p.click('.seqb.seq-x'); await p.waitForTimeout(300);
    check(!(await ev(p, () => SEQ.playing)) && !(await visible(p, '#seq-panel.on')), 'salir no para'); await cerrar(p);
  });
  await T('descargar PNG de una secuencia guardada (primer frame)', async (cap) => {
    const p = cap(await abrir({ pro: true })); await ev(p, () => { openSequence(); seqAddFrame(); seqAddFrame(); }); p.respuestaPrompt = 'Jugada animada';
    await p.click('.seqb[title="Guardar secuencia en Pizarras guardadas"]'); await ev(p, () => { seqExit(); openBoards(); });
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 4000 }), p.click('.board-item .board-act[title="Descargar imagen"]')]);
    check(dl.suggestedFilename() === 'Jugada animada.png', 'nombre: ' + dl.suggestedFilename()); await cerrar(p);
  });
  await T('generador: medidas extremas no tapan la puerta ni rompen el dibujo', async (cap) => {
    const p = cap(await abrir({ pro: true })); await ev(p, () => openGenerator()); await p.waitForTimeout(200);
    for (const [id, v] of [['g-wall', 40], ['g-glassSide', 600], ['g-meshSide', 700], ['g-serviceOff', 450]]) await p.$eval('#' + id, (e, v) => { e.value = v; e.dispatchEvent(new Event('input')); }, v);
    await p.click('.gen-btn-main:has-text("Usar en pizarra")'); await p.waitForTimeout(250); check((await st(p)).screen === 'board-screen', 'no aplica');
    for (const [id, v] of [['g-wall', 6], ['g-glassSide', 100], ['g-meshSide', 100], ['g-serviceOff', 200]]) { await ev(p, () => openGenerator()); await p.$eval('#' + id, (e, v) => { e.value = v; e.dispatchEvent(new Event('input')); }, v); }
    await cerrar(p);
  });
  await T('cuenta: contraseña errónea de un email existente da un mensaje claro; cancelar cierra', async (cap) => {
    const p = cap(await abrir()); p.api.users['ana@ejemplo.es'] = { id: 'u9', password: 'buenabuena1' };
    await ev(p, () => openAccount()); await p.fill('#acc-email', 'ana@ejemplo.es'); await p.fill('#acc-pass', 'malamala12'); await p.click('#account-modal .pro-btn-main'); await p.waitForTimeout(400);
    const msg = (await p.textContent('#acc-error')).trim(); check(msg.length > 0 && !/^Un momento/.test(msg), 'mensaje: «' + msg + '»');
    check(!/ya existe/i.test(msg) || /contraseña/i.test(msg), 'mensaje confuso para una contraseña errónea: «' + msg + '»');
    await p.click('#account-modal .pro-btn-cancel'); check(!(await visible(p, '#account-modal.open')), 'cancelar no cierra'); await cerrar(p);
  });
  await T('compra: si el pago falla avisa y el botón vuelve a su texto', async (cap) => {
    const p = cap(await abrir()); p.api.users['ana@ejemplo.es'] = { id: 'u9', password: 'segura1234' };
    await ev(p, () => { localStorage.setItem('padel.token', 'tok-u9'); localStorage.setItem('padel.uid', 'u9'); });
    await p.unroute('**/api/**'); await p.route('**/api/**', (r) => r.request().url().includes('/pro/checkout') ? r.fulfill({ status: 500, body: '{}' }) : apiMock(p.api)(r));
    await p.click('#go-pro'); await p.click('.pro-btn-main'); await p.waitForTimeout(500);
    check(p.dialogos.some((d) => /pago/i.test(d)), 'no avisa del fallo'); check(/Comprar Pro/.test(await p.textContent('#pro-modal .pro-btn-main')), 'el botón se queda en «Abriendo pago…»'); await cerrar(p);
  });
  await T('tutorial: se pasa deslizando el dedo', async (cap) => {
    const p = cap(await abrir({ tut: false })); await p.waitForTimeout(900);
    await dedos(p, [[330, 400]], [[60, 400]], 10); await p.waitForTimeout(400);
    check((await p.textContent('#tutPages')).trim() === '2 / 5', 'deslizar no pasa: ' + await p.textContent('#tutPages')); await cerrar(p);
  });
  await T('gratis: #gen y #seq por enlace directo abren el muro Pro, no la función', async (cap) => {
    const p = cap(await abrir()); for (const h of ['gen', 'seq']) { await p.goto(BASE + '#' + h); await p.reload(); await p.waitForTimeout(400); check((await st(p)).screen === 'home' && await proAbierto(p), '#' + h + ' en gratis'); await ev(p, () => closePro()); }
    await cerrar(p);
  });
  await T('girar a mitad de un trazo lo cancela sin dejar restos', async (cap) => {
    const p = cap(await abrir()); await ev(p, () => openBoard()); await p.waitForTimeout(250);
    const a = await px(p, 300, 1000); await p.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a[0], y: a[1] }] });
    await p.cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: a[0] + 50, y: a[1] }] });
    await ev(p, () => (window.__ang = 90)); await p.setViewportSize({ width: 844, height: 390 }); await ev(p, () => dispatchEvent(new Event('resize'))); await p.waitForTimeout(150);
    await p.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(100);
    const s = await ev(p, () => ({ n: strokes.length, live: !!live, d: S.drawing })); check(s.n === 0 && !s.live && !s.d, 'restos: ' + JSON.stringify(s)); await cerrar(p);
  });

  console.log('\nModo pruebas');
  await T('modo pruebas (/beta/): interruptor Pro, datos aparte y cachés separadas', async (cap) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const p = cap(await ctx.newPage()); p.ctx = ctx; p.errores = []; p.on('pageerror', (e) => p.errores.push('JS: ' + e.message));
    await p.route('**/api/**', apiMock({ users: {}, pro: false, calls: [] }));
    await p.goto(BASE); await ev(p, () => { localStorage.setItem('padel.tutDone', '1'); localStorage.setItem('padel.boards', JSON.stringify([{ name: 'REAL', date: 1, strokes: [] }])); });
    await ev(p, () => navigator.serviceWorker.ready); await p.reload(); await p.waitForTimeout(400);
    await p.goto(BASE.replace('/index.html', '/beta/index.html')); await ev(p, () => localStorage.setItem('padel.tutDone', '1')); await p.reload(); await p.waitForTimeout(500);
    check(await visible(p, '#dev-pro') && /PRUEBAS/.test(await p.textContent('#dev-pro')), 'no sale el interruptor PRUEBAS');
    await p.click('#dev-pro'); check(await ev(p, () => IS_PRO), 'el interruptor no activa Pro');
    await ev(p, () => openBoards()); check((await p.$$('.board-item')).length === 0, 've las pizarras de la app real');
    await ev(p, () => openBoard()); check(!(await visible(p, '#dev-pro')), 'el interruptor tapa la pizarra');
    await ev(p, () => { strokes = [{ type: 'dot', color: '#000', w: 3, x1: 1, y1: 1 }]; boardScreenshot(); });
    const k = await ev(p, () => { const out = []; for (let i = 0; i < localStorage.length; i++) out.push(localStorage.key(i)); return out.sort().join(','); });
    check(k.includes('padelbeta.boards') && k.includes('padel.boards'), 'claves: ' + k);
    check((await ev(p, () => JSON.parse(localStorage.getItem('padel.boards')).length)) === 1, 'lee mal sus propios datos');
    await ev(p, () => navigator.serviceWorker.ready); await p.waitForTimeout(600);
    const cachesK = await ev(p, () => caches.keys().then((k) => k.join(',')));
    check(/padelboard-v\d+/.test(cachesK) && /padelboard-beta-v\d+/.test(cachesK), 'una caché borra a la otra: ' + cachesK);
    const e = p.errores; await ctx.close(); check(e.length === 0, e.join(' | '));
  });

  console.log('\nSin conexión');
  await T('sin conexión: tras la primera visita abre y dibuja', async (cap) => {
    const p = cap(await abrir({ sw: true })); await ev(p, () => navigator.serviceWorker.ready); await p.reload(); await p.waitForTimeout(600);
    await p.ctx.setOffline(true); await p.reload(); await p.waitForTimeout(500);
    check(await visible(p, '#home'), 'no abre sin red'); await ev(p, () => openBoard()); await p.waitForTimeout(200); await trazo(p, LINEA);
    check((await st(p)).n === 1, 'no dibuja sin red'); await p.ctx.setOffline(false); await cerrar(p);
  });

  // ───────── resumen
  await browser.close(); server.close();
  const fallos = results.filter((r) => !r.ok);
  console.log(`\n${results.length - fallos.length}/${results.length} pruebas superadas` + (fallos.length ? `, ${fallos.length} fallos:` : '.'));
  fallos.forEach((f) => console.log('  ✘ ' + f.name + '\n      ' + f.err));
  fs.writeFileSync(path.join(OUT, 'resultado.json'), JSON.stringify({ fecha: new Date().toISOString(), results }, null, 2));
  process.exit(fallos.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
