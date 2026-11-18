# Consistencia visual en escenarios de suplantación y estafa

## Objetivo, problema y autorización

Actualizar las vistas solicitadas de Suplantación y Estafa para que las opciones, cabeceras, botones y paneles informativos comuniquen mejor qué representa cada app simulada. El usuario autorizó realizar los cambios y confirmó como preferencia usar Tailwind y componentes reutilizables, sin duplicar estilos.

El componente compartido `DeviceScreen` ya centraliza opciones de apps y el acento visual, pero todavía no representa contactos con avatar y acción de llamada. Los escenarios configuran sus apps por separado, por lo que cambios locales repetidos pueden divergir.

## Enfoque aprobado

Extender los componentes compartidos existentes con variantes configurables por datos: filas de contacto con inicial y llamada, y el catálogo de iconos de opciones. Mantener las clases de presentación en Tailwind y reutilizar los acentos de app existentes. Cada escenario solo declarará contenido, acento y apps del dock. Para las dos fichas informativas, crear un componente común solo para las filas etiqueta/valor que ambas comparten; no añadir dependencias ni abstracciones para otros patrones.

Se descartó construir filas y estilos en cada escenario, porque duplicaría markup y clases; también se evita cambiar globalmente vistas no solicitadas.

## Alcance autorizado

- Suplantación: `CambioNumero`, `PerfilClonado`, `ClonaronTuPerfil`, `JefeUrgente`, `NumeroNuevoReal`, `CodigoPrestado`, `CuentaHackeada`, `VozClonada`.
- Estafa: `SaldoContable`, `MitadDePrecio`, `VisitaDepartamento`, `ArriendoAnticipado`, `PagoLavadora`, `VueltoDeMas`, `GananciaGarantizada`, `TareasPagadas`.
- Componentes compartidos de pantalla simulada y sus estilos Tailwind.
- Sin cambios en guiones, decisiones, resultados, datos del estudio ni navegación narrativa.

## Restricciones

- Interfaz en español; identificadores nuevos en inglés.
- Seguir `docs/DESIGN.md`, usar Tailwind y `lucide-react`; no añadir dependencias.
- Preservar comportamiento de escenarios no pedidos.
- TDD frontend desactivado según `odd/tasks/simulated-apps-ui.md`; runner identificado: Vitest (`pnpm test` desde `frontend/`). No añadir pruebas por la instrucción de desarrollo de esta sesión; ejecutar verificaciones funcionales ordinarias permitidas.
- RDD no disponible: `gentle-ai review mode status` terminó con código 127 (`gentle-ai` no está instalado). Entrega: `disabled/unmanaged`, sin evaluación ni revisión nativa.
- Estrategia de entrega: `ask-on-risk` (predeterminada). Pronóstico inicial: 450–600 líneas authored. Revisado tras T2: T1 + T2 suman 214 líneas; T3 se estima en 100–140, para un total aproximado de 314–354, por debajo del presupuesto de entrega de unas 400 líneas. No hace falta preguntar por estrategia de cadena.
- Rama de función: `feat/ui-escenarios-consistency`.

## Criterios de aceptación

- Las filas de contacto solicitadas comparten una presentación con avatar circular claro, inicial y acción de llamada a la derecha; las demás filas conservan su aspecto actual.
- Las opciones solicitadas de redes sociales, tienda y Banco del Litoral muestran iconos semánticos y consistentes.
- Los acentos y botones de Envíos Andina, Mercado, Portal Inmobiliario, Ruvel Capital y TaskPro coinciden con los colores indicados.
- Galería desaparece solo del dock de los escenarios de estafa indicados.
- Las fichas de PagoLavadora y TareasPagadas tienen jerarquía visual y agrupación legible en móvil y escritorio, con la misma información y sin alterar decisiones.
- `pnpm typecheck`, `pnpm lint` y `pnpm build` del frontend pasan, o sus fallos se documentan con salida. No se ejecutan pruebas automatizadas sin petición explícita.
- Cada tarea se cierra con verificación observada y un commit Conventional Commits en español.

## Tareas

- [x] **T1 — Presentación compartida de opciones.** Extender `DeviceScreen.tsx` para soportar icono por fila y una variante configurable de contacto con avatar e icono de llamada; ampliar el catálogo semántico de iconos para opciones sociales, bancarias y de tienda. Mantener el estilo en clases Tailwind y preservar el fallback actual para escenarios no configurados.
  - Ruta: delegada directa.
  - Evidencia del disparador: el mapeo encontró `DeviceScreen.tsx`, `DeviceScreen.module.css` y escenarios en 16 archivos; requiere coordinar el componente y múltiples consumidores. El cambio toca más de un archivo no trivial.
  - Checks: lectura del render compartido; `pnpm typecheck` (verde); `pnpm lint` (verde, con advertencias preexistentes `only-export-components`/`exhaustive-deps`). La primera ejecución de `typecheck` detectó una clave duplicada en el catálogo añadido; se corrigió antes de cerrar T1 y el chequeo final pasó. No se ejecutaron pruebas automatizadas por instrucción de la sesión.
  - Cambios: `ScreenView.opciones` admite `icon` y `contact`; los contactos derivan la inicial de `texto`, muestran avatar circular claro y reemplazan la flecha por el icono de teléfono. El catálogo conserva el criterio de mostrar iconos solo cuando todas las filas tienen correspondencia, con resolución para búsqueda y resultados de perfiles dinámicos.
  - Conteo authored de la unidad: 96 líneas (76 adiciones, 20 eliminaciones); no se excedió el presupuesto de entrega.
  - Commit: `044e69a` (`feat(ui): mejorar opciones de apps simuladas`).

