---
version: 1.0
name: tema-oscuro
description: Tema oscuro opcional para el cromo de la plataforma, con control de tres estados (Sistema / Claro / Oscuro) y cumplimiento WCAG 2.2 nivel AA verificado por cálculo en ambos temas. Cierra de paso cuatro incumplimientos que el modo claro ya arrastra.
fecha: 2026-09-10
estado: aprobado
---

# Tema oscuro con control del usuario

## 1. Problema

La plataforma es solo modo claro por decisión de diseño (`docs/DESIGN.md`, regla 1).
Se quiere que el usuario pueda escoger claro u oscuro. El encargo añade una
condición dura: **el resultado debe cumplir WCAG 2.2 nivel AA en las dos
apariencias**, en todas las páginas y vistas.

Dos restricciones que no se negocian y que dan forma a todo lo demás:

1. **Los escenarios simulados no cambian.** Un correo falso del SRI, un chat de
   WhatsApp o la pantalla de un banco tienen que parecerse a lo que imitan. Si
   se recolorean con el tema del usuario, el entrenamiento pierde su razón de
   ser: la persona aprende a reconocer algo que ya no se parece al original.
2. **El contraste se demuestra, no se estima.** Cada par de color de este
   documento lleva su ratio calculado con la fórmula de luminancia relativa de
   WCAG. La matriz completa texto×superficie da **0 fallos en los dos temas**.

## 2. Estado del código, medido

El sistema de diseño ya está tokenizado, y eso cambia radicalmente el tamaño
del trabajo:

| Medida | Valor |
|---|---|
| Tokens de color en `@theme` (`frontend/src/index.css`) | 25 |
| Hex en línea en el cromo (`pages/`, `components/*.tsx`, `App.tsx`) | **0** |
| Clases de paleta cruda de Tailwind en el cromo | **2** (`text-white` en `components/ui/Tarea.tsx:18` y `components/ui/PanelVeredicto.tsx:172`) |
| Hex en línea en `secciones/` | 182 (todos, y ahí se quedan) |
| Tests que afirman clases de color | 0 |

Tailwind v4 compila `bg-primary` a `background-color: var(--color-primary)`.
Redefinir la variable bajo un selector basta: **ningún archivo del cromo cambia
sus clases**.

### 2.1 La frontera cromo / simulación

| Capa | Archivos | ¿Sigue el tema? |
|---|---|---|
| **Cromo** | Todo `pages/`, todo `components/*.tsx`, y 9 de `components/ui/`: `PanelVeredicto`, `AccionesFinal`, `Instrucciones`, `StoryChoices`, `TarjetaIdentidad`, `IndicadorProgreso`, `EtiquetaAprobacion`, `Tarea`, `ContextoEscenario` | **Sí** |
| **Simulación** | `components/ui/`: `DeviceScreen`, `DesktopChrome`, `Navegador`, `PantallaLlamada`, `NotaDeVoz`, `armazonSitio`, `carpetasCorreo`, `NotificacionTelefono`, `AvisoFinEscenario`, `RiskGauge`, `FlashOverlay`, `DossierHeader` — más todo `secciones/` | **No** |

El criterio operativo, para que no haya duda en una revisión futura: **si el
componente se estiliza con un `.module.css`, es simulación y se congela; si se
estiliza con clases de utilidad de Tailwind, es cromo y sigue el tema.** La
correspondencia es exacta hoy y es la regla que hay que mantener.

### 2.2 Fugas de token hacia la simulación

Dos archivos de simulación referencian tokens del tema y, sin corregirlos,
cambiarían de aspecto junto con el cromo:

- `src/secciones/fisico/fisico.module.css`
- `src/components/ui/DossierHeader.module.css`

Entre los dos usan `--color-primary` (4), `--color-warning` (3),
`--color-surface` (2), `--color-success` (2), `--color-muted` (2),
`--color-ink` (2), `--color-hairline` (2), `--color-body` (2),
`--color-surface-strong` (1), `--color-on-primary` (1),
`--color-hairline-strong` (1).

Se sustituyen por los valores literales que esos tokens tienen **hoy en modo
claro**, de modo que la apariencia actual de esos escenarios no se mueva ni un
píxel.

## 3. Incumplimientos WCAG que el modo claro ya tiene

Calculados sobre el `index.css` actual. No son consecuencia del tema oscuro:
existen hoy y se corrigen en este mismo trabajo.

