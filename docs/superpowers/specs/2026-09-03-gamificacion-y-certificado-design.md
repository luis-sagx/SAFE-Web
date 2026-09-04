# Diseño: gamificación de maestría y certificado de 4 horas

**Fecha:** 2026-09-03
**Proyecto:** MIC · Simulador de entrenamiento anti-fraude
**Estado:** diseño propuesto
**Rama:** `gamificacion-y-certificado` (desde `4246114`)
**Continúa:** `2026-08-03-safe-web-mvp-phishing-design.md` (§7 gating, §11 certificado diferido)

---

## 1. Problema

El entrenamiento tiene 48 escenarios repartidos en seis módulos, un gating de
6 de 8 por módulo y un debrief que resalta las señales sobre la pantalla real.
Lo que no tiene es **razón para llegar al final**.

Hoy el recorrido de un participante termina en una insignia gris-verde que dice
«Módulo aprobado» (`Seccion.tsx:230`) y en un contador que no vuelve a
mencionarse. Concretamente:

**1.1 El esfuerzo no se acumula en ninguna parte.** El `score` de cada corrida
—0, 50 o 100, afinado a 20 y 60 en algunos guiones (`estafa/PagoLavadora.tsx:236`)—
se guarda en la base y **el participante no lo ve nunca**. Solo aparece en la
tabla del supervisor (`Admin.tsx:416`). Lo mismo con `durationMs` y con la traza
`decisions`: se registran y no vuelven.

**1.2 Existe un historial y nadie lo muestra.** `GET /api/runs/me` está
implementado en los dos lados —`runs.controller.ts` y `api.ts:232`— y
`fetchMyRuns()` **no tiene ningún llamador en la aplicación**. El dato está
servido y sin consumir.

**1.3 El orden dentro de un módulo es arbitrario.** Los escenarios se abren de
uno en uno (`lib/bloqueoEscenarios.ts`), pero el catálogo no está ordenado por
`dificultad`, así que un módulo puede empezar por un escenario de dificultad 4 y
seguir por uno de 1. La secuencia existe y no significa nada.

**1.4 Los cuatro discriminadores no aparecen en la aplicación.** El diseño
pedagógico (`2026-07-25…§3.1`) los declara como lo que *"vale más que cualquier
lista de señales sueltas"* — qué te piden, si resiste la verificación, cómo
reacciona a tu duda, adónde va el dinero. Están en el spec y en ninguna
pantalla.

**1.5 No hay nada al final del recorrido.** Un participante que aprueba los
cinco módulos activos no recibe nada que pueda guardar, enseñar o archivar. El
certificado quedó diferido en `2026-08-03…§11` y arrastraba dos servicios
nuevos que hoy no se justifican.

## 2. Regla

> **Lo que el participante demuestra se le devuelve; lo que no puede demostrar
> no se le promete.**

De ahí salen las dos mitades de este diseño. La gamificación devuelve lo que ya
se está midiendo —puntaje, recorrido, dominio de un módulo— sin inventar una
moneda paralela. El certificado atesta un hecho fechado y verificable, y no
finge un estado vivo que la arquitectura no puede sostener (§5.2).

### 2.1 Qué gamificación, y por qué esta

La revisión de la literatura descarta por sí sola las tres mecánicas más citadas
en formación de concienciación:

| Mecánica | Por qué no entra |
|---|---|
| **Leaderboard / ranking** | `ARQUITECTURA.md` §7 hace imposible unir el seudónimo con un nombre: `entrenamiento` no tiene la tabla de participantes ni permiso sobre su schema. Un ranking de `P001…P0NN` es ilegible. Y la evidencia sobre los de rango bajo es mala: acumulan percepción de fracaso repetido, justo el público que más necesita el curso. |
| **Rachas / misiones diarias** | El estudio es una sesión presencial de horas. El refresh token vive 12 h por diseño (§5.1). No hay «mañana» donde una racha pueda ocurrir. |
| **Monedas, tienda, avatares, confeti** | `DESIGN.md` §10: un solo color de marca, sin dependencias nuevas, `primary` nunca significa acierto. Y desplazan el foco del aprendizaje al premio. |

