# Diseño: el código llega como notificación del teléfono

**Fecha:** 2026-09-03
**Proyecto:** MIC · Simulador de entrenamiento anti-fraude
**Estado:** diseño propuesto
**Rama:** `notificaciones-codigo-telefono` (desde `dd1745f`)
**Continúa:** `2026-08-23-cierre-escenarios-smishing-design.md`

---

## 1. Problema

En el fraude real de código de un solo uso, el atacante no falsifica el código:
lo **provoca**. Entra a tu banca con tu número, el banco te manda el código de
verdad, y el atacante solo tiene que convencerte de que se lo pases. La víctima
no cae por leer mal un remitente: cae porque el código le llegó de verdad, del
banco de siempre, y eso hace creíble a quien lo pide.

El simulador enseña esa mecánica en siete escenarios, pero **el código nunca
llega**. Llega quien lo pide. El código hay que ir a buscarlo, o directamente no
existe:

**1.1 Donde el SMS existe, está escondido detrás de un gesto.** En
`CodigoReenviado` el mensaje del banco está en `n3`, y para verlo hay que salir
del hilo del impostor con la flecha `‹` y elegirlo en la lista. En
`AntifraudeBanco` y `BancoConfirma` está en `n4`, detrás del icono `Mensajes`
del dock. En `CodigoPrestado` está en `n2`, detrás de otro icono. En los cuatro,
el participante tiene que **decidir ir a mirar** un mensaje del que solo sabe
por boca del atacante.

**1.2 Donde el SMS no existe, el código sale de la nada.** En
`TarjetaBloqueada` el estafador dice "le acabo de enviar un código de seis
dígitos" y la única respuesta disponible es `Se lo dicto.` — se dicta un código
que el participante nunca vio. En `DevolucionSri` pasa lo mismo: el código
`302774` solo aparece dentro del texto de una opción de diálogo. En
`BonoEstado` el formulario pide "Código que te llegó por SMS" y no llegó ningún
SMS con un código.

