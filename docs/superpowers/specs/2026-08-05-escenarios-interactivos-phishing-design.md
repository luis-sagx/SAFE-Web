# Diseño: tres escenarios más a la mecánica interactiva

**Fecha:** 2026-08-05
**Proyecto:** SAFE Web
**Estado:** diseño aprobado, pendiente plan de implementación
**Alcance:** `phishing/rol-de-pagos`, `phishing/quishing-actualice`,
`phishing/sesion-bogota`. Convierte los tres a la mecánica de
`phishing/factura-sri` (ver
`docs/superpowers/specs/2026-08-04-escenario-interactivo-factura-sri-design.md`),
que queda confirmada como la plantilla del módulo.

---

## 1. Objetivo

`FacturaSri.tsx` ya demostró la mecánica: el participante actúa sobre la
pantalla simulada en vez de elegir de una lista de acciones descritas. Este
documento aplica lo mismo a los tres escenarios que todavía usan
`StoryEscenario` + lista de opciones, y de paso extrae del archivo de Factura
SRI las piezas que ya estaban pensadas para reutilizarse pero seguían
codificadas en un solo componente.

Regla general para los tres: el contenido pedagógico (señales, veredictos,
`outcome`, regla de oro) se conserva. Lo que cambia es únicamente cómo se
llega a cada final — de un botón en una lista de texto a un punto interactivo
real sobre correo/navegador. Las únicas excepciones de contenido están
señaladas explícitamente más abajo (§3.2 la fusión de un final en Quishing).

---

## 2. Arquitectura compartida

### 2.1 `Navegador` se extrae a `components/ui/`

Hoy vive codificado dentro de `FacturaSri.tsx`. Pasa a
`components/ui/Navegador.tsx`, parametrizado por props en vez de por
constantes del módulo:

- `pestanas: Record<string, PestanaConfig>` — lo que hoy es el `PESTANAS` de
  Factura SRI (`titulo`, `url`, `segura`, `cierra?`, `senalUrl?`,
  `mismaPestana?`, ver §2.2).
- `marcadores: {Icono, texto, goto?, label?}[]` — lo que hoy es `MARCADORES`.
- `pestanasAbiertas`, `activa`, `cierrePortal`, `onHotspot`, `children`: igual
  que hoy.

`FacturaSri.tsx` pasa a importar esta pieza en vez de definirla; sin cambio
visual ni de comportamiento ahí.

### 2.2 Transición "misma pestaña"

Nueva capacidad, motivada por Sesión Bogotá (§5): una entrada de `pestanas`
puede declarar `mismaPestana: true`. Cuando el hotspot que lleva a ese nodo se
activa, el motor de la pantalla no agrega una pestaña nueva a
`pestañasAbiertas` — reemplaza el id de la pestaña activa por el nuevo nodo,
y `Navegador` repinta esa misma pestaña con el título/url del nodo destino.
Sin esta marca, el comportamiento es el de hoy (pestaña nueva por escena).
Vive en el escenario que orquesta `elegir()`, no dentro de `Navegador`: es la
misma función que ya decide si abrir una pestaña, solo gana una rama.

### 2.3 Qué no cambia

- `useStoryEngine`, `useScenarioRun`, `EnlaceHotspot`/`BotonHotspot`/
  `manejarClicHotspot`, `PanelVeredicto`: intactos, igual que en el diseño de
  Factura SRI.
- `ClaveCaducada.tsx` y cualquier otro escenario en `StoryEscenario`: cero
  cambios de comportamiento.

### 2.4 Barra del correo: bespoke, no genérica

Los tres escenarios actuales importan `ACCIONES_BARRA`/`finalesDeBarra` de
`barraDeCorreo.tsx` para las 5 acciones (Responder/Reenviar/Archivar/
Eliminar/Spam). Los tres nuevos dejan de importarlo y escriben sus propios 5
finales, como ya hace `FacturaSri.tsx` — así el texto de cada uno puede
anclarse a lo específico de ese correo (el QR, el rol de pagos, la alerta de
sesión) en vez de quedar genérico. `barraDeCorreo.tsx` no se borra: sigue
sirviendo a los escenarios que quedan en `StoryEscenario`.

---

## 3. Rol de pagos disponible (`phishing/rol-de-pagos`)

Legítimo, 2 pantallas. Es el más simple de los tres: no hay dominio falso que
comparar, la decisión es "¿confío en este aviso real y entro por mi cuenta, o
reacciono mal a algo que no era una trampa?".

**n1 (correo) — sin enlace en el cuerpo.** El texto menciona
`portal.andes.com.ec` como referencia, no como link: entrar "escribiendo yo
mismo la dirección" se representa con un marcador del navegador ("Portal
Andes"), igual que el atajo al portal real en Factura SRI. Tocarlo abre n2.

**n2 (portal real)** — formulario con usuario/clave prellenados (como en
Factura SRI, campos no editables). Botón "Ingresar" → `e_bien` (bueno).