| # | Par | Ratio actual | Requisito | Dónde |
|---|---|---|---|---|
| A | `success` `#16a34a` como texto sobre blanco | **3.30:1** | 4.5:1 — SC 1.4.3 | 9 usos de `text-success` |
| B | blanco sobre `bg-success` | **3.30:1** | 4.5:1 — SC 1.4.3 | `Tarea.tsx:18` (glifo ✓) y las insignias |
| C | `hairline-strong` `#dcdee0` como borde de campo | **1.35:1** | 3:1 — SC 1.4.11 | `Campo.tsx` y todo input derivado |
| D | `muted` `#6b6f76` sobre `surface-strong` `#f0f0f3` | **4.44:1** | 4.5:1 — SC 1.4.3 | rótulos dentro de insignias |

Un quinto grupo se revisó y **se declara conforme sin cambios**: los bordes
translúcidos (`border-link/40`, `border-danger/30`, `border-success/50`,
`border-warning/40`, `border-mint-mid`) dan entre 1.6:1 y 2.4:1, pero todos
acompañan a un texto que dice lo mismo. SC 1.4.11 se aplica a la información
visual *necesaria* para identificar un componente o su estado; aquí no lo es.
Se documenta para que una auditoría futura no lo reabra.

## 4. Mecanismo

### 4.1 Selector y variables

```css
/* frontend/src/index.css */
@import 'tailwindcss';

@theme {
  /* Tema claro: los valores de la columna "Claro" de §5. */
}

:root {
  color-scheme: light;
}

:root[data-tema='oscuro'] {
  color-scheme: dark;
  /* Solo se redefinen los tokens de color y --shadow-card.
     Tipografía, radios y espaciado no dependen del tema. */
}
```

`color-scheme` es obligatorio: sin él, la barra de desplazamiento, los
controles nativos (`<input type="date">`, `<select>`) y el fondo por defecto
del navegador se quedan en claro sobre una página oscura.

`@theme` no puede usarse dentro de un selector; por eso el bloque oscuro es CSS
plano que sobrescribe las mismas custom properties. Funciona porque las
utilidades de Tailwind v4 ya resuelven a `var()`.

### 4.2 Tres estados y persistencia

`localStorage['tema']` guarda `'sistema' | 'claro' | 'oscuro'`. Por defecto
`'sistema'`.

- `'sistema'` consulta `matchMedia('(prefers-color-scheme: dark)')` y **escucha
  el evento `change`**: si la persona cambia el tema del sistema operativo con
  la pestaña abierta, la página lo sigue.
- `'claro'` y `'oscuro'` fijan el atributo e ignoran el sistema.

Solo `localStorage`, sin backend. Razones: funciona antes del login (las
páginas `/`, `/registro`, `/verificar/:codigo` y `/politica-de-datos` son
públicas), no necesita migración de base de datos, y ya hay precedente del
patrón en `lib/api.ts` y `lib/pendingRuns.ts`.

Toda lectura y escritura va envuelta en `try/catch`: en una ventana privada o
con almacenamiento bloqueado, `localStorage` lanza, y el tema debe caer a
`'sistema'` en vez de romper el arranque de la aplicación.

### 4.3 Aplicación antes del primer pintado

React monta después de que el navegador pinta. Sin precaución, una persona con
preferencia oscura ve un destello blanco en cada carga. Se resuelve con un
script inline en `frontend/index.html`, antes de `<div id="root">`:

```html
<script>
  try {
    var t = localStorage.getItem('tema') || 'sistema'
    var oscuro =
      t === 'oscuro' ||
      (t === 'sistema' && matchMedia('(prefers-color-scheme: dark)').matches)
    if (oscuro) document.documentElement.dataset.tema = 'oscuro'
  } catch (e) {}
</script>
```

Es intencionadamente síncrono y bloqueante: son unos pocos microsegundos y es
lo único que garantiza que el atributo exista antes del primer pintado.

### 4.4 Contexto de React

`src/context/ThemeContext.tsx`, con el mismo patrón que `AuthContext`:

```ts
type Preferencia = 'sistema' | 'claro' | 'oscuro'

interface ThemeContextValue {
  preferencia: Preferencia        // lo que la persona escogió
  temaEfectivo: 'claro' | 'oscuro' // lo que se está mostrando ahora
  setPreferencia: (p: Preferencia) => void
}
```

`temaEfectivo` se expone porque hay consumidores que necesitan el valor
resuelto, no la preferencia: el `<Toaster>` de sonner y el componente de marca.