Lo que sí entra son las mecánicas de **maestría y propiedad**: progresión
legible, resultado propio consultable y cierre con contenido. No compiten con el
instrumento de investigación porque no premian insistir — y eso importa, porque
`AccionesFinal.tsx` ya esconde «Repetir» hasta haber jugado los ocho
precisamente para que el gating no mida cuántas veces alguien insistió.

**Advertencia que conviene dejar escrita para el análisis:** la evidencia
disponible indica que la gamificación mejora motivación y participación pero
tiene efecto pequeño sobre competencia medida. Si el post-test no se mueve, eso
es el resultado esperado, no un fallo de implementación. Lo que este diseño
puede defender causalmente es **más exposición al debrief** —más escenarios
terminados por participante, menos abandono a mitad—, y esas dos cantidades ya
son derivables de `ScenarioRun` sin instrumentación nueva.

---

## 3. Alcance

### 3.1 Entra

| id | Qué |
|---|---|
| **G2** | Los escenarios de cada módulo, ordenados por `dificultad` ascendente. |
| **G3** | El puntaje de la corrida, visible en el debrief. |
| **G4** | Pantalla `/recorrido`: el historial propio, con `fetchMyRuns()`. |
| **G5** | Cierre de módulo con los cuatro discriminadores. |
| **C** | Certificado PDF de 4 horas, descargable, con código verificable. |

### 3.2 No entra

| Qué | Por qué |
|---|---|
| **El módulo `fisico`** | Lo lleva otra persona. No se toca `UMBRALES`, ni las entradas de `fisico` en `catalogo.ts`, ni `RequireEscenarioDisponible.tsx`. Ver §3.3. |
| **Envío del certificado por correo** | Sin `nodemailer`, sin SMTP en producción, sin servicio `notificaciones`. La descarga en la aplicación es toda la entrega, y se puede repetir siempre. |
| **Verificación de correo por código** | El §11 la ataba al certificado porque el correo era la única vía de entrega. Con descarga en la aplicación, una dirección con typo ya no impide que el participante tenga su certificado. |
| **Insignias por discriminador** | Requieren que cada escenario etiquete sus decisiones en `decisions`. Trabajo por 48 escenarios; se puede hacer después sobre el JSONB que ya se guarda. |
| **Repetición espaciada** | Choca con «último intento manda»: habría que decidir si un repaso cuenta para el 6/8, y eso toca el instrumento de medición. Decisión aparte. |
| **Leaderboard, rachas, tienda** | §2.1. |

### 3.3 La consecuencia de dejar `fisico` fuera

`UMBRALES` (`progreso.ts:12`) declara cinco módulos: phishing, smishing,
vishing, suplantacion, estafa. **No declara `fisico`**, así que
`GET /api/runs/progreso/fisico` responde 404 y ese módulo queda sin barra, sin
insignia y sin gating. Es trabajo de otra persona y este spec no lo asume.

Dos efectos que hay que conocer para no leerlos como fallos de este diseño:

1. **El contador global dirá «5 módulos · 40 escenarios».** Es correcto:
   `calcularGlobal` (`Dashboard.tsx:33`) excluye a propósito los módulos sin
   progreso, para no mostrar una meta que nadie puede alcanzar.
2. **Los ocho escenarios de `fisico` siguen abiertos de golpe**, porque
   `RequireEscenarioDisponible.tsx:44` deja pasar cuando el progreso falla. Es
   el síntoma del umbral que falta, no un bug aparte: se cierra solo el día que
   se añada `fisico: 6`.

**Por eso la condición del certificado no fija un número de módulos.** Se deriva
de `UMBRALES` (§5.1): hoy exige cinco, y el día que la otra persona añada
`fisico: 6` pasará a exigir seis sin tocar una línea de este diseño.

---

## 4. Gamificación

### 4.1 G2 · Orden por dificultad

Los ocho escenarios de cada módulo con umbral se reordenan dentro del array
`BASE` de `catalogo.ts` por `dificultad` ascendente, con el orden actual como
desempate (ordenación estable).

