# Aumento real de dificultad — escenarios 3 y 4 de `asistentes-ia`

Fecha: 2026-09-10
Rama: `mejora-escenarios-ai`

## Problema

Los cuatro escenarios de la sección `asistentes-ia` comparten mecánica exacta:
una sola decisión, tres burbujas de respuesta, con una `pista` que casi da la
solución y botones que se autodescriben (`"...a nombre de mi compañera, cédula
X"` frente a `"deja en blanco los datos"`). El campo `dificultad` iba de 1 a 4,
pero esa progresión era solo temática (dato de una compañera → documento pegado
→ información de empresa → datos de cliente), no de exigencia real: los cuatro se
resuelven leyendo el botón, no el contenido.

Objetivo: que la dificultad declarada esté respaldada por el diseño del
escenario. Los escenarios 1 y 2 se quedan como entrada fácil; 3 y 4 se
endurecen.

## Alcance

| Escenario | Archivo | `dificultad` | Cambio |
|---|---|---|---|
| 1 · `correo-datos-terceros` | `CorreoDatosTerceros.tsx` | 2 | ninguno |
| 2 · `correo-credenciales` | `HojaDeVida.tsx` | 2 | ninguno |
| 3 · `resumen-documento-interno` | `ResumenDocumentoInterno.tsx` | **3** | palancas A + B |
| 4 · `historial-cliente` | `HistorialCliente.tsx` | **4** | palancas A + B + C + D |

En `catalogo.ts` (`escenarioAsistentesIA(...)`, líneas ~908-937) el 4.º argumento
vuelve a `3` para `resumen-documento-interno` y a `4` para `historial-cliente`
(ambos habían quedado en `2` en un cambio previo de esta sesión). Escenarios 1 y
2 quedan en `2`.

## Palancas de dificultad

- **A — botones neutros:** las burbujas de elección no delatan qué comparte cada
  camino. El texto largo con los datos sensibles vive en el mensaje que se
  envía (nodo destino), no en la burbuja.
