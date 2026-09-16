---
version: 2.0
name: safe-web-design
description: Sistema de diseño de la plataforma de entrenamiento anti-fraude. Lienzo blanco puro (o casi negro en oscuro) con tinta casi negra (o casi blanca); el único voltaje de marca es verde profundo (#006837 en claro, #2fbf71 en oscuro) para las acciones primarias, discreto y editorial. Tipografía Inter en pesos moderados (display 600, cuerpo 400). Cromo con tema claro y oscuro, elegible por la persona; los escenarios simulados quedan siempre fuera del tema. Implementado con Tailwind CSS v4 mediante variables de tema en `@theme`, redefinidas bajo `:root[data-tema="oscuro"]`. Adaptado de un análisis del sitio de Expo, despojado de todo lo propio de una web de marketing. La portada pública `/` extiende el sistema con un mundo propio —el boleto premiado: papel `ticket`, troquel `ticket-edge`, foil plateado raspable y titulares en Oswald condensado (`font-display`)— sin sustituir nada de lo anterior (§11).
mode: light-and-dark
framework: tailwind-v4
---

# Sistema de diseño

Este documento define los tokens y las recetas de clases de la plataforma.
Es la referencia visual para cualquier persona o agente de IA que construya
pantallas o escenarios aquí.

**Dos reglas que gobiernan todo el documento:**

1. **El cromo tiene tema claro y oscuro; los escenarios simulados no tienen
   ninguno de los dos.** La persona elige Sistema / Claro / Oscuro con
   `SelectorTema`, guardado en `localStorage` y aplicado con el atributo
   `data-tema` en `<html>`. Un componente de cromo nunca escribe `dark:` en su
   JSX: sigue el tema automáticamente porque usa clases de utilidad
   (`bg-surface`, `text-ink`…) que Tailwind resuelve a variables CSS, y esas
   variables son las que cambian bajo `:root[data-tema="oscuro"]` en
   `frontend/src/index.css`. Ver el detalle completo, con cada valor y su
   ratio de contraste, en
   `docs/superpowers/specs/2026-09-10-tema-oscuro-design.md`.

   **Excepción, y esta sí es absoluta: el interior de un escenario.** Un
   escenario que simula WhatsApp, una llamada o una app bancaria debe
   *parecerse a esa app*, no al tema que la persona eligió para la
   plataforma — varias son oscuras aunque el cromo esté en claro, y deben
   seguir siéndolo aunque el cromo pase a oscuro. Esa apariencia vive en el
   `.module.css` del escenario, en valores **literales**, y nunca en
   `var(--color-*)`: un escenario que referenciara un token del tema cambiaría
   de aspecto cuando la persona cambia de tema, que es justo lo que no debe
   pasar. El criterio para saber en qué lado de la frontera está un
   componente: **si se estiliza con un `.module.css`, es simulación y va en
   literales; si se estiliza con clases de utilidad de Tailwind, es cromo y
   sigue el tema.** Todo lo que rodea al escenario —acceso, dashboard, listado
   de secciones, encabezados y botones de navegación— es cromo y sí usa los
   tokens.

   **El marco exterior sí importa, y no es el mismo para todas las amenazas.**
   `EscenarioLayout` acepta `dispositivo: 'telefono' | 'escritorio'`. Un correo
   o una página web (phishing) se abren más en computador que en celular, así
   que usan el marco de escritorio —ventana ancha con barra de título y franja
   de tareas, en `DeviceScreen`—; SMS, llamadas y chats se quedan en el marco de
   celular, angosto y con esquinas redondeadas. La elección la hace
   `StoryEscenario` según `view.kind`, no cada escenario por separado.
2. **Tailwind primero.** Los tokens viven como variables de tema de Tailwind v4
   en `frontend/src/index.css`. En el JSX se usan clases de utilidad, nunca
   hex en línea ni estilos sueltos.

---

## 1. Tokens en Tailwind v4

Tailwind v4 se configura en CSS, no en `tailwind.config.js`. Todo el sistema
vive en el bloque `@theme` de `frontend/src/index.css`:

```css
@import 'tailwindcss';

@theme {
  /* Marca */
  --color-primary: #006837;
  --color-primary-active: #00522b;
  --color-on-primary: #ffffff;

  /* Texto */
  --color-ink: #171717;
  --color-body: #60646c;
  --color-muted: #63676e;
  --color-muted-soft: #a8acb3;
  --color-link: #006837;

  /* Superficies: levemente gris, no blanco puro — así surface (blanco de
     verdad) se separa de la página sin depender solo del borde. */
  --color-canvas: #f7f7f8;
  --color-canvas-soft: #eef0f1;
  --color-surface: #ffffff;
  --color-surface-strong: #f0f0f3;

  /* Líneas y bordes */
  --color-hairline: #e6e6ea;
  --color-hairline-soft: #f5f5f7;
  --color-hairline-strong: #dcdee0;
  --color-border-control: #7d828a;

  /* Ambiente: solo detrás del hero de la portada */
  --color-mint-light: #d9ede2;
  --color-mint-mid: #a9d1ba;

  /* Mundo de la portada (§11): papel del boleto, troquel y foil plateado.
     `ticket` es superficie de texto y entra en la verificación de contraste
     junto a las otras. El foil no tiene variante oscura a propósito. */
  --color-ticket: #f3efe4;
  --color-ticket-edge: #d6d0be;
  --color-foil-hi: #d3d6da;
  --color-foil-lo: #9aa0a7;
  --color-foil-ink: #1c2024;

  /* Semántico */
  --color-success: #16a34a;
  --color-success-ink: #0d7038;
  --color-on-success: #06210f;
  --color-danger: #b4342f;
  --color-on-danger: #ffffff;
  --color-warning: #945700;
  --color-on-warning: #ffffff;

  /* Velo de modal */
  --color-scrim: rgb(0 0 0 / 0.45);

  /* Tipografía */
  --font-display: 'Oswald', 'Arial Narrow', system-ui, sans-serif;
  --font-sans: 'Inter', -apple-system, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Radios */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  /* Sombra: un solo nivel */
  --shadow-card: 0 4px 12px rgba(0, 0, 0, 0.04);
}

:root[data-tema='oscuro'] {
  /* Solo tokens de color y la sombra. Valores completos y su ratio de
     contraste en el spec de tema oscuro §5. */
  --color-primary: #2fbf71;
  --color-primary-active: #25a862;
  --color-on-primary: #06170d; /* invierte: tinta oscura sobre relleno claro */
  --color-ink: #eef2f6;
  --color-body: #bcc5d0;
  --color-muted: #98a2ae;
  --color-muted-soft: #6b7480;
  --color-link: #4fd08a;
  --color-canvas: #0f1317;
  --color-canvas-soft: #161b21;
  --color-surface: #161b21;
  --color-surface-strong: #222932;
  --color-hairline: #1e242c;
  --color-hairline-soft: #171c22;
  --color-hairline-strong: #3a4450;
  --color-border-control: #697687;
  --color-mint-light: #13301f;
  --color-mint-mid: #2a5c3f;
  /* El boleto en oscuro es papel entintado, un punto más claro que el lienzo.
     `foil-*` no se redefine: un foil es plateado en cualquier luz. */
  --color-ticket: #171e1b;
  --color-ticket-edge: #33413a;
  --color-success: #3ddc84;
  --color-success-ink: #3ddc84;
  --color-on-success: #06170d;
  --color-danger: #f0736f;
  --color-on-danger: #2a0b0a;
  --color-warning: #e8a33d;
  --color-on-warning: #241705;
  --color-scrim: rgb(0 0 0 / 0.65);
  --shadow-card: 0 4px 12px rgba(0, 0, 0, 0.5);
}
```

Declarar un color acá genera automáticamente `bg-*`, `text-*`, `border-*`.
`--color-ink` habilita `text-ink`, `bg-ink`, `border-ink`. Como es una
variable CSS, no hace falta ningún prefijo `dark:` en el JSX: la misma clase
`bg-canvas` resuelve a un color distinto según `data-tema`.

**Nunca** escribas `text-[#171717]` ni `style={{ color: '#171717' }}`. Si un
color no existe como token, agrégalo a `@theme` primero — con su valor en
claro **y** en oscuro, y su ratio de contraste comprobado en las dos.

---

## 2. Color

### Marca

| Token | Valor | Uso |
|---|---|---|
| `primary` | `#006837` | Relleno del botón primario. Se usa con moderación. |
| `primary-active` | `#00522b` | Estado presionado. |
| `on-primary` | `#ffffff` | Texto sobre el botón verde. |
| `link` | `#006837` | Enlaces dentro de texto corrido. **Siempre subrayados.** |

`primary` es el único relleno de acción, y va con moderación: una acción
primaria por pantalla. No se introduce un segundo color de marca.

**`link` es el mismo verde que `primary`.** Lo que distingue un enlace de un
botón no es el color, es la forma: **los enlaces en texto van siempre
subrayados; verde sin subrayar es un botón.**

**Acento contenido con `link`:** además de los enlaces en texto, `link` puede
colorear un ícono pequeño (los íconos de categoría del dashboard, un ícono de
estado) o el borde de una tarjeta en `:hover`. Es el único lugar donde se
permite fuera del texto — nunca como color de fondo ni de borde en reposo.

`primary` sobre blanco da **6.9:1**: cumple AA para texto normal y AAA para
texto grande. `primary-active` sobre blanco, 9.4:1.

**En oscuro el botón primario invierte polaridad.** Ningún verde alcanza a la
vez 3:1 contra un lienzo oscuro y 4.5:1 bajo texto blanco con margen seguro,
así que `on-primary` pasa a ser tinta casi negra (`#06170d`) sobre un verde
más claro (`primary: #2fbf71`), como en Material 3. `text-on-primary` sigue
usándose exactamente igual en el JSX — solo el token cambia de significado
según el tema. `link`, en cambio, sí se separa de `primary` en oscuro
(`#4fd08a` contra `#2fbf71`): como texto necesita 4.5:1 y el relleno solo 3:1.
La regla del subrayado no cambia.

### Superficies

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `canvas` | `#f7f7f8` | `#0f1317` | Fondo de página. |
| `canvas-soft` | `#eef0f1` | `#161b21` | Banda alterna sutil, fondo de `:hover`, paneles con borde (p. ej. "Tu avance"). |
| `surface` | `#ffffff` | `#161b21` | Tarjetas, campos, menús. |
| `surface-strong` | `#f0f0f3` | `#222932` | Insignias, botones secundarios, placas de icono. |

En claro, `canvas` es levemente gris a propósito — no blanco puro — para que
`surface` (blanco de verdad) se lea como una tarjeta elevada sobre la página
en vez de fundirse con ella. En oscuro pasa lo contrario: `canvas` y
`surface` son casi el mismo tono, y lo que separa una tarjeta de la página es
su borde (`hairline-strong`), porque ahí ya no hay margen para bajar más el
fondo sin perder legibilidad.

### Texto

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `ink` | `#171717` | `#eef2f6` | Títulos y énfasis. |
| `body` | `#60646c` | `#bcc5d0` | Texto corrido. |
| `muted` | `#63676e` | `#98a2ae` | Subtítulos, texto de ayuda. **Nunca** para contenido. |
| `muted-soft` | `#a8acb3` | `#6b7480` | Placeholders, controles deshabilitados. **Nunca** para un rótulo: no es texto legible y está exento de contraste a propósito. |

### Líneas y bordes

`hairline` (divisor por defecto) · `hairline-soft` · `hairline-strong`
(contorno de tarjetas, decorativo, exento de 3:1 porque el contenido ya
delimita la tarjeta) · **`border-control`**, para cualquier borde que la
persona necesite *percibir* y no solo decorar: a diferencia de
`hairline-strong`, este sí cumple 3:1 (SC 1.4.11) contra las seis superficies
del sistema, en los dos temas. Dos usos:

- El borde en reposo de un `<input>`, `<select>` o `<textarea>` — es lo que
  hace visible dónde se puede escribir.
- El marco de un escenario simulado (`MARCO_TELEFONO` / `MARCO_ESCRITORIO` /
  `MARCO_ESCENA` en `EscenarioLayout.tsx`) — tiene que distinguirse de la
  página, no solo de una tarjeta vecina, y varios escenarios simulan una app
  oscura: con el cromo también en oscuro, `hairline-strong` (decorativo) se
  funde con los dos fondos oscuros a la vez.

### Semántico

`success` (relleno) es un verde vivo que solo cumple 1.4.11 (3:1) como objeto
gráfico, no como texto. Para texto existe **`success-ink`**, una variante
oscurecida a 4.5:1 — cae cerca de `primary` a propósito: cualquier verde que
llegue a 4.5:1 sobre blanco queda en esa franja, y el acierto se distingue por
el glifo y la palabra, no por el matiz (ver §7). `on-success`, `on-danger` y
`on-warning` son la tinta que va **encima** de cada relleno semántico — en
claro casi siempre blanco, en oscuro casi siempre tinta oscura sobre el verde
más claro de ese tema.

El rojo de error se oscureció respecto del sistema original de Expo
(`#eb8e90`): aquel no alcanzaba contraste AA sobre blanco, y los mensajes de
error de un formulario tienen que leerse.

**`success`/`success-ink` son más claros y saturados que `primary` a
propósito.** En una aplicación donde verde significa «acertaste», el verde del
acierto no puede ser el mismo verde del cromo. Aun así, §7 sigue exigiendo que
el color nunca sea la única señal: un resultado siempre lleva texto.

### Velo de modal

`scrim`: el fondo de un `<dialog>` o de un modal superpuesto. No es
`bg-ink/40` — en oscuro `ink` es casi blanco, y ese velo se aclararía en vez
de oscurecer el fondo. `scrim` es negro con una opacidad fija que sube en
oscuro (0.45 → 0.65) para leerse igual de sólido en los dos temas.

### Ambiente

`mint-light` `#d9ede2` + `mint-mid` `#a9d1ba`: el degradado suave detrás del
hero de la portada, y **solo ahí**. No es un color de marca.

```html
<div class="bg-gradient-to-b from-mint-light to-canvas">
```

**`mint-mid` es además el fondo de `::selection`,** con `ink` de tinta, en los
dos temas (`frontend/src/index.css`). El azul del navegador no viene de ningún
sistema; la selección también es diseño. Es el único uso de menta fuera del
hero.

### Papel y foil (portada)

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `ticket` | `#f3efe4` | `#171e1b` | El papel del boleto. Superficie de texto: `ink`, `body` y `muted` se verifican contra ella como contra las otras seis. |
| `ticket-edge` | `#d6d0be` | `#33413a` | Troquel, perforación punteada, filete impreso interior y filete que separa los contadores. Decorativo, exento de 3:1. |
| `foil-hi` / `foil-lo` | `#d3d6da` / `#9aa0a7` | (sin variante) | Las dos tintas del degradado plateado que se raspa. |
| `foil-ink` | `#1c2024` | (sin variante) | La tinta impresa encima del foil. 4.5:1 contra **los dos** extremos del degradado. |

**El foil no tiene tema.** Un foil plateado es plateado con cualquier luz, y
oscurecerlo dejaba el rótulo "Raspa aquí" por debajo de 4.5:1 sobre la parte
baja del degradado. Es la única excepción a «todo token de color lleva valor en
claro y en oscuro», y está cubierta por el test: `foil-ink/foil-hi` y
`foil-ink/foil-lo` viven en `FILLERS` de `frontend/src/index.test.ts`, y
`ticket` entró en `SURFACES`.

---

## 3. Tipografía

**Inter** para todo; **JetBrains Mono** en superficies de código y en los
folios y rótulos del boleto; **Oswald** (`font-display`), condensado, solo en
los titulares del mundo de la portada (§11). Inter y JetBrains Mono se cargan
desde `frontend/index.html`; Oswald va self-hosted desde `main.tsx`
(`@fontsource/oswald` 500/600/700).

| Rol | Clases Tailwind | Uso |
|---|---|---|
| display-xl | `text-5xl font-semibold tracking-tight leading-[1.1]` | Título de portada |
| display-lg | `text-4xl font-semibold tracking-tight leading-[1.15]` | Encabezado de sección |
| display-md | `text-2xl font-semibold tracking-tight` | Título de pantalla |
| display-sm | `text-xl font-semibold tracking-tight` | Título de grupo |
| title-md | `text-lg font-semibold` | Título de tarjeta |
| title-sm | `text-base font-semibold` | Etiqueta de lista |
| body-md | `text-base text-body leading-relaxed` | Cuerpo por defecto |
| body-sm | `text-sm text-body leading-relaxed` | Cuerpo secundario |
| caption | `text-[13px] text-muted` | Pies de foto |
| overline | `text-[11px] font-semibold uppercase tracking-[0.88px]` | Etiquetas de sección |
| code | `font-mono text-[13px]` | Código |
| poster-xl | `font-display text-5xl uppercase leading-[0.95] tracking-[0.01em]` (→ `sm:text-6xl lg:text-7xl`) | Titular de la portada |
| poster-lg | `font-display text-3xl uppercase tracking-[0.01em]` (→ `sm:text-4xl`) | Encabezado de sección de la portada |
| poster-md | `font-display text-2xl uppercase tracking-[0.01em]` | Título de paso o de boleto de video |
| folio | `font-mono text-sm uppercase tracking-[0.14em] text-muted` | Folio y etiqueta impresos del boleto |
| folio-contenido | `font-mono text-base uppercase tracking-[0.12em]` | Rótulo mono que **es** contenido (contadores, "Raspa el boleto") |
| button | `text-sm font-medium` | Etiquetas de botón |

### Principios

- **El display se queda en peso 600.** Inter a 600 lee mejor que a 700.
- **Tracking negativo solo en display** (`tracking-tight`). El cuerpo va a 0.
- **El condensado es solo titular.** `font-display` se usa en `<h1>`/`<h2>`/
  `<h3>` de la portada y en las ráfagas dentro del mensaje cebo. El cuerpo
  nunca va condensado: el público incluye adultos mayores.
- **Dos tamaños de mono, y ninguno a 13px.** Un rótulo mono que es contenido
  (un contador, una instrucción) va a 16px; uno que solo etiqueta (folio,
  número de remitente, pie institucional) va a 14px. `text-[13px]` queda
  reservado a `caption` y `code` fuera de este mundo.
- **En escenarios, el texto nunca baja de 16px.** El público incluye adultos
  mayores; `text-sm` se reserva para etiquetas y ayudas, jamás para el
  contenido de un escenario o una opción de decisión.

---

## 4. Espaciado y layout

Unidad base 4px — la escala nativa de Tailwind (`p-1` = 4px) ya coincide.

| Uso | Clase |
|---|---|
| Contenedor de página | `mx-auto max-w-5xl px-6 py-12` |
| Contenedor de lectura | `mx-auto max-w-2xl px-6` |
| Ritmo de sección | `py-16` (`py-24` en la portada) |
| Separación de tarjetas | `gap-4` |
| Interior de tarjeta | `p-5` (`p-8` en tarjetas grandes) |

El ritmo de 96px del sistema original se bajó a 64px (`py-16`): esta es una
aplicación, no una web de marketing, y el usuario debe llegar a los escenarios
sin desplazarse de más.

---

## 5. Formas y profundidad

| Radio | Token | Uso |
|---|---|---|
| 4px | `rounded-xs` | Etiquetas en línea |
| 6px | `rounded-sm` | Filas compactas |
| 8px | `rounded-md` | **Botones y campos de formulario** |
| 12px | `rounded-lg` | Tarjetas |
| 16px | `rounded-xl` | Contenedores grandes |
| 9999px | `rounded-full` | Solo insignias |

**Las pastillas completas son solo para insignias, nunca para botones.**

Un solo nivel de sombra: `shadow-card` en tarjetas interactivas al pasar el
mouse. Todo lo demás se separa con líneas de 1px.

---

## 6. Componentes

### Botones

```html
<!-- Primario -->
<button class="h-10 rounded-md bg-primary px-[18px] text-sm font-medium
               text-on-primary transition hover:bg-primary-active
               disabled:opacity-60">

<!-- Enlace en texto: subrayado, para no confundirse con un botón -->
<a class="font-medium text-link underline">

<!-- Secundario -->
<button class="h-10 rounded-md border border-hairline-strong bg-surface
               px-[17px] text-sm font-medium text-ink transition
               hover:bg-surface-strong">

<!-- Terciario (enlace) -->
<button class="text-sm font-medium text-link hover:underline">
```

### Campo de formulario

```html
<label class="block text-sm font-medium text-ink">Correo</label>
<input class="mt-1.5 h-11 w-full rounded-md border border-hairline-strong
              bg-surface px-4 text-base text-ink
              placeholder:text-muted-soft
              focus:border-ink focus:outline-none focus:ring-1
              focus:ring-ink" />
```

Altura 44px — objetivo táctil AAA. El foco engrosa el borde a tinta; **no** se
usa un anillo de color.

### Mensaje de error

```html
<p role="alert" class="mt-2 text-sm text-danger">
```

El error va debajo del campo que falló, no en un banner al inicio del
formulario: el usuario no técnico no relaciona un banner lejano con su campo.

### Tarjeta

```html
<div class="rounded-lg border border-hairline-strong bg-surface p-5">

<!-- Tarjeta enlazada (escenario, sección) -->
<a class="rounded-lg border border-hairline-strong bg-surface p-5 transition
          hover:-translate-y-0.5 hover:shadow-card">
```

### Insignia

```html
<span class="rounded-full bg-surface-strong px-2.5 py-1 text-[11px]
             font-semibold uppercase tracking-[0.88px] text-ink">
```

### Encabezado de pantalla

```html
<p class="text-[11px] font-semibold uppercase tracking-[0.88px] text-muted">
  Secciones disponibles
</p>
<h2 class="mt-1 text-2xl font-semibold tracking-tight text-ink">…</h2>
<p class="mt-2 max-w-xl text-base text-body">…</p>
```

---

## 7. Accesibilidad

El público objetivo son personas no técnicas, incluidos adultos mayores. Esto
no es opcional:

- **Contraste AA como mínimo, en los dos temas.** `body` da 4.85:1 en claro y
  8.19:1 en oscuro, mínimo sobre cualquiera de las seis superficies del
  sistema. `muted` da 4.64:1 / 5.52:1 — **nunca para contenido**, solo
  subtítulos y ayudas. `danger` da 4.94:1 / 5.02:1. `border-control` (el
  borde de un campo) da 3.16:1 / 3.09:1. Estos números no son una foto fija:
  `frontend/src/index.test.ts` los recalcula desde `index.css` en cada corrida
  y falla si algún par baja del mínimo — ver
  `docs/superpowers/specs/2026-09-10-tema-oscuro-design.md` §5 y §7.1 para la
  tabla completa y el razonamiento detrás de cada valor.
- **Objetivos táctiles de 44px** en cualquier control de un escenario.
- **El color nunca es la única señal.** Un error lleva texto; un acierto lleva
  texto. Un escenario no puede depender de rojo/verde para comunicar su
  resultado. Es también la razón por la que `success-ink` (el verde de texto)
  puede quedar cerca de `primary`: el acierto ya lo dice el glifo y la palabra.
- **Foco siempre visible.** No se elimina el contorno de foco sin reemplazarlo.
- **Etiquetas reales**, con `htmlFor` apuntando al `id` del campo. Un
  `placeholder` no es una etiqueta.
- **El selector de tema lleva texto, no solo ícono** (SC 1.4.1): "Sistema" /
  "Claro" / "Oscuro", no solo un sol y una luna.

---

## 8. Comportamiento responsivo

| Punto de quiebre | Ancho | Cambios |
|---|---|---|
| Móvil | < 640px | Título 48→30px; rejillas a 1 columna; contenedor `px-4` |
| Tablet | 640–1024px | Título 36px; rejillas a 2 columnas |
| Escritorio | > 1024px | Rejillas a 3 columnas; contenido tope 1024px |

Los escenarios que simulan un teléfono (chat, SMS, llamada) mantienen su ancho
de dispositivo en escritorio y pasan a pantalla completa en móvil.

---

## 9. Qué se quitó del sistema original

Este documento se adaptó de un análisis del sitio de Expo. Se eliminó todo lo
que no aplica:

| Eliminado | Motivo |
|---|---|
| `pricing-tier-featured`, `ide-mockup-card` | Chrome de marketing sin equivalente en una app de entrenamiento. |
| `device-mockup-card` (hero MacBook + iPhone) | Chrome de marketing de Expo. Acá el hero es texto y una acción. |
| `pricing-tier-card`, `ecosystem-tile`, `testimonial-card` | No existe precio, ecosistema ni testimonios en esta plataforma. |
| `footer-light` de 5 columnas | Una aplicación de entrenamiento no lleva pie de página de marketing. |
| `semantic-error` #eb8e90 | No alcanzaba contraste AA sobre blanco. Reemplazado por `danger` #b4342f. |
| Ritmo de sección de 96px | Bajado a 64px: aplicación, no sitio de marketing. |
| Negro #000000 como acción y azul #0d74ce como enlace | Reemplazados por verde #006837, el color de marca de la plataforma. |
| Tokens `sky-light` / `sky-mid` | Renombrados a `mint-light` / `mint-mid` con valores verdosos: «cielo» ya no describía el degradado. |

Se conservó lo que sí sirve: lienzo blanco, tinta #171717, un solo color de
acción usado con moderación, Inter 600/400, radios de 8px en botones y 12px en
tarjetas, y un solo nivel de sombra.

---

## 10. Reglas

### Hacer

- Usar tokens de `@theme` mediante clases de utilidad — eso es lo que hace que
  un componente de cromo siga el tema sin escribir una sola línea para ello.
- Reservar `bg-primary` (verde) para la acción principal de la pantalla — una
  sola por pantalla.
- Subrayar todo enlace en texto: es lo único que lo distingue de un botón.
- Botones y campos a `rounded-md` (8px); tarjetas a `rounded-lg` (12px).
- Mantener el cuerpo en 16px dentro de los escenarios.
- Etiquetar los campos con `<label htmlFor>`.
- Usar `border-control` (no `border-hairline-strong`) en el borde en reposo de
  cualquier `<input>`, `<select>` o `<textarea>` nuevo, y en el marco de
  cualquier escenario simulado nuevo.
- Usar `scrim` (no `bg-ink/40`) para el velo de un modal nuevo.
- Si agregas un token de color, dale valor en claro **y** en oscuro en el
  mismo cambio, y corre `npx vitest run src/index.test.ts` — ese archivo
  recalcula el contraste de los dos temas y falla si algo queda por debajo de
  AA.
- En la portada, construir sobre `Boleto.tsx`: papel, troquel y perforación
  salen de ahí (§11).
- Dar folio a todo boleto nuevo de la portada, en la serie que le toque y en
  orden de lectura.
- Reservar `font-display` (Oswald) para titulares de la portada y para las
  ráfagas del mensaje cebo.

### No hacer

- No escribir `dark:` en un componente de cromo. Si necesitas que algo cambie
  con el tema, es una variable en `@theme` / `:root[data-tema="oscuro"]`, no
  una clase condicional en el JSX.
- No usar `var(--color-*)` dentro de un `.module.css` de un escenario
  simulado: eso lo haría seguir el tema del cromo, y un escenario simulado
  nunca debe hacerlo (ver regla 1). Ahí los colores van en literal.
- No usar hex en línea ni `style={{}}` en el cromo. Si falta un color,
  agregarlo a `@theme`.
- No dejar un enlace en texto sin subrayar: en verde sin subrayado se lee como
  botón.
- No usar `rounded-full` en un botón. Las pastillas son de las insignias.
- No usar `text-muted` ni `text-muted-soft` para contenido: `muted-soft` está
  exento de contraste a propósito porque no es texto que haya que leer.
- No agregar un segundo nivel de sombra ni un segundo color de marca.
- No repetir el degradado de menta fuera del hero de la portada.
- No usar `primary` para señalar un acierto: eso es `success`/`success-ink`,
  que son otro verde a propósito.
- No usar `bg-ink/40` como velo de modal: en oscuro `ink` es casi blanco. Usa
  `scrim`.
- No poner una tarjeta (`bg-surface`) en la portada, ni una rejilla de boletos
  sueltos donde el contenido es una serie: eso es una tira perforada (§11).
- No usar `ticket`, `ticket-edge` ni `font-display` fuera de la portada: son el
  mundo de esa superficie, no tokens generales. Una pantalla interna nueva se
  hace con `surface` e Inter.
- No poner cuerpo de texto en condensado, ni un rótulo mono a 13px en la
  portada: contenido a 16px, etiqueta a 14px.
- No añadir un rótulo descriptivo encima de un titular. El folio es un
  identificador —no describe nada— y por eso puede ir arriba; una frase de
  ambientación en ese sitio es un kicker y no entra.
- No depender del raspado para revelar contenido: lo raspado vive siempre en el
  DOM y su botón equivalente está visible.

---

## 11. El mundo de la portada: el boleto premiado

Alcance: la portada pública `/` (`Portada.tsx`) y los componentes que solo ella
monta (`Boleto.tsx`, `BoletoRaspable.tsx`, `VideoCapacitacion.tsx`). Todo lo
demás de la aplicación sigue con el sistema de las secciones 1–10 sin cambio.
Este mundo **extiende** el sistema: usa los mismos tokens de tinta, de marca y
de foco, y solo añade papel, troquel, foil y una voz de titular.

La tesis: el fraude promete un premio; la persona raspa ese premio con el dedo
y debajo aparecen las señales que lo delataban. De ahí sale la materia —papel
de sorteo— y de ahí sale que el cebo del estafador esté compuesto con más
fuerza (condensado, versalitas, $1.200 a cuerpo de cartel) que la voz calmada
de SAFE-Web, que se queda en Inter y en `body`.

### El átomo

**La Regla del Boleto.** En la portada no hay tarjetas. Toda superficie de
contenido es un `Ticket`: papel (`bg-ticket`), troquel de 1px
(`border-ticket-edge`), esquinas a 12px (`rounded-lg`) y `shadow-card` — la
misma y única sombra del sistema, sin un segundo nivel. Nunca
`rounded-lg border-hairline-strong bg-surface` en esta página.

Tres planos, y el del medio es lo que hace que sea papel y no un rectángulo:

1. el papel con su sombra sobre el lienzo,
2. el **filete impreso** interior — `absolute inset-[5px] rounded-[7px] border
   border-ticket-edge opacity-60`, el marco que trae impreso un boleto de
   verdad,
3. el contenido.

**La Regla de la Perforación.** Lo que separa dos zonas dentro de un boleto es
una línea punteada (`border-dashed border-ticket-edge`), nunca un `hairline`.
Cuando esa línea es un troquel por el que el boleto se rompería, lleva sus dos
medias lunas: `Notches`, dos círculos de 20px rellenos de **`bg-canvas`** —del
lienzo, no del papel, porque son agujeros— montados a `-top-2.5` / `-bottom-2.5`
sobre la línea. El boleto que lleva muescas va `overflow-hidden`.

**La Regla de la Tira.** Un conjunto de hermanos es una tira perforada, no una
rejilla de boletos sueltos. Los siete módulos son siete `<li>` dentro de **un**
`Ticket`, separados por perforación con muescas (la primera fila sin muescas,
porque no hay nada arriba de lo que arrancarla); los tres pasos de "Así es un
módulo" son un boleto con `divide-dashed divide-ticket-edge`. Siete boletos
sueltos del mismo alto vuelven a ser el muro de tarjetas que esta portada
rechaza.

### El folio

**La Regla del Folio.** Cada boleto imprime su identificador en mono, versalitas,
`tracking-[0.14em]`, con la tinta en `text-ink` y el resto en `muted`:
`SMS-01` para el cebo, `GEN-00` para el video general, `MOD-01`…`MOD-07` para
los módulos. El folio **es el índice de la página**: se numera en orden de
lectura, es estable, y no describe ni adelanta nada. Un folio nunca es una
frase; si necesita adjetivos, no es un folio.

### El foil

El raspado es la única pieza con estado de todo el mundo. Reglas que la
sostienen:

- **Lo de debajo está siempre en el DOM.** El canvas es `aria-hidden` y solo
  tapa: un lector de pantalla lee las señales sin raspar. Sin canvas (jsdom,
  navegador sin 2d) el contenido se muestra revelado.
- **Todo gesto tiene su equivalente de teclado, visible y a la vista.** El
  botón "Revelar las señales" vive en el talón junto a la instrucción "Raspa el
  boleto"; no es un recurso escondido para lectores de pantalla. Altura mínima
  44px. Al revelarse, el talón entero desaparece: ya no queda nada que raspar.
- **El foil se pinta con los tokens**, leídos con `getComputedStyle` desde
  `--color-foil-*`, más grano de ruido (blanco 0.35 / negro 0.12): sin grano
  parece un degradado de software y no una lámina.
- **El dedo que arrastra en vertical sigue desplazando la página**
  (`touch-pan-y`). Un efecto de la portada no puede atrapar el scroll de un
  celular.

### La voz del cebo

Dentro del mensaje cebo, las ráfagas del estafador van en `font-display`
versalitas a `text-xl`/`text-2xl` sobre cuerpo Inter de 16px: la urgencia se
compone, no se colorea. Las tres señales marcadas usan `<mark>` con fondo
transparente y subrayado ondulado en `warning`
(`underline decoration-warning decoration-wavy decoration-2`) con su número
volado en mono — nunca un resaltado de fondo, que en oscuro se vuelve una
mancha. `warning` marca además lo pendiente: el sello "Sin grabar" es un
recuadro de 2px en `warning`, rotado `-4deg`, con su texto en `warning`; es el
único elemento del mundo que se sale de la vertical.

### Lo que este mundo no cambia

- El verde de marca sigue siendo el único relleno de acción (una por pantalla,
  y la portada repite la **misma** acción arriba y en el cierre) y la tinta de
  las anotaciones: los círculos numerados de las señales son `bg-primary` con
  `text-on-primary`.
- Enlaces de texto en `link` y **subrayados**, incluido el botón "Revelar".
- Ni un `dark:` en el JSX: el papel cambia porque cambia el token.
- Contraste AA en los dos temas, comprobado por `src/index.test.ts`.
- Radios, espaciado (`px-6`, `p-6`, `py-12`/`lg:py-20`) y sombra son los del
  sistema. El contenedor de la portada es `max-w-6xl`, un escalón por encima
  del `max-w-5xl` de las pantallas internas, porque el hero es de dos columnas
  (`lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]`, una sola columna por debajo
  de `lg`).
