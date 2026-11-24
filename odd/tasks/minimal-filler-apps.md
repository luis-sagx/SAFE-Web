# Banco y Galería de relleno

Archivo: `odd/tasks/minimal-filler-apps.md`

El usuario autorizó simplificar Banco y Galería de relleno en el teléfono y quitar el círculo decorativo a la derecha del título. Banco conserva su identidad, el saldo y dos movimientos de ejemplo. Galería conserva tres recuerdos, sin selección ni filtros decorativos. En el refinamiento posterior, el usuario pidió que se vea menos vacía y que aumenten un poco el texto y los iconos; se añadió un contador visual discreto y se alargaron las tarjetas.

La cabecera de estas vistas conserva la flecha y el título centrado. El contenido sigue activando el toque existente y la cabecera queda fuera. El alcance cubre las vistas de relleno compartidas.

- Ruta delegada directa por el mapeo y los cambios coordinados en composición, cabecera, estilos y pruebas. TDD ON por la guía de sesión, Vitest con `pnpm test` en frontend. RDD desactivado/no gestionado. Estrategia `ask-on-risk`, previsión de 150–200 líneas autorales. Rama `feat/smishing-message-controls`.

## Tareas

- [x] T1 — Simplificar ambas vistas y retirar el círculo. RED con 4 fallos esperados. GREEN con 21 pruebas focalizadas aprobadas y 2 omitidas. Commit `369df72`, 129 líneas autorales. RDD desactivado/no gestionado.
- [x] T2 — Dar más presencia a Galería sin perder el diseño minimalista: mostrar un indicador breve de tres recuerdos, hacer las tarjetas algo más altas y aumentar moderadamente sus etiquetas e iconos. Mantener el Banco sin cambios. Ruta delegada directa: JSX y CSS coordinados (trigger de writer). TDD ON según la guía de sesión; runner Vitest (`pnpm test`), omitido por la instrucción de runtime de no ejecutar pruebas sin petición expresa. RDD desactivado/no gestionado. Typecheck, lint, build y `git diff --check` pasaron; lint conserva advertencias existentes. El Banco no cambió. Commit T2: `0a8a814`.

Pasaron typecheck, lint con 93 advertencias preexistentes, build y diff-check. Suite completa con 986 pruebas aprobadas y 4 omitidas en 128 archivos. En Chrome a 420 px se verificaron las dos vistas, los títulos centrados, la flecha visible y la ausencia del círculo. El intento inicial de escribir en Engram encontró su base local en solo lectura.

La entrega queda en la rama local con el commit de trabajo.