- **B — sin `pista`:** se elimina el prop `pista` del `<StoryEscenario>`. El
  prop `cuandoTermina` se conserva: es instrucción de interfaz ("cuando toques
  una respuesta"), no una pista de contenido.
- **C — rama "casi bien":** una opción adicional que comparte solo una parte
  del dato sensible y cierra en `partial`. Rompe el binario sí/no.
- **D — segundo paso:** desde la opción limpia, la IA redacta sin datos y
  **repregunta** por ellos con una excusa razonable ("para personalizar"). Hay
  que resistir una segunda vez.

## Escenario 3 · `resumen-documento-interno` (Media) — A + B

### Grafo (sin cambios de forma: `n1` → un final)

`n1` (`kind: 'scene'`, chat) con tres `respuestas`:

| burbuja (corta, neutra) | `goto` | `kind` |
|---|---|---|
| `Le paso el informe y le pido que lo resuma.` | `e_con_cifras` | `bad` |
| `Le pido un párrafo modelo y yo pongo las cifras aparte.` | `e_sin_cifras` | `good` |
| `Mejor lo resumo yo.` | `e_no_usa_ia` | `partial` |

### Cambios concretos

- `RespuestaIA.texto` pasa a ser el texto corto de la tabla. El párrafo largo
  (`PROMPT_CON_CIFRAS`, con `$340.000`, el 15 % en enero y el "todavía no se les
  avisa") se conserva **solo** como texto enviado en
  `conRespuestaIA(CHAT, HORA, marcar(PROMPT_CON_CIFRAS, {...}), ...)` del nodo
  `e_con_cifras`. Igual para `PROMPT_SIN_CIFRAS` y `PROMPT_SIN_IA`.
- Coherencia narrativa: "le paso el informe" → el mensaje que aparece enviado es
  el contenido del informe (con las cifras marcadas). El repaso sigue resaltando
  `dato-perdidas`, `dato-recorte`, `dato-sin-avisar` en `e_con_cifras`.
- Se elimina el prop `pista` del `<StoryEscenario>`.
- Señales de `e_con_cifras` / `e_sin_cifras` / `e_no_usa_ia`, señal inicial
  (`informe-en-juego`), `RULE`, `RESUMEN`, `CONTEXTO`: sin cambios.

## Escenario 4 · `historial-cliente` (Difícil) — A + B + C + D

### Grafo

```
n1 (scene)
 ├── "Le paso el reclamo con los datos de la clienta."          -> e_con_datos     (bad)
 ├── "Le paso el motivo y el nombre de pila para el saludo."    -> e_solo_nombre   (partial)  [C]
 ├── "Le paso solo el motivo del reclamo."                      -> n2_seguimiento  (scene)    [D]
 └── "Le paso el reclamo y le pido que trate los datos          -> e_pide_secreto  (bad)
      como confidenciales."

n2_seguimiento (scene)
 ├── "Sí, es Mónica Zambrano, cuenta 2100-0000-45."             -> e_recae         (bad)      [D]
 └── "No hace falta, eso lo completo yo al enviarla."           -> e_sin_datos     (good)
```

### Nodos

- **`n1`** — cuatro `respuestas` neutras (tabla de arriba). El prompt largo con
  nombre/cuenta/saldo/teléfono vive en el mensaje enviado de `e_con_datos` y
  `e_pide_secreto`, no en la burbuja.

- **`e_con_datos`** (`bad`) — sin cambios respecto de hoy: cinco señales
  (`dato-nombre`, `dato-cuenta`, `dato-saldo`, `dato-telefono`, `dato-devuelto`).

- **`e_pide_secreto`** (`bad`) — sin cambios: la cuenta y el saldo ya iban en el
  texto; pedir confidencialidad después no lo deshace.

- **`e_solo_nombre`** (`partial`, nuevo) — mensaje enviado: el motivo del reclamo
  + `"Sus datos: Mónica Zambrano."` (solo el nombre, marcado `dato-nombre`). La
  IA responde con `"Hola, Mónica. Buenas tardes."` y el cuerpo genérico.
  - Señal: `dato-nombre` en `e_solo_nombre` — "El nombre completo de la clienta.
    Para un saludo bastaba 'Hola, buenas tardes'; un nombre junto a un reclamo ya
    es un dato de una persona concreta en un servicio externo."
  - `verdict`: `"Diste menos, pero diste"`.
  - `outcome`: para redactar la respuesta no hacía falta ni el nombre; el saludo
    personalizado lo pones tú al enviarla, dentro del sistema de la empresa.

- **`n2_seguimiento`** (`kind: 'scene'`, nuevo) — construido con el helper nuevo
  `conSeguimientoIA`. El hilo muestra: apertura + `PROMPT_SIN_DATOS` (mío,
  `senal: 'borrador-enviado'`) + respuesta de la IA que **repregunta antes de
  redactar**:
  `"Puedo redactarla. Para personalizar el saludo y el cierre, ¿me pasas el
  nombre de la clienta y el número de cuenta?"`. Dos `respuestas`:
  - `"Sí, es Mónica Zambrano, cuenta 2100-0000-45."` → `e_recae`
  - `"No hace falta, eso lo completo yo al enviarla."` → `e_sin_datos`

- **`e_recae`** (`bad`, nuevo) — construido con `conRespuestaIA` sobre el chat de
  `n2_seguimiento`. Mensaje enviado: `"Sí, es Mónica Zambrano, cuenta
  2100-0000-45."` con `dato-nombre` y `dato-cuenta` marcados. La IA agradece y
  devuelve la respuesta final con el nombre y la cuenta escritos (marcados
  `dato-devuelto`).
  - Señales: `dato-nombre`, `dato-cuenta` en el mensaje de seguimiento;
    `dato-devuelto` en la respuesta de la IA.
  - `verdict`: `"Resististe al principio, cediste a la segunda"`.
  - `outcome`: la IA no insiste con una amenaza sino con una excusa razonable —
    "personalizar" —, y ahí es donde se cede. Los datos de Mónica salieron igual;
    llegar limpio al primer mensaje no sirve si se entregan en el segundo.

- **`e_sin_datos`** (`good`) — se conserva. Ahora se llega a él desde
  `n2_seguimiento`, no desde `n1`. Su vista se arma con `conRespuestaIA` sobre el
  chat de `n2_seguimiento` (mensaje `"No hace falta, eso lo completo yo al
  enviarla."`, respuesta final de la IA sin datos). Señal `borrador-enviado`
  apunta al primer prompt limpio.

### Otros cambios del escenario 4

- Se elimina el prop `pista`.
- Señal inicial (`cuenta-en-juego`), `RULE`, `RESUMEN`, `CONTEXTO`: sin cambios
  de fondo. `RULE` puede ganar una frase sobre que resistir una vez no basta si
  la IA repregunta (opcional, a criterio en implementación).

## Helper nuevo — `chatIA.tsx`

```ts
/**
 * Continúa el hilo dejando el chat abierto: agrega [tu mensaje, respuesta de la
 * IA] y mantiene nuevas `respuestas` para elegir. Como `conRespuestaIA`, pero la
 * conversación sigue — la IA contestó y además repreguntó.
 *
 * Las ramas que salen de ese segundo paso se arman con `conRespuestaIA` sobre el
 * chat que devuelve esta función.
 */
export function conSeguimientoIA(
  chat: ChatIA,
  hora: string,
  textoEnviado: string,
  respuestaIA: string,
  respuestas: RespuestaIA[],
): ChatIA {
  return {
    ...chat,
    respuestas,
    msgs: [
      ...chat.msgs,
      { text: textoEnviado, time: hora, mine: true, senal: 'borrador-enviado' },
      { text: respuestaIA, time: hora },
    ],
  }
}
```

Diferencia con `conRespuestaIA`: este mantiene `respuestas` (no las pone en
`undefined`) porque el chat no ha terminado.

## Motor — verificación

Riesgo: que un nodo `scene` distinto de `n1` no pinte las burbujas o cierre la
corrida antes de tiempo. Lectura del código dice que no:

- `DeviceScreen.tsx:656` — `view.respuestas` se pinta como botones con
  `data-hotspot-goto` en cualquier vista `sms`, sin depender del id del nodo.
- `useStoryEngine.ts:68` — `isEnding = node.kind !== 'scene'`; `n2_seguimiento`
  es `scene`, así que la corrida sigue abierta y `finish()` no se dispara.
- `StoryEscenario.tsx` `onHotspot` — con `engine.isEnding === false` llama
  `manejarClicHotspot(event, engine.choose)`, que registra la decisión
  `n1 → n2_seguimiento` en la traza y avanza.
- `abiertas` / pestañas (`StoryEscenario.tsx:255`) — indexadas por URL;
  `n2_seguimiento` comparte `sitio.url` con `n1`, se pliega en la misma pestaña.

Se confirma con un test de integración (abajo). Si al implementar aparece un
problema real, se resuelve ahí antes de seguir.

## Tests

### `ResumenDocumentoInterno.test.tsx`

- Actualizar los `name` de los botones a los textos cortos nuevos.
- Mantener los tres casos: con cifras → `bad` ("Información confidencial..."),
  párrafo modelo → `good`, lo resumo yo → `partial`.
- Un caso nuevo: el repaso de `e_con_cifras` resalta la cifra de pérdidas (que
  el mensaje enviado —no el botón— trae los datos).

### `HistorialCliente.test.tsx` (reescritura)

| caso | pasos | espera |
|---|---|---|
| datos completos | `n1`: "...con los datos de la clienta" | `bad`, verdict datos financieros |
| pide secreto | `n1`: "...trate los datos como confidenciales" | `bad`, verdict "pedir confidencialidad no deshace" |
| solo nombre (C) | `n1`: "...el nombre de pila para el saludo" | `partial`, verdict "Diste menos, pero diste" |
| llega al paso 2 | `n1`: "...solo el motivo del reclamo" | aparece la repregunta de la IA + dos burbujas nuevas |
| recae (D) | paso 2: "Sí, es Mónica Zambrano, cuenta..." | `bad`, verdict "cediste a la segunda" |
| mantiene (D) | paso 2: "No hace falta, eso lo completo yo..." | `good` |

## Archivos tocados

- `frontend/src/data/catalogo.ts` — dificultad 3 → `3`, 4 → `4`
- `frontend/src/secciones/asistentes-ia/chatIA.tsx` — `conSeguimientoIA`
- `frontend/src/secciones/asistentes-ia/ResumenDocumentoInterno.tsx`
- `frontend/src/secciones/asistentes-ia/ResumenDocumentoInterno.test.tsx`
- `frontend/src/secciones/asistentes-ia/HistorialCliente.tsx`
- `frontend/src/secciones/asistentes-ia/HistorialCliente.test.tsx`

## Fuera de alcance

- Escenarios 1 y 2 (`CorreoDatosTerceros`, `HojaDeVida`).
- Cambios en `StoryEscenario`, `useStoryEngine`, `DeviceScreen`,
  `PanelVeredicto` — el segundo paso usa el motor tal como está.
- La escala número→etiqueta de `Seccion.tsx` (`NOMBRE_DIFICULTAD`,
  `ESTRELLAS_DIFICULTAD`).