- [x] **T2 — Configuración consistente por escenario.** Configurar avatares/llamadas y los iconos solicitados en las ocho escenas de Suplantación; ajustar iconos, acentos, botones y quitar Galería del dock en las ocho escenas de Estafa indicadas.
  - Ruta: delegada directa.
  - Evidencia del disparador: son más de cuatro archivos de escenario y el mapeo fue delegado antes de decidir; cambios coordinados en varios módulos.
  - Checks: revisé las seis agendas solicitadas en Suplantación y la agenda de Vuelto de Más; sus iniciales salen del `texto`. Comprobé los menús de Red social, Tienda y Banco contra el catálogo compartido, y las opciones de Mercado/Portal contra sus iconos por fila. Confirmé los ocho docks sin Galería y los acentos de courier, Mercado, Portal Inmobiliario, Ruvel Capital y TaskPro. `git diff --check` pasó; `pnpm typecheck` pasó; `pnpm lint` pasó con advertencias existentes. No ejecuté pruebas automatizadas por instrucción de la sesión.
  - Cambios: siete listas de contactos usan `contact:true`; se ajustaron los acentos de las apps indicadas, se acortó Mercado Abierto a Mercado y se retiró Galería de los ocho docks solicitados. Las opciones de Mercado y Portal Inmobiliario declaran iconos semánticos por fila porque el catálogo compartido no tenía una correspondencia directa; los demás menús usan el catálogo existente.
  - Conteo authored de la unidad: 118 líneas (67 adiciones, 51 eliminaciones). Acumulado T1 + T2: 214 líneas; presupuesto no excedido.
  - Commit: `b50207a` (`feat(escenarios): unificar opciones y acentos visuales`).

- [x] **T3 — Jerarquía compartida para datos informativos.** No se encontró un componente común de filas etiqueta/valor en las vistas de apps (la lista parecida de `PoliticaDatos.tsx` es local a esa página). Crear un componente reutilizable con `<dl>` y filas responsivas en Tailwind; usarlo tanto en la ficha de mercado de `PagoLavadora.tsx` como en las condiciones de `TareasPagadas.tsx`. Dar jerarquía al perfil de Gabriela y destacar el depósito no reembolsable con tokens existentes, sin añadir texto ni quitar datos.
  - Ruta: delegada directa.
  - Evidencia del disparador: el cambio crea un componente compartido y actualiza dos vistas no triviales; el recorrido superó el umbral de mapeo y CodeGraph no encontró una lista reutilizable que ya aplique.
  - Checks: revisé que `InfoRows` use `<dl>/<dt>/<dd>`, agrupe cada fila y apile etiqueta/valor en móvil antes de pasar a columnas desde `sm`; las dos vistas habilitan la variante y destacan respectivamente el perfil y el depósito. `pnpm typecheck` (código 0); `pnpm lint` (código 0, con advertencias preexistentes `only-export-components`/`exhaustive-deps`); `pnpm build` (código 0, Vite generó el build); `git diff --check` (código 0). No se añadieron ni ejecutaron pruebas automatizadas, según TDD OFF.
  - Cambios: `InfoRows.tsx` presenta los datos en una sola ficha de filas etiqueta/valor, con lectura responsiva y énfasis opcional mediante `bg-surface-strong`; `DeviceScreen` lo usa solo cuando `dataLayout: 'info-rows'`. PagoLavadora resalta literalmente “Interesada / Gabriela Ponce · cuenta desde 2019”; TareasPagadas resalta “Depósito de activación / $180,00 · no reembolsable en ningún caso” y deja retiro, cupo y empresa como filas subordinadas. No se modificaron los textos ni las decisiones.
  - Conteo authored de la unidad: 64 líneas (55 adiciones, 9 eliminaciones). Acumulado T1 + T2 + T3: 278 líneas; presupuesto no excedido.
  - Commit: `a4dd538` (`feat(ui): ordenar fichas informativas de escenarios`).

## Progreso y siguiente paso

- Exploración: completada mediante CodeGraph y revisión de los commits `45386d8` y `4433bf1`; se confirmó el patrón compartido de acentos y opciones.
- T1 completada y verificada en `044e69a`. La primera compilación falló por una clave duplicada agregada en el catálogo; se retiró la duplicación y `pnpm typecheck` final pasó.
- T2 completada y verificada en `b50207a`. T1 + T2 suman 214 líneas authored y el forecast actualizado de la rama es de unas 314–354 líneas.
- T3 completada y verificada en `a4dd538`; fuente y escenarios suman 64 líneas authored. Acumulado observado: 278 líneas.
- Mirror Engram pendiente de sincronizar T3. El agente y el padre intentaron guardar el documento completo, pero el CLI no pudo consultar la versión por DNS bloqueado y no pudo abrir `/home/luissagnay/.engram/.instance-id.lock` por filesystem de solo lectura. La observación `#128` conserva una versión anterior y no incluye T3; el documento local es la copia actual.
- Siguiente paso: la implementación queda cerrada con los checks disponibles; sincronizar y leer de vuelta el mirror cuando Engram permita escritura.
