# Diseño: consistencia visual y estructural de los escenarios de riesgo físico

**Fecha:** 2026-09-05
**Proyecto:** MIC · Simulador de entrenamiento anti-fraude
**Estado:** diseño aprobado

---

## 1. Problema

El módulo de riesgo físico tiene ocho escenarios. Dos siguen el patrón del repositorio;
seis lo rompen, cada uno a su manera.

Los dos correctos:

- `SalidaSegura.tsx` — SVG a sangre en `.escenaMarco`, `PanelVeredicto` con señales, `resultado` al layout.
- `DescargaProgramasPiratas.tsx` — `StoryEscenario` con vistas `web`.

Los seis rotos: `TrampaUSB`, `CodigoQRCafe`, `PuertosFriosColdAisle`, `TarjetaClonada`,
`CableComprometido`, `PrivacidadClaves`.

### 1.1 Defectos observados

**Contenedor blanco alrededor de la escena.** Los seis envuelven su contenido en
`.app` → `.mainArea` (`padding: 1rem`, `overflow-y: auto`) dentro de `MARCO_ESCRITORIO`,
que ya es una caja blanca con borde, redondeo y sombra. La `<img>` añade encima su propio
`rounded shadow-md`. Tres marcos concéntricos donde debería haber uno.

**La foto obliga a desplazar.** Cinco archivos fijan `className="w-full h-170 object-cover"`.
En Tailwind v4 `h-170` son 42.5 rem (680 px) de alto fijo. `PuertosFriosColdAisle` va sin
altura (`w-full rounded shadow-md`) y desborda por alto natural.

Las imágenes de `public/escenarios/fisico/` son 1408×768 salvo
`usb-estacionamiento.webp`, que es 1024×1024.
Una foto cuadrada dentro de un marco ancho fijo no puede caber sin recorte ni barras.

**Paleta cruda en vez de tokens.** La tira de datos usa
`bg-gray-100 border-gray-300` con tarjetas `bg-white border-l-4 border-blue-500`. El acento
de borde izquierdo no existe en ninguna otra parte del repositorio. El botón "Siguiente" de
`.nextBtn` es azul `#1d4ed8`; el primario del sistema es verde `#006837`.

**Dos estilos de opción distintos dentro del mismo módulo.**

- `bg-gray-300 hover:bg-gray-400 text-gray-800` — `TrampaUSB`, `CodigoQRCafe`, `PuertosFriosColdAisle`
- `.choiceBtn { border: 1px solid #d1d5db; background: white }` — `CableComprometido`, `TarjetaClonada`

El estándar del repositorio es `StoryChoices`: `rounded-lg border-hairline-strong bg-surface`,
numerado, **en la columna de decisión**, no dentro de la pantalla simulada.

**Las opciones viven dentro de la pantalla.** Por eso la columna de decisión queda ocupada
solo por `¿Cuándo termina el escenario?` y `No sé por dónde empezar`. Esos dos controles
vienen del componente compartido `Instrucciones` y son idénticos en todos los módulos: lo que
se lee como inconsistente no son ellos, sino que en el resto de módulos esa columna contiene
además las opciones, y aquí no contiene nada más.

**Círculo con rayo.** `FlashSpark` (`CableComprometido`, `TarjetaClonada`) esconde las
opciones detrás de un clic sobre un punto amarillo `#fbbf24` que pulsa. Ningún otro escenario
del repositorio pide ese gesto, y el color está fuera de paleta.

**Veredicto propio en vez de `PanelVeredicto`.** `.feedbackPanel` con `.badge` y `.nextBtn`
dentro de la pantalla, o `border-l-4 border-gray-400 pl-3` con `text-gray-700` en la columna.
Ninguno de los seis ofrece "Ver las señales". Ninguno cierra con `AccionesFinal`, así que
tampoco muestran el avance del módulo.

**Tres vocabularios de veredicto en el mismo módulo:**

