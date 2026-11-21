# Corregir auditoría de Prisma y fixture E2E de evaluaciones

## Objetivo, problema y autorización

Corregir los dos bloqueos del pipeline de la PR actual, manteniendo el comportamiento de SAFE-Web.

- La auditoría de producción falla porque Prisma 7.10.0 resuelve `effect@3.20.0`, afectado por GHSA-7589-6fvf-x4pw; la versión corregida comienza en 3.22.1.
- `backend/test/assessments.e2e-spec.ts` aún usa la clave de respuestas anterior al commit 6292534 y espera puntajes que ya no corresponden al cuestionario actual.

El usuario autorizó con «arregla» aplicar las correcciones localmente. Los commits de trabajo locales forman parte del flujo ODD. No hay autorización para publicar ni operar remotamente.

## Alcance y restricciones

- Backend únicamente: `backend/package.json`, `backend/pnpm-lock.yaml` y `backend/test/assessments.e2e-spec.ts`.
- Forzar la dependencia transitiva a una versión corregida compatible, sin actualizar dependencias directas por conveniencia.
- Alinear la fixture E2E con la clave de respuestas actual para que siga verificando una evaluación con 21 respuestas correctas y una mejora de -21 cuando el POST es todo incorrecto.
- No modificar prompts, opciones, clave del cuestionario, versión de la evaluación, API ni otros escenarios de prueba.
- Permanecer en la rama actual `questions-test`; no hacer push ni crear/editar la PR.

## TDD y verificaciones

- TDD: activado por la skill de sesión `test-driven-development`.
- Runner de regresión: Jest E2E, `pnpm test:e2e` desde `backend/`. RED observado en el log de CI aportado por el usuario.
- Runner de auditoría: `pnpm audit --prod --audit-level high` desde `backend/`. RED observado en el log de CI y confirmado por `backend/pnpm-lock.yaml` (`effect@3.20.0`).
- Checks finales aplicables: `pnpm install --frozen-lockfile`, `pnpm audit --prod --audit-level high`, `pnpm test:e2e`; además `pnpm lint:ci`, `pnpm test` y `pnpm build` desde `backend/`.
- RDD: `disabled/unmanaged`; no se pudo consultar `gentle-ai review mode status` porque `gentle-ai` no está instalado. No iniciar RDD ni una revisión nativa.
- Espejo Engram: pendiente. `engram save` falló porque el sandbox no puede escribir el lock de instancia en `/home/luissagnay/.engram`; se conserva el documento local y no se solicitará acceso externo para sincronizarlo.
- La regeneración del lockfile puede requerir acceso a `registry.npmjs.org`; se solicitó autorización al usuario. T1 queda en espera hasta recibirla. T2 no depende de esa autorización y continúa.
- Previsión inicial: menos de 100 líneas autoradas. Estrategia: `ask-on-risk`.

## Tareas

- [ ] **T1 — Parchear la dependencia transitiva vulnerable de Prisma.** Resolver `effect` en versión >=3.22.1, regenerar el lockfile del backend y verificar auditoría e instalación congelada. Ruta: delegada directa por el disparador escritor (manifiesto y lockfile no triviales); preparación delegada con el escritor. TDD habilitado por `test-driven-development`; RED: audit CI/local reportado por el usuario. Commit independiente requerido.
- [ ] **T2 — Actualizar la fixture obsoleta de evaluación E2E.** Usar respuestas correctas de la clave vigente y conservar las expectativas de 21/21 y mejora -21. Ruta: delegada directa por preparación de escritura. TDD habilitado; RED: `pnpm test:e2e` reportado por el usuario con `16` y `-16`. Commit de trabajo `113abb8` (`test(assessments): alinear fixture con respuestas vigentes`). Pendiente observar GREEN automatizado por fallo de configuración local del cliente Prisma.

## Evidencia y siguiente paso

- La dependencia actual está fijada en `backend/pnpm-lock.yaml`: `@prisma/config@7.10.0` declara `effect@3.20.0`.
- El test E2E usa el array anterior; al compararlo con `answerKey` vigente obtiene 16, lo que explica ambos asserts fallidos. El warning de `pg` no produjo el código de salida.
- T2: el escritor actualizó solo el fixture base de `backend/test/assessments.e2e-spec.ts`; ahora coincide con las 21 entradas de `answerKey`, y se conservan las expectativas 21 y -21. El E2E local se intentó, pero las pruebas fallaron en la preparación de base antes de los asserts: el cliente Prisma generado local exige un adaptador de driver. La salida de CI aportada sí ejecutó los asserts y confirmó el RED anterior. La verificación GREEN automatizada queda pendiente; no se cambia el cuestionario ni la versión.
- Se revisó `backend/test/entrenamiento.e2e.ts`: los E2E dependen de `PrismaService` y una base accesible. El fallo local ocurre en `cleanDatabase`, fuera de la lógica de evaluación.
- Engram sigue pendiente por el error de acceso a `/home/luissagnay/.engram` dentro del sandbox.
- Siguiente paso: cerrar T2 con commit local dejando explícita la verificación automatizada pendiente; reanudar T1 solo cuando llegue la autorización del registro. Tras cada tarea, actualizar esta lista y sincronizar su espejo si el entorno lo permite.
