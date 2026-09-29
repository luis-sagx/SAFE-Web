# Escenarios y administración responsivos

## Objetivo y autorización

Resolver los cuatro problemas comunicados por la persona usuaria: foto de riesgo físico recortada, inicio de sesión tras restablecer contraseña desde administración, pérdida del mensaje enviado en pago-lavadora y menú de cuenta abrumador. La petición autoriza cambios locales de código y pruebas; no autoriza operaciones remotas.

## Evidencia y alcance

- La foto de `fisico/tarjeta-clonada` mide 1672×941. El marco de escena y la imagen usan altura fija y ancho ajustado desde `lg`; la columna de decisión conserva ancho fijo, por lo que el conjunto rebasa el espacio disponible.
- En `estafa/pago-lavadora`, `n1` envía al banco `n2`; `n1b` contiene el mensaje enviado. Desde movimientos `n3`, el dock descarta `cerrarGoto: n2` y usa el último SMS narrativo `n1`.
- `AdminService.resetPassword` guarda bcrypt de la clave que devuelve. La prueba e2e vigente cubre ingreso con clave nueva para cuenta activa y confirmada. El fallo comunicado aún no está discriminado; se pidió el mensaje exacto sin credenciales.
- `MenuUsuario` reúne cuenta, tema, sonido, navegación y salida en un desplegable de 14 rem. Debe conservar accesibilidad, temas y acciones.
- Código nuevo en inglés, interfaz y pruebas en español, privacidad y contratos existentes preservados.

## Tareas

- [x] T1. Corregir el ancho y flujo responsivo de las escenas fotográficas sin desalinear las zonas de señales. Ruta: delegada; preparación y escritura abarcan `EscenarioLayout` y `EscenaFoto`. Criterio: foto y zonas comparten una superficie de proporción natural limitada por ancho y alto del marco; columna de decisiones conserva espacio. Comprobaciones: prueba RED/GREEN, suite frontend, typecheck, lint, build y prueba de colapso con Chrome; inspección visual integral pendiente por restricción del navegador.
- [x] T2. Conservar el chat actualizado de pago-lavadora al regresar desde el banco y movimientos. Ruta: delegada; se modifican motor visual y prueba de integración; el guion ya declaraba `n1b` como destino. Criterio: tras enviar «Deme un momento...», Mensajes muestra el mensaje enviado y la siguiente respuesta, sin opciones iniciales; abrir el banco directamente conserva el chat inicial. Comprobaciones: prueba RED/GREEN, suite frontend, typecheck, lint, build.
- [ ] T3. Diagnosticar y corregir el fallo concreto de inicio de sesión después de restablecer la contraseña. Ruta: delegada si el diagnóstico exige varios archivos. Criterio: el flujo informado funciona y la prueba reproduce el fallo original. Comprobaciones: prueba RED/GREEN aplicable, suite backend y e2e si hay Postgres; registrar impedimentos.
- [x] T4. Simplificar el menú de cuenta, con jerarquía clara para navegación, preferencias y salida. Ruta: delegada; cambian menú, selectores y prueba. Criterio: navegación, sonido y salida visibles; tema en un subpanel con retorno de foco; filas táctiles de 44 px y ancho limitado al viewport. Comprobaciones: prueba RED/GREEN, suite frontend, typecheck, lint, build, detector de diseño. Inspección visual autenticada pendiente.

## Configuración y entrega

- TDD: activado por la habilidad `superpowers:test-driven-development` de esta sesión; runners `pnpm --dir frontend test` (Vitest), `pnpm --dir backend test` (Jest), `pnpm --dir backend test:e2e` si Postgres está disponible. Para cambios puramente visuales, inspección funcional además de las pruebas aplicables.
- RDD: `gentle-ai` no está disponible; evaluación nativa no disponible, entrega `disabled/unmanaged` mientras no se habilite explícitamente.
- Engram: las herramientas `mem_context`, `mem_search`, `mem_get_observation` y escritura de espejo no están disponibles en esta sesión; espejo `odd/escenarios-admin-responsivo/tasks` pendiente.
- Estrategia de entrega: `ask-on-risk`; pronóstico inicial ~300 líneas autoradas, excluidos artefactos generados. Si supera ~400, decidir cadena antes del siguiente commit.
- Rama: `fix/escenarios-admin-responsivo`, creada desde `main`. Cada tarea cerrará con commit Conventional Commit de su unidad verificada. Conteo y límites de slices pendientes.

## Progreso y siguiente paso

- T1: prueba nueva falló antes del cambio porque la proporción de la superficie estaba ausente, y pasó después. `pnpm --dir frontend test --run src/secciones/fisico/EscenaFoto.test.tsx src/components/EscenarioLayout.test.tsx`: 4/4; suite `pnpm --dir frontend test`: 887 pasaron, 4 omitidas; `typecheck`, `lint`, `build` y `git diff --check`: salida 0. Lint emitió advertencias preexistentes. Chrome headless comprobó RED de `sm:h-auto` con 4 px de alto a 640 px; se fijó un alto responsivo y las 4 pruebas enfocadas volvieron a pasar. Inspección visual integral pendiente. Commits `c6f669c`, `8c7a555`; 95 líneas autoradas acumuladas.
- T2: prueba nueva observó RED porque faltaba la respuesta de Gabriela tras volver desde movimientos; GREEN 2/2 y suite `pnpm --dir frontend test` 889 pasaron, 4 omitidas. `typecheck`, `lint`, `build`: salida 0; lint conserva advertencias preexistentes. Commit `9f12e2b`; 42 líneas autoradas.
- T3: diagnóstico sin escritura. Tests unitarios de admin/auth: 53/53 pasaron. La ruta activa y confirmada está cubierta por e2e existente; login distingue contraseña incorrecta (401), cuenta desactivada (403), correo no confirmado (401) y límite de intentos (429). Administración solo informa `activo` desde `disabledAt`, sin mostrar confirmación de correo. No hay evidencia para elegir una de esas causas. `test:e2e` pendiente: su `cleanDatabase` ejecuta `deleteMany` y no se ha verificado una base aislada. Respuesta de usuario sobre mensaje exacto pendiente; sin ella, T3 permanece abierta y sin commit.
- T4: prueba RED mostró opciones de tema expuestas de inicio; otra comprobación RED mostró pérdida de foco al abrir el subpanel. GREEN: 11/11 pruebas focales y suite `pnpm --dir frontend test` 890 pasaron, 4 omitidas. `typecheck`, `lint`, `build`, `git diff --check` y detector Impeccable (`[]`): salida 0; lint con advertencias preexistentes. Inspección visual en sesión autenticada pendiente. Commit `aec2dba`; 165 líneas autoradas.
- Acumulado de unidades: 302 líneas autoradas, debajo del umbral de entrega previsto; PRs y push no solicitados.
- T3 queda como única tarea abierta; requiere el mensaje de error del caso informado para identificar la causa antes de cambiar autenticación.
