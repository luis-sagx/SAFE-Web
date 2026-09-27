# UI de apps simuladas — tareas ODD

Objetivo: hacer más creíbles las apps simuladas en escenarios de fraude, aplicar acentos de color consistentes y reducir a tres las opciones decorativas donde hoy hay cuatro.

Problema y motivo: los bancos y apps de relleno se repiten con apariencia genérica; algunos docks o menús distraen con accesos de relleno. La práctica debe conservar las rutas de verificación y decisiones que evalúa cada escenario.

Alcance autorizado: frontend de SAFE-Web, componentes compartidos de apps, escenarios de smishing, vishing, suplantación de identidad y estafa electrónica, con sus pruebas y documentación incidental necesaria. No cambiar narrativa, IDs publicados, decisiones evaluadas, rutas, datos personales ni dependencias.

Restricciones: interfaz y comentarios/pruebas en español; identificadores nuevos en inglés; TypeScript strict; simulaciones fuera del tema claro/oscuro del cromo; usar colores literales en CSS Modules; no introducir `fetch` ni dependencias. Banco turquesa, Mi Operadora rosa, EnvíaExpress naranja, Red social celeste. Mantener contraste legible.

Configuración de pruebas: TDD desactivado según la configuración registrada en tareas frontend del proyecto; runner `pnpm test` (Vitest), con typecheck, lint y build según AGENTS.md. RDD: `gentle-ai` no está instalado, por tanto `disabled/unmanaged`. Engram no está disponible en las herramientas de esta sesión; espejo pendiente.

Estimación inicial: ~600 líneas editadas acumuladas; estrategia de entrega `feature-branch-chain`, inferida de la autorización del usuario para crear commits en esta rama. No se hará push ni se creará PR.

## Tareas

- [x] T1 — Apps simuladas y acentos compartidos. Ruta: delegated direct; trigger: preparación requiere 4+ archivos y writer de 2+ archivos no triviales. Banco y galería recibieron layouts más definidos; `ScreenView.appAccent` pinta solo la cabecera de una app real; paleta común en `components/ui/appAccents.ts`. Checks: `pnpm typecheck` OK; `pnpm lint` OK con advertencias preexistentes `only-export-components` y `exhaustive-deps`; suite completa Vitest: 875 pasaron, 4 omitidas, 0 fallos (119 archivos). Commit `568b342` (`feat(ui): mejorar apps simuladas compartidas`). Detector visual pendiente al completar todo el trabajo.
- [x] T2 — Smishing. Ruta: delegated direct; trigger: escritor para cambios coordinados en cuatro escenarios y pruebas. Eliminados Consumo de datos, `sri.gob.ec`, Mis direcciones, Transferir (menú normal y variante durante llamada) y Navegador del dock de TarjetaBloqueada. Acentos compartidos en apps reales y docks; rutas útiles conservadas. Checks: `pnpm test -- src/secciones/smishing/{BajaSuscripcion,BonoEstado,EntregaProgramada,TarjetaBloqueada}.test.tsx` terminó ejecutando la suite completa (879 pasaron, 4 omitidas, 0 fallos); `pnpm typecheck` OK; `pnpm lint` OK con advertencias preexistentes `only-export-components` y `exhaustive-deps`. Commit `a5d682c` (`feat(smishing): simplificar apps y docks`).
- [x] T3 — Vishing, suplantación y estafa. Ruta: delegated direct; trigger: escritor para cambios coordinados en 19+ escenarios no triviales. Docks ajustados a tres; retiradas las apps de relleno indicadas, preservando las rutas útiles. Acentos bancarios y sociales unificados. Checks: `pnpm test` OK (879 pasaron, 4 omitidas, 0 fallos; 119 archivos); `pnpm typecheck` OK; `pnpm lint` exit 0 con advertencias `only-export-components`/`exhaustive-deps`; `git diff --check` OK. `PremioSorteo.test.tsx`: 7 pasaron. Commit `5f2b87a` (`feat(ui): unificar acentos de apps simuladas`).
- [x] T4 — Completar color y jerarquía de apps. Ruta: delegated direct; trigger: writer para `DeviceScreen`, tokens y cuatro escenarios. Acento turquesa compartido en las vistas y docks bancarios de AlertaConsumo, CodigoReenviado, PaqueteRetenido y CitacionTransito; Mi Operadora pasa a rosa. Se oculta la marca redundante de apps nativas y se conserva en sitios y navegador. Pruebas: `pnpm exec vitest run src/components/ui/DeviceScreen.test.tsx src/secciones/smishing/CodigoReenviado.test.tsx src/secciones/smishing/BajaSuscripcion.test.tsx` OK (24 pruebas); `pnpm typecheck` OK; `pnpm lint` exit 0 con advertencias preexistentes `only-export-components`/`exhaustive-deps`; `git diff --check` OK. Commit `16d893f` (`fix(ui): unificar cabeceras de apps simuladas`).

## Criterios de aceptación

- Cada dock afectado tiene tres apps y cada menú señalado pasa de cuatro a tres opciones.
- Permanecen las rutas útiles: `Paquetes y suscripciones`, `inclusion.gob.ec`, ver detalle/devolver envío, Mis tarjetas/Bloquear tarjeta, y las apps de comunicación requeridas por cada llamada.
- Colores coherentes entre dock y app abierta: banco turquesa, Mi Operadora rosa, EnvíaExpress naranja y Red social celeste.
- Las apps no repiten una marca azul dentro del contenido cuando ya aparece su nombre en la cabecera; los sitios web conservan su identificación.
- Banco y galería de relleno se distinguen visualmente y mantienen legibilidad.
- `pnpm typecheck`, `pnpm lint`, `pnpm test` y `pnpm build` desde `frontend/` pasan; los fallos se registran explícitamente.

## Evidencia y progreso

- Mapeo previo de solo lectura: `AppRelleno.tsx` y `StoryEscenario.tsx` son compartidos. La mayoría de los docks ya tienen tres; las excepciones y menús de cuatro se detallan en T2/T3. `PremioSorteo.test.tsx` ahora comprueba que la llamada sigue abierta al revisar la app bancaria y volver.
- Rama: `feat/simulated-apps-ui`.
- Commits: `568b342` (T1), `a5d682c` (T2), `5f2b87a` (T3).
- Próximo paso: revisión final de la rama; build y suite completa.

## Verificación final

- `pnpm build` desde `frontend/`: OK (`tsc -b && vite build`).
- `git diff --check`: OK.
- Detector visual Impeccable sobre todos los targets modificados: una advertencia preexistente en `DeviceScreen.module.css:724` (`border-left: 4px solid #d39b19`, regla `side-tab`); la línea no forma parte del diff de esta rama (`git blame`: commit `ec31a908`, 2026-09-10). No se cambió código ajeno al alcance.
- Diff acumulado de T1–T3 contra `main`: 442 inserciones + 74 eliminaciones = 516 líneas editadas. La entrega queda en la rama feature, según la autorización del usuario para crear commits.
- T4: CodeGraph MCP no reconoció el índice `.codegraph/` y `gentle-ai codegraph init` no está instalado; se usó lectura puntual de los archivos indicados. Checks focalizados y typecheck/lint registrados arriba; build y suite completa pendientes para la revisión final.
