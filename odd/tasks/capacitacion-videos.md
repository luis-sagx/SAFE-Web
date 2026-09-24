# Videos de capacitación

## Objetivo

Actualizar el catálogo de videos de capacitación: asignar el video de YouTube indicado a phishing y dejar los demás módulos sin video para que muestren el estado de publicación próxima.

## Alcance autorizado

- Phishing: `https://youtu.be/6SxLDCPSSIc`.
- Smishing, vishing, suplantación, estafa, seguridad física y asistentes de IA: sin URL de video.
- Prueba automatizada del catálogo.

## Restricciones y criterios de aceptación

- Conservar el estado de interfaz existente para módulos sin video ("Este video se publica pronto").
- No incorporar el iframe proporcionado: el componente actual ya genera su iframe seguro y diferido desde la URL.
- Ejecutar la prueba enfocada y el conjunto de pruebas aplicable de frontend.

## Configuración

- TDD: habilitado; fuente: habilidad `superpowers:test-driven-development`; runner: `pnpm --dir frontend test` (Vitest).
- Ruta: delegada. Evidencia: se actualizan catálogo y prueba, dos archivos no triviales; el mapeo previo identificó ambos.
- Estrategia de entrega: ask-on-risk. Pronóstico: menos de 20 líneas modificadas.
- Espejo Engram: pendiente; el entorno actual no expone las herramientas de memoria requeridas.

## Tareas

- [x] CV-01 — Añadir prueba RED para las URLs de los módulos, actualizar el catálogo y verificar GREEN. Ruta: delegada; evidencia del trigger: catálogo, pruebas de catálogo y prueba de portada afectados. Commit de trabajo: `f1727020155032199a4b0c015ba10151c4a8a8b8` (`feat(frontend): publish phishing training video`).

## Progreso y siguiente paso

RED observado: `pnpm --dir frontend test src/data/videosCapacitacion.test.ts` falló como se esperaba: phishing tenía `https://youtu.be/1To_Wz5RWi0` en vez de `https://youtu.be/6SxLDCPSSIc` (6 pruebas pasaron, 1 falló).

GREEN observado: el mismo comando pasó con 7/7 pruebas. La suite completa inicial reveló una expectativa de portada desactualizada (8 botones de reproducción frente a los 2 publicados); se actualizó esa expectativa. Verificación final: `pnpm --dir frontend test` pasó con 104 archivos, 827 pruebas aprobadas y 3 omitidas. `git diff --check` no reportó errores antes del commit de trabajo.

Conteo acumulado de líneas modificadas en commits de trabajo: 28 (19 adiciones y 9 eliminaciones; documentos de seguimiento excluidos). RDD: deshabilitado/no administrado por defecto; no se ejecutó revisión. Espejo Engram: pendiente, porque el entorno no expone sus herramientas.

Siguiente paso: entregar el commit de documentación de seguimiento y reportar CV-01 al orquestador.