| Archivos | Vocabulario |
|---|---|
| `TrampaUSB`, `CableComprometido`, `TarjetaClonada` | `Decisión segura` / `Observación` / `Riesgo detectado` |
| `CodigoQRCafe` | `✓ Bien resuelto` / `◐ A medias` / `✗ No salió bien` |
| `PuertosFriosColdAisle` | `Decisión excelente` / `Acción rápida, respuesta incompleta` / `Fallo crítico - Equipos comprometidos` |

**`AvisoFinEscenario` nunca aparece en dos escenarios.** `CableComprometido` y
`TarjetaClonada` no pasan `resultado` a `EscenarioLayout`.

**Fases muertas.** `TarjetaClonada` arranca con `escaneo-billetera.webp` y un `useEffect` de
6 000 ms que avanza solo, con el rótulo `Observa la escena...`. Dos fotos que no llegan a
contar la historia porque la primera no admite ninguna acción.

**Código duplicado literal.** `FlashSpark` y `ConsequenceArt` están copiados carácter por
carácter en `CableComprometido.tsx` y `TarjetaClonada.tsx`. `shuffled()` está en cinco
archivos.

**Accesibilidad.** `TrampaUSB.tsx:229` inyecta
`<style>{'[role="status"],[role="alert"]{display:none!important}'}</style>`, que oculta
regiones vivas en toda la página, no solo en ese escenario.

### 1.2 Defectos de contenido

Aparecieron al leer los guiones, no son de estilo:

1. **`TrampaUSB`:** el feedback de la opción correcta dice *"lo mejor es reportar el USB
   encontrado al área de IT"*, pero esa opción no existe. La respuesta que el propio texto
   declara mejor no se puede elegir.
2. **`TrampaUSB`:** el guion describe *"una etiqueta escrita a mano: NÓMINA DICIEMBRE,
   CONFIDENCIAL"*. La foto es un USB liso sobre asfalto: no hay etiqueta. El cebo que la
   narrativa presenta como clave no se ve.
3. **`CableComprometido`:** en la fase de la sala de descanso las dos opciones son malas
   (usarlo o llevárselo). No se puede acertar hasta la fase dos.
4. **`PuertosFriosColdAisle`:** las etiquetas de los botones no dicen lo que su feedback juzga.
   "Reportar el incidente a infraestructura" se evalúa como *"cerraste la puerta y luego
   reportaste"*; "Observar la situación primero" se castiga como *"no hiciste nada"*.
5. **`CableComprometido`:** la opción "Llevártelo a tu escritorio" es un `Choice` con
   `level: 'warn'`, `risk: 8` y **`feedback: ''`**. Registra riesgo en la traza y nunca
   muestra nada, porque no es un desenlace: es un paso intermedio disfrazado de decisión.

---

## 2. Regla

**Si es mundo real, la foto ocupa el marco entera y sin recorte. Si es decisión, vive fuera
del marco y usa los tokens del sistema.**

Es la misma regla que `EscenarioLayout` y `StoryChoices` ya documentan —lo que la app real
mostraría va en `pantalla`, lo demás en `decision`— extendida al caso que faltaba: en riesgo
físico la "app real" no es una app. Un USB en el suelo no está dentro de ninguna pantalla,
así que no lleva marco de dispositivo.

---

## 3. Diseño

### 3.1 Reparto de los ocho escenarios

| Escenario | Molde | Motivo |
|---|---|---|
| `TrampaUSB` | `StoryEscenario` + `kind:'escena'` | foto + elección múltiple |
| `CodigoQRCafe` | `StoryEscenario` + `kind:'escena'` | foto + elección múltiple |
| `PuertosFriosColdAisle` | `StoryEscenario` + `kind:'escena'` | foto + elección múltiple |
| `TarjetaClonada` | `StoryEscenario` + `kind:'escena'` | un nodo jugable tras quitar la observación |
| `CableComprometido` | `StoryEscenario` + `kind:'escena'` | dos nodos de foto encadenados |
| `DescargaProgramasPiratas` | `StoryEscenario` (`web`) | **ya correcto, no se toca** |
| `SalidaSegura` | `EscenarioLayout` + `PanelVeredicto` | **ya correcto, no se toca** |
| `PrivacidadClaves` | `EscenarioLayout` + `PanelVeredicto` | manipulación con reloj, no cabe en `choices` |