**No cambia ningún `id` ni ninguna `version`**, así que no invalida ninguna
corrida registrada: el catálogo es un array, y su orden solo decide qué tarjeta
lleva el número `01` y cuál se abre primero. Lo que cambia es que el desbloqueo
secuencial deja de ser arbitrario y pasa a ser una curva.

Esto **cierra una contradicción abierta** en el repositorio: el spec
`2026-08-03…§7.3` dice *"Sin bloqueo de orden. Los 8 siguen jugables en
cualquier orden… El 6/8 es una meta, no una puerta secuencial"*, pero
`lib/bloqueoEscenarios.ts` y `RequireEscenarioDisponible.tsx` implementan
justamente una puerta secuencial. Se resuelve a favor del código —el
desbloqueo de uno en uno se queda, porque un público no técnico ante ocho
tarjetas iguales no sabe por dónde entrar— y se corrige §7.3 de aquel spec.

Las entradas de `fisico` no se tocan (§3.2).

### 4.2 G3 · El puntaje, en el debrief

`EtiquetaAprobacion.tsx` ya deriva el resultado del nodo con la misma regla que
se envía al servidor (`node.resultado ?? outcomeFromKind(node.kind)`). Se añade
ahí el puntaje, con la misma derivación: `node.score ?? scoreFromOutcome(...)`.
Un solo sitio, y por construcción no puede contradecir a lo que quedó guardado.

Reglas de presentación, y son parte del diseño, no decoración:

- Se presenta como **calidad de la decisión de esta corrida**, no como saldo.
- **No hay total acumulado, no hay récord, no hay «mejor intento».** Un puntaje
  acumulable invitaría a repetir hasta subirlo, y el gating cuenta el último
  intento: sería una vía para inflar el resultado sin haber aprendido nada.
- Alcance: los escenarios que usan `PanelVeredicto`. Los de mecánica propia
  (`useScenarioRun` directo) quedan igual; no se les añade nada.

### 4.3 G4 · `/recorrido`

Pantalla nueva, ruta protegida por `RequireAuth`, enlazada desde el dashboard.
**Cero backend nuevo**: consume `fetchMyRuns()` (`api.ts:232`), que hoy no tiene
llamador.

Contenido, agrupado por módulo según el catálogo:

- Los escenarios que el participante intentó, con su último resultado, su
  puntaje y su tiempo.
- Cuántos intentos lleva cada uno.

Dos reglas:

1. **«Último manda», igual que el gating.** El resumen por escenario se calcula
   con la corrida de mayor `finishedAt`, la misma regla de `calcularProgreso`.
   Cualquier otra —el mejor intento, el promedio— haría que esta pantalla
   contradijera a la insignia de la sección.
2. **Solo aparece lo jugado.** `GET /api/runs/me` únicamente devuelve corridas,
   así que un escenario sin intentar no puede aparecer, y con él no se filtra
   su `naturaleza`. Es la misma protección que ya aplica `Seccion.tsx:260`.

### 4.4 G5 · Cierre de módulo

Cuando `progreso.aprobado` es cierto, `Seccion.tsx` reemplaza la línea actual
(«Módulo aprobado. Puedes repetir cualquier escenario si quieres.») por un
componente `CierreModulo.tsx`, encima del `SiguienteModulo` que ya existe —que
no se duplica ni se toca.

Contenido:

1. Cuántos escenarios aprobó de los ocho y en cuánto tiempo, con los datos que
   ya trae `Progreso` y `fetchMyRuns()`.
2. **Los cuatro discriminadores** de `2026-07-25…§3.1`, en la tabla que aquel
   spec ya redactó: qué te piden · si resiste la verificación · cómo reacciona a
   tu duda · adónde va el dinero. Con el tercero destacado, porque el propio
   diseño pedagógico lo llama el más fiable y el más usable por alguien no
   técnico: *quien es legítimo nunca se ofende porque verifiques.*

Es contenido pedagógico, no una animación de recompensa. Los cuatro
discriminadores son lo único del diseño que enseña a **discriminar** en vez de a
reconocer señales sueltas, y hoy no están en ninguna pantalla.

