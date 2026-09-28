# Copy sencillo para refuerzo y escenarios de IA

## Objetivo

Facilitar que personas no técnicas entiendan las preguntas de refuerzo y los escenarios de asistentes de IA con lenguaje directo, opciones explícitas, feedback útil y textos laterales breves. Distinguir visualmente los aciertos y errores del mini test.

## Problema y motivo

El mini test usa términos y explicaciones que pueden ser difíciles de entender a la primera. En los escenarios de IA, el panel lateral y las instrucciones incluyen demasiado texto para una actividad breve.

## Alcance autorizado

- Simplificar preguntas, opciones y explicaciones de las preguntas de refuerzo de los siete módulos y del conjunto predeterminado.
- Hacer explícito el feedback de respuesta incorrecta sin revelar la respuesta correcta ni impedir el reintento.
- Presentar aciertos y errores del mini test en estados visuales claros y accesibles.
- Resumir el contexto, las instrucciones y los textos laterales de los cuatro escenarios de IA, conservando la información necesaria para decidir.
- Acortar descripciones de la galería de IA; conservar intacto el contenido de los blocs de notas, como pidió el usuario.
- Quitar guiones usados como separadores en las redacciones de los escenarios de IA; usar comas o paréntesis.
- Actualizar pruebas que dependan del texto que cambie.

## Restricciones

- No cambiar índices correctos, flujo de reintento, IDs de escenario, nodos, datos de ejemplo ni reglas de privacidad.
- Conservar las frases de `CONTEXT` que indexan audios existentes hasta contar con autorización para generar nuevas locuciones; el objetivo del usuario es el material que ocupa la columna derecha.
- Mantener el español de Ecuador y vocabulario familiar para personas no técnicas.
- Evitar explicaciones largas y no culpabilizar a quien elija una opción incorrecta.
- TDD: desactivado según la configuración registrada para tareas frontend (`odd/tasks/simulated-apps-ui.md`); ejecutar checks funcionales ordinarios.
- Runner: Vitest mediante `pnpm test` en `frontend/`; checks del proyecto: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
- Engram no está disponible en las herramientas de esta sesión; espejo pendiente.
- RDD: `disabled/unmanaged`; `gentle-ai` no está instalado y una tarea frontend previa registra el mismo estado. No se habilitó.
- Recuento acumulado actual: 426 líneas añadidas/eliminadas en archivos de esta tarea, incluido el documento ODD y excluyendo el cambio preexistente de backend. Supera el umbral aproximado de 400. Estrategia `ask-on-risk`: antes del siguiente commit de trabajo hace falta que el usuario elija `stacked-to-main` o `feature-branch-chain`.
- Estrategia de entrega: `ask-on-risk`.

## Tareas

### RF-1: Simplificar preguntas y feedback

- [x] Reescribir preguntas, opciones y explicaciones del mini test con instrucciones y vocabulario más claros.
- [x] Mejorar el feedback de respuestas incorrectas, manteniendo el reintento y sin revelar la opción correcta.
- [x] Actualizar selectores/asserts de pruebas solo donde dependan de copy cambiado.
- [x] Ejecutar checks funcionales aplicables y registrar resultado.

Commits: `f4c0baa` (`copy(quiz): simplificar preguntas de refuerzo`) y `e0cf9ad` (`test(quiz): actualizar selectores del mini test`). Checks observados: prueba enfocada de `MiniTestModulo` (6/6), `AccionesFinal` (19/19), suite completa (`pnpm test`, 119 archivos, 884 aprobadas, 4 omitidas), `pnpm typecheck` y `pnpm build` pasan; `pnpm lint` termina con warnings de oxlint ya existentes. La primera ejecución completa mostró selectores obsoletos en `AccionesFinal.test.tsx`; actualizados y comprobados con la ejecución completa posterior.

Ruta: delegada. Evidencia del disparador: preguntas y feedback viven en `MiniTestModulo.tsx` y sus pruebas usan copy literal; el mapa abarcó más de cuatro archivos/consumidores potenciales.

### IA-1: Acortar ayudas y feedback de escenarios de IA

