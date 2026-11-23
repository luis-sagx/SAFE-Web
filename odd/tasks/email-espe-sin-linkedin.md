# Correo institucional y retirada de LinkedIn

## Objetivo

Restringir las altas de cuentas al dominio exacto `espe.edu.ec` y dejar solo la descarga del certificado en el cierre del estudio.

## Problema y motivo

El backend acepta muchos proveedores y dominios `.ec`; el formulario solo revisa el formato y deja descubrir el dominio permitido al enviar. El cierre del estudio ofrecía además abrir y descargar una insignia, una acción que ya no se requiere.

## Alcance y restricciones

- Rechazar cualquier dominio distinto de `espe.edu.ec` en los DTO que comparten el validador (`RegisterDto` y `CreateTrainerDto`), y reflejar la regla en el formulario de registro.
- Retirar la opción de agregar el certificado a LinkedIn y el botón `Ver insignia` del cierre del estudio.
- Mantener solo `Descargar certificado` en la pantalla final. Conservar la vista de desarrollo de la insignia y referencias ajenas a las acciones retiradas.
- No cambiar contratos existentes ni dependencias.

## Configuración de desarrollo

- TDD: desactivado según el registro frontend del proyecto en `odd/tasks/certificados-admin-revocation.md`; runner identificado: Vitest (`pnpm test` en `frontend/`) y Jest (`pnpm test` en `backend/`).
- T1–T3 no añadieron ni ejecutaron pruebas automatizadas. T4 actualiza pruebas existentes por el fallo de pipeline reportado; ejecutar los runners focalizados backend `pnpm test -- apps/identidad/src/auth/dto/register.dto.spec.ts` y `pnpm test:e2e -- --runTestsByPath test/auth.e2e-spec.ts` si el entorno local permite usar Postgres.
- RDD: `disabled/unmanaged` (modo opt-in apagado por defecto; no iniciar revisiones).
- Estrategia de entrega: `ask-on-risk`; previsión aproximada menor a 400 líneas modificadas.

## Tareas

- [x] **T1 — Restringir el correo de todas las altas a `espe.edu.ec`.** El validador compartido acepta solo el dominio exacto y el formulario muestra el error junto al campo y bloquea el envío. Ruta: delegada directa; el disparador escritor aplica porque la validación coherente toca al menos dos archivos no triviales. Commit de trabajo: `d78395e` (`fix(auth): exigir correo institucional ESPE`).
- [x] **T2 — Retirar la acción de LinkedIn de la insignia.** Quitados el enlace y el helper; se retiró la prueba obsoleta del enlace y se conservaron las pruebas restantes de la descarga. Ruta: delegada directa; el disparador escritor aplica por cambios coordinados en varios archivos. Commit de trabajo: `6f7e7a8` (`refactor(certificates): quitar acción de LinkedIn`).
- [x] **T3 — Dejar solo la descarga del certificado en la pantalla final.** Quitados `Ver insignia`, la conexión con el modal y las expectativas obsoletas en las pruebas existentes; se conserva `Descargar certificado`. Ruta: delegada directa porque el disparador escritor aplica al modificar el componente y dos archivos de pruebas. Commit de trabajo: `b5fd08e` (`fix(certificates): dejar solo descarga en cierre`).
- [x] **T4 — Alinear los fixtures de prueba con el dominio institucional.** Actualizados el correo base y las expectativas del spec DTO, los fixtures E2E, y las aserciones de privacidad y administración que dependían del dominio anterior; se conservaron direcciones de casos inexistentes. Ruta: delegada directa por el disparador escritor; el mapeo encontró cinco archivos de prueba relacionados. Commit de trabajo: `63173a6` (`test(auth): alinear fixtures con dominio ESPE`).
- [x] **T5 — Alinear el fixture del registro frontend con el dominio institucional.** Correo de entrada, respuesta simulada y expectativa de navegación ahora usan `ana@espe.edu.ec`. Ruta: directa inline; un fixture mecánico en un solo archivo. Commit de trabajo: `f34b619` (`test(auth): alinear fixture de registro frontend`).
- [x] **T6 — Alinear el smoke test Docker con el dominio institucional.** El workflow registra e inicia sesión con `ci@espe.edu.ec`. Ruta: directa inline; dos literales del mismo flujo en un solo workflow. Commit de trabajo: `26dbbf8` (`fix(ci): usar correo ESPE en smoke test Docker`). Checks estáticos pasaron; Docker no se ejecutó localmente porque el job descarga imágenes y manipula contenedores/volúmenes.
- [x] **T7 — Alinear los fixtures de las pruebas k6 con el dominio institucional.** `nominal.js`, `aula.js` y `seed_accounts.py` usan ahora cuentas `@espe.edu.ec`. Ruta: delegada directa; actualización coordinada de tres fixtures. Commit de trabajo: `e38cd1f` (`test(load): usar correos institucionales ESPE`).
- [ ] **T8 — Identificar por qué falla el Quality Gate de Sonar.** El scanner sube el análisis y recibe `QUALITY GATE STATUS: FAILED`, pero el log no incluye las condiciones incumplidas. Continuar cuando el usuario facilite el detalle del gate o autorice lectura remota de ese análisis.

## Criterios de aceptación

- Una dirección terminada en `@espe.edu.ec` se acepta; Gmail, otros dominios `.ec`, subdominios y dominios parecidos se rechazan tanto en registro como en creación de Tester.
- El formulario de registro indica que se requiere `@espe.edu.ec` y no envía una dirección de otro dominio.
- La pantalla final muestra `Descargar certificado` y no muestra `Ver insignia`.