El provider se monta en `main.tsx`, **por fuera** de `AuthProvider`: el tema no
depende de la sesión y debe existir en las rutas públicas.

## 5. Los dos temas, token por token

Ratio mostrado como `claro / oscuro`. «min» significa el peor caso del token
contra las seis superficies del sistema (`canvas`, `canvas-soft`, `surface`,
`surface-strong`, `mint-light`, `signal`).

### 5.1 Superficies

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `canvas` | `#ffffff` | `#0f1317` | Fondo de página |
| `canvas-soft` | `#fafafa` | `#161b21` | Banda alterna, fondo de `:hover` |
| `surface` | `#ffffff` | `#161b21` | Tarjetas, campos, menús |
| `surface-strong` | `#f0f0f3` | `#222932` | Insignias, botón secundario, placas de icono |

En oscuro el escalón entre `canvas` y `surface` es deliberadamente pequeño
(1.08:1). La separación de una tarjeta la hace su borde, no su fondo — igual
que en claro, donde `canvas` y `surface` son ambos blanco puro. El sistema
mantiene su lógica; solo cambia de polaridad.

`#0f1317` en vez de negro puro: sobre `#000000` el texto claro produce halación
(el texto parece sangrar), y no queda margen para representar elevación.

### 5.2 Texto

| Token | Claro | Oscuro | min claro | min oscuro |
|---|---|---|---|---|
| `ink` | `#171717` | `#eef2f6` | 14.65 | 12.70 |
| `body` | `#60646c` | `#bcc5d0` | 4.85 | 8.19 |
| `muted` | **`#63676e`** | `#98a2ae` | 4.64 | 5.52 |
| `muted-soft` | `#a8acb3` | `#6b7480` | — | — |

`muted` sube de `#6b6f76` a `#63676e`: cierra el incumplimiento **D**.

`muted-soft` no lleva ratio porque no es texto legible. Su contrato, ya escrito
en `index.css`, es «placeholders, controles deshabilitados, separadores y
rellenos». Los controles inactivos están explícitamente exentos de SC 1.4.11, y
los placeholders no sustituyen a la etiqueta: `Campo.tsx` ya emite un `<label
htmlFor>` real en todos los casos. **Nunca debe usarse para un rótulo**, y esa
regla se mantiene palabra por palabra en `DESIGN.md`.

### 5.3 Marca y acción

| Token | Claro | Oscuro | Ratio |
|---|---|---|---|
| `primary` | `#006837` | `#2fbf71` | relleno |
| `on-primary` | `#ffffff` | **`#06170d`** | 6.92 / 7.76 |
| `primary-active` | `#00522b` | `#25a862` | 9.37 / 6.03 |
| `link` | `#006837` | `#4fd08a` | min 5.65 / 7.29 |

**El botón primario invierte su polaridad en oscuro.** No es una preferencia
estética; es aritmética. Un relleno verde sobre fondo oscuro tiene que cumplir
dos cosas a la vez: 3:1 contra el lienzo (SC 1.4.11, para que el botón se
distinga) y 4.5:1 bajo su texto (SC 1.4.3). Barriendo la rampa de verdes contra
`#0f1317`:

| Verde | vs lienzo | blanco encima |
|---|---|---|
| `#006837` (marca) | 2.70 ✗ | 6.92 ✓ |
| `#0b7a45` | 3.45 ✓ | 5.41 ✓ |
| `#118a4f` | 4.24 ✓ | **4.40 ✗** |
| `#17a05c` | 5.52 ✓ | 3.38 ✗ |

`#0b7a45` cumple las dos condiciones, pero por un margen tan estrecho (3.45 y
5.41) que cualquier ajuste posterior del lienzo lo rompe, y a esa luminosidad
el botón apenas se despega del fondo: se lee apagado, no sólido. La salida
robusta es la que usa Material 3 en su superficie oscura: **relleno verde claro
con tinta oscura encima**. `#2fbf71` da 7.83:1 contra el lienzo y 7.76:1 bajo
`#06170d`. Margen amplio en ambos ejes.

Esto es seguro porque `text-on-primary` se usa **exclusivamente junto a
`bg-primary`**. Se verificaron los 16 sitios: `EscenarioLayout` (3),
`AccionesFinal` (2), `ConfirmarRepeticionModal`, `Admin`, `PanelVeredicto`,
`Bienvenida`, `Seccion`, `Login`, `Registro`, `CertificadoBoton`, `Dashboard`,
y en `secciones/fisico` `PrivacidadClaves` y `SalidaSegura`. No hay ni un solo
`text-on-primary` sobre un relleno que no sea `primary`.

