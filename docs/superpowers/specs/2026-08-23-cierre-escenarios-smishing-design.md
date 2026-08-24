# Diseño: dónde cierra un escenario de smishing

**Fecha:** 2026-08-23
**Proyecto:** MIC · Simulador de entrenamiento anti-fraude
**Estado:** diseño aprobado
**Continúa:** `2026-08-21-flujo-escenarios-smishing-design.md`

---

## 1. Problema

Comprobar en la entidad correcta no termina la corrida. Después de mirar el dato,
el participante tiene que cerrar la app, volver al hilo y pulsar la flecha `‹` de
la cabecera. Ese último gesto es el que gana, y no se entiende:

**1.1 La flecha no dice qué hace.** Es un chevron con `aria-label` "Volver a la
lista de mensajes". En seis de los ocho escenarios no hay lista ninguna: termina
la corrida.

**1.2 El mismo píxel cambia de significado a mitad de la corrida.** En
`TarjetaBloqueada` el `‹` es `e_ignora` (parcial) antes de comprobar y `e_app`
(acierto) después. Nada en pantalla marca el cambio.

**1.3 El enunciado no acompaña.** Tras comprobar, el panel de decisión sigue
diciendo `¿Qué haces?`, igual que en la primera pantalla. No hay ninguna señal de
"ya comprobaste, ahora te falta decidir".

**1.4 En `CodigoReenviado` el acierto es inalcanzable.** Ningún `goto` apunta a
`e_app`: `n_seguridad` cierra a `n2` (la lista) y la lista cierra a `e_ignora`.
El test que lo cubría quedó en `it.skip` (commit `5e8244d`). Hoy ese escenario no
se puede ganar comprobando.

La cola nació de la issue #74, pero la issue decía algo más estrecho de lo que se
implementó: el problema era que **tocar el icono de la entidad legítima ganaba de
un toque**. La respuesta correcta a eso es que el icono abra el inicio de la app y
que haya que elegir en el menú — que es lo que ya hace el diseño del 2026-08-21,
§3.2. Todo lo que viene después del detalle no mide nada más.

## 2. Regla

> **El escenario cierra en cuanto no queda nada abierto.**
>
> Si comprobaste y nadie espera respuesta, se acabó ahí, sobre la pantalla que lo
> prueba. Si queda algo en marcha —una llamada viva, un código pedido y sin
> usar— comprobar no cierra: hay que cortarlo, y con una opción rotulada.

La issue #74 queda intacta: el icono del dock abre el **inicio** de la app y no
gana nada. El acierto exige elegir la opción correcta del menú, con la opción
precipitada cerrando en parcial justo al lado (`Bloquear tarjeta`, `Cambiar mi
clave`, `Bloquear mensajes de números cortos`).

Es una regla que un participante no técnico puede formular solo, y esa es la
mitad de su valor: sabe cuándo ha terminado sin que nadie se lo explique.

## 3. Diseño

### 3.1 Los seis sin nada pendiente: el detalle es terminal

`AlertaConsumo`, `BajaSuscripcion`, `BonoEstado`, `CitacionTransito`,
`EntregaProgramada` y `PaqueteRetenido`. En los seis, el nodo `good` ya renderiza
exactamente la vista del detalle (`e_app.view === APP_BANCO`, `e_verifica.view
=== OPERADORA`, y así). El cambio es una deleción:

- la opción correcta del menú apunta al final en vez de a la escena intermedia
  (`goto: 'n_movimientos'` → `goto: 'e_app'`)
- desaparecen el nodo del detalle (`n_movimientos` / `n_tarjetas` /
  `n_seguridad`), el nodo `n_sms_verificado`, la constante `SMS_VERIFICADO` y el
  `cerrarGoto` / `cerrarLabel` del detalle

Se van tres gestos y unas doce líneas por escenario. El veredicto sigue
apareciendo sobre la pantalla que lo prueba, que es lo que ya pedía §3.1 del spec
anterior: el final se ve sobre lo que de verdad pasó.

### 3.2 `CodigoReenviado`: comprobar no cierra, y el acierto vuelve a existir

Aquí el impostor está esperando respuesta y el código sigue vivo. Comprobar es
necesario y no es suficiente: falta negarse.

```
n1 hilo del impostor ──‹──▶ n2 lista ──▶ n3 hilo del banco
n4 Banco inicio ──▶ n_seguridad ──‹──▶ n1c hilo comprobado
                                       └─ «Ese código no se lo puedo pasar» ─▶ e_app
```

Dos cambios:

- `n_seguridad.cerrarGoto` pasa de `'n2'` (la lista) a `'n1c'`, el hilo del
  impostor **después de haber comprobado**.
- `n1c` es `HILO_COMPROBADO`: el mismo `HILO_FALSO`, con la respuesta `Ese código
  no se lo puedo pasar a nadie.` apuntando a `e_app` en vez de a `e_niega`.

