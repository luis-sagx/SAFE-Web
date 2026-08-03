---
version: 1.0
name: safe-web-design
description: Sistema de diseño de la plataforma de entrenamiento anti-fraude. Lienzo blanco puro con tinta casi negra (#171717); el único voltaje de marca es verde profundo (#006837) para las acciones primarias, discreto y editorial. Tipografía Inter en pesos moderados (display 600, cuerpo 400). Solo modo claro. Implementado con Tailwind CSS v4 mediante variables de tema en `@theme`. Adaptado de un análisis del sitio de Expo, despojado de sus superficies oscuras y de todo lo propio de una web de marketing.
mode: light-only
framework: tailwind-v4
---

# Sistema de diseño

Este documento define los tokens y las recetas de clases de la plataforma.
Es la referencia visual para cualquier persona o agente de IA que construya
pantallas o escenarios aquí.

**Dos reglas que gobiernan todo el documento:**

1. **Solo modo claro.** No hay tema oscuro ni superficies oscuras. Nada de
   `dark:` en las clases, nada de `prefers-color-scheme`.

   **Única excepción: el interior de un escenario.** Un escenario que simula
   WhatsApp, una llamada o una app bancaria debe *parecerse a esa app*, y varias
   son oscuras. Esa apariencia vive en el `.module.css` del escenario y no usa
   los tokens de este documento. Todo lo que rodea al escenario —acceso,
   dashboard, listado de secciones, encabezados y botones de navegación— sí es
   modo claro y sí usa los tokens.
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
  --color-muted: #999999;
  --color-muted-soft: #cccccc;
  --color-link: #006837;

  /* Superficies */
  --color-canvas: #ffffff;
  --color-canvas-soft: #fafafa;
  --color-surface: #ffffff;
  --color-surface-strong: #f0f0f3;

  /* Líneas */
  --color-hairline: #f0f0f3;
  --color-hairline-soft: #f5f5f7;
  --color-hairline-strong: #dcdee0;

  /* Ambiente: solo detrás del hero de la portada */
  --color-mint-light: #d9ede2;
  --color-mint-mid: #a9d1ba;

  /* Semántico */
  --color-success: #16a34a;
  --color-danger: #b4342f;
  --color-warning: #ab6400;

  /* Tipografía */
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
```

Declarar un color acá genera automáticamente `bg-*`, `text-*`, `border-*`.
`--color-ink` habilita `text-ink`, `bg-ink`, `border-ink`.

**Nunca** escribas `text-[#171717]` ni `style={{ color: '#171717' }}`. Si un
color no existe como token, agrégalo a `@theme` primero.

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

`primary` sobre blanco da **6.8:1**: cumple AA para texto normal y AAA para
texto grande. Blanco sobre `primary`, lo mismo. `primary-active` sobre blanco,
9.4:1.

### Superficies

| Token | Valor | Uso |
|---|---|---|
| `canvas` | `#ffffff` | Fondo de página. |
| `canvas-soft` | `#fafafa` | Banda alterna sutil. |
| `surface` | `#ffffff` | Tarjetas. |
| `surface-strong` | `#f0f0f3` | Insignias, botones secundarios, placas de icono. |

No hay superficies oscuras. La variante `feature-card-dark` del sistema
original **se eliminó**: contradice el modo claro único.

### Texto

| Token | Valor | Uso |
|---|---|---|
| `ink` | `#171717` | Títulos y énfasis. |
| `body` | `#60646c` | Texto corrido. |
| `muted` | `#999999` | Subtítulos, texto de ayuda. |
| `muted-soft` | `#cccccc` | Texto deshabilitado. |

### Líneas

`hairline` `#f0f0f3` (divisor por defecto) · `hairline-soft` `#f5f5f7` ·
`hairline-strong` `#dcdee0` (contorno de tarjetas y campos).

### Semántico

`success` `#16a34a` · `danger` `#b4342f` · `warning` `#ab6400`.

El rojo de error se oscureció respecto del original (`#eb8e90`): aquel no
alcanzaba contraste AA sobre blanco, y los mensajes de error de un formulario
tienen que leerse. Ver §7.

**`success` es más claro y saturado que `primary` a propósito.** En una
aplicación donde verde significa «acertaste», el verde del acierto no puede ser
el mismo verde del cromo. Aun así, §7 sigue exigiendo que el color nunca sea la
única señal: un resultado siempre lleva texto.

### Ambiente

`mint-light` `#d9ede2` + `mint-mid` `#a9d1ba`: el degradado suave detrás del
hero de la portada, y **solo ahí**. No es un color de marca.

```html
<div class="bg-gradient-to-b from-mint-light to-canvas">
```

---

## 3. Tipografía

**Inter** para todo; **JetBrains Mono** solo en superficies de código.
Ambas se cargan desde `frontend/index.html`.

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
| button | `text-sm font-medium` | Etiquetas de botón |

### Principios

- **El display se queda en peso 600.** Inter a 600 lee mejor que a 700.
- **Tracking negativo solo en display** (`tracking-tight`). El cuerpo va a 0.
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

- **Contraste AA como mínimo.** `body` (#60646c) sobre blanco da 5.7:1 ✓.
  `muted` (#999999) da 2.8:1 — **solo para texto de 18px o más, nunca para
  contenido**. `danger` (#b4342f) da 6.4:1 ✓.
- **Objetivos táctiles de 44px** en cualquier control de un escenario.
- **El color nunca es la única señal.** Un error lleva texto; un acierto lleva
  texto. Un escenario no puede depender de rojo/verde para comunicar su
  resultado.
- **Foco siempre visible.** No se elimina el contorno de foco sin reemplazarlo.
- **Etiquetas reales**, con `htmlFor` apuntando al `id` del campo. Un
  `placeholder` no es una etiqueta.

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
| `surface-dark`, `feature-card-dark`, `pricing-tier-featured`, `ide-mockup-card` | Superficies oscuras — se pidió solo modo claro. |
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

- Usar tokens de `@theme` mediante clases de utilidad.
- Reservar `bg-primary` (verde) para la acción principal de la pantalla — una
  sola por pantalla.
- Subrayar todo enlace en texto: es lo único que lo distingue de un botón.
- Botones y campos a `rounded-md` (8px); tarjetas a `rounded-lg` (12px).
- Mantener el cuerpo en 16px dentro de los escenarios.
- Etiquetar los campos con `<label htmlFor>`.

### No hacer

- No usar `dark:` ni consultas de esquema de color en la interfaz de la
  plataforma. La apariencia de una app simulada vive en el `.module.css` del
  escenario, nunca en tokens ni en utilidades de Tailwind.
- No usar hex en línea ni `style={{}}`. Si falta un color, agregarlo a `@theme`.
- No dejar un enlace en texto sin subrayar: en verde sin subrayado se lee como
  botón.
- No usar `rounded-full` en un botón. Las pastillas son de las insignias.
- No usar `text-muted` para contenido: no alcanza contraste a tamaño normal.
- No agregar un segundo nivel de sombra ni un segundo color de marca.
- No repetir el degradado de menta fuera del hero de la portada.
- No usar `primary` para señalar un acierto: eso es `success`, que es otro
  verde a propósito.
