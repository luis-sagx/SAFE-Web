# Diseño: corrección del flujo de los escenarios de smishing

**Fecha:** 2026-08-21
**Proyecto:** MIC · Simulador de entrenamiento anti-fraude
**Estado:** diseño aprobado

---

## 1. Problema

Los siete escenarios de smishing funcionan, pero tres defectos de flujo hacen que
el participante gane o pierda sin haber decidido nada. Los tres se detectaron
jugando el módulo:

**1.1 El campo de escribir se rellena solo.** Los siete usan `composerGoto`: tocar
"Mensaje de texto" salta a una escena que ya trae escrito un `borrador` fijo. El
participante no eligió esa frase. En `CodigoReenviado` el efecto es peor: aparece
en el campo un código de seis dígitos que nunca vio de dónde salió, y enviarlo lo
hace perder.

**1.2 El icono de la app gana de un toque.** En `BajaSuscripcion` y
`TarjetaBloqueada` el icono del dock lleva directo al nodo ganador. Quien toca por
explorar —o por error— gana sin haber comprobado nada. Los otros cinco escenarios
del módulo ya no tienen este defecto: pasan por el inicio de la app.

**1.3 La pantalla del banco no parece un banco.** En `TarjetaBloqueada` y
`CodigoReenviado` la app del banco es una lista plana de pares etiqueta/valor, sin
inicio, sin cuenta, sin menú. No se lee como una app: se lee como una ficha del
ejercicio. En `CodigoReenviado`, además, se gana **cerrándola** (`cerrarGoto:
'e_app'`), que es exactamente al revés de lo que enseña.

## 2. Restricciones

- **Cero cambios en `DeviceScreen`.** Las tres primitivas que hacen falta ya
  existen y las usan otros módulos: `respuestas` (burbujas de elección sobre el
  composer, 15 escenarios de estafa/suplantación/vishing), `borrador` +
  `enviarGoto` (texto escrito y sin enviar) y `opciones` (menú de app).
- **Regla diegética de `EscenarioLayout`.** Dentro del marco del teléfono solo se
  dibuja lo que la app real mostraría. Nada de preguntas de examen dentro de la
  pantalla.
- **`BonoEstado` no se toca.** No tiene composer y su camino de comprobación ya es
  navegador → sitios frecuentes → portal oficial.

## 3. Diseño

### 3.1 El composer pasa a burbujas de elección

`composerGoto` desaparece de los siete. En su lugar, `respuestas`: burbujas
rotuladas "Tú escribes", encima del campo. Con `respuestas` el campo queda de
adorno, que es el comportamiento ya documentado en `DeviceScreen`.

Cada set trae al menos dos frases con desenlaces distintos. Elegir la frase
prudente no siempre gana: en un SMS, contestar cualquier cosa ya confirma que la
línea existe y que alguien la lee.

**Un gesto, no dos.** Elegir la burbuja manda el mensaje. Se probó el paso
intermedio —la frase cae en el campo como `borrador` y hace falta pulsar
enviar— para las frases que entregan el botín, y se descartó: obligaba a buscar
un segundo botón, y en un mismo escenario hacía que de dos frases que pierden
igual una costara dos gestos y la otra uno. El instante de "lo estoy mandando"
no lo da un borrador: lo da la burbuja saliendo hacia la derecha del hilo.

**Todo final que nace de contestar se ve sobre la burbuja propia.** El nodo final
no rinde el hilo tal como estaba ni el borrador sin enviar, sino el hilo con el
mensaje ya mandado. Sin eso el veredicto aparece sin que el participante llegue a
ver qué salió de su teléfono: sabe que perdió, no por qué.

### 3.2 El icono de la app deja de resolver el escenario

`BajaSuscripcion` y `TarjetaBloqueada` ganan una escena intermedia: el inicio de la
app, con la cuenta arriba y un menú de `opciones`. La consulta la elige el
participante.

Cada inicio lleva **una opción precipitada** que no gana: una acción que la app de
verdad ofrece, que parece prudente, y que se toma sin haber comprobado nada.

**BajaSuscripcion → `n4`, inicio de Mi Operadora**

```
Mi Operadora · Línea 09 8 123 4567 · Prepago · Saldo $4,80
  Recargar saldo                            (inerte)
  Paquetes y suscripciones                → e_verifica  ACIERTO
  Consumo de datos                          (inerte)
  Bloquear mensajes de números cortos     → e_bloquea   PARCIAL
```

`e_bloquea` (parcial): te tapaste el oído sin comprobar si el cobro existía. Si
hubiera sido real, seguiría cobrándose.

