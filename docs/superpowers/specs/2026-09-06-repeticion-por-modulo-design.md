# Repetición por módulo (ronda completa)

Fecha: 2026-09-06
Estado: aprobado (diseño); pendiente plan de implementación

## Problema

Regla del curso: cuando un participante **no aprueba** un escenario, no debe poder
**repetirlo enseguida**. Tiene que terminar todos los escenarios de ese tipo de
ataque y, para repetir, **repite todos** (una ronda completa). La nota `/8` que
queda es la de la **última ronda completa**, no la del mejor intento ni una mezcla
de intentos sueltos.

Objetivo pedagógico: forzar repaso de todo el módulo en vez de reintentar a ciegas
un solo escenario hasta acertar. El diseño UI/UX debe hacer que esta regla no se
sienta como castigo: el avance hacia adelante siempre está disponible, la nota
actual nunca baja por empezar una repetición, y repetir se presenta como práctica
deliberada.

## Estado actual (lo que ya existe)

- **6 módulos** (`phishing`, `smishing`, `vishing`, `suplantacion`, `estafa`,
  `fisico`), **8 escenarios** cada uno. Umbral: 6 aprobados de 8
  (`backend/apps/entrenamiento/src/runs/progreso.ts`, `UMBRALES`/`TOTALES`).
- El backend guarda el **último** `outcome` por escenario, no el mejor
  (`calcularProgreso`). Solo `CORRECTO` acredita; `PARCIAL`/`INCORRECTO` no.
- `aprobado` de un módulo = `aprobados >= 6` **y** `escenarios.length >= 8`
  (haber intentado los 8 alguna vez).
- Certificado: `calificacion = Σ progreso.aprobados` de los 6 módulos, sobre 48
  (`runs.service.ts` `atestacion()`, PDF `48`).
- Gating de escenario (`lib/bloqueoEscenarios.ts` `escenarioEstaDisponible`):
  disponible si su índice `<= primerPendiente`. Cuando **todos** fueron jugados
  (`primerPendiente === -1`), **cualquiera** vuelve a estar disponible → hoy se
  puede repetir un escenario suelto.
- `AccionesFinal.tsx`: mientras queden escenarios sin intentar, la única acción es
  "Siguiente escenario"; al terminar los 8 aparece "↻ Repetir el escenario"
  (individual). `EtiquetaAprobacion.tsx` ya dice "Podrás repetirlo cuando hayas
  pasado por todos".
- `RequireEscenarioDisponible.tsx` protege la ruta del escenario con la misma
  función de gating; usa `location.state.recienCompletado` para tapar la carrera
  entre el guardado async de la corrida y el montaje de la siguiente pantalla.
- Botón in-page "↻ Repetir el escenario" (`restartLabel` + `onRestart=reiniciar` →
  `engine.restart`) recorre `StoryEscenario` → `PanelVeredicto` → `AccionesFinal`.
  ~50 archivos de escenario pasan el literal `restartLabel`.

**Qué falta:** repetir debe ser **módulo entero**, no escenario suelto; y la nota
oficial debe **congelarse** mientras dura la ronda de repetición.

## Decisiones tomadas

1. **Solo módulo completo.** Se elimina la repetición de un escenario suelto. Al
   terminar los 8, la única forma de volver a jugar es "Repetir el módulo", que
   reinicia la ronda entera desde el escenario 1.
2. **La nota se congela hasta terminar los 8.** Al empezar una repetición, la nota
   `/8` vigente se mantiene. Solo se reemplaza cuando la nueva ronda se completa
   (los 8 vueltos a jugar). Si el participante abandona a media repetición,
   conserva la nota de la ronda anterior.
3. **Un módulo ya aprobado sí puede repetirse**, como repaso, con un aviso claro
   de que la nota actual (`X/8`) puede bajar. La nota final sigue siendo la de la
   última ronda completa.

## Enfoque elegido: rondas derivadas (sin migración)

No se añade columna ni tabla ni endpoint. Una "ronda" se **deriva** de las filas
`ScenarioRun` existentes, ordenadas por `finishedAt`.

Alternativa descartada: columna `ronda` explícita en `ScenarioRun` +
`POST /runs/modulo/:id/repetir`. Da identidad de ronda robusta pero cuesta
migración, endpoint y estado nuevo. Se reserva como salida si el límite conocido
(abajo) llega a causar bugs reales.