**Barra del correo, mapeo 1:1 con las decisiones que ya existían:**

| Botón | Destino | `kind` | Nota |
|---|---|---|---|
| Responder | `e_credenciales` | bad | El contenido original ya era exactamente "responder con mi usuario y clave" — no hay una acción "responder genérica" separada en este escenario. |
| Eliminar | `e_borra` | partial | Ya bespoke en el original ("prudente, pero de más"). |
| Reenviar | nuevo, bespoke | partial | Tono legítimo: reenviaste un aviso real sin verificar. |
| Archivar | nuevo, bespoke | partial | Igual, tono legítimo. |
| Spam | nuevo, bespoke | bad | Descartaste un aviso real y le enseñaste al filtro a esconder los próximos. |

---

## 4. Código para actualizar datos (`phishing/quishing-actualice`)

Fraude, QR. La particularidad del quishing es que un QR no tiene `href`: no
se puede "pasar el mouse y ver a dónde lleva" antes de tocarlo, que es
justamente la señal que el escenario enseña (`s1` ya lo dice en texto).

**n1 (correo)** — el QR es el hotspot: tocarlo abre n2 directamente, sin paso
intermedio de "vista previa" (no existe tal cosa fuera de la ficción). La
señal `s1` se ancla sobre el QR mismo (`data-signal` en su contenedor) en vez
de flotar sin target como hoy.

Marcador "App Banco del Litoral" en el navegador → `e_app` (bueno: ignoraste
el QR y entraste por tu cuenta).

**n2 (página falsa)** — formulario cédula/clave prellenado. Botón "Confirmar
datos" → `e_datos` (bad). Cerrar la pestaña sin enviar → `e_cierra` (bueno).

### 4.1 Fusión de finales (única excepción de contenido)

El final antiguo `e_preview` ("escaneé, leí la URL, no completé nada")
desaparece como nodo propio: mecánicamente, llegar a n2 y cerrar sin escribir
es indistinguible de "cerrar tras notar que pide la clave" — ambos terminan
en la misma pantalla sin haber enviado el formulario. Se fusiona con
`e_cierra`. La lección de `e_preview` (que un QR no se puede inspeccionar
antes de escanear) se conserva completa como señal `s1`, ahora anclada al QR.

**Barra del correo:** 5 finales bespoke, fraude — mismo patrón que Factura
SRI (texto ajustado a "sin escanear el código" en vez de "sin tocar el
enlace ni el adjunto").

---

## 5. Inicio de sesión desconocido (`phishing/sesion-bogota`)

Fraude, 3 pantallas — el más complejo de los tres: dos páginas falsas
encadenadas del mismo sitio (clave → OTP).

**n1 (correo)** — enlace real `<a href="...">` "No fui yo — proteger mi
cuenta" → n2. Marcador "App Banco del Litoral" → `e_app` (bueno: verificaste
por la app en vez de por el enlace de la alerta).

**n2 (página de clave)** — formulario con la contraseña prellenada. Botón
"Cerrar acceso no reconocido" → **n3, en la misma pestaña** (§2.2:
`mismaPestana: true`), sin abrir una pestaña nueva — es el mismo sitio
avanzando un paso, tal como pasaría de verdad en un kit de phishing
multi-paso. Cerrar la pestaña sin enviar → `e_dominio` (bueno).

**n3 (página de OTP)**, misma pestaña que n2, título y url actualizados
("Un paso más"). Formulario con el código. Botón "Confirmar y cerrar sesión"
→ `e_otp` (bad, terminal). Cerrar la pestaña sin enviar → `e_detiene`
(bueno — ya se había escrito la clave en n2, pero no el código; el `outcome`
ya explica esa distinción y no cambia).

**Barra del correo:** 5 finales bespoke, fraude, en tono de alerta de
seguridad.

---

## 6. Accesibilidad

Sin cambios respecto al patrón de Factura SRI (§4 de esa spec): puntos
interactivos son `<a>`/`<button>` reales, foco se mueve al botón "Ver las
señales" al terminar, resaltado no depende solo del color.

---

## 7. Pruebas

- Un test por escenario, equivalente a `FacturaSri.test.tsx`: que las
  carpetas del correo (Enviados/Spam/Papelera/Recibidos vacío) reflejen la
  acción de barra tomada, sin cerrar el escenario.
- Sesión Bogotá suma una verificación de que enviar la clave en n2 deja la
  pestaña abierta con el mismo id (no aparece una pestaña nueva) y que su
  título pasa a mostrar el paso de OTP.
- `useStoryEngine`/`useScenarioRun`: sin cambios, las pruebas existentes
  siguen validando el mismo contrato.
- Verificación manual en navegador de los finales alcanzables en los tres
  escenarios, y que `ClaveCaducada`/cualquier otro en `StoryEscenario` siga
  renderizando sin cambios.
