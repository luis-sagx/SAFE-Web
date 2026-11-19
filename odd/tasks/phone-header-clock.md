# Centrar cabeceras y actualizar hora del teléfono

## Objetivo, problema y autorización

Mantener centrado el nombre de la app en todas las cabeceras del teléfono, con o sin controles laterales, y mostrar la hora local actual con el mismo formato que el reloj de escritorio. El usuario autorizó directamente estos cambios.

## Alcance y restricciones

- Alcance: cromo compartido del teléfono en `frontend/src/components/StoryEscenario.tsx` y `frontend/src/components/ui/DeviceScreen.module.css`.
- Reutilizar `useSystemClock` y `formatTime` de `frontend/src/hooks/useRelojDelSistema.ts`; no duplicar formato ni lógica de intervalo.
- La hora debe seguir la zona horaria local del navegador y refrescarse con la frecuencia compartida existente.
- Centrar el título respecto a la pantalla, sin depender de que exista un control a la derecha; conservar accesibilidad, controles y comportamiento de las vistas.
- No cambiar narrativa, datos, rutas, decisiones, dependencias ni otros estilos de escenarios.

## Configuración y entrega

- TDD: desactivado según la configuración registrada para el frontend en `odd/tasks/simulated-apps-ui.md`.
- Runner registrado: `pnpm test` (Vitest); no ejecutar ni añadir pruebas automatizadas para este ajuste, conforme a la instrucción del entorno. Verificación funcional: `pnpm typecheck`, `pnpm lint`, `pnpm build` y `git diff --check` desde `frontend/` (diff check desde la raíz).
- Ruta: delegated direct. Evidencia del trigger: la preparación consultó más de cuatro archivos y el cambio coordinado toca JSX compartido y CSS; el mapper delegado confirmó los casos de cabecera y el helper de reloj existente.
- Pronóstico: menos de 100 líneas editadas. Estrategia de entrega: `ask-on-risk`; no se hará push ni PR.
- RDD: no iniciar revisión ni cambiar su modo; la sesión de trabajo previa registra `disabled/unmanaged`.

## Tareas

- [x] T1 — Centrar títulos de apps y usar la hora local actual del sistema. En `StoryEscenario`, consumir el hook/formateador del reloj compartido y retirar el estado derivado de horas fijas de la narrativa; en el CSS del teléfono, distribuir los laterales de cabecera simétricamente para que el centro no dependa de botones presentes. Checks observados: `pnpm typecheck` OK; `pnpm lint` OK con advertencias preexistentes de Fast Refresh/hooks; `pnpm build` OK; `git diff --check` OK. No se ejecutaron pruebas automatizadas.

## Criterios de aceptación

- El nombre en las cabeceras de apps/cabeceras web queda en el eje horizontal del teléfono cuando solo hay botón izquierdo, hay controles a ambos lados o falta alguno.
- El reloj del teléfono muestra la hora local actual en formato 24 horas `es-EC` y se actualiza usando el helper existente.
- Los escenarios que usan horas históricas en el contenido conservan ese contenido; solo cambia el reloj de sistema de la barra superior.

## Evidencia y progreso

- Mapeo: `StoryEscenario.tsx` renderiza dos estructuras de cabecera de app, una de las cuales no reservaba la columna derecha. `DeviceScreen.module.css` define el layout compartido. El teléfono retenía la hora extraída de la vista; escritorio usa `useSystemClock` y `formatTime` de `useRelojDelSistema.ts`.
- Commit relacionado inspeccionado: `4433bf1 Style/telefono escenarios (#341)`, que añadió las cabeceras y la hora por hilo.
- Implementación: `StoryEscenario` utiliza `useSystemClock` y `formatTime`; se retiró el reloj derivado de los mensajes. Las barras de app y navegador usan laterales de igual ancho; la app web reserva el lado derecho vacío.
- Verificación: typecheck, lint y build terminaron con código 0. Lint mostró advertencias del proyecto sobre Fast Refresh y dependencias de hooks. No se ejecutaron pruebas automatizadas. `git diff --check` pasó.
- Estado: verificado; commit de trabajo pendiente.
- Próximo paso: registrar el commit de trabajo en esta evidencia y cerrar la tarea.