En claro `primary` y `link` siguen siendo el mismo verde, y lo que distingue un
enlace de un botón sigue siendo el subrayado (`DESIGN.md` §2). En oscuro se
separan: `link` `#4fd08a` es más claro que el relleno `#2fbf71` porque como
texto necesita 4.5:1 y el relleno solo necesita 3:1. La regla del subrayado no
cambia.

### 5.4 Semántico

| Token | Claro | Oscuro | Ratio |
|---|---|---|---|
| `success` (relleno) | `#16a34a` | `#3ddc84` | 3.30 / 10.45 vs lienzo — SC 1.4.11 ✓ |
| `success-ink` *(nuevo)* | **`#0d7038`** | `#3ddc84` | min 5.06 / 8.00 |
| `on-success` *(nuevo)* | **`#06210f`** | `#06170d` | 5.17 / 10.36 |
| `danger` | `#b4342f` | `#f0736f` | min 4.94 / 5.02 |
| `on-danger` *(nuevo)* | `#ffffff` | `#2a0b0a` | 6.05 / 6.42 |
| `warning` | **`#945700`** | `#e8a33d` | min 4.74 / 6.62 |
| `on-warning` *(nuevo)* | `#ffffff` | `#241705` | 5.80 / 8.12 |

Tres decisiones que conviene dejar razonadas:

**`success` se parte en dos tokens.** El verde vivo `#16a34a` sobrevive donde
de verdad se lee como «acierto»: el relleno del círculo con el ✓. Ahí cumple
SC 1.4.11 (3.30:1 contra blanco, objeto gráfico) y su texto pasa a ser tinta
oscura `on-success`, que da 5.17:1 y cierra el incumplimiento **B**. Para los 9
usos de `text-success` entra `success-ink` `#0d7038`, con 5.06:1 en el peor
caso, y se cierra el incumplimiento **A**.

**Concesión declarada:** `success-ink` queda a 1.12:1 de `primary` `#006837`
—visualmente el mismo verde—. No hay salida: cualquier verde que alcance 4.5:1
sobre blanco cae en esa misma franja oscura. Se acepta conscientemente, porque
`DESIGN.md` §7 ya exige que el color nunca sea la única señal: el acierto lo
comunican el glifo ✓ y la palabra, y el matiz distinto sobrevive donde sí tiene
sitio, en el relleno. La alternativa —mantener `#16a34a` como texto— es
mantener un incumplimiento de AA, y eso no está sobre la mesa.

**`warning` se oscurece de `#ab6400` a `#945700`.** El valor viejo pasaba sobre
blanco (4.61:1) pero fallaba sobre las otras superficies del sistema:
`canvas-soft` 4.42, `signal` 4.33, `surface-strong` 4.05, `mint-light` 3.77. El
nuevo da 4.74:1 en el peor caso, y de paso mejora el blanco encima, de 4.61 a
5.80.

**`on-danger` y `on-warning` son blancos en claro**, o sea que hoy no cambian
nada. Existen para que el tema oscuro pueda voltearlos, y para retirar los dos
`text-white` sueltos de `Tarea.tsx:18` y `PanelVeredicto.tsx:172` — las únicas
dos clases de paleta cruda que quedan en el cromo.

### 5.5 Líneas y bordes

| Token | Claro | Oscuro | Papel |
|---|---|---|---|
| `hairline` | `#f0f0f3` | `#242b34` | Divisor decorativo |
| `hairline-soft` | `#f5f5f7` | `#1c222a` | Divisor más tenue |
| `hairline-strong` | `#dcdee0` | `#3a4450` | Contorno de tarjeta (decorativo) |
| `border-control` *(nuevo)* | **`#7d828a`** | **`#697687`** | min 3.16 / 3.09 — SC 1.4.11 ✓ |

`border-control` es el token que cierra el incumplimiento **C**, y la razón de
separarlo merece quedar escrita: el borde de una tarjeta y el borde de un
`<input>` se ven igual pero la norma los trata distinto. El de la tarjeta es
decoración —el contenido ya delimita la tarjeta— y está exento. El del input
**es** lo que hace visible dónde se puede escribir: si desaparece, el campo
desaparece. Ese necesita 3:1 y hoy tiene 1.35:1.

