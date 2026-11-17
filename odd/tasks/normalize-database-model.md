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
- Engram: espejo local en `odd/normalize-database-model/tasks` pendiente de sincronizar; `engram save` no pudo escribir su lock de instancia bajo `/home/luissagnay/.engram` por restricción de filesystem. Continúo con copia local como fuente de verdad temporal.
- RDD: `disabled/unmanaged`; `gentle-ai` no está instalado en el entorno. No iniciar revisión nativa.
- ODD: sustancial; ruta delegada por mapa de 4+ archivos y escritor delegado para tareas de varios archivos. T1 también cubre preparación. Evidencia: schemas, AuthService, AdminService, certificados, runs/assessments/SUS, JWT compartido y Docker ejecutan o consumen varias tablas/contratos.
- Entrega: `ask-on-risk`; previsión supera 400 líneas. Pedir estrategia de cadena antes del commit que supere el presupuesto. Sin push/PR/despliegue sin autorización.
- Engram mirror: `odd/normalize-database-model/tasks`.

## Tareas
- [ ] **NDB-1** Caracterizar contratos, datos y respaldo restaurable en entorno aislado; diagnóstico sin PII; resolver TDD.
- [ ] **NDB-2** Expandir schema identidad con tablas destino y migrador idempotente transaccional, conservando legado durante transición.
- [ ] **NDB-3** Adaptar identidad, cifrado, auth/JWT, seeds, administración, certificado y narración.
- [ ] **NDB-4** Expandir entrenamiento, migrar respuestas por versión y adaptar assessment/SUS; retirar excepción PRE solo tras inventario limpio.
- [ ] **NDB-5** Ensayar ambos servicios, contratos frontend, aislamiento, despliegue y recuperación antes de abrir escrituras.
- [ ] **NDB-6** Retirar legado en fase diferida, actualizar arquitectura/PUML y verificar migración desde respaldo y base vacía.

## Progreso y evidencia
- Rama creada. Plan detallado en `docs/superpowers/plans/2026-11-16-normalize-database-model.md`.
- NDB-1 en curso. RED: tres pruebas de `migratePiiField` fallaron inicialmente porque faltaba la función; GREEN: helper valida ciphertext `v1:` y lo preserva byte a byte, cifra texto legado y propaga errores. Suite `pii.spec.ts`: 17/17 pasan.
- Sin respaldo de base verificado, diagnóstico completo ni migraciones todavía.
- Ninguna tarea de implementación completada; commits pendientes.
- Siguiente paso: integrar `migratePiiField` en backfill con diagnóstico para filas mixtas y completar NDB-1 sin escribir al volumen activo.