---

## 5. Certificado

### 5.1 Condición: todos los módulos que el servidor declara

```
certificable(participante) =
    ∀ modulo ∈ claves(UMBRALES) :  progreso(participante, modulo).aprobado
```

**El número no se escribe en ninguna parte.** Hoy `UMBRALES` tiene cinco claves
y el certificado exige cinco módulos; cuando se añada `fisico: 6` exigirá seis,
sin tocar el código del certificado ni este documento. Una sola fuente de
verdad, y ya existía.

`UMBRALES` sigue siendo autoritativo del lado del servidor: el denominador (los
ocho escenarios) lo pone el catálogo del frontend, y un cliente modificado no
puede certificarse solo.

### 5.2 El flujo: la atestación viaja firmada, por el cliente

El certificado necesita dos datos que viven separados **a propósito**: el
nombre, en `identidad`, y el progreso, en `entrenamiento`. `ARQUITECTURA.md` §2
prohíbe que los servicios se llamen entre sí, y §3 fija la salida: *"si algo
tiene que viajar entre servicios, viaja en el JWT"*. Eso es exactamente lo que
se hace.

```
Dashboard · todos los módulos aprobados
   │
   │ ① GET /api/runs/atestacion                        → entrenamiento
   │      recalcula el progreso de CADA módulo de UMBRALES
   │      firma { sub, seq, modulos[], typ:'atestacion' }, vida 5 min
   │      409 si falta alguno, con cuáles faltan
   ▼
   │ ② POST /api/certificados      { atestacion }      → identidad
   │      verifica la firma con el JWT_SECRET que ya comparte
   │      exige typ === 'atestacion'
   │      exige atestacion.sub === accessToken.sub
   │      upsert de la fila Certificate
   │      → { codigo, emitidoAt, modulos, horas }
   ▼
   │ ③ POST /api/certificados/pdf  { atestacion }      → identidad
   │      regenera el PDF con pdfkit y lo devuelve
   ▼
  PDF
```

Cero llamadas HTTP entre servicios, cero contenedores nuevos, cero roles de
Postgres nuevos. Se descarta el servicio `certificados` (:3003) que proponía
`2026-08-03…§11`: contradice §2 y añade un contenedor, un schema, un juego de
migraciones y un health check que operar durante una sesión presencial.

`entrenamiento` pasa a **firmar** tokens, cosa que hasta hoy no hacía.
`docker-compose.yml` ya le pasa `JWT_EXPIRES_IN` con el comentario *"por si
algún día un endpoint propio necesitara emitir uno"*. Es ese día.

#### 5.2.1 Por qué la dirección del dato es segura

El progreso entra a `identidad`, que **ya sabe quién es la persona**. El nombre
nunca sale hacia `entrenamiento`. La regla de §7 que hay que proteger es la
inversa —que ningún dato personal llegue al servicio del análisis— y este flujo
no la toca.

`identidad` guarda de ese progreso **solo el hecho de la aprobación y qué
módulos cubría** (§5.4). Nada por escenario y ningún puntaje: el servicio de
los datos personales no debe acumular el detalle del rendimiento.

#### 5.2.2 Las tres comprobaciones que no son opcionales

1. **`typ: 'atestacion'`.** `JwtAuthGuard` ya rechaza todo token cuyo `typ` no
   sea `'access'` (§5.1 de `ARQUITECTURA.md`), así que una atestación no sirve
   como token de acceso. La simétrica hay que escribirla: `identidad` rechaza
   como atestación cualquier token cuyo `typ` no sea `'atestacion'`, para que un
   access token no pueda pasar por una.
2. **`atestacion.sub === accessToken.sub`.** Sin esto, quien consiga la
   atestación de otra persona —se la pasan, la copia de un log— se emite un
   certificado a su propio nombre con el progreso ajeno.
3. **Vida de 5 minutos.** Es un pase de un solo salto a través del cliente, no
   una credencial. Constante en el código, sin variable de entorno: no hay
   ningún despliegue que necesite otro valor.

