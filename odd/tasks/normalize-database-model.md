# Normalizar modelo de datos SAFE-Web

## Objetivo y autorización
Reestructurar el almacenamiento a doce tablas de negocio acordadas, preservando acceso, cifrado, sesiones, contratos, resultados y aislamiento entre identidad y entrenamiento. El usuario autorizó implementación y rama desde la rama actual. Rama: `plan/normalize-database-model`, origen `feat/certificados-admin-revocation` en `770bf7f8f4cf3e0ea5270e4de989d5859012215a`.

## Alcance y restricciones
Modelo destino descrito en `docs/superpowers/plans/2026-11-16-normalize-database-model.md`. Sin Credential, CertificateEvent, AssessmentBaselineExemption ni ScenarioRunDecision. Mantener ModuleReset. Credenciales/tokens viven en Account; revocación vigente en Certificate; perfil personal en AccountProfile; Role, StudyParticipant, CertificateModule, AssessmentAnswer y SusAnswer. `answers[]` y `modulos[]` se preservan en APIs mediante adaptación del backend. No FK entre bases ni cambios de secretos/algoritmos. No migrar ni borrar datos del volumen activo durante desarrollo.

## Criterios de aceptación
- Copia ensayada conserva bytes de PII cifrada, hashes, tokens, fechas, IDs, secuencias, certificados y respuestas.
- Cuentas existentes autentican y refrescan; nuevos registros completan entidades requeridas atómicamente.
- JWT/API, CSV, scoring, acceso por rol, reinicio, emisión y revocación mantienen contratos y semántica.
- Migración aborta ante duplicados, datos ambiguos, encuestas no mapeables o filas históricas de exención no resueltas; nunca inventa ni descarta datos.
- Servicios conservan bases/roles aislados y Compose arranca migraciones compatibles por fase.

## Configuración y ruta
- TDD: activado por instrucción del usuario «continua con todo» y skill obligatoria `superpowers:test-driven-development`; RED observado y GREEN en la prueba de migración PII. Runner backend Jest: `pnpm exec jest apps/identidad/src/pii/pii.spec.ts --runInBand`; e2e `pnpm test:e2e`; frontend Vitest `pnpm test`.
- Engram: espejo sincronizado con el documento completo bajo el proyecto `safe-web` después de las verificaciones de esta unidad.
- RDD: `disabled/unmanaged`; `gentle-ai` no está instalado en el entorno. No iniciar revisión nativa.
- ODD: sustancial; ruta delegada por mapa de 4+ archivos y escritor delegado para tareas de varios archivos. T1 también cubre preparación. Evidencia: schemas, AuthService, AdminService, certificados, runs/assessments/SUS, JWT compartido y Docker ejecutan o consumen varias tablas/contratos.
- Entrega: `single-pr`, según la instrucción del usuario de mantener toda la migración en la rama actual sin dividirla por número de líneas. Esto autoriza continuar en una rama y una entrega; no autoriza crear/publicar un PR, hacer push ni desplegar.
- Engram mirror: `odd/normalize-database-model/tasks`.

## Tareas
- [x] **NDB-1** Caracterizar datos reales y probar respaldo/restauración en entorno aislado. `pg_dump` de ambas bases Compose se restauró en tmpfs; el diagnóstico no reveló PII en salida. Cerrado en el commit `f626987`.
- [x] **NDB-2** Expandir identidad y añadir migrador idempotente transaccional. Pruebas sintéticas y copia idempotente; cerrado en `f626987`.
- [x] **NDB-3** Adaptar identidad, cifrado, auth/JWT, seeds, administración, certificado y narración. Suite backend, lint y build verdes; cerrado en `f626987`.
- [x] **NDB-4** Expandir entrenamiento, normalizar respuestas por versión y exigir PRE sin bypass histórico. `runs.service` elimina la excepción y respuestas se reconstruyen solo desde filas; cerrado en `f626987`.
- [ ] **NDB-5** Ensayar migraciones, contratos, aislamiento y recuperación antes de abrir escrituras. Ruta delegada para adaptación; las pruebas de integración y e2e pasan con PostgreSQL aislado, pero el ensayo de corte en Compose no está autorizado ni se ejecutó.
- [ ] **NDB-6** Completar migraciones físicas de retiro con precondiciones transaccionales y schemas Prisma finales; validar doce tablas desde base vacía y copia restaurada. Ruta delegada (disparadores: SQL, schemas, pruebas y documentación); migraciones finales creadas y abortos seguros comprobados en copia tmpfs, corte real pendiente de decisión/autorización.