Consumidores de `border-control`: `Campo.tsx` (el borde en reposo, no el de
error, que ya usa `danger`), y cualquier `<select>`, `<textarea>` o casilla que
se añada después. Los 43 usos de `border-hairline-strong` se quedan como están;
solo se cambia el del input.

### 5.6 Ambiente y panel de señales

| Token | Claro | Oscuro |
|---|---|---|
| `mint-light` | `#d9ede2` | `#13301f` |
| `mint-mid` | `#a9d1ba` | `#2a5c3f` |
| `signal` | `#fff7e6` | `#251d10` |
| `signal-border` | `#a66a00` | `#d9a441` |
| `signal-body` | `#4b5563` | `#c4ccd6` |

`primary` sobre `mint-light` —las iniciales del avatar en `MenuUsuario.tsx:55`
y la insignia de `EtiquetaAprobacion`— da 5.65 / 5.99. Cumple en ambos.

### 5.7 Tokens que no son color

| Token | Claro | Oscuro |
|---|---|---|
| `scrim` *(nuevo)* | `rgb(0 0 0 / 0.45)` | `rgb(0 0 0 / 0.65)` |
| `shadow-card` | `0 4px 12px rgb(0 0 0 / 0.04)` | `0 4px 12px rgb(0 0 0 / 0.5)` |

**`scrim` es una corrección necesaria, no un adorno.** Los siete velos de modal
usan hoy `bg-ink/40`. En oscuro `ink` es `#eef2f6`, así que el velo se volvería
un blanco translúcido: el fondo se *aclararía* al abrir un diálogo, que es lo
contrario de lo que un velo comunica. Sitios a cambiar:
`Bienvenida.tsx:149`, `Admin.tsx:287` (`backdrop:`),
`EscenarioLayout.tsx:391` y `:432` (`backdrop:`), `CierreModuloModal.tsx:49`,
`ConfirmarRepeticionModal.tsx:25`.

`BarraProgreso.tsx:92` también usa `bg-ink/40`, pero ahí es una marca de
división dentro de una barra, no un velo: se queda con `ink` y se moverá con el
tema como debe.

La sombra en oscuro se sube a 0.5 de opacidad, pero con la expectativa
realista de que apenas se perciba: una sombra negra sobre fondo casi negro no
eleva. En oscuro quien separa la tarjeta es `hairline-strong` `#3a4450`. La
sombra se conserva para no tener que quitar `shadow-card` de 13 sitios.

## 6. Piezas que no son tokens

### 6.1 Marca

`public/marca/logo-safeweb.webp` tiene canal alfa (verificado: esquina
`rgba(0,0,0,0)`), pero la palabra «Safe» es `#171f25`, prácticamente invisible
sobre `#0f1317`. El isotipo es verde `#026138` y también queda corto.

Se generan `logo-safeweb-dark.webp` e `isotipo-safeweb-dark.webp` recoloreando
**solo** los píxeles casi negros del texto hacia `#eef2f6`, sin tocar los
verdes. Un `<Marca variante="logo" | "isotipo" />` lee `temaEfectivo` y elige.

No se usa `filter: invert()`: destruiría el verde de la marca.

Consumidores: `AppHeader.tsx:70`, `AuthLayout.tsx:17`, `Bienvenida.tsx:151`,
`PantallaCarga.tsx:27`.

### 6.2 Notificaciones

`RunNotifications.tsx:87` tiene `theme="light"` fijo. Pasa a
`theme={temaEfectivo}`. `richColors` se mantiene: sonner trae sus propias
paletas para ambos temas.

### 6.3 El control

`src/components/SelectorTema.tsx`: tres opciones en un `role="radiogroup"` con
`aria-label="Tema de la interfaz"`, objetivos de 44px, foco visible con
`outline-link` como el resto del cromo. Etiquetas «Sistema», «Claro»,
«Oscuro» — texto, no solo iconos, que es lo que SC 1.4.1 pide y lo que un
público no técnico necesita.

Se monta en dos sitios:

- `MenuUsuario.tsx`, dentro del menú de cuenta, junto a «Tu recorrido» — donde
  la gente ya busca sus preferencias.
- `AuthLayout.tsx`, arriba a la derecha, para las páginas públicas `/` y
  `/registro`.

