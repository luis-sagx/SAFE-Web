# UI de apps simuladas — tareas ODD

Objetivo: hacer más creíbles las apps simuladas en escenarios de fraude, aplicar acentos de color consistentes y reducir a tres las opciones decorativas donde hoy hay cuatro.

Problema y motivo: los bancos y apps de relleno se repiten con apariencia genérica; algunos docks o menús distraen con accesos de relleno. La práctica debe conservar las rutas de verificación y decisiones que evalúa cada escenario.

Alcance autorizado: frontend de SAFE-Web, componentes compartidos de apps, escenarios de smishing, vishing, suplantación de identidad y estafa electrónica, con sus pruebas y documentación incidental necesaria. No cambiar narrativa, IDs publicados, decisiones evaluadas, rutas, datos personales ni dependencias.

Restricciones: interfaz y comentarios/pruebas en español; identificadores nuevos en inglés; TypeScript strict; simulaciones fuera del tema claro/oscuro del cromo; usar colores literales en CSS Modules; no introducir `fetch` ni dependencias. Banco turquesa, Mi Operadora rojiza, EnvíaExpress naranja, Red social celeste. Mantener contraste legible.

Configuración de pruebas: TDD desactivado según la configuración registrada en tareas frontend del proyecto; runner `pnpm test` (Vitest), con typecheck, lint y build según AGENTS.md. RDD: `gentle-ai` no está instalado, por tanto `disabled/unmanaged`. Engram no está disponible en las herramientas de esta sesión; espejo pendiente.

Estimación inicial: ~350 líneas editadas; estrategia de entrega `ask-on-risk` (por defecto). Conteo observado en T1+T2: 359 líneas añadidas/eliminadas, bajo el umbral aproximado de 400; conservar la estrategia sin encadenar todavía.

## Tareas

- [x] T1 — Apps simuladas y acentos compartidos. Ruta: delegated direct; trigger: preparación requiere 4+ archivos y writer de 2+ archivos no triviales. Banco y galería recibieron layouts más definidos; `ScreenView.appAccent` pinta solo la cabecera de una app real; paleta común en `components/ui/appAccents.ts`. Checks: `pnpm typecheck` OK; `pnpm lint` OK con advertencias preexistentes `only-export-components` y `exhaustive-deps`; suite completa Vitest: 875 pasaron, 4 omitidas, 0 fallos (119 archivos). Commit `568b342` (`feat(ui): mejorar apps simuladas compartidas`). Detector visual pendiente al completar todo el trabajo.
- [x] T2 — Smishing. Ruta: delegated direct; trigger: escritor para cambios coordinados en cuatro escenarios y pruebas. Eliminados Consumo de datos, `sri.gob.ec`, Mis direcciones, Transferir (menú normal y variante durante llamada) y Navegador del dock de TarjetaBloqueada. Acentos compartidos en apps reales y docks; rutas útiles conservadas. Checks: `pnpm test -- src/secciones/smishing/{BajaSuscripcion,BonoEstado,EntregaProgramada,TarjetaBloqueada}.test.tsx` terminó ejecutando la suite completa (879 pasaron, 4 omitidas, 0 fallos); `pnpm typecheck` OK; `pnpm lint` OK con advertencias preexistentes `only-export-components` y `exhaustive-deps`. Commit `a5d682c` (`feat(smishing): simplificar apps y docks`).
- [ ] T3 — Vishing, suplantación y estafa. Ruta: delegated direct; trigger: escritor para cambios en 19+ escenarios no triviales. Quitar Galería de cuatro docks de vishing y seis de suplantación; quitar Banco de DevolucionSri; conservar los docks que ya tienen tres. Aplicar turquesa a bancos y celeste a Red social; mantener los ocho docks de estafa en tres y alinear sus acentos. Adaptar pruebas que dependan de una app retirada. Checks: pruebas focalizadas de los escenarios tocados, `pnpm typecheck`, `pnpm lint`; commit Conventional Commit.

## Criterios de aceptación

- Cada dock afectado tiene tres apps y cada menú señalado pasa de cuatro a tres opciones.
- Permanecen las rutas útiles: `Paquetes y suscripciones`, `inclusion.gob.ec`, ver detalle/devolver envío, Mis tarjetas/Bloquear tarjeta, y las apps de comunicación requeridas por cada llamada.
- Colores coherentes entre dock y app abierta: banco turquesa, Mi Operadora rojiza, EnvíaExpress naranja y Red social celeste.
- Banco y galería de relleno se distinguen visualmente y mantienen legibilidad.
- `pnpm typecheck`, `pnpm lint`, `pnpm test` y `pnpm build` desde `frontend/` pasan; los fallos se registran explícitamente.

## Evidencia y progreso

- Mapeo previo de solo lectura: `AppRelleno.tsx` y `StoryEscenario.tsx` son compartidos. La mayoría de los docks ya tienen tres; las excepciones y menús de cuatro se detallan en T2/T3. `PremioSorteo.test.tsx` abre Galería y deberá actualizarse al quitarla.
- Rama: `feat/simulated-apps-ui`.
- Commits: `568b342` (T1), `a5d682c` (T2).
- Próximo paso: implementar T3; la suite completa y el build final quedan para el cierre general.
