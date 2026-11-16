# Revocación de certificados desde participantes — tareas ODD

Objetivo: permitir que un supervisor vea el estado del certificado de cada participante y revoque certificados vigentes desde la lista existente de participantes.

Problema y motivo: el backend ya ofrece `PATCH /admin/certificados/:id/revocar`, pero el panel no lista certificados ni proporciona una acción para revocarlos. Integrarlo en la fila del titular facilita localizar la cuenta correcta.

Alcance autorizado: lista administrativa de participantes y certificados, contrato de lectura necesario en identidad, e integración del botón de revocación existente. No añadir motivo ni autor de revocación, rehabilitación, cambios en emisión/verificación/PDF, ni datos del estudio.

Restricciones: interfaz y comentarios en español; identificadores nuevos en inglés; TypeScript strict; no exponer seudónimo ni resultados junto al nombre/correo; preservar `fetch` únicamente en `frontend/src/lib/api.ts`; usar `ConfirmDialog` y tokens de `docs/DESIGN.md`; no añadir dependencias.

TDD: desactivado según la configuración frontend registrada en `odd/tasks/simulated-apps-ui.md`; runner identificado `pnpm test` (Vitest), sin ejecutarlo ni añadir pruebas por la instrucción de desarrollo de esta sesión. Checks funcionales previstos: frontend `pnpm typecheck`, `pnpm lint`, `pnpm build`; backend identidad `pnpm lint:ci`, `pnpm build`.

RDD: `disabled/unmanaged`; `gentle-ai` no está instalado.

Ruta: delegated direct. Trigger: la integración requiere coordinar el contrato backend, cliente API y panel (más de dos archivos no triviales); la preparación de lectura acompaña al escritor. El mapeo read-only previo encontró la ruta de revocación existente y confirmó que aún no hay ruta administrativa de lectura.

Pronóstico: ~250 líneas editadas. Estrategia de entrega: `ask-on-risk` (predeterminada). No push ni PR.

## Tareas

- [x] **T1 — Mostrar y revocar certificados en la lista de participantes.** La consulta administrativa de participantes ahora incluye ID, fecha de emisión y revocación del certificado, sin seudónimo ni resultados. La tabla muestra `Sin certificado`, `Vigente` con fecha de emisión y `Revocado`; el botón de vigentes confirma y usa `PATCH /admin/certificados/:id/revocar`, y actualiza la fila al completarse. Checks: frontend `pnpm typecheck`, `pnpm lint` y `pnpm build` OK; backend identidad `pnpm lint:ci` y `pnpm build` OK; `git diff --check` OK. No se añadieron ni ejecutaron pruebas por la instrucción de desarrollo de esta sesión. Ruta delegated direct; sin RDD (`disabled/unmanaged`).

## Criterios de aceptación

- Cada participante muestra si no tiene certificado, si está vigente o si fue revocado.
- Los certificados vigentes muestran su fecha de emisión.
- Para un certificado vigente se puede iniciar la revocación desde su fila; el panel confirma la acción y actualiza el estado tras el éxito.
- Certificados revocados no ofrecen una segunda acción de revocación.
- La consulta y las mutaciones siguen protegidas para supervisor; la respuesta no incluye seudónimo ni resultados.
- `typecheck`, `lint` y `build` de los proyectos modificados pasan o quedan reportados con evidencia.

## Evidencia y progreso

- Rama: `feat/certificados-admin-revocation` (creada desde `main`).
- Mapeo previo: `frontend/src/pages/Admin.tsx` gestiona participantes y usa `ConfirmDialog`; `frontend/src/lib/api.ts` centraliza las llamadas; `PATCH /admin/certificados/:id/revocar` ya existe y exige rol administrativo. No había ruta para incluir el estado del certificado.
- Aprobación del diseño: usuario eligió integrar la acción en la lista de participantes el 2026-11-16.
- Commit de unidad: pendiente.
- Espejo Engram: pendiente; `engram save` no pudo abrir `/home/luissagnay/.engram/.instance-id.lock` porque el sistema de archivos está en solo lectura.
- Checks observados: frontend typecheck exit 0; frontend lint exit 0 con avisos preexistentes en escenarios/componentes ajenos al diff; frontend build exit 0. Backend lint: primer intento reportó solo formato Prettier en `admin.service.ts`; tras corregirlo, `pnpm --dir backend lint:ci` exit 0. Backend build exit 0; Corepack mostró un aviso de intento fallido de consultar el registro npm antes de continuar con la versión local. `git diff --check` exit 0. Pruebas no ejecutadas.

## Próximo paso

Crear el commit de unidad y añadir su identidad a esta evidencia; sincronizar Engram si vuelve a estar disponible.