Alternativa descartada: solo frontend. Imposible: congelar la nota exige que el
servidor distinga rondas.

---

## Parte A — Backend: `calcularProgreso` con rondas

Archivo: `backend/apps/entrenamiento/src/runs/progreso.ts`.

### Partición en rondas

1. Ordenar `corridas` por `finishedAt` ascendente (ya se hace).
2. Recorrer en orden acumulando `scenarioId` **distintos** de la ronda en curso en
   un `Set` y el último `outcome` por escenario en un `Map`. Cuando el `Set`
   alcanza `total` (8), **cerrar** la ronda: guardar su `Map` de resultados y
   arrancar `Set`/`Map` vacíos para la siguiente. La corrida que cierra la ronda
   es la última que entra en ella.
3. Al terminar quedan: `rondasCerradas: Map<string, RunOutcomeValue>[]` (0 o más) y
   una `rondaAbierta: Map<string, RunOutcomeValue>` (posiblemente vacía).

Dentro de una ronda un `scenarioId` normalmente aparece una sola vez (la nueva
regla impide repetir sueltos). "Último gana" cubre duplicados defensivos
(StrictMode, reintento de red, `recienCompletado`).

### Ronda oficial

```
rondaOficial = rondasCerradas.at(-1) ?? rondaAbierta
```

- **Primera pasada** (aún no se cierra ninguna ronda): `rondaOficial = rondaAbierta`
  → la nota crece en vivo, no hay nota previa que proteger.
- **Después de cerrar la primera ronda**: `rondaOficial` = esa ronda cerrada.
- **Durante una repetición**: hay ≥1 ronda cerrada y una `rondaAbierta` con
  `< 8` escenarios → `rondaOficial` sigue siendo la última cerrada. **Nota
  congelada.**
- **Al cerrarse la repetición**: la nueva ronda cerrada pasa a ser `rondaOficial`.

`aprobados`, `aprobado` y `escenarios[]` del DTO salen **solo** de `rondaOficial`.

### DTO `Progreso` (nuevos campos)

```ts
interface Progreso {
  modulo: string
  escenarios: ProgresoEscenario[]   // de la ronda oficial
  aprobados: number                 // de la ronda oficial
  requeridos: number
  aprobado: boolean                 // aprobados >= requeridos && escenarios.length >= total  (de la ronda oficial)

  // NUEVO
  ronda: number                     // nº de la ronda que se está jugando o se jugó última:
                                    //   max(1, rondasCerradas.length + (rondaAbiertaNoVacia ? 1 : 0))
  rondaEnCurso: {                    // null salvo que haya una repetición en marcha
    jugados: number                 // escenarios distintos jugados en la ronda abierta
    escenarios: ProgresoEscenario[] // resultados provisionales de la ronda abierta
  } | null
}
```

Regla de `rondaEnCurso`:
- `null` si **no** hay ronda cerrada (primera pasada: la ronda abierta ya es la
  oficial) o si la ronda abierta está vacía.
- objeto si hay ≥1 ronda cerrada **y** la ronda abierta tiene ≥1 escenario.

`ronda` = `max(1, rondasCerradas.length + (rondaAbierta.size > 0 ? 1 : 0))`
(1 durante y tras la primera pasada; 2 al empezar y tras terminar la primera
repetición; …).

### Lo que NO cambia en el backend

- `ScenarioRun` (schema), `create()`, `findMine()`, `resultados()` — el análisis
  del supervisor sigue viendo **todas** las corridas planas.
- `atestacion()` — sigue sumando `progreso.aprobados`; ahora ese número viene de
  la ronda oficial, que es exactamente lo que se quiere certificar.
- `UMBRALES` / `TOTALES`.

### Límite conocido

`finishedAt` lo pone la BD (`@default(now())`) al insertar. Una corrida encolada
offline (`lib/pendingRuns.ts`) que sincroniza tarde entra como la **más reciente**;
si el módulo ya tenía su ronda cerrada, esa corrida abriría una ronda nueva de 1
escenario (repetición fantasma que el participante no pidió). Escenario poco
probable: exige cerrar el módulo con una corrida sin guardar pendiente. Efecto:
`rondaEnCurso` aparece con `jugados: 1` y una tarjeta desbloqueada de más; la nota
oficial **no** cambia. Salida si molesta: columna `ronda` explícita.