**1.3 Se pierde la mitad de la lección.** Lo que hace peligroso al ataque es que
el mensaje del banco es **auténtico**: remitente de siempre, formato de siempre,
y con la defensa escrita dentro ("NUNCA lo comparta, ni con personal del
banco"). Un participante que nunca ve llegar ese mensaje no aprende a
reconocerlo, y sobre todo no aprende lo único que hay que aprender: que la
advertencia venía en el propio mensaje y aun así se compartió.

**1.4 La simulación se delata.** Un teléfono al que le llega un SMS y no avisa
no es un teléfono. La barra de estado tiene reloj, señal y batería; el hilo
tiene hora; el dock tiene apps. Falta la única cosa que un teléfono hace sola.

## 2. Regla

> **Un mensaje que llega mientras miras otra cosa se anuncia solo.**
>
> El código no se busca: aparece encima de lo que estés viendo, con el
> remitente y las primeras líneas, como en cualquier teléfono. Tocarlo abre el
> hilo. Ignorarlo también es una decisión, y también se registra.

El corolario es lo que el módulo enseña: **la notificación trae el código, pero
la advertencia completa está dentro del mensaje.** Un banner de verdad recorta a
dos líneas. Quien lee solo el banner se lleva los seis dígitos; quien toca se
lleva además el "nunca lo comparta". Esa diferencia es el escenario entero.

## 3. Diseño

### 3.1 El campo `notificacion`, en el nodo y no en la vista

La notificación es un **evento del teléfono ligado a llegar a una escena**, no
contenido de una pantalla. El código llega cuando el atacante lo pide, y eso es
una posición del grafo. Va en `ScreenNode` (`StoryEscenario.tsx:20`):

```ts
export interface ScreenNode extends StoryNode {
  view: ScreenView
  /** Lo que el teléfono anuncia al llegar a esta escena. Va en el nodo y no en
   *  la vista porque una notificación no es contenido de una pantalla: es algo
   *  que pasa en un momento del guion. Dos nodos que enseñan la misma pantalla
   *  pueden diferir en si el mensaje ya llegó. */
  notificacion?: Notificacion
}
```

Y en `src/components/ui/NotificacionTelefono.tsx`:

```ts
export interface Notificacion {
  /** App que la emite: "Mensajes". Va en la cabecera del banner, como en un
   *  teléfono de verdad. */
  app: string
  /** El remitente del SMS, tal cual: "BANCO LITORAL", "+593 99 412 8867". Es
   *  la primera señal de un mensaje y aquí es lo primero que se lee. */
  remitente: string
  /** La vista previa. Texto plano, nunca HTML: un banner no lleva negritas, y
   *  no hace falta una segunda vía de inyección al lado de `msgs[].text`.
   *  El CSS lo recorta a dos líneas, como recorta un banner de verdad. */
  texto: string
  hora?: string
  /** Nodo al que lleva tocarla. Sin esto la notificación es solo aviso: se ve
   *  y no se abre, que es lo que hace un banner de una app que no está
   *  simulada. */
  goto?: string
  label?: string
}
```

Que vaya en el nodo resuelve gratis dos casos que la vista no resolvería:
`AntifraudeBanco` llega a pedir el código por dos caminos (`n3` y `n3b`) que
comparten estructura pero no vista, y `DevolucionSri` igual. Cada uno declara la
suya sin duplicar contenido.

### 3.2 Dónde se pinta

Dentro de `pantallaTelefono` (`StoryEscenario.tsx:431`), como **primer hijo de
`.phoneBody`** (`StoryEscenario.tsx:441`), en posición absoluta sobre
`.phoneApp`:

```
.phoneStage
  .phoneStatusBar                        ← el banner NO la tapa: el reloj sigue
  .phoneBody            position: relative
     ▸ NotificacionTelefono   absolute, top/left/right .5rem, z-index 5
     .phoneApp                          ← queda debajo, intacta
  .phoneDock
  .phoneSystemBar
```

El único cambio de CSS estructural es **`.phoneBody { position: relative }`**
(`DeviceScreen.module.css:1705`). No `.phoneStage`: colgar el banner de la etapa
obligaría a calcular a mano el alto de la barra de estado (`min-height: 1.5rem`
más `padding-bottom: .375rem` más el `padding: .4375rem` de la etapa), y ese
número se rompería la próxima vez que alguien toque la barra. `.phoneBody` ya
empieza exactamente donde el banner tiene que empezar.

`#pantalla-escenario` ya es `relative overflow-hidden`
(`EscenarioLayout.tsx:328`) y ya tiene un overlay encima (`AvisoFinEscenario`),
así que no hay nada que cambiar fuera del teléfono.

Estilos nuevos en `DeviceScreen.module.css`, con los nombres del archivo
(`phoneNotificacion*`): tarjeta clara translúcida con `backdrop-filter`, sombra,
radio 1rem, cabecera de 0.6875rem con app · remitente · hora, cuerpo recortado a
dos líneas con `-webkit-line-clamp: 2`, y un `✕` a la derecha.

El recorte es CSS y no una cadena truncada en el escenario: el lector de
pantalla sigue leyendo el texto entero, que es lo correcto, y el escenario
declara el mensaje que de verdad llegó en vez de una versión mutilada a mano.

### 3.3 Cómo se toca

Nada nuevo. `.phoneStage` ya lleva `onClick={onHotspot}`
(`StoryEscenario.tsx:431`), así que:

- **Abrirla** es un `<button data-hotspot-goto data-hotspot-label>`. Ya navega,
  ya entra en la traza de la corrida, ya deshace `appAbierta` y `pestanaMirada`.
  Cero código nuevo en `onHotspot`.
- **Descartarla** es un `<button data-control>` con su propio `onClick`. El
  `data-control` es obligatorio: `StoryEscenario.tsx:383-384` trata cualquier
  clic sin `data-hotspot-goto` como "tocó en vacío" y enciende la pista de
  fallo. `data-control` es la puerta que ya existe para los controles del propio
  aparato ("reproducir una nota de voz, silenciar la llamada").

Abrir la notificación **sí es una decisión y sí se registra**: distingue en los
datos del estudio a quien fue a leer el mensaje de quien se quedó con los seis
dígitos del banner. Es exactamente el dato que este spec existe para capturar.

**El nombre accesible de los dos botones es un `aria-label` fijo y sin nombres
propios dentro**: `Abrir la notificación` y `Descartar la notificación`. No es
cosmético, y el detalle de que no lleve el remitente tampoco:

- `AntifraudeBanco.test.tsx:56` y `BonoEstado.test.tsx:84` hacen
  `getByRole('button', { name: /Mensajes/ })` estando exactamente en el nodo
  donde va el banner (`n3` y `n2`). Si el nombre accesible saliera del contenido
  del banner —que empieza por la app, "Mensajes"— colisionaría con el icono del
  dock y los dos tests romperían con *found multiple elements*.
- Meter el remitente en el `aria-label` traslada el problema en vez de
  resolverlo: `Abrir la notificación de BANCO LITORAL` casa con el
  `getByRole('button', { name: /Banco/ })` que usan
  `TarjetaBloqueada.test.tsx:47, 82, 103, 121`. Hoy ninguno de esos clics cae en
  el nodo del banner, pero es una mina para el primer test que se añada.

Un `aria-label` gana sobre el contenido, así que con el texto fijo el dock sigue
siendo el único `/Mensajes/` y el único `/Banco/`. Lo que el banner dice se
anuncia igual por el `aria-live` del contenedor (§3.6), que es donde tiene que
estar.

### 3.4 Cuándo aparece y cuándo se va

```ts
const [descartadas, setDescartadas] = useState<string[]>([])

const notificacion = story[engine.current]?.notificacion
const mostrarNotificacion = Boolean(
  notificacion &&
    !engine.isEnding &&
    !pantallaRepaso &&
    !descartadas.includes(engine.current),
)
```

Cuatro condiciones, cada una por una razón:

- **`engine.current` y no `nodoVisible`.** La notificación pertenece a la
  posición del grafo, no a la pantalla que se está mirando. Que siga ahí
  mientras abres la cámara desde el dock es lo que hace un teléfono de verdad.
- **`!engine.isEnding`.** Sobre el veredicto no llega nada. `AvisoFinEscenario`
  ya ocupa ese sitio.
- **`!pantallaRepaso`.** Durante el repaso de señales, `PanelVeredicto` resalta
  el elemento con `[data-signal]` dentro de `#pantalla-escenario`
  (`PanelVeredicto.tsx:108-109`). Un banner encima taparía justo lo que se está
  explicando.
- **`descartadas`.** Una notificación llega una vez.

Se marca como descartada al **salir** del nodo, no al entrar, con la limpieza
del efecto:

```ts
useEffect(() => {
  if (!mostrarNotificacion) return
  // Se marca al salir del nodo y no al entrar: mientras sigas ahí sigue en
  // pantalla, y en cuanto haces cualquier cosa —tocarla, descartarla, decidir
  // otra cosa— el momento ya pasó y no vuelve.
  return () => setDescartadas((ids) => [...ids, engine.current])
}, [mostrarNotificacion, engine.current])
```

Así un solo mecanismo cubre los tres finales del banner: tocarlo (cambia el
nodo), descartarlo (el `✕` añade el id a mano) y decidir cualquier otra cosa
(cambia el nodo). Mirar una app del dock no lo cambia, y por eso el banner
sobrevive a eso, que es lo correcto.

**Hay que limpiar `descartadas` al reiniciar.** `engine.restart()`
(`useStoryEngine.ts:91`) solo devuelve `current` a `startId`; el estado local de
`StoryEscenario` sobrevive. Sin esto, "↻ Repetir el escenario" daría una corrida
sin notificación. Se envuelve el reinicio que ya se pasa a `PanelVeredicto`
(`onRestart`) y a `EscenarioLayout` (`onEmpezar`):

```ts
const reiniciar = useCallback(() => {
  setDescartadas([])
  engine.restart()
}, [engine])
```

`EscenarioLayout` llama a `onEmpezar` también al salir del briefing
(`EscenarioLayout.tsx:142`), así que la primera corrida entra limpia por el
mismo camino.

### 3.5 Una sola a la vez

No hay cola. Ningún escenario del simulador tiene dos mensajes llegando en la
misma escena, y una cola con su animación de apilado es código que hoy no
ejecutaría nadie. Si algún día hiciera falta, el campo pasa de objeto a array
sin tocar nada más.

### 3.6 Movimiento y lectura

- Entrada: deslizar hacia abajo + fundido, 260 ms, anulado bajo
  `prefers-reduced-motion: reduce`. Es el mismo trato que ya recibe
  `FlashOverlay.module.css`.
- `role="status"` y `aria-live="polite"` en el contenedor: un lector de pantalla
  anuncia la llegada, que es lo que hace un teléfono.
- `aria-label` fijos en los dos botones: `Abrir la notificación` y `Descartar la
  notificación`. Sin nombres propios dentro, por §3.3.

### 3.7 Lo que no cambia

- Ningún camino del grafo existente desaparece. La flecha `‹` de
  `CodigoReenviado` sigue llevando a la lista, el icono `Mensajes` de
  `AntifraudeBanco` sigue llevando a `n4`. La notificación es un camino **más**.
- Ninguna `senal` se mueve. Las señales siguen apuntando a los elementos del
  hilo, que es donde se pueden resaltar durante el repaso.
- Los escenarios de escritorio no la ven nunca: vive dentro de
  `pantallaTelefono`, que solo se pinta con `accionesEnPantalla`. Los siete
  escenarios de este spec lo declaran todos.
- `DeviceScreen.tsx` no se toca.

## 4. Los escenarios

### 4.1 Fase A — los cuatro que ya tienen el SMS

Aquí la notificación es puro añadido: el mensaje ya existe como nodo, ya tiene
su señal, y lo único que cambia es que ahora se anuncia solo.

| Escenario | Nodo | Remitente · hora | `goto` |
|---|---|---|---|
| `smishing/CodigoReenviado` | `n1` | `BANCO LITORAL` · 20:40 | `n3` |
| `vishing/AntifraudeBanco` | `n3`, `n3b` | `BancoLitoral` · 21:07 | `n4` |
| `vishing/BancoConfirma` | `n3` | `BancoLitoral` · 21:06 | `n4` |
| `suplantacion/CodigoPrestado` | `n1` | `Verificación` · 20:13 | `n2` |

**`CodigoReenviado` (`n1`).** El SMS del banco es de las 20:40 y el del impostor
de las 20:41; el escenario abre en el hilo del impostor. La notificación
reproduce el orden real: el código ya llegó y su banner sigue arriba cuando
empiezas a leer al impostor.

```ts
notificacion: {
  app: 'Mensajes',
  remitente: 'BANCO LITORAL',
  hora: '20:40',
  texto:
    'Su codigo de verificacion es 731 640. Vence en 5 minutos. NUNCA lo comparta con nadie, ni con personal del banco.',
  goto: 'n3',
  label: 'Abrió la notificación del código que envió el banco',
}
```

El texto es el del SMS, sin recortar. Las dos líneas del banner dejan ver los
seis dígitos y cortan dentro de la advertencia; leerla entera cuesta un toque.

**`AntifraudeBanco` (`n3` y `n3b`).** Los dos nodos terminan en `PIDE_CODIGO`
("le acabo de enviar un código de seis dígitos. Léamelo"). La notificación llega
justo ahí, encima de la llamada en curso, que es el momento entero del ataque.
Misma declaración en los dos.

**`BancoConfirma` (`n3`).** `BLOQUEAN` dice "le va a llegar un mensaje con un
código de constancia. Ese código no me lo dé a mí ni a nadie". El banner llega
después de la frase y es el contraste que este escenario existe para enseñar: la
llamada es de verdad, el mensaje es de verdad, y aun así el código no se dicta.

**`CodigoPrestado` (`n1`).** El código es de las 20:13 y el mensaje de la prima
de las 20:14. Igual que en `CodigoReenviado`: el banner ya está cuando abres el
chat. `n2` es una lista tipo `web`, no un hilo `sms`, y no importa: el `goto`
apunta a un nodo, no a un tipo de vista.

Ninguno de los cuatro cambia una sola línea de su grafo.

### 4.2 Fase B — los tres que además necesitan el SMS

Aquí no basta con anunciar: hay que crear el mensaje que hoy no existe. Es un
cambio de contenido pedagógico, no solo de presentación, y por eso va aparte.

**`smishing/TarjetaBloqueada`.** El estafador dice "le acabo de enviar un código
de seis dígitos" y hoy no hay tal mensaje. Según el propio desenlace del
escenario ese código es **auténtico**: "el código que dictaste autorizaba una
compra que ellos hacían mientras hablabas". Es exactamente el ataque que este
spec describe, y le falta la mitad visible.

- Nodo nuevo `n_codigo`, vista `sms`, remitente `BANCO LITORAL`, sub `Remitente
  habitual · SMS`, código `508 213` (sin colisión con ningún otro escenario),
  hora `20:44`, `senal: 'aviso-real'`.
- Notificación en `n4` (`PIDEN_CODIGO`) con `goto: 'n_codigo'`.
- **Señal nueva** `remitente-real`: el SMS falso viene de `BANCO-LIT`
  ("Remitente sin verificar") y el auténtico de `BANCO LITORAL`. Hoy el
  escenario afirma que el remitente es la señal pero no da con qué compararlo.
  Este mensaje es esa comparación.
- `n_codigo` no lleva `volverGoto`: se vuelve a la llamada con el icono
  `Teléfono` del dock, que ya restaura `hilos.call`
  (`TarjetaBloqueada.tsx:252`). El patrón está probado: `AntifraudeBanco` ya
  navega a un nodo `sms` con la llamada viva.
- `n_codigo` se declara **después** de `n1` en `STORY`. El reloj del teléfono se
  inicializa con la hora del **primer** nodo `sms` del objeto
  (`StoryEscenario.tsx`, inicializador de `horaTelefono`), y `n1` ya marca
  20:36. Al abrir el código el reloj avanza a 20:44, que es lo que se quiere.

**`vishing/DevolucionSri`.** `CIERRE` dice "su banco le va a enviar un código de
seis dígitos. Léamelo en cuanto le llegue", y el `302774` solo vive dentro del
texto de una opción de diálogo.

- Nodo nuevo `n_codigo`, remitente `BancoLitoral`. El texto tiene que decir lo
  que la regla de oro del escenario enseña: *"su codigo de autorizacion de
  transferencia es 302774. Vence en 5 minutos. Nunca lo comparta: con el se
  autorizan salidas de dinero de su cuenta."* El código no libera un depósito,
  autoriza una salida — y ahora está escrito donde el participante puede leerlo.
- Notificación en `n3` (`DIO_CEDULA`) y `n3b` (`SIN_CEDULA`), `goto: 'n_codigo'`.
- El dock **no tiene icono `Mensajes`** (`DevolucionSri.tsx:181-201`). Se le
  añade uno con `goto: 'n_codigo'`, como en `AntifraudeBanco`, para poder releer
  el mensaje después de descartar el banner. Un `hilo: 'sms'` no serviría: sin
  haber visitado ningún hilo, el destino cae en `hilos.call` y el icono
  `Mensajes` devolvería a la llamada.
- **Consecuencia sobre el reloj:** hoy el escenario no tiene ningún nodo `sms`,
  así que la barra de estado marca el `'09:41'` por defecto. Al añadir uno, el
  reloj pasa a marcar su hora desde el principio de la corrida. Se fija en
  `10:12`, coherente con "una mañana entre semana" del contexto.
- **Señal nueva** `texto-codigo` sobre el mensaje, con el argumento de la regla
  de oro: el código del banco solo autoriza salidas, nunca entradas.

**`smishing/BonoEstado`.** El formulario falso pide "Código que te llegó por
SMS" y no llegó ninguno. Es el caso más literal del ataque descrito: mientras el
participante tiene la página abierta, los atacantes usan el usuario y la clave
recién entregados para entrar a la banca, y el banco manda el código de verdad.

- Nodo nuevo `n_codigo`, remitente `BANCO LITORAL`, hora `09:47` (el SMS del
  bono es de las `09:41`, que sigue siendo el primero del objeto y por tanto el
  reloj inicial no cambia).
- Notificación en `n2` (`PAGINA`), `goto: 'n_codigo'`.
- `n_codigo` lleva `volverGoto: 'n2'` con label `Volvió a la página después de
  leer el código`: aquí sí hace falta, porque de la página se sale al hilo y del
  hilo hay que poder volver a la página.
- **Fidelidad reducida, a propósito:** en la vida real el código llega *después*
  de mandar usuario y clave, y el formulario de `BonoEstado` los pide los tres a
  la vez en una sola pantalla. Partir el formulario en dos pasos sería el
  modelado fiel; es un rediseño del escenario y no entra aquí. La notificación
  llega al abrir la página, y el mensaje del banco explica por qué llegó.

### 4.3 Los que no entran

- `smishing/CitacionTransito` y `smishing/PaqueteRetenido`: piden el **CVV** de
  la tarjeta, que está impreso en el plástico. No llega por SMS y no hay nada
  que anunciar.
- `suplantacion/JefeUrgente`: los códigos son de tarjetas de regalo raspadas en
  una tienda física.
- `vishing/SoporteTecnico`: el código de sesión lo genera y lo muestra la app de
  control remoto en pantalla; no llega por mensaje.
- Los escenarios sin `accionesEnPantalla` y los de escritorio: no tienen
  teléfono donde pintar nada.

## 5. Alcance

| Archivo | Infra | Fase A | Fase B |
|---|---|---|---|
| `components/ui/NotificacionTelefono.tsx` *(nuevo)* | ✓ | | |
| `components/ui/DeviceScreen.module.css` | ✓ | | |
| `components/StoryEscenario.tsx` | ✓ | | |
| `secciones/smishing/CodigoReenviado.tsx` | | ✓ | |
| `secciones/vishing/AntifraudeBanco.tsx` | | ✓ | |
| `secciones/vishing/BancoConfirma.tsx` | | ✓ | |
| `secciones/suplantacion/CodigoPrestado.tsx` | | ✓ | |
| `secciones/smishing/TarjetaBloqueada.tsx` | | | ✓ |
| `secciones/vishing/DevolucionSri.tsx` | | | ✓ |
| `secciones/smishing/BonoEstado.tsx` | | | ✓ |
| `secciones/smishing/CodigoReenviado.test.tsx` | | ✓ | |
| `secciones/smishing/TarjetaBloqueada.test.tsx` | | | ✓ |

`DeviceScreen.tsx`, `EscenarioLayout.tsx`, `useStoryEngine.ts` e `interactivo.tsx`
no se tocan. El backend no se toca: `label` viaja por la traza de la corrida que
ya existe.

En `StoryEscenario.tsx` son cuatro añadidos: el campo en `ScreenNode`, el estado
`descartadas` con su efecto, el `reiniciar` envuelto, y el render dentro de
`.phoneBody`. Ninguna función existente cambia de comportamiento.

## 6. Verificación

**Infra**

1. **Un nodo sin `notificacion` se ve igual que hoy.** Ningún escenario de los
   demás módulos cambia de píxel.
2. **El banner no rompe la pista de fallo.** Tocar el `✕` no enciende el aviso
   de "tocaste en vacío"; tocar el fondo del teléfono sí lo sigue encendiendo.
3. **Tocar el banner navega y queda en la traza.** La decisión aparece con su
   `label` en la corrida enviada al backend.
4. **La notificación llega una vez.** Descartarla y volver al mismo nodo por
   otro camino no la vuelve a mostrar.
5. **Reiniciar la devuelve.** Tras "↻ Repetir el escenario" el banner vuelve a
   aparecer en su nodo.
6. **No aparece sobre el veredicto ni durante el repaso.** Con la corrida
   terminada no hay banner, y recorriendo las señales tampoco.
7. **Mirar una app del dock no la mata.** Abrir la cámara y volver deja el
   banner donde estaba.
8. **La barra de estado sigue visible.** El banner empieza debajo del reloj.

**Fase A**

9. **`CodigoReenviado`:** el banner está en la primera pantalla; tocarlo abre el
   hilo del banco (`n3`); la flecha `‹` sigue llevando a la lista y la lista
   sigue enseñando la vista previa. Los **seis** tests del archivo pasan sin
   tocarlos.
10. **`AntifraudeBanco`:** `getByRole('button', { name: /Mensajes/ })` sigue
    encontrando **un solo** botón estando en `n3`. Los cuatro tests pasan sin
    tocarlos.
11. **`BancoConfirma` y `CodigoPrestado`:** el banner aparece en su nodo. No hay
    tests que romper — ninguno de los dos tiene archivo `.test.tsx` hoy — así
    que se comprueban a mano.

**Fase B**

12. **`TarjetaBloqueada`:** durante la llamada llega el código; tocarlo abre
    `n_codigo`; el icono `Teléfono` devuelve a la llamada exacta y la corrida
    sigue viva. El reloj arranca en 20:36 y avanza a 20:44 al leer el mensaje.
    `Se lo dicto.` sigue cerrando en `e_dicta`. Los ocho tests del archivo pasan
    sin tocarlos, incluido el `getByRole('button', { name: /Banco/ })` de los
    cuatro que lo usan.
13. **`DevolucionSri`:** el reloj marca 10:12 desde el principio; el icono
    `Mensajes` nuevo abre `n_codigo` sin terminar la corrida; dictar el código
    sigue cerrando en `e_codigo`. Tampoco tiene archivo de test hoy.
14. **`BonoEstado`:** el reloj arranca en 09:41; el banner llega con el
    formulario abierto; `volverGoto` devuelve a la página y el formulario sigue
    entero. Los tests del archivo pasan sin tocarlos, incluido el
    `getByRole('button', { name: /Mensajes/ })` de la línea 84, que corre
    estando en `n2` — el nodo del banner.
15. **Las señales nuevas se resaltan.** `remitente-real` en `TarjetaBloqueada` y
    `texto-codigo` en `DevolucionSri` encuentran su elemento durante el repaso.

**Tests nuevos**

La infraestructura es lógica con ramas y estado, así que deja comprobación
propia. Van en los archivos que ya existen, sin crear ninguno:

- `CodigoReenviado.test.tsx`: el banner aparece al empezar, tocarlo lleva al
  hilo del banco, y descartarlo con el `✕` lo quita sin terminar la corrida ni
  encender la pista de fallo.
- `TarjetaBloqueada.test.tsx` (fase B): el banner llega al pedir el código,
  abrirlo enseña el mensaje auténtico, y el icono `Teléfono` devuelve a la
  llamada.

Cubren entre los dos las cuatro condiciones de §3.4 y los dos botones de §3.3.
Los cuatro escenarios restantes son declaración de datos y no añaden ramas.

## 7. Riesgos y decisiones

**7.1 `CodigoReenviado` pierde dificultad, y es el precio.** Su comentario de
cabecera defiende hoy lo contrario: "el código del banco está a un gesto […] que
es exactamente lo que cuesta en un teléfono de verdad". Es un buen argumento
para el diseño anterior y deja de valer con este: en un teléfono de verdad ese
mensaje **también** llega con banner. La dificultad que se pierde era la de
encontrar una pantalla, no la de resistir la petición, y solo la segunda es lo
que el escenario mide. El comentario se reescribe con este spec.

**7.2 El recorte a dos líneas es la defensa de la dificultad, y es frágil.**
Depende de `-webkit-line-clamp` y del ancho del marco. Si un banner acabara
mostrando el aviso completo, el escenario se resolvería sin tocar nada. Es un
punto a mirar en revisión visual, no algo que un test cubra bien.

**7.3 La Fase B cambia qué mide cada escenario.** En `TarjetaBloqueada`, hoy
"Se lo dicto." se elige sin haber visto el código; mañana se elige después de
haberlo podido leer, con su "NUNCA lo comparta" delante. Es más realista y más
duro de justificar para quien cae — que es el punto — pero es un cambio de
contenido, no de presentación. Por eso va en fase aparte y con aprobación
propia.

**7.4 El reloj de `DevolucionSri` cambia.** De `09:41` a `10:12` durante toda la
corrida, por cómo se inicializa `horaTelefono`. Es inofensivo y coherente con el
contexto, pero es un efecto secundario no obvio de añadir un nodo `sms`.

**7.5 Sonido y vibración quedan fuera.** Un teléfono que suena en una aula o en
una sala de estudio es un problema, no realismo.
