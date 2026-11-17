# Opciones de smishing dentro del teléfono

Archivo: `odd/tasks/smishing-help-choices.md`

## Objetivo, problema y autorización

Ocultar las opciones de decisión del panel lateral en los ocho escenarios de smishing. En el primero, «Cobro de una suscripción», el control «No sé por dónde empezar» desplegará las tres opciones para quien necesite ayuda. La persona también podrá decidir directamente desde el teléfono simulado.

El usuario autorizó implementar este comportamiento y aprobó el diseño el 17 de noviembre de 2026. El módulo debe sentirse como una interacción con el teléfono: el panel lateral aporta contexto e instrucciones, sin tarjetas de decisión visibles.

## Alcance y restricciones

- Frontend: `ScenarioStory` y los escenarios `smishing/baja-suscripcion` y `smishing/bono-estado`, que son los únicos escenarios smishing con `StoryNode.choices` que actualmente crean tarjetas laterales.
- Los otros seis escenarios ya presentan sus interacciones en el teléfono y no declaran `StoryNode.choices`.
- En BajaSuscripcion, incluir las tres decisiones existentes dentro del desplegable de ayuda. En BonoEstado, ocultar las opciones laterales; mantener las acciones dentro del teléfono.
- Mantener resultados, etiquetas registradas, IDs públicos, narrativa existente y demás módulos.
- No agregar dependencias. Identificadores nuevos en inglés; textos de interfaz en español.
- Estado inicial: rama `fix/smishing-help-choices`, creada desde `main`. `BajaSuscripcion.tsx` ya tenía un cambio local del usuario que quitó `ocultarDecision`; conservarlo. No incluir otros archivos locales no relacionados.

## Diseño

La ubicación de las opciones será explícita para evitar cambiar otros usos de `ScenarioStory`: la presentación lateral sigue siendo el valor por defecto; BajaSuscripcion presenta sus opciones dentro de la ayuda y BonoEstado no las presenta en el panel. La ayuda conserva su despliegue nativo mediante `<details>`.

Alternativas consideradas: ocultarlas siempre desde `accionesEnPantalla` (alcance más amplio a otros módulos); quitar `choices` de los guiones (acopla la presentación a los datos de la historia); seleccionar ubicación por escenario (elegida porque limita el cambio a smishing y mantiene el flujo compartido claro).

## Tareas

- [x] **T1 — Mover las decisiones de smishing fuera del panel lateral.** Ruta: delegated direct. Disparadores: mapeo porque el comportamiento abarca ocho guiones y el componente compartido; escritor porque se cambiarán varios archivos no triviales. `ScenarioStory` ahora admite ubicación explícita: BajaSuscripcion pone sus tres opciones en «No sé por dónde empezar» y BonoEstado no las muestra lateralmente. Se conservan controles telefónicos, etiquetas y destinos. Checks: typecheck, lint (exit 0, advertencias preexistentes), build y diff-check OK; pruebas omitidas por instrucción de sesión. Commit `3cb749e` (`fix(smishing): ocultar opciones laterales y mover ayuda`), 81 líneas autorales acumuladas.

## Criterios de aceptación

- Ninguno de los ocho escenarios smishing muestra tarjetas de decisión en el panel lateral.
- Solo la ayuda de BajaSuscripcion despliega las tres decisiones de ese escenario; las etiquetas y destinos siguen iguales.
- En BonoEstado las decisiones siguen disponibles desde el SMS, el navegador y el teléfono simulado.
- Los demás usos de `ScenarioStory` mantienen su presentación lateral por defecto.
- `pnpm typecheck`, `pnpm lint`, `pnpm build` y `git diff --check` terminan correctamente. Las pruebas no se añaden ni ejecutan por la instrucción de sesión indicada abajo.

## Configuración de pruebas y entrega

- TDD: desactivado para esta tarea por la instrucción de sesión de no añadir ni ejecutar pruebas salvo que el usuario lo solicite. Runner disponible: `pnpm test` (Vitest), desde `frontend/`; no se ejecutará. Checks funcionales previstos: `pnpm typecheck`, `pnpm lint`, `pnpm build` y `git diff --check` desde `frontend/`/raíz según corresponda.
- RDD: `disabled/unmanaged`; `gentle-ai` no está instalado, por lo que no se ejecutará evaluación ni revisión nativa.
- Engram: espejo pendiente; `engram save` no pudo abrir `/home/luissagnay/.engram/.instance-id.lock` porque el directorio está en solo lectura. Se conserva este documento local y no se bloquea la implementación.
- Previsión: ~140 líneas autorales. Estrategia: `ask-on-risk`, predeterminada; no se anticipa superar el umbral de cadena. Sin push ni PR.

## Progreso y evidencia

- Exploración de `StoryEscenario`, `Instructions`, catálogo, ocho escenarios de smishing y pruebas existentes completada mediante CodeGraph y búsqueda focalizada. Orden confirmado: `baja-suscripcion` es el primer escenario; le sigue `bono-estado`.
- Mapeo delegado: seis escenarios ya actúan desde controles del teléfono; BajaSuscripcion y BonoEstado eran los únicos con `choices` que se renderizaban en el lateral.
- Implementación T1 realizada por escritor delegado en `StoryEscenario.tsx`, `BajaSuscripcion.tsx` y `BonoEstado.tsx`; no se tocaron pruebas ni otros archivos de producto.
- `pnpm typecheck` (frontend): OK. `pnpm lint`: exit 0; advertencias existentes de Fast Refresh y `react-hooks/exhaustive-deps`. `pnpm build`: OK (Vite transformó 2035 módulos). `git diff --check`: OK. Suite Vitest omitida por la instrucción de sesión, no por un fallo.
- Commit de unidad registrado: `3cb749e`. Evaluación RDD: `disabled/unmanaged`; sin revisión nativa. No hubo push ni PR.
- Resultado: T1 completo. La función está implementada localmente en `fix/smishing-help-choices`; espejo Engram pendiente porque el directorio local de Engram es de solo lectura.