### Tests (Vitest, backend)

`progreso.test.ts` (o el existente para `calcularProgreso`):
- 8 corridas → 1 ronda cerrada, `rondaEnCurso: null`, `aprobados` correcto.
- 5 corridas → primera pasada, ronda oficial = abierta, `rondaEnCurso: null`.
- 8 + 3 corridas → nota oficial = la de las primeras 8; `rondaEnCurso.jugados === 3`;
  `ronda === 2`.
- 8 + 8 corridas, la 2ª ronda peor → nota oficial baja a la 2ª ronda; `ronda === 2`;
  `rondaEnCurso: null`.
- 8 + 8 + 2 → oficial = 2ª ronda; `rondaEnCurso.jugados === 2`; `ronda === 2`.
- Duplicado dentro de una ronda (mismo `scenarioId` dos veces antes de llegar a 8)
  → "último gana", no adelanta el cierre de ronda.
- Orden de entrada barajado → la partición respeta `finishedAt`, no el orden del
  array.

---

## Parte B — Gating y flujo de repetición

### `lib/bloqueoEscenarios.ts`

`escenarioEstaDisponible` pasa a recibir el `Progreso` completo (necesita
`rondaEnCurso`) en vez de solo `progreso.escenarios`.

Estado del módulo, derivado:
- `enRepeticion = progreso.rondaEnCurso !== null`
- `moduloEnReposo = progreso.rondaEnCurso === null && progreso.escenarios.length >= total`
  (primera pasada terminada, o repetición terminada; nada abierto)
- primera pasada en curso = el resto

Escenarios "jugados en la ronda actual":
- si `enRepeticion` → `progreso.rondaEnCurso.escenarios`
- si primera pasada → `progreso.escenarios`
- si `moduloEnReposo` → conjunto vacío para efectos de desbloqueo

`escenarioEstaDisponible(catalogo, progreso, escenarioId, opciones?)`:
- `moduloEnReposo` **y** no `opciones.iniciandoRepeticion` → **nadie** disponible.
  El único camino de vuelta es el botón "Repetir el módulo".
- `moduloEnReposo` **y** `opciones.iniciandoRepeticion` → solo el **primer**
  escenario del catálogo.
- en otro caso → disponible el primer escenario del catálogo **no jugado en la
  ronda actual** (y solo ese; se elimina el `indiceEscenario <= primerPendiente`
  que dejaba volver a los anteriores dentro de la pasada).

`escenarioFueJugado` se mantiene como "¿tiene `ultimoOutcome` en la ronda
oficial?" para las insignias de las tarjetas.

Nuevo helper: `siguienteEnRonda(catalogo, progreso): Escenario | null` — el primer
escenario no jugado en la ronda actual. Reutilizado por `AccionesFinal` y
`useSiguienteEscenario` (hoy cada uno recalcula lo mismo con `fetchProgreso`).

### `RequireEscenarioDisponible.tsx`

- Pasa el `Progreso` completo a `escenarioEstaDisponible`.
- Lee `location.state.iniciarRepeticion` (bandera del botón "Repetir el módulo") y
  lo traduce a `opciones.iniciandoRepeticion` para permitir la primera entrada al
  escenario 1 cuando `moduloEnReposo`. Tras guardarse esa primera corrida,
  `rondaEnCurso` deja de ser `null` y el gating normal toma el relevo.
- `recienCompletado` (fix de la carrera async) se mantiene: significa "cuenta este
  escenario como jugado en la ronda actual".

### `useSiguienteEscenario.ts` y `AccionesFinal.tsx`

- "Siguiente" = `siguienteEnRonda(...)`.
- Cuando no hay siguiente (`moduloEnReposo`): `AccionesFinal` deja de renderizar el
  botón in-page `onRestart`. En su lugar, la acción terminal es **"Repetir el
  módulo"**, que abre `ConfirmarRepeticionModal` (ver Parte C) y, al confirmar,
  navega a `/seccion/<mod>/<escenario-1>` con `state={{ iniciarRepeticion: true }}`.
