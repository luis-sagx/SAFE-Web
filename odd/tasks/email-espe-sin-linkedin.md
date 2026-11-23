# Correo institucional y retirada de LinkedIn

## Objetivo

Restringir las altas de cuentas al dominio exacto `espe.edu.ec` y retirar la acción de LinkedIn de la insignia de certificado.

## Problema y motivo

El backend acepta muchos proveedores y dominios `.ec`; el formulario solo revisa el formato y deja descubrir el dominio permitido al enviar. La insignia también ofrece agregar el certificado a LinkedIn, una opción que se quiere quitar.

## Alcance y restricciones

- Rechazar cualquier dominio distinto de `espe.edu.ec` en los DTO que comparten el validador (`RegisterDto` y `CreateTrainerDto`), y reflejar la regla en el formulario de registro.
- Retirar el botón visible, el helper de URL y sus referencias de prueba/comentarios que describen esa función.
- Mantener otros canales de descarga/compartición de la insignia y referencias ajenas a la función (plantilla externa de NestJS e historial de incidencias).
- No cambiar contratos existentes ni dependencias.

## Configuración de desarrollo

- TDD: desactivado según el registro frontend del proyecto en `odd/tasks/certificados-admin-revocation.md`; runner identificado: Vitest (`pnpm test` en `frontend/`) y Jest (`pnpm test` en `backend/`).
- Esta sesión no añadirá ni ejecutará pruebas automatizadas. Verificaciones funcionales disponibles: `pnpm typecheck`, `pnpm lint`, `pnpm build` desde `frontend/`; `pnpm lint:ci` y `pnpm build` desde `backend/`; `git diff --check`.
- RDD: `disabled/unmanaged` (modo opt-in apagado por defecto; no iniciar revisiones).
- Estrategia de entrega: `ask-on-risk`; previsión aproximada menor a 400 líneas modificadas.

## Tareas

- [x] **T1 — Restringir el correo de todas las altas a `espe.edu.ec`.** El validador compartido acepta solo el dominio exacto y el formulario muestra el error junto al campo y bloquea el envío. Ruta: delegada directa; el disparador escritor aplica porque la validación coherente toca al menos dos archivos no triviales. Commit de trabajo: `d78395e` (`fix(auth): exigir correo institucional ESPE`).
- [ ] **T2 — Retirar la acción de LinkedIn de la insignia.** Quitar el enlace y el helper y actualizar las pruebas existentes para reflejar que solo queda la descarga. Ruta: delegada directa; el disparador escritor aplica por cambios coordinados en varios archivos.

## Criterios de aceptación

- Una dirección terminada en `@espe.edu.ec` se acepta; Gmail, otros dominios `.ec`, subdominios y dominios parecidos se rechazan tanto en registro como en creación de Tester.
- El formulario de registro indica que se requiere `@espe.edu.ec` y no envía una dirección de otro dominio.
- La insignia conserva su descarga y no muestra una acción de LinkedIn; no quedan imports ni referencias activas al helper eliminado.

## Progreso y evidencia

- Exploración: `IsAllowedDomain` es el validador compartido por `RegisterDto` y `CreateTrainerDto`; el formulario vive en `frontend/src/pages/Registro.tsx`. La acción visible está en `frontend/src/components/ModalInsignia.tsx`, con helper en `frontend/src/lib/linkedin.ts`.
- Exploración delegada: confirmó las referencias de prueba y distinguió menciones no funcionales que quedan fuera del alcance.
- T1: `pnpm typecheck` y `pnpm lint` (frontend) pasaron; lint dejó advertencias preexistentes en archivos ajenos. `git diff --check` pasó. `pnpm lint:ci` (backend) quedó sin verificar: pnpm intentó instalar dependencias ausentes y el acceso al registro produjo errores de red; se interrumpió la instalación. No se añadieron ni ejecutaron pruebas automatizadas según la instrucción de desarrollo.
- Espejo Engram pendiente: el almacén local está fuera del área escribible y la solicitud de acceso ampliado fue cancelada; preservar este documento local.

## Siguiente paso

Implementar T2, observar las verificaciones disponibles y actualizar esta lista. Sincronizar el espejo de Engram cuando el almacén esté disponible.