**La atestación es reutilizable dentro de esos 5 minutos, no de un solo uso.**
El flujo la gasta dos veces seguidas —② emitir y ③ descargar— y el participante
puede volver a pulsar «Descargar» sin repetir el paso ①. Invalidarla al primer
canje obligaría a guardar los jti canjeados en `identidad`, que es estado nuevo
para no ganar nada: lo que acota el riesgo es la vida corta, no el uso único.

### 5.3 Revocación: aquí este diseño contradice al §11

`2026-08-03…§11` prometía: *"si un participante ya certificado repite un
escenario y baja de 6/8, la aplicación marca `revocadoAt`"*.

**Eso no es implementable sin romper §2.** `identidad` no tiene forma de
enterarse de que alguien bajó de umbral: no puede consultar a `entrenamiento`,
no tiene permiso sobre su schema y no hay evento que la despierte. Es un dato al
que nunca va a llegar por sí sola. Se sustituye por tres cosas que sí se
sostienen:

1. **El PDF exige atestación fresca en cada descarga** (paso ③). Quien bajó de
   umbral no obtiene atestación, luego no obtiene PDF. Esa es la revocación
   efectiva, y es automática.
2. **`revocadoAt` se queda, pero como acción del supervisor**, en
   `/api/admin/certificados/:id/revocar`. Para retiro de consentimiento o
   incidencia; no para caídas de puntaje.
3. **El certificado dice en su cara qué atestó y cuándo**: «Emitido el <fecha>,
   tras aprobar los módulos: …». Un certificado es un hecho fechado, no un
   estado vivo. Decirlo así es más honesto que prometer una revocación que la
   arquitectura no puede cumplir.

Guardar `modulos` en la fila (§5.4) es lo que sostiene el punto 3: sin esa
columna, un certificado emitido con cinco módulos y otro emitido con seis dirían
exactamente lo mismo.

### 5.4 Modelo de datos

Tabla `Certificate`, en el schema `identidad`. Es la segunda tabla de ese
servicio; el schema `entrenamiento` no cambia.

| Campo | Tipo | Nota |
|---|---|---|
| `id` | `uuid` | |
| `participantId` | `uuid` **único** | Un certificado por persona; `POST` idempotente. |
| `codigo` | `String` **único** | Formato `SW-XXXX-XXXX`. |
| `modulos` | `String[]` | Los que cubría al emitirse. Es lo que impide que el documento mienta cuando `UMBRALES` crezca. |
| `horas` | `Int` | Constante `HORAS_CERTIFICADO = 4`. Se guarda y no se calcula, para que un certificado viejo no cambie si algún día cambia la constante. |
| `emitidoAt` | `DateTime` | |
| `revocadoAt` | `DateTime?` | Solo lo pone el supervisor (§5.3). |

#### 5.4.1 Qué pasa cuando `UMBRALES` crece

`participantId` es único, así que `POST /api/certificados` es idempotente. Pero
el día que se añada `fisico: 6`, un participante ya certificado con cinco
módulos puede aprobar el sexto y volver a pedirlo. La regla:

- Si la atestación fresca cubre **los mismos módulos o menos** que la fila
  guardada, se devuelve la fila tal cual.
- Si cubre **más**, se actualizan `modulos` y `emitidoAt`, **conservando el
  `codigo`**. El certificado impreso que alguien ya tenga en la mano sigue
  verificándose, y la verificación pasa a reflejar el recorrido mayor.

Nunca se emite un segundo `codigo` para la misma persona: dos códigos vivos del
mismo participante harían que la revocación tuviera que perseguir a los dos.

**El `codigo` es aleatorio y no se deriva de nada.** Ni de `seq`, ni del
`participantId`, ni del correo: derivarlo filtraría el orden de registro y el
número de participantes del estudio a cualquiera que reúna dos códigos. Se
genera con `crypto.randomBytes` sobre un alfabeto sin caracteres ambiguos (sin
`O`/`0`, sin `I`/`1`), porque se lee y se teclea desde un papel. Colisión →
choca contra el índice único y se reintenta.