### 3.2 Cambios en el núcleo

Tres archivos, unas 35 líneas. La rama sin marco de dispositivo **no hay que inventarla**:
`StoryEscenario.tsx:669` ya renderiza `kind: 'sms'` como `<DeviceScreen>` pelado, fuera del
`<Navegador>`.

**`components/ui/DeviceScreen.tsx`** — nuevo miembro de la unión `ScreenView`:

```ts
| {
    kind: 'escena'
    /** Ruta en /public. El mundo real, no una pantalla: un USB en el suelo no
     *  está dentro de ningún dispositivo, así que va sin marco. */
    src: string
    alt: string
    /** Rectángulos sobre la foto que el repaso de señales resalta. Van en
     *  porcentaje para que sigan cuadrando a cualquier tamaño de marco. */
    zonas?: { id: string; x: string; y: string; ancho: string; alto: string }[]
  }
```

Y una rama temprana que devuelve `<EscenaFoto>`. Es obligatoria, no decorativa: sin ella
`escena` cae en el `return` final —el de `sms`— y TypeScript falla al leer `view.msgs`.

Estos helpers **no necesitan cambio alguno**, verificado:

| Helper | Por qué no cambia |
|---|---|
| `pestanaDeVista` (`StoryEscenario.tsx:106`) | cae en `return null` |
| `horaDeVista` (`StoryEscenario.tsx:140`) | `view.kind !== 'sms'` → `undefined` |
| `conNombre` (`DeviceScreen.tsx:281`) | es genérico y recorre cualquier objeto |

**`components/StoryEscenario.tsx`** — cuarta rama en el ternario de `pantalla`, y
`dispositivo="escena"` para ese caso.

**`components/EscenarioLayout.tsx`** — `dispositivo` admite `'escena'`, con `MARCO_ESCENA`
como tercera constante junto a `MARCO_TELEFONO` y `MARCO_ESCRITORIO`.

### 3.3 `EscenaFoto` y el encuadre

`src/secciones/fisico/EscenaFoto.tsx`. Vive en `fisico/` y no en `components/ui/` porque hoy
solo la usa este módulo; sube cuando un segundo módulo la pida.

El marco toma la relación de la foto sin declararla en ningún sitio: la impone la imagen.

- **De `lg` arriba** (columna y escena lado a lado): contenedor `lg:h-full lg:w-fit
  lg:flex-none lg:max-w-full`, imagen `h-full w-auto max-w-full object-contain`. El alto sale
  del layout, el ancho de la relación intrínseca de la foto, y el contenedor se ajusta a ese
  ancho: borde, redondeo y sombra caen sobre el borde real de la imagen. No hay barras porque
  no queda hueco, y no hay recorte porque no se fuerza ninguna relación.

  `max-w-full` es el caso que hay que cubrir: en un `lg` estrecho una foto de relación 1.83 a
  todo el alto puede pedir más ancho del disponible. Ahí el ancho manda y `object-contain` es
  la red de seguridad —con `w-auto` normalmente ni llega a actuar.
- **Debajo de `lg`** (apilado, la página ya se desplaza ahí): contenedor `w-full`, imagen
  `w-full h-auto`.

Esto resuelve dos defectos con el mismo cambio: muere el `h-170` que causaba el scroll, y
muere el contenedor blanco, porque `MARCO_ESCENA` sustituye a `MARCO_ESCRITORIO` y nadie
envuelve la foto en `.app` / `.mainArea`.

`AvisoFinEscenario` se posiciona `absolute` contra ese contenedor, así que tapa exactamente la
foto y no una caja mayor.

