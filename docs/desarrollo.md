# Padel PWA — guía de desarrollo y continuación

> Cómo seguir trabajando en este proyecto desde **otra máquina** (p. ej. la Torre SkyNET) sin romper nada.

## TL;DR — ¿Puedo continuar desde la Torre?

**Sí, sin problema.** Todo el código está en **GitHub `bpmaeso/PADELBOARD` (rama `main`)**. En la Torre:

```bash
git clone https://github.com/bpmaeso/PADELBOARD.git   # si no lo tienes
# o, si ya está la carpeta:
git pull origin main
```

Eso es lo único imprescindible. El resto de esta guía son matices.

## Reglas de oro para no liarla con 2 máquinas

1. **GitHub es la fuente de verdad.** Antes de empezar: `git pull origin main`. Al terminar: commit + `git push`.
2. **No edites el proyecto a la vez en el portátil y en la Torre.** La carpeta `C:\Users\jdlq1\SkyNET-Shared\...\PADELBOARD\` se **sincroniza con Syncthing**, e incluye `.git`. Si dos máquinas tocan git a la vez, Syncthing puede corromper el repo. Trabaja en **una a la vez** y sincroniza por `git pull`/`push`, no confíes en Syncthing para el `.git`.
3. **No uses los worktrees de `.claude/worktrees/`** (son temporales y específicos de la máquina del portátil; sus rutas absolutas no viajan). Trabaja en el directorio raíz del repo.

## Qué NO está en git (y por qué)

- `.claude/` está en `.gitignore`: incluye `settings.local.json` (permisos) y `launch.json` (servidor de preview). Cada máquina tiene su propia config de Claude → no hace falta moverlo.
- **Clave SSH del VPS** (`...\Desktop\jdlq10_server\SSH_privada_jdlq10.key`): no está en el repo. Según el ecosistema, las 3 instancias (VPS/portátil/Torre) comparten acceso con esa clave; en la Torre debe existir en su ruta equivalente para poder **desplegar**. Si no, el desarrollo del código va igual; solo el deploy necesita la clave.
- Datos de usuario de la app (pizarras, secuencias, config de pista): viven en el **localStorage del navegador**, no en el repo.

## Entorno

- **Stack**: HTML/CSS/JS vanilla, sin dependencias ni build. Se edita `index.html` (monolítico) directamente.
- **Preview local** (servidor estático para validar en navegador):
  ```bash
  python -m http.server 8099    # luego abrir http://localhost:8099
  ```
  > Si usas el preview de Claude Code, crea `.claude/launch.json` con un config `python -m http.server 8099` (puerto 8099). Para ver cambios recientes: borra el SW y caches del navegador (DevTools → Application → Service Workers → Unregister + Clear storage) o haz hard reload, porque el SW sirve cache-first.

## Flujo de trabajo (por feature)

1. `git pull origin main` y crea rama: `git checkout -b feat/x`.
2. Edita `index.html` / `sw.js`. **Sube la versión del SW** (`const CACHE = 'pizarra-padel-vN'`) en cada release para forzar refresco en clientes.
3. Valida en navegador (preview): dibujo, fichas, las funciones que toques, y consola sin errores.
4. Commit + push + PR + merge a `main`.
5. **Despliega** (ver abajo) y verifica en producción.
6. Actualiza `docs/` si cambia arquitectura, y el ECOSYSTEM_STATE del VPS.

## Despliegue (desde cualquier máquina con la clave SSH)

```bash
ssh -i <clave_jdlq10> ubuntu@143.47.33.174 "
  sudo git -C /opt/stacks/padel-pwa/app pull --ff-only origin main &&
  sudo rsync -a --delete --exclude='.git' --exclude='.claude' --exclude='docs' --exclude='CLAUDE.md' \
    /opt/stacks/padel-pwa/app/ /opt/stacks/caddy/static/padel/"
```

Caddy sirve los estáticos al vuelo (no hay que reiniciarlo). Verifica:

```bash
curl -s https://padel-jdlq10.mywire.org/sw.js | grep -m1 pizarra-padel-v
curl -s -o /dev/null -w '%{http_code}\n' https://padel-jdlq10.mywire.org/
```

## Batería de pruebas (auditoría funcional)

Para una auditoría, abrir la app en preview y verificar (manual o con `preview_eval`):

- **Navegación**: HOME → cada una de las 5 entradas y vuelta a Inicio.
- **Pizarra 2D**: las 8 herramientas dibujan; 6 colores; 3 grosores; arrastrar fichas; goma; **borrador 3 dedos**; vaciar; captura PNG; **zoom** (no baja del tamaño de pantalla, sin bordes negros).
- **Generador de pista**: cambiar colores/medidas (vista previa reacciona), "usar en pizarra" (persiste), reset, export SVG.
- **Generador de secuencias**: capturar ≥2 frames, reproducir (entra en inmersivo, fichas se mueven, para al final), velocidad/bucle.
- **Mis pizarras**: guardar con nombre, cargar (restaura trazos+fichas), borrar.
- **Pizarra 3D**: carga Three.js, renderiza, cámaras.
- **Casos límite**: sliders al máximo (puerta se conserva), goma sin trazos, 1 punto, pinch 2 dedos, resize/orientación.
- **Consola**: 0 errores.

## Comunicación entre máquinas

- ECOSYSTEM_STATE (VPS): `/opt/stacks/jdlq-agent/inbox/ECOSYSTEM_STATE.md` — leer al empezar, actualizar al cerrar.
- Canal Claude↔Claude: `notify_claude_target("torre"/"laptop", texto)` y `read_claude_inbox_for(...)`.