**El PDF no se persiste.** Se regenera de la fila más el nombre pedido a la
propia base de `identidad`. Guardarlo dejaría en disco un archivo con datos
personales, que es justo el problema que el diseño de la cédula cerró.

### 5.5 El PDF

`pdfkit` en `identidad`. Es la única dependencia nueva de todo el spec.
`ARQUITECTURA.md` §10 prohíbe añadir dependencias *"si la biblioteca estándar,
una dependencia ya instalada o unas pocas líneas resuelven el caso"*: escribir
un PDF válido a mano no son unas pocas líneas, y ninguna dependencia instalada
lo hace. Se descarta un navegador headless, que añadiría cientos de MB al
contenedor por un documento de una página.

Sin fuente embebida: la Helvetica de pdfkit usa WinAnsi, que cubre tildes y `ñ`.

Contenido, una página A4 apaisada:

- **Certificado de aprovechamiento**
- Nombre y apellido del participante
- «ha completado el entrenamiento **SAFE Web** en reconocimiento de
  ciberamenazas dirigidas a usuarios no técnicos, con una duración de
  **4 horas**»
- Los módulos cubiertos, listados por su `titulo` del catálogo
- Fecha de emisión
- El código y la URL de verificación: `…/verificar/SW-XXXX-XXXX`
- Pie: Trabajo de Integración Curricular · Carrera de Software · Departamento de
  Ciencias de la Computación — ESPE

**Sin escudo institucional y sin firma.** Emitir un documento con la identidad
visual de la universidad necesita autorización del departamento; la línea del
pie sitúa el origen sin comprometer a nadie con un documento que no aprobó.

**Sin cédula, nunca** — §7.1: no existe en claro en ninguna parte del sistema,
y un PDF no es la excepción.

### 5.6 Verificación pública

`GET /api/certificados/verificar/:codigo`, **sin autenticación**, con límite por
IP como el login. Devuelve `{ valido, emitidoAt, horas, modulos, revocadoAt }`.

**Nunca devuelve el nombre.** Quien verifica ya tiene el PDF con el nombre
delante; publicarlo convertiría el endpoint en un directorio consultable de
quién participó en el estudio, probando códigos. Eso es exactamente lo que §7
prohíbe.

Ruta SPA pública `/verificar/:codigo` que lo muestra, junto a `/` y `/registro`
en `App.tsx` (fuera de `RequireAuth`).

---

## 6. Contrato del API

Se añaden cinco rutas. Prefijo `/api` como el resto.

| Método | Ruta | Servicio | Auth | Qué hace |
|---|---|---|---|---|
| `GET` | `/api/runs/atestacion` | entrenamiento | JWT | Comprueba todos los módulos de `UMBRALES`. `200` con `{ atestacion }` si están aprobados; `409` con `{ faltan: [...] }` si no. |
| `POST` | `/api/certificados` | identidad | JWT | Body `{ atestacion }`. Emite (o devuelve) el certificado. → `{ codigo, emitidoAt, modulos, horas }`. |
| `POST` | `/api/certificados/pdf` | identidad | JWT | Body `{ atestacion }`. → `application/pdf`. |
| `GET` | `/api/certificados/verificar/:codigo` | identidad | — | Público, 20/min por IP. → `{ valido, emitidoAt, horas, modulos, revocadoAt }`. Sin nombre. |
| `PATCH` | `/api/admin/certificados/:id/revocar` | identidad | JWT + `SUPERVISOR` | Marca `revocadoAt`. |

Notas de contrato:

- **`POST` y no `GET` para el PDF.** La atestación es un JWT; en la query string
  acabaría en los logs de nginx y en el historial del navegador. Va en el
  cuerpo. El frontend descarga por `fetch` → `Blob`, no por `<a href>`, así que
  no pierde nada.
- Los dos `POST` llevan **DTO con `class-validator`**, como exige §5 del
  documento normativo. `ValidationPipe` global con `whitelist` y
  `forbidNonWhitelisted` ya rechaza cualquier campo no declarado.
- El guard va **por ruta y no por controlador** en `CertificadosController`:
  `verificar` es la única pública, y un guard a nivel de clase obligaría a
  excluirla con un decorador que hoy no existe.