Sin haber comprobado, esa misma frase sigue cerrando en `e_niega` (parcial:
hiciste lo correcto, pero no llegaste a saber que el intento de acceso no
existía). Con la comprobación hecha, cierra en `e_app`.

La diferencia entre los dos hilos es sólo el destino de una burbuja, así que el
segundo se deriva del primero y no se duplica el contenido.

El test `abrir la app del banco no termina la corrida` sale de `it.skip`.

### 3.3 `TarjetaBloqueada`: la llamada bifurca el camino

El spec anterior (§3.7) deja el dock visible durante la llamada a propósito:
salir a mirar la app del banco mientras el otro habla tiene que costar lo mismo
que en un teléfono de verdad. Eso hace que al detalle del banco se llegue por dos
caminos con valor distinto:

- **Sin haber llamado:** `dock Banco → n5 inicio → Mis tarjetas → e_app`. Igual
  que los seis de §3.1.
- **Dentro de la llamada:** comprobar no cierra. Vuelves a la llamada sabiendo
  que no hay ningún bloqueo, y cierras colgando: `e_cuelga` (parcial, ya habías
  marcado) o `e_devuelve` (acierto, cuelgas para marcar el reverso).

Un acierto pleno por el segundo camino contradiría la regla de oro del escenario
—al número del mensaje no se llama— y el propio reparto de §3.7, donde `e_cuelga`
es parcial precisamente porque marcar ya confirma la línea.

**`AppTelefono` gana `gotoEnLlamada?: string`.** `StoryEscenario` lo usa en lugar
de `goto` cuando el nodo actual es una pantalla de llamada de verdad:

```ts
const enLlamada = vista.kind === 'call' && !vista.marcando
```

El marcador no cuenta: tocar el número todavía no es haber llamado, y salir de él
devuelve al hilo sin coste.

El escenario duplica dos nodos:

- `n5c`, el inicio del banco durante la llamada. Mismo menú; `Mis tarjetas`
  apunta a `n_tarjetas_llamada` y `Bloquear tarjeta` sigue en `e_bloquea`.
- `n_tarjetas_llamada`, el detalle sin `cerrarGoto`: la vuelta a la llamada es el
  icono `Teléfono` del dock, que ya restaura el nodo exacto desde `hilos.call`.

Es el único cambio fuera de `secciones/smishing/`, y es un campo opcional: los
demás módulos no lo declaran y siguen igual.

### 3.4 Lo que se queda

El `‹` del hilo **antes** de comprobar sigue cerrando en `e_ignora` (parcial,
"lo dejaste pasar"). Ese se entiende: es el estado inicial, y salir de un hilo
sin hacer nada significa exactamente eso. Lo que desaparece es el `‹` que cambia
de significado a mitad de la corrida.

Las `pista` de los escenarios afectados dejan de mencionar el regreso al hilo.

## 4. Alcance

| Archivo | §3.1 | §3.2 | §3.3 |
|---|---|---|---|
| `AlertaConsumo.tsx` | ✓ | | |
| `BajaSuscripcion.tsx` | ✓ | | |
| `BonoEstado.tsx` | ✓ | | |
| `CitacionTransito.tsx` | ✓ | | |
| `EntregaProgramada.tsx` | ✓ | | |
| `PaqueteRetenido.tsx` | ✓ | | |
| `CodigoReenviado.tsx` | | ✓ | |
| `TarjetaBloqueada.tsx` | | | ✓ |
| `components/StoryEscenario.tsx` | | | ✓ |

`DeviceScreen` no se toca.

## 5. Verificación

1. **El icono sigue sin ganar.** En los ocho, tocar el icono de la entidad
   legítima deja el inicio de la app en pantalla con su menú, y el panel sigue
   preguntando `¿Qué haces?`.
2. **La opción correcta cierra.** En los seis de §3.1, elegir la opción del menú
   que enseña el dato termina la corrida en acierto, sin pasos intermedios.
3. **La opción precipitada sigue en parcial.** `Bloquear tarjeta`, `Cambiar mi
   clave` y `Bloquear mensajes de números cortos` no ganan.
4. **`CodigoReenviado` se puede ganar.** Comprobar la seguridad de la cuenta,
   salir al hilo y negarse cierra en `e_app`. Negarse **sin** haber comprobado
   sigue cerrando en `e_niega`. Se reactiva el `it.skip`.
5. **`TarjetaBloqueada` bifurca.** Abrir el banco desde el hilo y mirar `Mis
   tarjetas` cierra en `e_app`; abrirlo desde dentro de la llamada deja la
   corrida viva y devuelve a la llamada por el icono `Teléfono`.
6. **El marcador no es una llamada.** Con el marcador en pantalla, el icono del
   banco usa `goto` y no `gotoEnLlamada`.

## 6. Pendiente de otro spec

`AlertaConsumo.tsx` todavía usa `composerGoto` + `borrador` donde §3.1 del spec
del 2026-08-21 pedía `respuestas`. No entra en este diseño.