`Verificar` y `PoliticaDatos` no montan ninguno de los dos layouts. Heredan la
preferencia guardada pero no llevan control propio: son páginas de paso, y
añadirles cromo solo para el selector no se justifica.

## 7. Verificación

### 7.1 Prueba automática — el entregable que sostiene el resto

`src/index.test.ts` (Vitest, sin framework adicional):

1. Declara los dos mapas de tokens como datos.
2. Implementa la luminancia relativa de WCAG (unas 10 líneas).
3. Afirma, para **cada** tema:
   - cada token de texto (`ink`, `body`, `muted`, `link`, `success-ink`,
     `danger`, `warning`, `signal-body`) contra **cada** una de las seis
     superficies → **≥ 4.5:1**
   - cada par relleno/tinta (`on-primary`/`primary`,
     `on-primary`/`primary-active`, `on-success`/`success`,
     `on-danger`/`danger`, `on-warning`/`warning`, `primary`/`mint-light`)
     → **≥ 4.5:1**
   - `border-control` contra cada superficie, y los rellenos semánticos contra
     el lienzo → **≥ 3:1**
4. Afirma que los valores del mapa coinciden con los de `index.css`, para que
   la prueba no se quede validando una copia obsoleta.

Sin esta prueba, el sistema se degrada en el siguiente PR que añada un color.
Con ella, el incumplimiento se convierte en un test rojo.

Resultado esperado hoy con los valores de §5: **0 fallos en claro, 0 fallos en
oscuro.**

### 7.2 Repaso visual — lo que el cálculo no cubre

El cálculo garantiza contraste, no que la pantalla se vea bien. Queda un
repaso manual en oscuro, página por página, con el `data-tema` forzado:

`/` · `/registro` · `/politica-de-datos` · `/verificar/:codigo` · `/bienvenida`
· `/dashboard` · `/recorrido` · `/seccion/:id` · `/admin` · y un escenario de
cada marco (`telefono` y `escritorio`) para confirmar que la frontera entre el
cromo oscuro y la simulación clara no produce un corte desagradable.

En cada una: los cuatro modales, el menú de cuenta abierto, un formulario con
error, un toast, y el estado de foco recorrido con el tabulador.

### 7.3 Comprobaciones puntuales

- `prefers-reduced-motion` no se toca: el cambio de tema no lleva transición de
  color. Una transición de 300 ms sobre `background-color` en toda la página se
  ve como un parpadeo sucio y no aporta nada.
- Recarga con el tema oscuro activo: no debe haber destello blanco (§4.3).
- Cambiar el tema del sistema operativo con la pestaña abierta y la preferencia
  en «Sistema»: la página debe seguirlo.
- Ventana privada con almacenamiento bloqueado: la aplicación arranca en
  «Sistema» y no lanza.

## 8. Orden de trabajo

1. **Arreglar el modo claro.** `success-ink`, `on-success`, `on-danger`,
   `on-warning`, `border-control`, `muted` `#63676e`, `warning` `#945700`.
   Actualizar `Campo.tsx`, `Tarea.tsx`, `PanelVeredicto.tsx` y los 9
   `text-success`. **Entregable comprobable por sí solo:** el modo claro pasa
   AA sin que exista todavía ningún tema oscuro.
2. **Congelar las simulaciones.** Literales en `fisico.module.css` y
   `DossierHeader.module.css`. Sin cambio visual.
3. **Token `scrim`** y los 6 velos de modal. Sin cambio visual en claro.
4. **La prueba de contraste** de §7.1, todavía con un solo tema.
5. **El tema oscuro**: bloque `:root[data-tema='oscuro']`, script inline,
   `ThemeContext`, `SelectorTema`, `<Marca>`, `<Toaster theme>`.
6. **Repaso visual** de §7.2.
7. **Actualizar `docs/DESIGN.md`**: la regla 1 («Solo modo claro») deja de ser
   cierta y hay que reescribirla con la frontera de §2.1. Sin esto, el
   documento que gobierna el diseño contradice al código, y la próxima persona
   o agente seguirá el documento.

Los pasos 1 a 4 no cambian nada visible y se pueden revisar por separado. El
riesgo se concentra en el 5.

## 9. Fuera de alcance

- Recolorear los escenarios simulados (`secciones/`, `.module.css`).
- Guardar la preferencia en el backend o sincronizarla entre dispositivos.
- Un tercer tema (alto contraste, sepia).
- Transiciones animadas al cambiar de tema.
- Nivel AAA (7:1). El objetivo acordado es AA.