CSS nuevo, dos reglas:

```css
.escenaFoto { display: block; object-fit: contain; }
.zonaSenal  { position: absolute; border-radius: 0.5rem; pointer-events: none; }
```

Y una corrección: el resalte del repaso está hoy en `.escena :global(.senal-resaltada)`, que
solo alcanza al SVG. Sube a `.escenaMarco :global(.senal-resaltada)` para cubrir también las
zonas de foto.

`zonas` va en porcentaje —`{ id: 'usb-suelo', x: '38%', y: '62%', ancho: '24%', alto: '18%' }`—
para que las señales sigan sobre el objeto correcto a cualquier tamaño de marco.

### 3.4 Lo que se hereda al pasar a `StoryEscenario`

Sin escribirlo en ningún archivo de escenario: `StoryChoices` en la columna de decisión,
`PanelVeredicto` con recorrido de señales y regla de oro, `AccionesFinal` con el avance del
módulo, `resultado` → `AvisoFinEscenario`, y la traza de decisiones de `useStoryEngine`.

Consecuencia que hay que decir en voz alta: **`shuffled()` desaparece**. `useStoryEngine`
sirve las opciones en el orden del grafo, como todos los demás módulos. Hoy físico baraja y
es el único que lo hace.

### 3.5 Escenario por escenario

#### `TrampaUSB` → `fisico/trampa-usb`

Foto `/escenarios/fisico/usb-estacionamiento.webp` (1024×1024, la única cuadrada: la que más gana con el marco
por relación).

```
n1  escena: usb-estacionamiento.webp
    ├─ "Agarrarlo, alguien lo dejó y probablemente lo necesita"  → e_agarra   (bad)
    ├─ "Dejarlo ahí, no es asunto tuyo"                          → e_deja     (partial)
    └─ "Dejarlo donde está y avisar a IT"                        → e_reporta  (good)
```

Se añade `e_reporta` porque el feedback existente ya declaraba esa respuesta como la mejor sin
ofrecerla. "Dejarlo ahí, no es asunto tuyo" baja a `partial`: evita el riesgo propio pero deja
el cebo en el suelo para el siguiente.

Y "Agarrarlo" sube de `warn` (riesgo 8) a **`bad`**. Con tres opciones y tres niveles cada una
ocupa el suyo, y recoger un USB cebado es el ataque entero, no una imprudencia menor. Es un
cambio de puntuación deliberado, no un efecto colateral del refactor.

Se quita del guion la etiqueta manuscrita *"NÓMINA DICIEMBRE, CONFIDENCIAL"*, que la foto no
muestra. El cebo pasa a ser el hallazgo mismo: un USB tirado donde cualquiera lo recoge.

Señales sobre `zonas`: el USB en el asfalto, y el estacionamiento vacío —no hay a quién
preguntar de quién es.

#### `CodigoQRCafe` → `fisico/qr-cafe-wifi`

Foto `/escenarios/fisico/internet-cafe.webp`. Las tres opciones actuales pasan sin tocar su texto:

| Opción | Nivel hoy | Nodo |
|---|---|---|
| Escanear el código QR para conectarme al WiFi | `danger` | `e_escanea` (bad) |
| Preguntar al personal del café por la contraseña | `safe` | `e_pregunta` (good) |
| Usar datos móviles aunque sea lento | `warn`, riesgo 0 | `e_datos` (partial) |

Señal: la zona del QR en la pared.

#### `PuertosFriosColdAisle` → `fisico/puertos-frios-datacenter`

Foto `/escenarios/fisico/puerta-abierta-servidores.webp`.

Las tres etiquetas se reescriben para que digan lo que su consecuencia evalúa:

| Etiqueta nueva | Nodo | Feedback que ya existe |
|---|---|---|
| "Cerrar la puerta y reportar a infraestructura" | `e_cierra_reporta` (good) | "acción rápida + comunicación" |
| "Cerrar la puerta y seguir adelante" | `e_solo_cierra` (partial) | "debiste reportar para que verificaran daño" |
| "Seguir de largo, alguien se encargará" | `e_nada` (bad) | "no hiciste nada, la puerta siguió abierta" |

La tira de estado **no se borra como en los demás**: `Temperatura 28.5 °C ↑ / Servidores En
Riesgo / Normal 18 °C` es la urgencia del escenario y no está en ningún otro sitio. Se muda a
`contexto.ahora` en prosa. Lo que se va es el `border-l-4` y la paleta cruda.

Las listas "Lo que hiciste bien" / "Lo que faltó" del panel actual pasan a `outcome` de cada
nodo final.

#### `TarjetaClonada` → `fisico/tarjeta-clonada`

Se quita la fase de observación. El escenario arranca en la llamada del banco; el "te clonaron
hace cuatro días mientras te distraían" se cuenta en `contexto.ahora`, que es donde vive la
historia en todos los módulos.

```
n_recuerdo  escena: escaneo-billetera.webp   (sin choices; solo se alcanza desde el repaso)
n1          escena: llamada-banco.webp
            ├─ "Bloquear la tarjeta inmediatamente y denunciar el fraude" → e_bloquea_denuncia (good)
            ├─ "Ignorar la notificación y esperar…"                       → e_ignora           (bad)
            ├─ "Bloquear la tarjeta pero no reportar nada…"               → e_bloquea_callado  (partial)
            └─ "Cambiar de banco y abrir una nueva cuenta"                → e_cambia_banco     (partial)
```

`escaneo-billetera.webp` se recupera en el repaso, no como fase muerta. `Senal` ya tiene el
campo `pantalla?: string`, que devuelve la vista a ese nodo mientras se explica la señal —es el
mecanismo que `DescargaProgramasPiratas` usa con `pantalla: 'e_malware'`:

```ts
{ id: 's1', pantalla: 'n_recuerdo', texto: 'Mientras uno te daba conversación, otro te escaneaba…' }
```

La foto que hoy se mira seis segundos sin poder hacer nada pasa a ser la revelación de *cómo*
te clonaron, justo después del veredicto.

El bloque "Dónde guardar tu billetera" (Lo que NO deberías hacer / Lo que DEBERÍAS hacer, hoy
con guiones sueltos dentro de `.feedbackPanel`) se convierte en la `regla` del panel.

#### `CableComprometido` → `fisico/cable-comprometido`

El SVG `SCENE_ART_OFFICE`, dibujado a mano, se jubila por `/escenarios/fisico/imagen-escritorio.webp`
(1408×768), que hoy no referencia nadie en `src/`.

```
n1  escena: cargador-sospechoso.webp        (sala de descanso)
    ├─ "Usarlo para cargar tu celular aquí"          → e_carga_alli (bad)
    ├─ "Dejarlo donde está y avisar a IT"            → e_avisa      (good)
    └─ "Llevártelo a tu escritorio, ahí lo necesitas más" → n2
n2  escena: imagen-escritorio.webp          (el cable ya en tu puesto)
    ├─ "Conectarlo a tu celular para cargar"         → e_celular (bad)
    ├─ "Conectarlo a tu computadora para revisar qué es" → e_pc  (bad)
    ├─ "Entregarlo a IT para análisis"               → e_it      (good)
    └─ "Descartarlo directamente"                    → e_basura  (good)
```

Se añade `e_avisa` en la fase uno: sin ella no había forma de acertar antes de la fase dos.

Llevárselo deja de ser un `Choice` con `level: 'warn'`, `risk: 8` y `feedback: ''`. En el grafo
es una arista, no un desenlace: deja de puntuar riesgo por un paso intermedio que nunca mostró
nada.

#### `PrivacidadClaves` → `fisico/privacidad-claves`