- `frontend/nginx.conf` necesita un `location /api/certificados` hacia
  `identidad`, **con `proxy-comun.inc` incluido**. Nginx no hereda
  `proxy_set_header`, y sin `X-Real-IP` el límite por IP de la verificación
  pública contaría todas las peticiones como si vinieran del contenedor.

### 6.1 Frontend

Cuatro funciones nuevas en `src/lib/api.ts` —regla de §3: ningún `fetch` fuera
de ahí—: `fetchAtestacion`, `emitirCertificado`, `descargarCertificadoPdf`,
`verificarCertificado`.

`descargarCertificadoPdf` necesita una variante de `request` que devuelva
`Blob` en vez de JSON. Es la primera respuesta no-JSON del API; se resuelve con
un parámetro en `RequestOptions`, sin duplicar la lógica de reintento con
refresh token que `request` ya tiene.

El botón vive en el bloque «Tu avance» del dashboard y aparece cuando
`global.modulosAprobados === global.modulos && global.modulos > 0` — condición
ya calculada en `Dashboard.tsx:145`.

---

## 7. Privacidad

Ninguna regla de §7 de `ARQUITECTURA.md` se relaja. Lo que este diseño añade y
por qué no la toca:

| Cambio | Efecto sobre §7 |
|---|---|
| `entrenamiento` firma atestaciones | La atestación lleva `sub`, `seq` y nombres de módulo. Ningún dato personal: son los mismos campos que ya lleva el access token. |
| El progreso entra a `identidad` | Dirección segura: `identidad` ya conoce a la persona. La regla protege la dirección contraria. |
| Tabla `Certificate` | Solo el hecho de la aprobación y qué módulos. Sin puntajes ni detalle por escenario. |
| Endpoint público de verificación | No devuelve nombre. Con límite por IP para que no sirva de oráculo. |
| El PDF | Lleva nombre y apellido —es un certificado— y **no** cédula. No se persiste en disco. |
| `GET /api/runs/resultados` | Sin cambios. Sigue siendo imposible que filtre PII: el servicio no tiene la tabla ni el permiso. |

---

## 8. Pruebas

Una prueba por regla que, si se rompe, arruina algo en silencio.

| Fase | Qué se verifica |
|---|---|
| **F1** | Unitaria de catálogo: en cada módulo con umbral, `dificultad` es no decreciente. Unitaria: el puntaje que muestra `EtiquetaAprobacion` es el mismo que `useScenarioRun` envía, incluido el caso de `node.score` explícito (20 y 60). |
| **F2** | Unitaria de `/recorrido`: con varias corridas del mismo escenario en desorden temporal, muestra la de mayor `finishedAt` — la misma regla que `calcularProgreso`. |
| **F3** | Unitaria de la atestación: con un módulo sin aprobar → `409` y lo nombra; con todos → firma con `typ: 'atestacion'`. Unitaria: un token de atestación **no** pasa `JwtAuthGuard`. |
| **F4** | **Las dos que sostienen la seguridad del canje:** una atestación cuyo `sub` no coincide con el del access token → rechazada; un access token enviado como atestación → rechazado. Más: `POST /api/certificados` dos veces devuelve el mismo `codigo`; dos participantes con los mismos módulos obtienen códigos distintos y ninguno contiene su `seq`. |
| **F5** | **E2e de privacidad:** la respuesta de `verificar/:codigo` no contiene nombre, apellido ni correo, ni con un código válido, ni con uno revocado, ni con uno inexistente. Más: un código inexistente responde `{ valido: false }` sin `emitidoAt` ni `modulos`, para no revelar cuántos certificados hay emitidos. |

---

## 9. Fases

| Fase | Contenido | Depende de |
|---|---|---|
| **F1** | G2 (orden por dificultad) + G3 (puntaje en el debrief). Frontend puro, sin backend. | — |
| **F2** | G4 (`/recorrido`) + G5 (cierre de módulo). Frontend puro; `fetchMyRuns()` ya existe. | F1 |
| **F3** | `GET /api/runs/atestacion` en `entrenamiento`. | — |
| **F4** | Tabla `Certificate`, migración, `pdfkit`, emisión y PDF en `identidad`. Botón en el dashboard. | F3 |
| **F5** | Verificación pública, ruta SPA `/verificar/:codigo`, revocación del supervisor. | F4 |

