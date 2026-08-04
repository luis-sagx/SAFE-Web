# Diseño: escenario interactivo — Factura por validar

**Fecha:** 2026-08-04
**Proyecto:** SAFE Web
**Estado:** diseño aprobado, pendiente plan de implementación
**Alcance:** un solo escenario, `phishing/factura-sri`. Es la plantilla para
replicar después en el resto de escenarios de phishing y, más adelante, en las
otras amenazas.

---

## 1. Objetivo

Hoy los escenarios de correo/web se juegan eligiendo de una lista de acciones
*descritas en texto* ("Abrir el enlace para validar la factura", "Descargar el
archivo adjunto…"). El participante nunca interactúa con la pantalla simulada
en sí — la pantalla es solo ilustración, y la decisión real ocurre en un menú
aparte.

El pedido: acercar la mecánica a
[phishingquiz.withgoogle.com](https://phishingquiz.withgoogle.com/), donde el
correo es una interfaz real —enlaces de verdad, remitente inspeccionable— y el
participante actúa directamente sobre ella. Investigado el sitio de referencia
a fondo (ver bitácora de la sesión): el correo se renderiza completo e
interactivo, pasar el mouse sobre un enlace muestra la URL real en la barra de
estado nativa del navegador (sin tooltip propio: son `<a href>` de verdad), el
veredicto es directo, y el repaso de señales ancla cada explicación al
elemento real en vez de listarlas aparte.

Este documento adapta esa mecánica al contrato existente del proyecto
(`useStoryEngine`, el registro de corridas, el vocabulario de tres resultados)
sin tocarlo, y sin arriesgar los demás escenarios de phishing.

---

## 2. Mecánica de interacción

### 2.1 Puntos interactivos reemplazan la lista de opciones

Cada nodo del grafo deja de mostrar una lista de botones con la acción
*descrita*. En su lugar, los elementos reales de la pantalla simulada son el
control:

**Nodo `n1` (correo) — 3 puntos:**

| Elemento | Tipo | Destino |
|---|---|---|
| Botón "Validar mi factura ahora" | `<a href="http://sri-facturacion-ec.com/validar-ruc">` real | `n2` |
| Adjunto `Factura_004521.html` | botón | `e_adjunto` (malo) |
| Atajo "🏦 Portal SRI" en la barra de tareas | botón, siempre visible | `e_portal` (bueno) |

El enlace de "Validar factura" usa un `href` real apuntando al dominio falso:
pasar el mouse (o mantener presionado en móvil) muestra esa URL en la barra de
estado del navegador — comportamiento nativo, sin construir un tooltip propio.
El clic nunca navega de verdad (`preventDefault`); lo que decide el destino es
el atributo `data-hotspot-goto` que un único manejador delegado lee del
elemento clicado.

**Nodo `n2` (página falsa) — 2 puntos:**

| Elemento | Tipo | Destino |
|---|---|---|
| Botón "Validar factura" (envía el formulario) | botón | `e_datos` (malo) |
| El mismo atajo de la barra de tareas | botón | `e_dominio` (bueno) |

La opción "mirar la barra de direcciones antes de escribir" desaparece como
*acción explícita*: la URL ya está siempre visible en la barra del navegador
simulado (como en un navegador real), así que mirarla no es una decisión que
haya que declarar, es algo que el participante ya puede hacer o no. Su
decisión real es si envía el formulario o se va.

El atajo de la barra de tareas es el mismo control visual en los dos nodos,
pero apunta a un destino distinto según dónde esté el participante — lo
resuelve el nodo actual, no la barra de tareas.

**Sin confirmación.** Tocar un punto interactivo termina la corrida de
inmediato, igual que en la vida real: no hay un paso intermedio de "¿seguro?".

### 2.2 Veredicto y recorrido de señales

Al llegar a un final, el panel de decisión (donde antes vivía la lista de
opciones) muestra primero el veredicto tal como hoy: ícono + color según
`kind`, título (`verdict`) y la prosa (`outcome`) — sin cambios en ese
contenido. En vez de la lista de señales fija debajo, un botón **"Ver las
señales"**.

Al tocarlo empieza un recorrido paso a paso: cada señal resalta con un anillo
el elemento real al que corresponde (el adjunto, la dirección del remitente,
la frase "24 horas" dentro del cuerpo del correo…), hace scroll hacia él
dentro del marco, y el texto de esa señal aparece en el panel con
"Anterior/Siguiente" y el conteo (`Señal 2 de 5`). Un enlace "Saltar" lleva
directo al final para quien no quiere el recorrido. Al llegar a la última
señal, el panel cierra con la regla de oro (sin cambios de contenido) y el
botón de reiniciar.

**Salvedad frente a la referencia, declarada a propósito:** en
phishingquiz.withgoogle.com el globo de explicación *flota* pegado al
elemento y lo sigue si hay scroll. Reproducir eso exige un motor de
posicionamiento (medir el elemento, seguirlo en scroll/resize, dentro de un
marco que además tiene su *propio* scroll interno) con riesgo real de romperse
en móvil. Se decidió no construirlo en esta iteración: el elemento se resalta
en su lugar real y el texto vive en el panel fijo de decisión, que es donde ya
vivía. Se conserva la parte que más importa —la señal ligada al objeto real,
una a la vez— sin el riesgo de una UI flotante frágil.

**Algunas señales no tienen un elemento anclable en la pantalla actual** (p.
ej. la señal sobre la conexión insegura de `n2` no tiene dónde anclarse si el
participante cayó por el adjunto sin pasar por `n2`). En ese caso el texto se
muestra igual en el panel, sin resaltado — el contenido pedagógico no se
recorta, solo el resaltado es best-effort.

---

## 3. Arquitectura

### 3.1 Qué no cambia

- `useStoryEngine`, `useScenarioRun`: intactos. El grafo sigue siendo
  `Story<ScreenNode>` con nodos y `choices: {label, goto}[]`; `engine.choose`
  ya acepta `(goto, label)` sin importar quién lo invoque.
- El contrato con el backend (`scenarioId`, `version`, `outcome`, `score`,
  `endingId`, `decisions`): sin cambios. La traza sigue registrando
  `{desde, hacia, eleccion}` por cada punto interactivo tocado, igual que hoy
  con cada opción elegida.
- `ClaveCaducada.tsx`, `RolDePagos.tsx` y cualquier otro escenario que siga
  usando `StoryEscenario` + `DeviceScreen` + `StoryChoices` +
  `StoryResultPanel`: cero cambios de comportamiento. Es el mismo motivo por
  el que `SaldoContable.tsx`, `CambioNumero.tsx` y `LlamadaAntiestafas.tsx` ya
  usan `EscenarioLayout` directamente en vez del envoltorio genérico —
  "mecánica propia" es un patrón ya establecido en el proyecto (ARQUITECTURA
  §4.3-B), esto es una variante de esa misma idea con un grafo detrás.

### 3.2 Qué se agrega

`FacturaSri.tsx` deja de usar `StoryEscenario` y pasa a orquestar
`useStoryEngine` + `EscenarioLayout` directamente, con pantallas propias en
vez de la `DeviceScreen` genérica. Piezas nuevas, pensadas para que el
siguiente escenario las reutilice sin reescribirlas:

| Pieza | Vive en | Qué hace |
|---|---|---|
| `Titlebar`, `Taskbar` | se extraen de `DeviceScreen.tsx` a un archivo propio, comparten `DeviceScreen.module.css` | Mismo chrome visual exacto (nada cambia a simple vista en los escenarios que ya lo usan) |
| `Taskbar` | — | gana un prop **opcional** `atajo?: {texto, onClick}`. Sin ese prop se comporta exactamente igual que hoy (puramente decorativa) |
| Enlace/botón interactivo | nuevo, `components/ui/` | Elementos con `data-hotspot-goto` / `data-hotspot-label` / `data-signal`; un único manejador delegado por pantalla llama a `engine.choose` |
| Panel de veredicto + recorrido | nuevo, `components/ui/` | Reemplaza `StoryResultPanel` para este escenario: mismo encabezado de veredicto, cuerpo con estado interno (`veredicto` → `señales 1..N` → `cierre`) |
| `EscenarioLayout` | cambio de una línea | El contenedor de la pantalla gana un `id` fijo, para que el recorrido de señales ubique el elemento resaltado con `document.getElementById(...).querySelector('[data-signal="…"]')` sin hilar una `ref` nueva a través de las props. Sin efecto visual ni de comportamiento en ningún otro escenario. |

### 3.3 Contenido pedagógico

Las 5 señales y la regla de oro de `FacturaSri.tsx` no cambian de texto — solo
se les agrega un identificador opcional (`targetId`) para el anclaje. Los
cuatro finales (`e_adjunto`, `e_datos`, `e_dominio`, `e_portal`) conservan
exactamente su `kind`, `verdict` y `outcome` actuales.

---

## 4. Accesibilidad

Los puntos interactivos son elementos reales (`<a>`, `<button>`), no `<div>`
con `onClick`: navegables por teclado y anunciados por lectores de pantalla
con su texto visible como nombre accesible, sin trabajo extra. El resaltado
de una señal no depende solo del color (anillo + `scrollIntoView`, y el texto
completo está en el panel de todas formas). Al terminar la corrida, el foco
se mueve al botón "Ver las señales", siguiendo el mismo patrón de manejo de
foco que ya usa `EscenarioLayout` entre fases.

---

## 5. Pruebas

- `useStoryEngine`/`useScenarioRun`: sin cambios, sus pruebas existentes
  siguen validando el mismo contrato.
- Nueva verificación de que cada punto interactivo llama a `engine.choose`
  con el `goto`/`label` correcto (equivalente a lo que hoy prueba
  `StoryChoices`, adaptado al manejador delegado).
- Verificación manual en navegador (Chrome DevTools, como en el resto de la
  sesión): los 4 finales alcanzables desde sus puntos interactivos, el
  recorrido de señales resaltando el elemento correcto, y que `ClaveCaducada`/
  `RolDePagos` sigan renderizando sin cambios.