- [x] Resumir las instrucciones, pistas, reglas, encuadres y feedback de los cuatro escenarios de IA.
- [x] Retirar guiones separadores de esas redacciones sin cambiar los datos ni la decisión que el ejercicio enseña.
- [x] Actualizar pruebas que afirmen el texto anterior.
- [x] Ejecutar checks funcionales aplicables y registrar resultado.
- [x] Restaurar el texto exacto de los contextos con audio asociado y confirmar que la prueba de narración vuelve a pasar sin regenerar audios.

Ruta: delegada. Evidencia del disparador: cuatro escenarios comparten un marco y cada uno aporta textos laterales propios, con pruebas asociadas.
Commits: `669322f` (`copy(ia): acortar textos de apoyo`) y `8d1147e` (`copy(ia): conservar sentido de permiso en fotos`). Las cuatro frases de `CONTEXT` se restauraron exactamente desde `5812e95` para conservar las locuciones existentes. Prueba de narración: 1 aprobada, 1 omitida; escenarios IA: 49/49.

### IA-2: Condensar el contenido de los paneles de referencia

- [x] Conservar sin cambios el bloc de notas de correo, la ficha escolar y el informe interno, como pidió el usuario.
- [x] Reducir las descripciones de la galería sin borrar quién aparece ni qué opciones no muestran personas.
- [x] Verificar que las decisiones y funciones de evaluación siguen distinguiendo fuga alta, parcial y segura.
- [x] Actualizar pruebas afectadas y ejecutar los checks funcionales aplicables.

Ruta: delegada. Evidencia del disparador: las fuentes visibles están en cuatro escenarios independientes, comparten patrones de evaluación y pruebas; la columna derecha confirma que el contenido principal no quedó resumido en IA-1.
Checks: cuatro suites enfocadas, 49/49. No hubo asserts de prueba dependientes del copy que requirieran cambios. Los blocs de notas conservan su redacción original.

### RF-2: Mejorar la presentación visual del feedback

- [x] Mostrar el resultado correcto e incorrecto como estados visuales distintos y fáciles de reconocer.
- [x] Mantener explicación breve, reintento, accesibilidad y el flujo actual del mini test.
- [x] Actualizar pruebas para comprobar el feedback visual y accesible.
- [x] Ejecutar checks funcionales aplicables y registrar resultado.

Ruta: delegada. Evidencia del disparador: implementación en `MiniTestModulo.tsx` y cambios en su prueba asociada; dos archivos no triviales.
Commit: `8499654` (`ui(quiz): mejorar feedback visual de respuestas`). Checks posteriores a RF-2: prueba enfocada 6/6, typecheck y build pasaron; lint terminó con advertencias ya existentes.

## Progreso y evidencia

- Exploración: `codegraph_explore` no reconoció el índice del proyecto; se hizo fallback a `rg` y lectura local. El mapeo encontró las preguntas en `frontend/src/components/MiniTestModulo.tsx` y los textos laterales en cuatro archivos de escenario más `EscenarioChatIA.tsx`.
- Estado RF-1: implementado y verificado; los índices correctos y el flujo de reintento/navegación no cambiaron.
- IA-2, alcance corregido por el usuario: los blocs de notas de correo, ficha escolar e informe interno quedan exactamente como estaban; solo se acortan las descripciones de la galería, sin quitar quién aparece ni qué opciones no muestran personas.
- RF-2: el acierto ahora muestra un panel verde con icono, título y explicación; el error muestra un panel rojo con icono, título y una instrucción para volver a intentar. La opción correcta no se revela al fallar.
- Verificación final: `pnpm typecheck`, `pnpm lint` (warnings existentes), `pnpm test` (119 archivos, 884 aprobadas, 4 omitidas) y `pnpm build` pasan. Tras un fallo posterior, se restauró el contexto exacto de `InvitacionCumpleanos` desde la clave de audio existente; narración focalizada y suite completa volvieron a pasar.
- Estado del mirror Engram: pendiente; la integración de memoria no está disponible en esta sesión.
- Estado del árbol al iniciar: había un cambio previo en `backend/apps/identidad/src/certificados/pdf.ts`; se conserva intacto y fuera de los commits de esta tarea.
- Siguiente paso: pedir al usuario la estrategia de cadena requerida por el umbral y crear el commit de IA-2/documentación; luego sincronizar el mirror Engram si la integración está disponible.