**TarjetaBloqueada → `n4`, inicio del Banco del Litoral**

```
Banca móvil · Tarjeta *4417 · Cupo disponible $1.240,00
  Transferir                                (inerte)
  Mis tarjetas                            → e_app       ACIERTO
  Movimientos                               (inerte)
  Bloquear tarjeta                        → e_bloquea   PARCIAL
```

`e_bloquea` (parcial): anulaste una tarjeta sana y te quedas días sin ella. El SMS
consiguió igual que actuaras a su ritmo.

**CodigoReenviado → `n5`, inicio del Banco del Litoral**

Deja de ganarse cerrando la pantalla. El inicio lleva a `Seguridad de la cuenta`
(→ `e_app`, acierto) y añade `Cambiar mi clave` (→ `e_clave`, parcial: cambiar la
clave no cancela el código ya solicitado y sin usar, que es lo que les falta).

### 3.3 La pantalla del banco se parte en inicio y detalle

Con las primitivas existentes:

- **Inicio:** `brand` (nombre del banco) + `title` (la cuenta o la tarjeta) +
  `subtitle` (el saldo o el cupo) + `opciones` (el menú).
- **Detalle:** `datos` (las filas de estado) + `aviso` (la guía al participante,
  al pie, que es donde una app real pone su nota de seguridad).

Aplica a `TarjetaBloqueada` y `CodigoReenviado`, que hoy tienen solo el detalle.

### 3.4 De dónde sale el código en `CodigoReenviado`

El problema era que el participante nunca había visto los seis dígitos, así que
el mensaje que los mandaba no significaba nada.

Se probó arrancar el escenario en la lista de conversaciones, con las dos vistas
previas visibles de entrada, y se descartó: era el único escenario del catálogo
que no empieza en la pantalla del ataque, y entrar por una bandeja antes de ver
el mensaje se lee como un paso administrativo del ejercicio. Quien recibe un
mensaje lo abre desde la notificación, no desde la lista.

Se entra por el hilo del impostor, como en todos los demás. El código está a un
gesto: la flecha ‹ de la cabecera sale a la lista, y ahí la vista previa lo
enseña junto al remitente por el que el banco escribe siempre.

```
n1  hilo del impostor  ──‹──▶  n2  lista  ──▶  n3  hilo del banco
                                              (Su código … es 731 640)
```

Eso es exactamente lo que cuesta en un teléfono de verdad, y la comparación de
los dos remitentes sigue estando a mano sin que nadie obligue a hacerla.

### 3.6 El veredicto tiene que caber sin desplazar

El panel de resultado enseña, a la vez, el veredicto, su prosa, la nota de
aprobación y una señal del repaso —cuyo hueco es de alto fijo (`min-h-[11rem]`,
reservado para la señal más larga del catálogo)—. Con `outcome` de 300 a 365
caracteres el conjunto no cabía en pantalla y había que desplazar para llegar a
los botones de "Anterior / Siguiente".

Techos que se aplican a los cinco escenarios señalados: **`outcome` ≤ 200
caracteres** (dos o tres frases) y **cada señal ≤ 145**. Se recorta prosa, no
contenido: cada final sigue diciendo qué pasó y por qué.

### 3.5 El reloj del teléfono sale del hilo

`StoryEscenario` pintaba `09:41` fijo en la barra de estado. Encima de un mensaje
de las 20:36, y bajo un enunciado que dice "ya de noche", el reloj delataba la
pantalla. Ahora la hora sale del último mensaje del hilo visible y se queda en la
última que vio: abrir la app del banco no la hace retroceder. Los sellos
relativos del historial ("ayer", "28 jul") se descartan, y un escenario sin hilo
—una llamada— conserva la hora neutra.

Es el único cambio fuera de `secciones/smishing/`, y alcanza a todos los
escenarios con marco de celular, no solo a este módulo: el defecto era del marco.

### 3.7 `TarjetaBloqueada`: la llamada usa el componente de vishing

La pantalla de la llamada era un `kind: 'web'` disfrazado —una ficha con filas
etiqueta/valor y un botón "Dictar el código"—. Pasa a `kind: 'call'`, el
componente `PantallaLlamada` que ya usan los ocho escenarios de vishing:
cronómetro, silenciar, colgar en rojo, burbujas de "lo que dices", y **audio**
`es-EC` generado por `scripts/voces.py`. Una llamada que solo se lee entrena a
leer, que es lo contrario de lo que hay que aprender aquí.

