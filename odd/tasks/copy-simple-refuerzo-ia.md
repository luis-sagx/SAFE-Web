# Copy sencillo para refuerzo y escenarios de IA

## Objetivo

Facilitar que personas no técnicas entiendan las preguntas de refuerzo y los escenarios de asistentes de IA con lenguaje directo, opciones explícitas, feedback útil y textos laterales breves.

## Problema y motivo

El mini test usa términos y explicaciones que pueden ser difíciles de entender a la primera. En los escenarios de IA, el panel lateral y las instrucciones incluyen demasiado texto para una actividad breve.

## Alcance autorizado

- Simplificar preguntas, opciones y explicaciones de las preguntas de refuerzo de los siete módulos y del conjunto predeterminado.
- Hacer explícito el feedback de respuesta incorrecta sin revelar la respuesta correcta ni impedir el reintento.
- Resumir el contexto, las instrucciones y los textos laterales compartidos en los cuatro escenarios de IA, conservando la información necesaria para decidir.
- Quitar guiones usados como separadores en las redacciones de los escenarios de IA; usar comas o paréntesis.
- Actualizar pruebas que dependan del texto que cambie.

## Restricciones

- No cambiar índices correctos, flujo de reintento, IDs de escenario, nodos, datos de ejemplo ni reglas de privacidad.
- Mantener el español de Ecuador y vocabulario familiar para personas no técnicas.
- Evitar explicaciones largas y no culpabilizar a quien elija una opción incorrecta.
- TDD: desactivado según la configuración registrada para tareas frontend (`odd/tasks/simulated-apps-ui.md`); ejecutar checks funcionales ordinarios.
- Runner: Vitest mediante `pnpm test` en `frontend/`; checks del proyecto: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
- Engram no está disponible en las herramientas de esta sesión; espejo pendiente.
- RDD: `disabled/unmanaged`; `gentle-ai` no está instalado y una tarea frontend previa registra el mismo estado. No se habilitó.
- Estimación inicial: hasta 250 líneas modificadas en copy, pruebas y documentación, archivos generados excluidos. RF-1 acumuló 203 líneas entre el commit principal y su ajuste de selectores, todavía bajo el presupuesto.
- Estrategia de entrega: `ask-on-risk`.

## Tareas

### RF-1: Simplificar preguntas y feedback

- [x] Reescribir preguntas, opciones y explicaciones del mini test con instrucciones y vocabulario más claros.
- [x] Mejorar el feedback de respuestas incorrectas, manteniendo el reintento y sin revelar la opción correcta.
- [x] Actualizar selectores/asserts de pruebas solo donde dependan de copy cambiado.
- [x] Ejecutar checks funcionales aplicables y registrar resultado.

Commits: `f4c0baa` (`copy(quiz): simplificar preguntas de refuerzo`) y `e0cf9ad` (`test(quiz): actualizar selectores del mini test`). Checks observados: prueba enfocada de `MiniTestModulo` (6/6), `AccionesFinal` (19/19), suite completa (`pnpm test`, 119 archivos, 884 aprobadas, 4 omitidas), `pnpm typecheck` y `pnpm build` pasan; `pnpm lint` termina con warnings de oxlint ya existentes. La primera ejecución completa mostró selectores obsoletos en `AccionesFinal.test.tsx`; actualizados y comprobados con la ejecución completa posterior.

Ruta: delegada. Evidencia del disparador: preguntas y feedback viven en `MiniTestModulo.tsx` y sus pruebas usan copy literal; el mapa abarcó más de cuatro archivos/consumidores potenciales.

### IA-1: Acortar el texto visible de escenarios de IA

- [ ] Resumir los paneles laterales, instrucciones y encuadres de los cuatro escenarios de IA.
- [ ] Retirar guiones separadores de esas redacciones sin cambiar los datos ni la decisión que el ejercicio enseña.
- [ ] Actualizar pruebas que afirmen el texto anterior.
- [ ] Ejecutar checks funcionales aplicables y registrar resultado.

Ruta: delegada. Evidencia del disparador: cuatro escenarios comparten un marco y cada uno aporta textos laterales propios, con pruebas asociadas.

## Progreso y evidencia

- Exploración: `codegraph_explore` no reconoció el índice del proyecto; se hizo fallback a `rg` y lectura local. El mapeo encontró las preguntas en `frontend/src/components/MiniTestModulo.tsx` y los textos laterales en cuatro archivos de escenario más `EscenarioChatIA.tsx`.
- Estado RF-1: implementado y verificado; los índices correctos y el flujo de reintento/navegación no cambiaron.
- Estado del árbol al iniciar: había un cambio previo en `backend/apps/identidad/src/certificados/pdf.ts`; se conserva intacto y fuera de los commits de esta tarea.
- Siguiente paso: delegar IA-1.