- Si el módulo **no** está aprobado y `moduloEnReposo` (terminó la pasada con
  `< 6/8`): misma acción "Repetir el módulo", pero el copy del marcador y del
  modal es más directo ("Te faltan N para aprobar; para volver a intentarlo
  repites el módulo completo").

### Botón "Repetir el módulo" ignora `onRestart` / `engine.restart`

El plumbing `restartLabel` + `onRestart` (`StoryEscenario` → `PanelVeredicto` →
`AccionesFinal`) queda **sin uso** en el flujo del participante.

- `AccionesFinal` y `PanelVeredicto`: se quitan los props `restartLabel` /
  `onRestart`.
- `StoryEscenario`: se deja de pasar `onRestart={reiniciar}`; `reiniciar` /
  `engine.restart` se pueden conservar (uso interno nulo, sin coste) o retirar en
  limpieza aparte.
- Los ~50 literales `restartLabel="↻ Repetir el escenario"` en los archivos de
  escenario: `restartLabel` se marca **opcional e ignorado** en
  `StoryEscenarioProps` con un comentario de deprecación. Quitarlos de los 50
  archivos es una limpieza mecánica separada, no bloquea esta feature.

### `pages/Seccion.tsx`

- `disponible` por tarjeta usa el nuevo `escenarioEstaDisponible(escenarios, progreso, id)`.
- Cuando `moduloEnReposo`: todas las tarjetas quedan bloqueadas (`opacity-70`, sin
  link) y aparece una **franja de acción** "Repetir el módulo" (abre el modal).
  Misma posición que la franja "siguiente paso" que ya existe.
- Cuando `enRepeticion`: el bloque "Progreso del módulo" muestra dos líneas
  (ver Parte C); las tarjetas se desbloquean según `rondaEnCurso`.
- `pendiente` / candados: nombran el primer escenario no jugado **en la ronda
  actual**.

### Tests (Vitest, frontend)

- `bloqueoEscenarios.test.ts`: casos primera-pasada / en-reposo / en-reposo+bandera
  / en-repetición; que dentro de una pasada **no** se puede volver a un escenario
  anterior ya jugado.
- `RequireEscenarioDisponible.test.tsx` (ya existe): añadir "módulo en reposo
  rebota a la sección" y "con `state.iniciarRepeticion` deja entrar al escenario 1".
- `useSiguienteEscenario.test.ts`: "en repetición apunta al siguiente de la ronda",
  "módulo en reposo apunta a la sección".

---

## Parte C — UI/UX anti-frustración

Principio: la regla no debe leerse como castigo. Tres palancas.

### 1. El avance hacia adelante nunca se bloquea

Al fallar un escenario a media pasada, la acción principal sigue siendo
**"Siguiente escenario →"**. No hay botón de reintento que tiente a insistir. El
panel de resultado (`PanelVeredicto`: veredicto → recorrido de señales → regla de
oro) ya es el momento de aprendizaje; se mantiene intacto y es lo que se ve antes
de seguir.

`EtiquetaAprobacion.tsx`, texto de "no aprobado":

> Este no suma todavía. Sigue con los demás escenarios del módulo; al terminarlos
> podrás repetir la ronda completa.

`AccionesFinal` marcador (contador contra el umbral) — sin cambios de fondo, sigue
diciendo "Llevas N de los 6 que necesitas".

### 2. La nota actual está a la vista y no baja por empezar

Durante una repetición, el bloque "Progreso del módulo" de `Seccion.tsx` muestra
**dos** líneas separadas:

```
Tu nota del módulo      6/8   (se mantiene)
Repetición en curso     3/8
```

- La barra `BarraProgreso` sigue reflejando la **nota oficial** (6/8), no la
  repetición. Un segundo indicador más tenue muestra el avance de la ronda nueva.
- Copy bajo la barra: "Tu nota se mantiene en 6/8 hasta que termines los 8 de esta
  repetición. Si la dejas a medias, conservas 6/8."

En `AccionesFinal`, durante la repetición, el marcador añade una línea:
"Tu nota del módulo sigue en 6/8; esta ronda va por N/8."

### 3. Repetir se presenta como práctica deliberada, con aviso claro

Nuevo componente `ConfirmarRepeticionModal.tsx` (mismo patrón que
`CierreModuloModal`: `<div role="dialog">`, foco al abrir, Escape, clic-fuera,
sin librería). Se abre desde la franja de `Seccion.tsx` y desde `AccionesFinal`.

Contenido:

- **Título:** "Repetir el módulo de {Título}"
- **Cuerpo:**
  > Vas a volver a jugar los **8 escenarios** de este módulo, en orden. No se
  > puede repetir uno suelto: repetir todo el módulo ayuda a fijar cómo se
  > distingue un fraude de un caso legítimo, no solo a acertar el que falló.
  >
  > Tu nota actual (**{aprobados}/8**) se mantiene mientras juegas. Solo se
  > reemplaza cuando termines los 8. Si dejas la repetición a medias, conservas
  > **{aprobados}/8**.
- **Si el módulo está aprobado**, añadir:
  > Cuenta tu **última** ronda completa, así que tu nota puede bajar si esta vez
  > te va peor.
- **Botones:** "Empezar la repetición" (primario, navega con
  `state={{ iniciarRepeticion: true }}`) · "Ahora no" (secundario, cierra).

### Copy global a alinear

- `pages/Bienvenida.tsx` (~215) y `pages/Dashboard.tsx` (~99): "Puedes fallar y
  repetir. Cuenta tu último intento en cada escenario." →
  "Puedes fallar y repetir el módulo completo. Cuenta tu última ronda completa."
- `components/CierreModulo.tsx`: "Puedes repetir cualquiera cuando quieras." →
  "Puedes repetir el módulo completo cuando quieras." Añadir al `CierreModulo`
  una **lista por escenario** (✓ aprobado / ✗ no) de la ronda oficial, para que
  antes de decidir repetir se vea exactamente cuáles fallaron — dirige el repaso.

### Sin cambios

- `AvisoFinEscenario` (golpe de fin de escenario), `PanelVeredicto` (recorrido de
  señales), `Recorrido.tsx`, vista del supervisor.

### Tests (frontend)

- `ConfirmarRepeticionModal.test.tsx`: render con módulo aprobado (muestra aviso
  de nota que baja) y sin aprobar (no lo muestra); "Empezar" navega con el
  `state`; Escape / clic-fuera cierran.
- `Seccion.test.tsx` (si existe patrón): "módulo en reposo muestra franja Repetir
  y bloquea tarjetas"; "en repetición muestra doble línea de progreso".
- `CierreModulo.test.tsx`: lista por escenario refleja la ronda oficial.

---

## Flujo completo (data flow)

```
Primera pasada
  Escenario 1..8  --createRun-->  ScenarioRun rows
  fetchProgreso   -->  ronda oficial = ronda abierta (crece en vivo)
                       rondaEnCurso = null
  Tras el 8º      -->  ronda se cierra; oficial = esa ronda; moduloEnReposo = true
  Seccion.tsx     -->  tarjetas bloqueadas + franja "Repetir el módulo"

Repetición
  Modal "Repetir"  --confirm-->  navigate(escenario-1, state.iniciarRepeticion)
  RequireEscenarioDisponible  -->  permite escenario 1 (bandera)
  Escenario 1..8   --createRun-->  nuevas ScenarioRun rows (ronda abierta nº2)
  fetchProgreso    -->  oficial = ronda 1 (CONGELADA); rondaEnCurso = { jugados }
  Seccion / AccionesFinal  -->  doble indicador: "nota 6/8" + "repetición N/8"
  Tras el 8º       -->  ronda 2 se cierra; oficial = ronda 2 (nota reemplazada)
                        rondaEnCurso = null; ronda = 2

Abandono a media repetición
  fetchProgreso    -->  oficial sigue = ronda 1; rondaEnCurso persiste
                        el participante puede retomar donde quedó, o el módulo
                        se queda así indefinidamente sin penalización
```

## Fuera de alcance

- Límite de nº de repeticiones (no hay).
- "Mejor de N" o promedio (la regla es explícitamente "última ronda completa").
- Repetición de un escenario suelto en cualquier forma.
- Migración de datos: participantes con corridas previas se reparten en rondas
  igual que cualquier otro; una pasada histórica de 8 se lee como ronda 1 cerrada.
- Limpieza de los ~50 literales `restartLabel` (ticket aparte).
- Columna `ronda` explícita (salida reservada, no se implementa ahora).