## Progreso y evidencia

- Exploración: `IsAllowedDomain` es el validador compartido por `RegisterDto` y `CreateTrainerDto`; el formulario vive en `frontend/src/pages/Registro.tsx`. La acción visible está en `frontend/src/components/ModalInsignia.tsx`, con helper en `frontend/src/lib/linkedin.ts`.
- Exploración delegada: confirmó las referencias de prueba y distinguió menciones no funcionales que quedan fuera del alcance.
- T1: `pnpm typecheck` y `pnpm lint` (frontend) pasaron; lint dejó advertencias preexistentes en archivos ajenos. `git diff --check` pasó. `pnpm lint:ci` (backend) quedó sin verificar: pnpm intentó instalar dependencias ausentes y el acceso al registro produjo errores de red; se interrumpió la instalación. No se añadieron ni ejecutaron pruebas automatizadas según la instrucción de desarrollo.
- T2: `pnpm typecheck`, `pnpm lint` y `pnpm build` (frontend) pasaron; lint conserva advertencias preexistentes en archivos ajenos. `git diff --check` pasó. `rg` ya no encuentra referencias funcionales a LinkedIn en `frontend/src`; queda únicamente el comentario histórico `issue #279-linkedin`. No se añadieron ni ejecutaron pruebas automatizadas según la instrucción de desarrollo.
- T3: `pnpm typecheck`, `pnpm lint` y `pnpm build` (frontend) pasaron; lint conserva advertencias preexistentes en archivos ajenos. `git diff --check` pasó y `rg` ya no encuentra `Ver insignia` en `frontend/src`. Se retiraron las expectativas obsoletas sin añadir ni ejecutar pruebas automatizadas.
- T4 causa y cambios: el correo base de `register.dto.spec.ts` era `ana@gmail.com`, sumando error `email` a casos de otras propiedades. `registrationData()` usaba `@ejemplo.ec`, lo que invalidaba altas E2E. Actualizados también el correo del supervisor en admin y el dominio que la prueba de privacidad de runs excluye. Se conservaron las direcciones `.ec` de casos inexistentes.
- T4 verificación: `./node_modules/.bin/jest --runInBand apps/identidad/src/auth/dto/register.dto.spec.ts` pasó (25/25). `./node_modules/.bin/jest --coverage` pasó (37 suites, 301 pruebas). La suite `auth.e2e-spec.ts` no alcanzó sus casos: su `beforeAll` falla en `cleanDatabase` porque el PrismaClient local requiere un driver adapter. El detalle de CI del fallo E2E no venía en el fragmento, así que esa causa no se confirma. El primer `pnpm test` disparó una instalación automática y se interrumpió; no se usó para correr pruebas. `git diff --check` pasó.
- T5 diagnóstico y verificación: antes del cambio, `./node_modules/.bin/vitest run --coverage --maxWorkers=1 --reporter=dot` reprodujo 2 fallos en `src/pages/Registro.test.tsx`; las dos rutas del formulario no llegaban a `register` porque `ana@correo.com` no satisface el dominio exacto. Después, `./node_modules/.bin/vitest run src/pages/Registro.test.tsx --reporter=dot` pasó (2/2) y la suite completa `./node_modules/.bin/vitest run --coverage --maxWorkers=1 --reporter=dot` terminó con exit code 0: 92.22% statements, 86.34% branches, 85.38% functions y 94.06% lines. `git diff --check` pasó.
- T6 diagnóstico: `.github/workflows/ci.yml` tenía el correo `ci@ejemplo.ec` tanto en el POST de registro como en el POST de login del smoke test Docker; con T1, el primero fallaría por dominio no permitido. Actualizado a `ci@espe.edu.ec` en `26dbbf8`.
- T6 verificación: `git diff --check` pasó y PyYAML pudo parsear `.github/workflows/ci.yml`. El log de CI ya muestra que la prueba de registro anterior permite llegar a k6; k6 falla después por el fixture nominal viejo, ahora corregido en T7. Falta reejecutar el job.
- T7 diagnóstico: el log de Docker llega al paso k6; `setup()` falla su única comprobación de login y cada POST de corrida también falla. `tests/carga/nominal.js` usa `ci@ejemplo.ec`, mientras el paso anterior ya registra `ci@espe.edu.ec`; las cuentas extendidas se generan y autentican con `@ejemplo.ec` en `tests/carga/aula.js` y `tests/carga/seed_accounts.py`.
- T7 verificación: `node --check` pasó en `nominal.js` y `aula.js`; Python compiló `seed_accounts.py`; `rg` confirmó que no quedan `@ejemplo.ec` en `tests/carga` ni `.github/workflows`; `git diff --check` pasó. k6 no está instalado localmente, así que el runtime queda pendiente de CI.
- Sonar diagnóstico: el scanner 8.3.0 completó el análisis, subió el reporte y recibió `QUALITY GATE STATUS: FAILED` para PR 344. Los warnings de codificación de assets y rutas LCOV no identifican qué condición del gate falló. Se necesita el desglose de condiciones de Sonar para decidir la corrección.
- Backend `pnpm build` pendiente por las dependencias ausentes tras el fallo de instalación del lint. `pnpm --offline build` no inició porque esta versión de pnpm rechaza `--offline` como opción para `run`.
- Espejo Engram pendiente: el almacén local está fuera del área escribible y la solicitud de acceso ampliado fue cancelada; preservar este documento local.

## Siguiente paso

T1–T7 implementadas localmente. Reejecutar CI y obtener el desglose del Quality Gate para T8; sincronizar el espejo Engram cuando el almacén esté disponible.