## Progreso y evidencia
- Rama: `plan/normalize-database-model`, desde `feat/certificados-admin-revocation`. Commits: `0aa2bf3` preservación de PII cifrada; `0f69dab` expansión de respuestas relacionales; `95d398a` expansión de identidad; `ca04b70` persistencia relacional y PRE; `f626987` normalización y corte protegido. El usuario indicó que el tamaño no es límite y que toda la entrega puede mantenerse en esta rama; estrategia `single-pr`.
- TDD ON. RED/GREEN observados para PII mixta, Auth, Admin, narración, módulos de certificado, respuestas por pregunta, PRE, preservación de certificado huérfano y corte final. Una auditoría encontró que `runs.service` todavía aceptaba exenciones; se reprodujo RED, se corrigió y quedó incluido en `f626987`.
- Identidad: migrador valida roles, correo normalizado, cifra solo texto legado, preserva ciphertext válido, hashes, IDs, tokens, fechas y secuencia; copia módulos ordenados, incluidos certificados sin cuenta. La suite completa del backend terminó en 37 suites/297 pruebas; también pasaron `pnpm lint:ci`, `pnpm build`, `pnpm prisma:generate` y `prisma validate` de ambos schemas.
- Entrenamiento: Assessment/SUS guardan filas hijas atómicamente y reconstruyen `answers[]`; `ModuleReset` conserva reinicios. El migrador mapea IDs de pregunta por versión, valida longitudes/rangos, coteja filas y bloquea el corte ante exenciones o PRE histórico faltante. Pruebas específicas 32/32 y TypeScript de app pasan.
- Ensayo DB aislado desde cero: PostgreSQL 18 temporal en tmpfs; `prisma migrate deploy` aplicó 14 migraciones de identidad y 7 de entrenamiento. Backfill sintético: 1 cuenta, secuencia 7, dos certificados/3 módulos (incluido certificado huérfano), 21 respuestas Assessment y 10 SUS; idempotencia y `cutoverSafe=true`. Consultas comprobaron round-trip, orden y cifrado. Roles impidieron conexiones cruzadas.
- Ensayo de copia real: los `pg_dump` de lectura de ambas bases Compose se restauraron exclusivamente en PostgreSQL sobre tmpfs. Identidad encontró un grupo de tres correos normalizados duplicados y dos hashes inconsistentes; el migrador abortó por falta de paridad/reconciliación, sin alterar tablas ni filas. Entrenamiento detectó cinco exenciones históricas; el intento de corte abortó y se comprobó que tablas, filas y arreglos legacy permanecieron intactos. El origen Compose no recibió escrituras ni migraciones.
- Integración PostgreSQL: 6/6 pruebas pasaron, cubriendo paridad, corte con datos poblados y abortos seguros. Los casos de identidad y entrenamiento incompatibles se ejecutaron solo sobre la copia tmpfs; no se resolvieron ni descartaron cuentas o exenciones.
- E2E contra PostgreSQL aislado: 6 suites/110 pruebas pasaron usando pares de claves ES256 coincidentes. El primer intento falló porque identidad y entrenamiento recibieron claves efímeras distintas; se corrigió el fixture y el reintento pasó. En la suite unitaria, `pnpm test -- --runInBand` no encontró pruebas por el argumento extra; el comando correcto `pnpm test` pasó con 37 suites/297 pruebas.
- `pnpm lint:ci`, `pnpm build`, `pnpm prisma:generate` y `prisma validate` de identidad y entrenamiento pasaron. Scripts Prisma pasan `tsc --noEmit` estricto. Frontend: typecheck/build pasan; Vitest 127 archivos, 947 pasan y 4 omitidas; lint exit 0 con advertencias preexistentes.
- Se añadieron las migraciones finales de identidad y entrenamiento con timestamps `20261116210000` y `20261116211000`; los schemas Prisma describen seis tablas finales por servicio (doce en total), sin `Credential`, `CertificateEvent`, `AssessmentBaselineExemption` ni `ScenarioRunDecision`. Su lógica de precondiciones aborta de forma segura ante la copia actual; no se aplicaron al Compose.
- Ensayos runtime detectaron imports ESM que no resolvían (`pii.ts` y JSON del cuestionario); se corrigieron y los dos migradores ejecutaron diagnóstico, copia e idempotencia contra PostgreSQL temporal. El volumen Compose se consultó en solo lectura para transmitir `pg_dump` a tmpfs; no se escribió ni migró el origen.
- Arquitectura y `docs/ThesisDiagrams/06-data-model.puml` describen las doce tablas objetivo y explican que las estructuras legado siguen existiendo durante expansión. El PUML no se renderizó: PlantUML/JAR no están instalados.
- NDB-5/NDB-6 siguen abiertos: falta resolver con autorización el grupo duplicado de cuentas y la retención de cinco exenciones, y no hay autorización para ejecutar el corte en Compose. No inventar PRE, elegir/fusionar cuentas, descartar exenciones ni retirar columnas/tablas. NDB-1 a NDB-4 se cerraron con el commit `f626987` y la evidencia anterior.
- Engram mirror actualizado con el documento completo; la escritura y la búsqueda posterior confirmaron el registro.
- RDD: `disabled/unmanaged`; sin revisión nativa. No hubo push, PR, despliegue ni cambios a la base Compose.
- El usuario aceptó una sola rama/entrega; estrategia `single-pr`, sin dividir por presupuesto de líneas. Esto no autoriza publicar un PR.
- Ruling NDB-6: implementar y probar ahora el corte físico solo con guardas que exijan paridad de tablas, hashes únicos/cotejados, respuestas relacionales completas y cero exenciones/PRE faltantes. Las migraciones deben abortar de forma transaccional ante los datos actuales; no se interpretan como permiso para fusionar cuentas, borrar filas ni ejecutar el corte en Compose.
- Siguiente: resolver con el usuario la retención/reconciliación del grupo de 3 cuentas y las 5 exenciones. Hasta aclararlo, la migración física final no puede borrar/retirar los datos legacy sin riesgo. No activar ni migrar el volumen Compose.