F1 y F2 no dependen de F3–F5: se pueden entregar y probar con participantes
antes de que exista el certificado.

---

## 10. Documentos a actualizar

Parte de la implementación, no trabajo aparte.

| Documento | Qué cambia | Fase |
|---|---|---|
| `docs/ARQUITECTURA.md` §5 | Las cinco rutas nuevas en la tabla del contrato. | F3–F5 |
| `docs/ARQUITECTURA.md` §5.1 | El tercer `typ` de token: `'atestacion'`, quién lo firma y quién lo verifica. | F3 |
| `docs/ARQUITECTURA.md` §6 | La tabla `Certificate` en el schema `identidad`. | F4 |
| `docs/ARQUITECTURA.md` §7 | El flujo de la atestación y por qué su dirección es segura. | F4 |
| `docs/ARQUITECTURA.md` §11 | Decisión cerrada: certificado sin servicio propio, por atestación firmada. | F4 |
| `docs/ARQUITECTURA.md` §12 | **Está obsoleto hoy**: dice «MVP de solo phishing, catálogo recortado a 3 escenarios activos» cuando hay 48 en seis secciones. Se corrige. | F1 |
| `2026-08-03…§7.3` | Dice «sin bloqueo de orden» y el código implementa desbloqueo secuencial. Se corrige a favor del código. | F1 |
| `2026-08-03…§11` | La revocación automática por caída de umbral no es implementable (§5.3). Se sustituye por atestación fresca + revocación del supervisor. | F4 |
| `README.md` | La pantalla `/recorrido` y el certificado. | F5 |

---

## 11. Decisiones cerradas

| Tema | Decisión | Por qué |
|---|---|---|
| Qué gamificación | Maestría y propiedad; nada competitivo | §2.1: el ranking es imposible por §7 e indeseable por evidencia; las rachas no tienen dónde ocurrir en una sesión de horas. |
| Puntaje | Visible, por corrida, sin acumular | Un saldo acumulable invita a repetir hasta subirlo, y el gating cuenta el último intento. |
| Orden dentro del módulo | Secuencial, ordenado por dificultad | Ocho tarjetas iguales no dicen por dónde entrar a un público no técnico; y si hay secuencia, que signifique algo. |
| Módulo `fisico` | Fuera de este spec | Lo lleva otra persona. La condición del certificado se deriva de `UMBRALES` para no chocar. |
| Condición del certificado | Todos los módulos de `UMBRALES` | Una sola fuente de verdad, que ya existe y ya es autoritativa del lado del servidor. |
| Cómo cruza el dato entre servicios | Atestación firmada, por el cliente | Es la regla que §2 y §3 ya fijan para el JWT. Evita un tercer servicio y cualquier llamada entre servicios. |
| Servicio `certificados` :3003 | Descartado | Contradice §2 y añade un contenedor que operar en una sesión presencial. |
| Servicio `notificaciones` :3004 | Descartado | El propio §11 pone el criterio: se justifica con dos productores de correo. Sin envío, hay cero. |
| Entrega | Descarga en la aplicación | Sin SMTP, sin cola de reintento, sin verificación de correo. Repetible siempre. |
| Verificación de correo por código | Fuera | Su razón de ser era garantizar la entrega por correo. Sin correo, no tiene ninguna. |
| Revocación automática por caída | Sustituida | No implementable sin romper §2 (§5.3). |
| Duración | 4 horas, guardada en la fila | Guardada y no calculada: un certificado viejo no debe cambiar si cambia la constante. |
| Identidad visual del PDF | SAFE Web, con el TIC al pie; sin escudo ni firma | Emitir con la identidad de la universidad necesita autorización del departamento. |
| Nombre en la verificación pública | No aparece | Sería un directorio de quién participó en el estudio. |