Es una llamada **saliente** —la marcas tú desde el número del SMS—, y ese
detalle sostiene el desenlace: ni siquiera queda un número extraño en tu
registro. En vishing solo `LlamadaPerdida` es saliente; las otras siete entran.

Tres nodos: `n2` la apertura, `n3` donde piden el código, `n4` la app del banco.
La opción de dictar dice `Se lo dicto.` y no cita seis dígitos que el
participante nunca vio; el desenlace explica qué era ese código. Se añade
`e_devuelve` (acierto): colgar y marcar el número del reverso de la tarjeta, la
respuesta que funciona sin tener que adivinar quién habla.

**Marcar el número del mensaje no puede ser el acierto.** Colgar puntuaba como
acierto pleno, por encima de no haber llamado — y la regla de oro del escenario
es justamente que a ese número no se llama. Marcarlo confirma la línea más
fuerte que un SMS: les suena tu número. `e_cuelga` pasa a parcial ("colgaste
bien, pero ya habías marcado"), como el `e_cuelga` de `BancoConfirma` en
vishing. Quedan dos aciertos, los dos por comprobar: `e_devuelve` (colgar y
marcar el reverso de la tarjeta) y `e_app` (mirarlo en la banca móvil).

El escenario entra en `GUIONES` (`voces.test.ts`) y en `VOZ_POR_ESCENARIO`
(`voces.py`) con la misma voz que las dos llamadas de banco de vishing: si
sonara distinto, se distinguiría por el timbre en vez de por lo que pide.

### 3.8 Los dos escenarios legítimos: qué se contesta a un aviso que no pide nada

Las burbujas preguntaban algo que el propio aviso ya respondía —`EntregaProgramada`
preguntaba la hora, que venía escrita en el mensaje— y dejaban al participante
como si no supiera leer. En un aviso legítimo la reacción natural no es
preguntar: es **pedir que hagan algo**. Y la lección es que el canal para pedir
no es contestarle al número.

| Escenario | Frases |
|---|---|
| `AlertaConsumo` | "Bloquéenme la tarjeta: 4539 0011 8842 4417" (fallo) · "Llámenme por favor, no reconozco ese consumo" (parcial) |
| `EntregaProgramada` | "¿Pueden dejarlo con el portero si no estoy?" (parcial) · "Yo no pedí nada, no me lo traigan" (parcial) |

Las dos de `AlertaConsumo` piden algo a un número que no lee, y cada una falla
distinto. La primera escribe la tarjeta entera, que es su regla de oro — y ya
nadie regala datos porque sí: los da para que le bloqueen la tarjeta, que es un
motivo real. La segunda no entrega nada y aun así deja al participante peor de
lo que estaba: queda esperando una llamada del banco, así que la próxima vez que
alguien llame diciendo que lo es, va a creerle porque él la pidió. Ningún otro
escenario del módulo enseña eso, y es el puente a vishing desde un legítimo.

## 4. Alcance

Seis archivos, todos en `frontend/src/secciones/smishing/`:

| Archivo | 3.1 | 3.2 | 3.3 | 3.4 |
|---|---|---|---|---|
| `AlertaConsumo.tsx` | ✓ | | | |
| `BajaSuscripcion.tsx` | ✓ | ✓ | | |
| `TarjetaBloqueada.tsx` | ✓ | ✓ | ✓ | | §3.7 |
| `CodigoReenviado.tsx` | ✓ | ✓ | ✓ | ✓ |
| `CitacionTransito.tsx` | ✓ | | | |
| `PaqueteRetenido.tsx` | ✓ | | | |
| `EntregaProgramada.tsx` | ✓ | | | |

`BonoEstado.tsx` queda intacto. De los componentes compartidos solo cambia
`StoryEscenario.tsx`, y solo por §3.5; `DeviceScreen` no se toca.

## 5. Verificación

`AlertaConsumo.test.tsx` cubre hoy el camino del composer y hay que actualizarlo a
las burbujas. Se añaden tests a `BajaSuscripcion`, `TarjetaBloqueada` y
`CodigoReenviado` que comprueban lo que estaba roto:

1. Tocar el icono de la app **no** termina la corrida: deja el inicio de la app en
   pantalla, con su menú.
2. La opción precipitada del inicio de la app cierra en parcial, no en acierto.
3. La burbuja del botín pasa por el borrador: el dato queda visible en el campo y
   hace falta un segundo gesto para enviarlo.
4. Las dos frases de `BajaSuscripcion` cierran igual: la burbuja deja de ser
   pulsable, aparece mandada dentro del hilo y el veredicto va encima.
5. `CodigoReenviado` abre en la lista, con las dos conversaciones a la vista.
