# Phishing progresivo y guiado

## Objetivo

Hacer que el módulo de phishing sea más accesible para principiantes: iniciar
con ESC-01 guiado y aclarar con sutileza una señal en cada uno de los otros
siete escenarios, sin revelar respuestas ni cambiar otros módulos.

## Alcance autorizado

- Solo frontend y los ocho escenarios de phishing.
- Mantener el orden del catálogo `1, 2, 2, 3, 3, 3, 4, 5`.
- No hacer commits: instrucción explícita de la persona usuaria.

## Restricciones

- No etiquetar un escenario como fraude antes de decidir ni conducir la
  elección con opciones deshabilitadas/preseleccionadas.
- Preservar identificadores, rutas, naturaleza, registro de corridas y
  desbloqueo secuencial.
- Los casos legítimos deben continuar siendo plausibles.

## Configuración de trabajo

- TDD: habilitado por `superpowers:test-driven-development`.
- Runner: `pnpm test` desde `frontend`; pruebas focalizadas con
  `pnpm exec vitest run <archivo>`.
- Estrategia de entrega: `ask-on-risk`; previsión menor a 400 líneas
  autoradas. No habrá commits por instrucción explícita de la persona usuaria.
- Espejo Engram: pendiente; el servicio `mem_*` no está disponible en esta
  sesión. Localizador: `odd/tasks/phishing-progresivo-guiado.md`.

## Tareas

- [x] PPG-01 — Proteger con pruebas la distribución de tres escenarios fáciles,
  tres medios y dos difíciles en phishing.
  - Ruta: delegada; gatillo de escritor: cambios previstos en prueba y
    catálogo/consumidores relacionados.
  - Aceptación: los ocho IDs y dificultades se verifican en orden exacto
    `1, 2, 2, 3, 3, 3, 4, 5`.
  - Comprobación: prueba focalizada de catálogo y suite de frontend.

- [x] PPG-02 — Convertir ESC-01 (`loteria-premiada`) en una introducción
  guiada dentro de la pantalla simulada, sin revelar la respuesta.
  - Ruta: delegada; gatillo de escritor: componente, comportamiento y prueba
    específica.
  - Aceptación: tres indicaciones progresivas se anclan al saludo, pago y
    remitente del correo simulado; no usan “fraude”, “trampa” ni “respuesta
    correcta”, y al final devuelven la decisión libre.
  - Comprobación: RED/GREEN de una prueba de interacción secuencial y suite de
    frontend.

- [x] PPG-03 — Hacer más reconocible una señal decisiva en cada escenario de
  phishing, conservando decisiones y los casos legítimos.
  - Ruta: delegada; gatillo de escritor: siete guiones no triviales y pruebas
    de regresión.
  - Aceptación: cada escenario presenta una señal más visible dentro de la
    simulación o su pista, sin señales caricaturescas ni cambios fuera de
    phishing.
  - Comprobación: pruebas focalizadas, typecheck, lint, build y suite de
    frontend.

## Progreso y evidencia

- PPG-01 completada. La prueba focalizada falló al requerir las versiones nuevas
  de los ocho guiones; después de actualizar el catálogo, pasó con 16 pruebas.
  La prueba fija IDs, dificultades y versiones en el orden `1, 2, 3, 3, 4, 4,
  4, 5`.
- PPG-02 completada. RED observado en
  `pnpm exec vitest run src/secciones/phishing/LoteriaPremiada.test.tsx` por
  ausencia de `Siguiente pista`. GREEN: la misma prueba pasó tras incorporar
  tres pistas dentro del correo, ancladas a saludo, pago y remitente, y
  `Ahora decide` las retira sin tocar las decisiones. `pnpm typecheck` pasó;
  `pnpm test` pasó con 104 archivos, 818 pruebas aprobadas y 3 omitidas. El
  runner emitió avisos preexistentes de APIs multimedia/canvas no implementadas
  por JSDOM, sin fallos.
- PPG-03 completada. La prueba focalizada falló para las siete pistas opcionales
  nuevas y después pasó con 16 pruebas. Cada caso incorpora una sola
  comprobación concreta: canal oficial (SRI), dominio (clave), ruta habitual
  (rol), vista previa (QR), teléfono oficial (colegio), marcador habitual
  (filtración) u OTP en la aplicación (sesión).
- PPG-01 y PPG-03 reabiertas por decisión de producto: se requiere la
  distribución `3 fáciles, 3 medios, 2 difíciles` (`1, 2, 2, 3, 3, 3, 4, 5`)
  y señales algo más visibles dentro de los ocho escenarios de phishing.
- PPG-01 reabierta, RED/GREEN: `pnpm exec vitest run src/data/catalogo.test.ts
  src/secciones/phishing/CorreosRealistas.test.tsx` falló primero con la
  distribución y las ocho señales nuevas ausentes (9 fallos), y después pasó
  con 40 pruebas. El catálogo conserva IDs, orden, rutas y naturalezas, fija
  las dificultades `1, 2, 2, 3, 3, 3, 4, 5` y sube la versión de cada guion.
- PPG-03 reabierta, RED/GREEN: cada simulación ahora hace más perceptible una
  sola señal: boleto no solicitado (lotería), verificación oficial (SRI),
  dominio institucional (clave), marcador habitual (rol y filtración), QR
  fuera de la aplicación, cambio de banco y cuenta, u OTP solicitado. La
  prueba de correos verifica la evidencia visible sin cambiar historias,
  decisiones ni desenlaces.
- Verificaciones de la reapertura: `pnpm typecheck`, `pnpm build` y `pnpm
  test` pasaron; suite completa: 104 archivos, 826 pruebas aprobadas y 3
  omitidas. `pnpm lint` terminó sin errores con advertencias preexistentes de
  Fast Refresh y dependencias de hooks. `git diff --check` pasó.
- Comprobaciones finales: `pnpm exec vitest run src/data/catalogo.test.ts
  src/secciones/phishing/LoteriaPremiada.test.tsx
  src/secciones/phishing/CorreosRealistas.test.tsx` pasó (33 pruebas);
  `pnpm lint` pasó con advertencias preexistentes de Fast Refresh y hooks;
  `pnpm typecheck`, `pnpm build` y `pnpm test` pasaron. La suite completa:
  104 archivos, 818 pruebas aprobadas y 3 omitidas.
- No hay commit por instrucción explícita de la persona usuaria. Espejo Engram:
  pendiente; el servicio `mem_*` no está disponible en esta sesión.

## Próximo paso

Revisión local de los cambios; no hay entrega remota, commit ni PR autorizados.