No pasa a `StoryEscenario`. **Conserva** su pantalla de escritorio simulado (pestañas, ✕,
bloquear, "Terminar") y el temporizador de 30 s: eso es manipulación, no elección, y no cabe en
un grafo de `choices`. Sigue el molde de `SalidaSegura` dentro del mismo módulo.

Cambia:

- Paleta `gray-*` / `blue-500` cruda → tokens (`bg-surface`, `text-ink`, `border-hairline-strong`).
- El veredicto `border-l-4 border-gray-400` → `PanelVeredicto` con `senales`, `regla` y `AccionesFinal`.
- `contexto.antes` lleva hoy mecánica dentro (*"Haz click en la X de cada pestaña"*, *"Presiona
  Terminar"*). El propio `EscenarioLayout` documenta que eso va en `nota`: se muda.
- Fuera `dossierTheme`, `styles.app`, `styles.mainArea`, `styles.sceneView` y el
  `linear-gradient` en línea con `minHeight: 600px`.

Las cadenas `'Excelente. Privacidad protegida'` e `'Información expuesta'` se conservan
literales como `verdict`, para que sus pruebas actuales sigan pasando.

### 3.6 Vocabulario de veredicto

Con `node.verdict` cada final escribe su frase, como en el resto de módulos. El icono ✓ / ! / ✕
y su color los pone `PanelVeredicto` desde `node.kind` con los tokens `--color-success`,
`--color-warning` y `--color-danger`. Desaparecen los emojis incrustados en el texto
(`'✓ Bien resuelto'`) y los tres vocabularios paralelos.

---

## 4. Alcance

### 4.1 Se borra

De `secciones/fisico/fisico.module.css` — los bloques de `.app` / `.mainArea` / `.sceneView`
del principio, y todo desde `.sceneFlash` (línea 212) hasta el final del archivo (línea 425).
En total **unas 234 de 425 líneas, el 55 %**. Verificado clase por clase: todo lo siguiente lo
usan solo los archivos que se reescriben.

`.app` · `.mainArea` · `.sceneView` · `.sceneCanvas` · `.sceneNarrative` · `.sceneObject` ·
`.sceneMeta` · `.sceneLocation` · `.choices` · `.choiceBtn` · `.feedbackPanel` · `.verdictRow` ·
`.badge` (+ `.safe` / `.warn` / `.danger`) · `.feedbackText` · `.nextBtn` · `.stampOverlay` ·
`.stamp` (+ 3 variantes) · `.sceneFlash` · `.flashPulseSpark` · `.flashDot` · `.flashBoltText` ·
`.flashHint` · `.glitchBar` · `.glitchText` · `@keyframes pulse` · `@keyframes glitch`

`.paginaAviso` tiene **0 usos**: ya estaba muerta antes de esto y se va con las demás.

En TSX: `FlashSpark` y `ConsequenceArt` (copiados literalmente en dos archivos),
`SCENE_ART_OFFICE`, `shuffled()` ×5, el `useEffect` de 6 000 ms de `TarjetaClonada`, los
imports de `dossierTheme` en los cinco, y el `<style>` de `TrampaUSB.tsx:229` que oculta
`[role="status"]` y `[role="alert"]` en toda la página.

### 4.2 Se queda

Todo el CSS del SVG de `SalidaSegura`: `.escenaMarco`, `.escena`, `.hotspot`, `.cerrar`,
`.revelable`, `.contorno`, `.pastilla*`, `.pestana*`, `.cerrarHalo`, `.url`, `.pagina*`,
`.pantallaBloqueada`, `.papel*`, `.rotuloMueble`, `.contadorMueble`, `.rotuloTeclado`,
`.piloto*`, y la regla `.senal-resaltada` —que además sube de ámbito.

### 4.3 Fuera de este spec

- Fusionar `PrivacidadClaves` con `SalidaSegura`. Enseñan cosas parecidas (información sensible
  a la vista), pero unirlos es una decisión de currículo, no de estilos.
- Cambiar las fotos de `public/`. Se trabaja con las que hay.
- Subir `EscenaFoto` a `components/ui/`. Cuando un segundo módulo la pida.

---

## 5. Verificación

### 5.1 Pruebas que se actualizan

Los seis archivos de test del módulo. Lo que rompe y por qué:

Las filas cuentan **sitios de llamada**, no tests: un mismo test suele romper por dos motivos
a la vez (elige una opción y luego afirma un veredicto). Los tests afectados son 15 de los 6
archivos.

| Qué rompe | Sitios | Ancla nueva |
|---|---|---|
| `within(telefono).getByRole('button', …)` para elegir | 18 | Las opciones salen de `#pantalla-escenario` a la columna: `screen.getByRole` |
| `within(telefono).getByText('Estacionamiento' \| 'Sala de descanso' \| 'Banco' \| 'Calle/Restaurante' \| 'Tu escritorio')` | 5 | Muere la tira `sceneMeta`. Ancla nueva: `getByAltText` de la foto |
| Veredictos literales | 13 | Pasan a ser `node.verdict` del grafo |
| `getByRole('button', { name: 'Siguiente' })` dentro del teléfono | 2 | Lo sustituye `AccionesFinal` → `"Siguiente escenario →"` |
| El test de los seis segundos con temporizadores falsos (`TarjetaClonada`) | 1 | Se borra con la fase de observación |

Sobreviven sin tocar los tests de `SalidaSegura` y `DescargaProgramasPiratas`. En
`PrivacidadClaves` sobreviven todos —las cadenas de veredicto se conservan literales a
propósito—, salvo el de la pista si su texto cambia al mudar la mecánica de `contexto` a
`nota`.

### 5.2 Comprobaciones nuevas

- Cada escenario reescrito conserva sus tests de "abre en…", uno por final del grafo, y el de
  `¿Cuándo termina el escenario?`.
- `CableComprometido`: un test de que llevarse el cable **no** cierra la corrida —hoy lo hay y
  hay que mantenerlo, porque es exactamente lo que el `feedback: ''` estropeaba.
- `TrampaUSB` y `CableComprometido`: un test por cada final nuevo (`e_reporta`, `e_avisa`).

### 5.3 Revisión a ojo

El repositorio no tiene pruebas de captura, así que nada de esto lo verifica un test
automático. Hay que abrir los ocho escenarios y comprobar, uno por uno:

1. La foto se ve entera, sin recorte, sin barras y sin barra de desplazamiento.
2. No hay contenedor blanco alrededor de la escena.
3. Las opciones están en la columna, numeradas, con los estilos de `StoryChoices`.
4. El veredicto ofrece "Ver las señales" y las zonas se resaltan sobre el objeto correcto.
5. `AvisoFinEscenario` tapa exactamente la foto.
6. Ancho estrecho (móvil) y ancho medio (1024–1279 px), no solo el escritorio ancho.

---

## 6. Riesgos

1. **`min-h-[34rem]` en móvil.** El contenedor de escena lo lleva fijo, fuera de la constante
   del marco (`EscenarioLayout.tsx`). Con imagen `h-auto` por debajo de `lg` puede sobrar
   hueco. Comprobar, no dar por hecho.
2. **`w-fit` contra `flex-1`.** El contenedor lleva `w-full flex-1` fuera de la constante;
   `MARCO_ESCENA` los pisa con `lg:w-fit lg:flex-none`. La media query gana, pero es
   exactamente el tipo de cosa que hay que ver en pantalla antes de cerrarla.
3. **Coordenadas de `zonas`.** Hay que calibrarlas mirando cada foto. No son deducibles del
   código, y una zona mal puesta resalta asfalto vacío en vez del USB.
4. **Riesgo de las nuevas opciones.** `e_reporta` y `e_avisa` cambian el reparto de finales de
   dos escenarios. Revisar que el umbral de aprobación del módulo siga teniendo sentido con un
   `good` más en cada uno.
