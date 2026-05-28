# Paywall — Variantes de UI (mockups)

Tres mockups HTML standalone del modal Pro de la PWA. Son maquetas estaticas con datos hardcoded, NO integradas todavia. El objetivo es que Borja decida cual incorporar manana.

Paleta y tipografias replican la app real (`#0a0b0e` de fondo, `#00e5a0` acento verde, `#0099ff` acento azul, DM Sans + Bebas Neue). No dependen de frameworks ni de assets externos salvo Google Fonts.

Cada fichero abre con doble clic en navegador. El boton CTA y los secundarios disparan `alert()` para ilustrar el enganche con la logica real (`buy()`, `dev()`, `trial()`, `restore()`, `stayFree()`, `goBack()`).

## Variante A — Modal centrado mejorado (`variante-a-modal.html`)

Iteracion directa del modal actual. Mismo patron mental para el usuario (overlay + tarjeta), pero con mejor jerarquia visual: icono de candado abierto en cabecera, lista de 4 features con check en degradado verde-azul, fila de precio con etiqueta "LANZAMIENTO", CTA principal degradada y boton "Activar (modo dev)" en estilo dashed para que se vea claramente que es un atajo temporal de pruebas. Soporta cerrar por X, click fuera y tecla Esc.

**Pros**: cambio minimo respecto a lo que ya tiene el usuario, riesgo bajo, integracion trivial (se sustituye el `.pro-sheet` actual). Funciona igual de bien en movil y desktop. Mantiene el flujo: el usuario ve la app debajo y entiende que es opcional.

**Contras**: sigue siendo un modal "generico" en aspecto. No vende tan bien como podria; quien dude antes de pagar 1 EUR no encontrara informacion extra que le convenza.

## Variante B — Bottom-sheet movil estilo Apple (`variante-b-sheet.html`)

Hoja inferior con drag-handle real (touch + raton), que arranca al 60% de alto y se puede expandir al 92% arrastrando hacia arriba, o cerrar arrastrando hacia abajo (umbral < 30%). En desktop se centra como sheet flotante. Header con icono de pala, lista de features mas detallada (titulo + descripcion corta), y footer fijo con precio, CTA principal y dos secundarios: trial de 7 dias y restaurar compra. Se ajusta a safe-area-inset-bottom para iPhone con notch.

**Pros**: patron nativo iOS/Android que Borja reconocera de cualquier app moderna; muy comodo con el pulgar; permite mostrar mas features sin saturar (scroll interno + expansion). El boton "restaurar compra" prepara el terreno para cuando exista compra real de App Store. Encaja con la regla "mobile-first" del CLAUDE.md.

**Contras**: el drag-to-dismiss requiere mantener la implementacion en JS y testear bien en iOS Safari (el caso historicamente mas frustrante con `touch-action`). El footer fijo come espacio en pantallas pequenas.

## Variante C — Pagina entera con tabla comparativa (`variante-c-pagina.html`)

Pantalla completa estilo landing page: hero con titulo con degradado y CTAs gemelas, tabla comparativa Gratis vs Pro con 7 filas (check / cross / texto destacado), seccion de 3 testimoniales ficticios con estrellas y avatares, y CTA final reforzada con precio destacado y etiqueta "-90%". Top bar fija con boton "Volver".

**Pros**: el formato landing es el que mejor convierte cuando el precio es bajo pero requiere justificarlo. La tabla comparativa elimina la duda "que pierdo si no pago" y los testimoniales (aunque sean placeholder) anaden prueba social. Sirve tambien como pagina externa enlazable desde web/redes.

**Contras**: rompe el flujo de la app: deja de sentirse como "estoy usando la pizarra" y se convierte en "estoy en una promo". Riesgo de rebote alto si el usuario solo queria probar una feature concreta. Testimoniales inventados pueden parecer poco serios; conviene reemplazarlos por reales o quitarlos antes de produccion. Mayor coste de mantenimiento (mas markup).

## Recomendacion

**Variante B (bottom-sheet)** es la mas alineada con la PWA tal como esta hoy: mobile-first, sensacion nativa, espacio para vender bien las features sin sacar al usuario del contexto. Permite escalar hacia trial / restore cuando llegue la pasarela real.

Si Borja quiere algo intermedio sin entrar a hacer drag handlers, **Variante A** es el camino mas seguro: misma UX que ya tiene, presentacion mas pulida.

**Variante C** la dejaria para una segunda iteracion ya con Design y precios definitivos, idealmente accesible tambien desde fuera de la app (`/pro` como ruta publica) para SEO y campanas. Mete demasiada friccion como paywall in-app por defecto.

## Ficheros

- `variante-a-modal.html`
- `variante-b-sheet.html`
- `variante-c-pagina.html`
