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
- [x] **T2 — Alinear el pipeline con el flujo inmersivo y el alcance de auditoría prod.** Ruta: delegated direct. Disparadores: mapeo de scripts, lockfile, pruebas y configuración en cuatro o más archivos; escritor para cambios coordinados en manifiesto, lockfile y pruebas. Root cause de `test:cov`: cuatro expectativas viejas en `BajaSuscripcion.test.tsx` y `BonoEstado.test.tsx`; ahora cubren el recorrido inmersivo del teléfono y las opciones dentro de la ayuda cerrada. Root cause del audit prod: `@tailwindcss/vite` y `tailwindcss` son herramientas de compilación colocadas como dependencias de runtime. Se movieron a `devDependencies` y se regeneró el lockfile, por lo que el árbol de producción ya no las instala. TDD ON: RED observado (4 fallidas, 942 pasaron, 4 omitidas), seguido de GREEN: `pnpm test:cov` aprobó 127 archivos, 946 pruebas aprobadas y 4 omitidas; cobertura: 92.22% statements, 94.08% lines. `pnpm audit --prod --audit-level high --fetch-retries 4 --fetch-retry-factor 2 --fetch-retry-mintimeout 10000 --fetch-retry-maxtimeout 60000 --fetch-timeout 120000`: sin vulnerabilidades conocidas. `pnpm typecheck`: OK; `pnpm lint`: exit 0 con advertencias preexistentes; `pnpm build`: OK; `git diff --check`: OK. Los paquetes de build siguen en el lockfile de desarrollo, incluido picomatch 4.0.7; el audit de desarrollo no se ejecutó y el GHSA consultado aún no confirma una versión corregida. Commit `a3cb178` (`fix(frontend): alinear pruebas y auditoría prod`), 62 líneas autorales en este work unit.

## Criterios de aceptación

- Ninguno de los ocho escenarios smishing muestra tarjetas de decisión en el panel lateral.
- Solo la ayuda de BajaSuscripcion despliega las tres decisiones de ese escenario; las etiquetas y destinos siguen iguales.
- En BonoEstado las decisiones siguen disponibles desde el SMS, el navegador y el teléfono simulado.
- Los demás usos de `ScenarioStory` mantienen su presentación lateral por defecto.
- `pnpm test:cov`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, el audit de producción y `git diff --check` terminan correctamente.

## Configuración de pruebas y entrega

- TDD: T1 desactivado por instrucción de sesión, runner `pnpm test` (Vitest) no ejecutado. T2 activado por la solicitud explícita del usuario de corregir `pnpm test:cov`; runner `pnpm test:cov` (Vitest con cobertura), RED observado antes de cambios. T2 también requiere `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm audit --prod --audit-level high` y `git diff --check`.
- RDD: `disabled/unmanaged`; `gentle-ai` no está instalado, por lo que no se ejecutará evaluación ni revisión nativa.
- Engram: espejo pendiente; `engram save` no pudo abrir `/home/luissagnay/.engram/.instance-id.lock` porque el directorio está en solo lectura. Se conserva este documento local y no se bloquea la implementación.
- Previsión: ~140 líneas autorales. Estrategia: `ask-on-risk`, predeterminada; no se anticipa superar el umbral de cadena. Sin push ni PR.

## Progreso y evidencia

- Exploración de `StoryEscenario`, `Instructions`, catálogo, ocho escenarios de smishing y pruebas existentes completada mediante CodeGraph y búsqueda focalizada. Orden confirmado: `baja-suscripcion` es el primer escenario; le sigue `bono-estado`.
- Mapeo delegado: seis escenarios ya actúan desde controles del teléfono; BajaSuscripcion y BonoEstado eran los únicos con `choices` que se renderizaban en el lateral.
- Implementación T1 realizada por escritor delegado en `StoryEscenario.tsx`, `BajaSuscripcion.tsx` y `BonoEstado.tsx`; no se tocaron pruebas ni otros archivos de producto.
- `pnpm typecheck` (frontend): OK. `pnpm lint`: exit 0; advertencias existentes de Fast Refresh y `react-hooks/exhaustive-deps`. `pnpm build`: OK (Vite transformó 2035 módulos). `git diff --check`: OK. T1 no ejecutó suite por instrucción de sesión.
- Commit de unidad registrado: `3cb749e`. Evaluación RDD: `disabled/unmanaged`; sin revisión nativa. No hubo push ni PR.
- Resultado: T1 completo. La función está implementada localmente en `fix/smishing-help-choices`; espejo Engram pendiente porque el directorio local de Engram es de solo lectura.
- Reanudación T2: no existe observación espejo de Engram (`engram search` no encontró el topic; `mem_get_observation` no está disponible en esta sesión); el archivo real se leyó y conserva el estado completo de T1.
- Evidencia T2, antes de cambios: `pnpm test:cov` exit 1: 4 fallidas, 942 aprobadas, 4 omitidas. Tres pruebas en BonoEstado buscan botones laterales suprimidos; una en BajaSuscripcion espera que falte «¿Qué haces?», aunque el diseño conserva el panel de contexto/ayuda. `pnpm audit --prod` reproduce la vulnerabilidad a través de Vite, fijado en `picomatch@4.0.7`.
- La metadata online del GHSA y del registro npm contradice el mensaje de audit que dice `Patched versions >=4.0.8`: el aviso oficial consultado el 17-11-2026 aún reporta sin versión corregida y npm muestra 4.0.7 como latest. Se evitó fijar una versión que no está publicada. El audit completo de herramientas dev no se ejecutó; la dependencia queda en el árbol dev.
- T2 completado localmente: las regresiones ya prueban las acciones del teléfono y las opciones de ayuda; herramientas de Tailwind están clasificadas como dependencias de desarrollo. Cobertura y audit de producción pasan. No se instaló una versión inexistente de picomatch; el árbol dev conserva la versión señalada por el aviso.
- Commit de unidad T2 registrado: `a3cb178`; evaluación RDD `disabled/unmanaged`, sin revisión nativa. No hubo push ni cambios remotos.
- Próximo paso: conservar el espejo Engram pendiente por la restricción de escritura local.
