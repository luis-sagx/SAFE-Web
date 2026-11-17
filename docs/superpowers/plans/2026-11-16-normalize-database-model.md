# Plan de implementación: normalizar el modelo de datos de SAFE-Web

**Estado:** implementación de código y diagnóstico de datos completados en `plan/normalize-database-model`; la migración física sigue bloqueada por registros reales que requieren decisión. La base Compose no fue modificada.
**Objetivo:** pasar a doce tablas de negocio preservando acceso a cuentas, cifrado, resultados, certificados y contratos públicos.
**Arquitectura:** dos bases PostgreSQL y dos roles de servicio independientes. El backend adapta el almacenamiento nuevo a los DTO actuales. Migración por expansión, copia, cambio de aplicación y retirada diferida del almacenamiento antiguo.
**Tecnologías:** PostgreSQL 18, Prisma 7, NestJS, React, TypeScript y pnpm del repositorio.
**Especificación:** este documento incorpora el modelo y las decisiones aceptadas en la conversación; no requiere un documento de diseño separado.
**Origen:** `feat/certificados-admin-revocation`, commit `770bf7f8f4cf3e0ea5270e4de989d5859012215a`.
**Rama del plan:** `plan/normalize-database-model`.

## Alcance autorizado y forma de ejecución

El usuario autorizó la implementación local y la creó sobre una rama desde el punto acordado. No se autorizó tocar el volumen activo de Compose, desplegar, transferir archivos a servidores ni publicar. Esas operaciones no forman parte de la evidencia actual.

La ejecución sigue ODD y se registra en `odd/tasks/normalize-database-model.md`; ese es el seguimiento vivo. TDD está ON por la solicitud explícita del usuario; se observaron RED/GREEN. Runners: backend Jest, e2e con Supertest y frontend Vitest. RDD permanece `disabled/unmanaged`; no se inició revisión nativa.

Topología aplicada: exploración delegada y escritores acotados para las tareas multiarquivo. El usuario aceptó mantener todo en una sola rama y entrega; estrategia `single-pr`, sin dividirla por presupuesto de líneas. Esto no autoriza crear/publicar PR, hacer push ni desplegar. Los commits Conventional Commit siguen siendo evidencia de cierre por unidad de trabajo; las tareas sin ese cierre permanecen abiertas.

## 1. Decisiones y límites

- Exactamente seis tablas de identidad y seis de entrenamiento; `_prisma_migrations` es infraestructura y no cuenta.
- Credenciales y tokens en `Account`. Sin `Credential`, `CertificateEvent`, `AssessmentBaselineExemption` ni `ScenarioRunDecision` en el modelo final.
- `ModuleReset` ya existe y conserva cada reinicio. No sustituirlo por un estado único.
- Introducir `AssessmentAnswer`, `SusAnswer`, `CertificateModule`, `Role`, `AccountProfile`, `StudyParticipant` y `Account`.
- `ScenarioRun.decisions` continúa JSONB; catálogo y cuestionarios permanecen en código. No añadir un CMS ni permisos configurables.
- Conservar nombres existentes de campos de contrato, rutas, cookies, claves locales, valores de roles, IDs de escenarios y versiones. Identificadores nuevos en inglés; interfaz, errores y pruebas en español.
- Mantener UUID como valores en columnas TEXT en esta migración. Convertir a UUID SQL sería otro cambio independiente.
- Retener `participantId` en certificados y resultados como identificador estable de la cuenta original. No introducir otro ID de persona en JWT o análisis.
- Separar `AccountProfile` es una decisión de responsabilidad; por sí sola no demuestra una forma normal superior ni limita al rol que accede a ambas tablas.

## 2. Diccionario completo del modelo destino

Convenciones: `?` admite NULL; campos sin `?` son NOT NULL salvo la semántica física existente de arreglos durante transición. IDs nuevos TEXT con UUID generado por Prisma. Fechas TIMESTAMP(3), manteniendo la representación actual y UTC en aplicación. No cambiar precisión ni zona implícitamente. PK = clave primaria, UQ = único, FK = referencia dentro de la misma base.

### Identidad: seis tablas

| Tabla | Atributos y restricciones |
|---|---|
| `Account` | `id TEXT PK` (ID original); `roleId TEXT FK Role.id`; `passwordHash TEXT`; `passwordResetTokenHash TEXT? UQ`; `passwordResetExpiresAt TIMESTAMP?`; `emailConfirmedAt TIMESTAMP?`; `emailConfirmationTokenHash TEXT? UQ`; `emailConfirmationExpiresAt TIMESTAMP?`; `tokenVersion INT DEFAULT 0`; `onboardingVistoAt TIMESTAMP?`; `disabledAt TIMESTAMP?`; `createdAt TIMESTAMP DEFAULT now()` |
| `AccountProfile` | `accountId TEXT PK FK Account.id ON DELETE CASCADE`; `nombre VARCHAR(255)`; `apellido VARCHAR(255)`; `email TEXT`; `emailHash TEXT? UQ`; `cedulaHash TEXT? UQ` |
| `Role` | `id TEXT PK`; `code TEXT UQ` con CHECK limitado a `PARTICIPANT`, `ADMIN`, `TRAINER`. Sembrar esos tres valores con identificadores deterministas. Sin permisos dinámicos, jerarquías ni asignación múltiple. |
| `StudyParticipant` | `accountId TEXT PK FK Account.id ON DELETE CASCADE`; `seq INT UQ`, secuencia automática, CHECK `seq > 0`. Solo cuentas PARTICIPANT; relación creada en la misma transacción de registro. No exponer esta tabla junto al perfil. |
| `Certificate` | `id TEXT PK`; `participantId TEXT UQ` (conservar sin FK para permitir el borrado actual de cuenta sin destruir/revocar certificado); `codigo TEXT UQ`; `horas INT DEFAULT 4`; `calificacion INT DEFAULT 0`; `emitidoAt TIMESTAMP DEFAULT now()`; `revocadoAt TIMESTAMP?`; `certificadoEnviadoAt TIMESTAMP?` |
| `CertificateModule` | `certificateId TEXT FK Certificate.id ON DELETE CASCADE`; `module TEXT`; `position INT CHECK >= 0`; PK (`certificateId`, `module`); UQ (`certificateId`, `position`). Mantener el orden de `modulos` al reconstruir el contrato. |

No añadir motivo ni actor de revocación automáticamente: el alcance solicitado conserva sus datos actuales en Certificate. Si se aceptan después, serían columnas allí, con DTO y política de retención explícitos. Mantener los endpoints administrativos de revocación ya presentes en la rama de origen.

### Entrenamiento: seis tablas

| Tabla | Atributos y restricciones |
|---|---|
| `ScenarioRun` | `id TEXT PK`; `participantId TEXT`; `participantSeq INT`; `scenarioId TEXT`; `version INT DEFAULT 1`; `outcome RunOutcome` (`CORRECTO`, `PARCIAL`, `INCORRECTO`); `score INT`; `endingId TEXT`; `durationMs INT`; `decisions JSONB DEFAULT '[]'`; `startedAt TIMESTAMP`; `finishedAt TIMESTAMP DEFAULT now()`. Conservar índices (`participantId`, `scenarioId`, `finishedAt DESC`) y (`scenarioId`). |
| `ModuleReset` | `id TEXT PK`; `participantId TEXT`; `module TEXT`; `createdAt TIMESTAMP DEFAULT now()`. Índice (`participantId`, `module`, `createdAt DESC`). |
| `Assessment` | `id TEXT PK`; `participantId TEXT`; `participantSeq INT`; `version INT`; `phase AssessmentPhase` (`PRE`, `POST`); `ageRange TEXT`; `gender TEXT`; `score INT`; `consentVersion TEXT?`; `consentAccepted BOOLEAN?`; `submittedAt TIMESTAMP DEFAULT now()`; UQ (`participantId`, `version`, `phase`). Retirar `answers` solo en la fase final. |
| `AssessmentAnswer` | `assessmentId TEXT FK Assessment.id ON DELETE CASCADE`; `questionId INT`; `answer INT`; PK (`assessmentId`, `questionId`). `questionId` es el ID real de la pregunta de esa versión, no un índice accidental del arreglo. |
| `SusResponse` | `id TEXT PK`; `participantId TEXT`; `participantSeq INT`; `version INT`; `score DOUBLE PRECISION`; `submittedAt TIMESTAMP DEFAULT now()`; UQ (`participantId`, `version`); índice (`version`, `participantSeq`). Retirar `answers` solo en la fase final. |
| `SusAnswer` | `susResponseId TEXT FK SusResponse.id ON DELETE CASCADE`; `questionId INT`; `answer INT`; PK (`susResponseId`, `questionId`). |

No hay FK desde entrenamiento a identidad. No crear tablas de participantes con nombres/correos dentro de entrenamiento. Rangos demográficos siguen siendo lo declarado en cada entrega, no un perfil mutable que altere retrospectivamente el estudio. Puntajes son instantáneas emitidas por la versión de su algoritmo; conservar los ya guardados y cotejar, no recalcular silenciosamente durante migración.

La aplicación valida que las respuestas sean completas y pertenezcan al cuestionario de la versión: una PK evita duplicados pero no prueba que estén todas. Para versiones sin definición disponible o arreglos mal formados, el diagnóstico debe detener esa conversión, no inventar preguntas ni respuestas. Identificadores de escenarios/módulos siguen siendo contratos de código, sin FK a un catálogo inexistente.

## 3. Cifrado, correo y acceso a cuentas

Referencia: `backend/apps/identidad/src/pii/pii.ts`, `email-hash-reconciliation.ts`, `backend/prisma/backfill-pii.mts`, `reconcile-email-hashes.mts` y `auth/auth.service.ts`.

1. Copiar `nombre`, `apellido`, `email` byte por byte a `AccountProfile`. AES-256-GCM usa prefijo `v1:` y Base64 de IV de 12 bytes, tag de 16 bytes y ciphertext. No cifrar el ciphertext de nuevo ni descifrar para una copia SQL.
2. Preservar `PII_ENCRYPTION_KEY` (32 bytes Base64), `EMAIL_PEPPER` y `CEDULA_PEPPER`, además de las claves JWT. Respaldo de secretos por el mecanismo existente, nunca en git, logs o plan. Cambiar peppers rompe búsqueda/deduplicación; cambiar clave PII impide descifrar los datos.
3. `hashEmail` no normaliza por sí mismo. Mantener normalización de los DTO y ejecutar el diagnóstico de reconciliación existente, leyendo sus opciones reales antes de invocarlo. Coincidencia de correos tras normalizar o hashes incorrectos detiene la preparación; no escoger cuenta ganadora ni fusionar automáticamente.
4. Mantener de inicio `emailHash` nullable y compatibilidad de login para filas históricas en claro. Adaptar búsqueda por huella y fallback al perfil nuevo, sin ampliar qué datos se exponen. Endurecer NOT NULL/eliminar fallback solo en una tarea futura tras un backfill verificado.
5. Copiar sin alteración `passwordHash`, hashes de tokens, fechas de vencimiento, `emailConfirmedAt`, `disabledAt` y `tokenVersion`. No hacer bcrypt del hash ni resetear contraseñas. Una contraseña antigua debe autenticar tras la migración.
6. Registrar cuenta, perfil y participante de estudio en una transacción de identidad. Conflictos de email/cédula deben devolver los mismos errores públicos y no dejar cuentas incompletas.
7. No cambiar cifrado ni algoritmos a la vez que la normalización. Probar una clave inválida con datos sintéticos: error controlado sin filtrar PII, no conversión silenciosa a texto plano.
8. Corregir la suposición del backfill actual: `emailHash === null` no demuestra que todos los campos estén en claro. Detectar prefijo de cada campo, validar ciphertext existente y cifrar solo campos realmente legados. Probar filas híbridas y abortar ante datos corruptos para evitar doble cifrado.

## 4. Identificadores, roles y contratos

### Sesiones

- `JWT.sub` conserva el antiguo `Participant.id`, ahora `Account.id`. Para participantes, `StudyParticipant.accountId` tiene ese mismo valor; no generar un segundo UUID de persona.
- Migrar secuencias existentes sin renumerar y ajustar el generador por encima del máximo del antiguo generador y del máximo migrado. No reciclar números de cuentas borradas ni de testers/admins antiguos.
- Los nuevos PARTICIPANT obtienen `StudyParticipant.seq`; nuevas cuentas ADMIN/TRAINER no tienen fila de estudio. Para conservar `JwtPayload.seq: number`, emitir `seq: 0` para personal, y validar `seq` entero positivo antes de admitir escrituras PARTICIPANT. Aceptar tokens antiguos del personal que ya traigan número positivo. No permitir escribir resultados a personal por tener un número positivo.
- `role` en HTTP/JWT continúa siendo el código textual; nunca `roleId` ni un objeto Role. Resolver por código el rol en registro y seeds. Un rol desconocido se rechaza y no se autoeleva.
- Access/refresh cookies, RS256, `typ`, caducidades, revocación por `tokenVersion` y forma de las respuestas se conservan. Tokens anteriores vigentes deben seguir funcionando durante su vida restante.

### Matriz de compatibilidad

| Contrato actual | Adaptación interna y prueba exigida |
|---|---|
| Registro/login/refresh/me/confirmación/recuperación | Construir el mismo objeto `participant` desde Account + Profile; mismo nombre de propiedad aunque cambie la tabla. Probar cada rol y estado. |
| Administración de participantes/testers y certificados | Mantener rutas, respuestas y resumen/revocación de certificados añadidos en la rama origen; filtrar por `Role.code`; no incluir seq, fecha/orden de registro junto a PII. |
| `GET /runs/atestacion`, POST certificados/PDF/verificación | Mantener `sub`, `seq`, `modulos`, `calificacion`, `typ`. Leer módulos ordenados por position; transacción al emitir/actualizar certificado y sus módulos. |
| PRE/POST y SUS, payload `answers: number[]` | Convertir lista a filas usando IDs del cuestionario versionado; reconstruir lista en su orden canónico para API, administración, CSV y scoring. No enviar entidades Prisma al navegador. |
| Estado de evaluación | Conservar `baselineMissing`; false para recorrido nuevo correcto y derivado de ausencia PRE en resultados históricos. `pretestRequired` depende solo de PRE. Eliminar lecturas/escrituras de la exención. Ninguna ruta de entrenamiento podrá omitir PRE por la vieja excepción. |
| Progreso/reinicios/corridas | Mantener filtro `startedAt > último reset.createdAt`, incluyendo el caso de corridas encoladas guardadas después del reinicio. |
| Narración y correo | Actualizar lectura de nombre/correo cifrados desde perfil; mismos destinatarios, PDFs y respuestas. |

No se requiere rediseño de frontend. Tocar tipos/pruebas o fixtures si cambian detalles internos del estado; conservar contratos evita alterar sus flujos. Revisar `api.ts`, `AuthContext.tsx`, `RequireAuth.tsx`, `Assessment.tsx`, `Dashboard.tsx`, `Admin.tsx`, `AssessmentResults.tsx`, `resultsCsv.ts` y UI de certificados de la rama origen. Eliminar mensajes de excepción obsoletos solo si efectivamente existen, sin sustituirlos por bloqueo permanente.

### Certificados y borrado

Mantener revocación manual, no rehabilitar al canjear otra atestación y no enviar PDF por correo de certificados revocados. Incluir casos de reemisión/reenvío: código estable, módulos sin duplicados, estado revocado preservado. `Certificate` conserva `participantId` sin FK: el borrado actual de cuenta deja el certificado y los datos del estudio intactos. Los nuevos Profile/StudyParticipant se eliminan con la cuenta. La creación de módulos no debe modificar ese comportamiento.

## 5. Migración segura y recuperación

### Preparación y diagnóstico

- Inventariar en la base objetivo versiones, migraciones, tamaños, cuentas por rol, filas sin hash, certificados huérfanos, módulos duplicados, arreglos NULL/vacíos y exenciones. Emitir totales/anomalías, sin PII ni secretos.
- No deducir que una cuenta es de prueba por su email o porque no hay participantes reales. Si hay exenciones o POST/corridas sin PRE, no borrarlos automáticamente: detener retirada y obtener decisión sobre esos registros; conservar hasta entonces su tabla como legado. No fabricar PRE para personas que ya jugaron.
- Revisar `scripts/backup-db.sh`, `scripts/verify-backup.sh` y `scripts/check-db-isolation.sh`; respaldar ambas bases con sus historiales de migración y comprobar restauración en un volumen aislado. No iniciar dos PostgreSQL sobre `safe-web_pgdata`.
- Copia de ensayo con identificadores conservados y misma configuración criptográfica; cualquier acceso remoto necesita destino, operación y sesión autorizados expresamente.

### Fases del cambio

1. **Expandir:** migraciones aditivas independientes por servicio. No editar migraciones aplicadas. Crear tablas destino y mantener Participant, arreglos y exenciones antiguos mientras la versión vieja está activa. No añadir campos Prisma persistentes ficticios que no existan físicamente.
2. **Preparar aplicación:** construir y verificar las imágenes nuevas antes de detener servicios. Actualizar scripts/seed/fixtures y adaptadores Prisma en una misma entrega coherente. El backend nuevo no se sirve antes de poblar/verificar sus tablas.
3. **Congelar escrituras:** poner gateway en mantenimiento y detener AMBOS backends, incluidos procesos locales y trabajos externos que escriban. Sincronizar las dos bases mediante esta ventana; no existe una transacción distribuida. Confirmar ausencia de escritores y tomar respaldo final.
4. **Copiar:** ejecutar una transacción por base bajo el rol autorizado de cada servicio. Roles deterministas; separar cuentas/perfiles/participantes; expandir arreglos con ordinality. Mapear ordinalidad a IDs reales por versión, no asumir que empiezan en 0 o 1. Idempotencia: PK/UNIQUE y cotejo del contenido existente; conflicto implica aborto, no `ON CONFLICT DO NOTHING` que oculte diferencias.
5. **Cotejar:** cuentas/perfiles/participantes por rol; igualdad byte a byte de PII y hashes; IDs/seq; totales y orden de módulos y respuestas; fechas, scores y tokens sin cambios. Ningún ciphertext ni hash se imprime. Si falla una base, mantener mantenimiento y recuperar coherencia de ambas.
6. **Cambiar aplicación:** arrancar ambas imágenes nuevas, verificar salud y flujos en mantenimiento, habilitar web tras comprobarlos. Mantener congelados los datos antiguos para recuperación, no usarlos como fallback silencioso.
7. **Retirar legado:** migración posterior, nunca incluida anticipadamente en la imagen que ejecuta migrate deploy al arrancar: retirar Participant/enum Role antiguo, arreglos y tabla de exenciones solo después de reconciliación y ensayo aprobados. El estado final tiene doce tablas; durante expansión puede tener más.

Antes de abrir escrituras, se puede volver a las imágenes previas usando las tablas antiguas intactas. Después de abrirlas, volver solo a la imagen antigua pierde las escrituras nuevas: volver a mantenimiento y ejecutar transformación inversa ensayada o restaurar respaldo con el punto de pérdida documentado y aprobado. No prometer reversibilidad sin pérdida después del cambio. No usar `migrate reset`, `db push --accept-data-loss` ni eliminar volúmenes.

`backend/Dockerfile` ejecuta migrate deploy al arrancar. Cada imagen debe incluir solo migraciones seguras para su fase; no publicar expandir+retirar juntas. Mantener URLs, schema de PrismaPg, roles aislados y rutas de clientes generados en build/runtime. Compose conserva servicios y volumen; puede necesitar soporte temporal para mantenimiento, no otra base compartida.

## 6. Tareas de implementación y criterios observables

Cada tarea debe actualizar el documento ODD y su espejo al ejecutarse. No se marcan completadas en este plan por haberlas descrito.

### T1 — Caracterizar comportamiento y preparar migración de ensayo

Ruta delegada: mapa de 4+ archivos. Archivos: schemas, `backend/test/identidad.e2e.ts`, pruebas auth/admin/certificados, `backend/test/*`, scripts de respaldo/aislamiento y reconciliación.

- [ ] Resolver configuración efectiva TDD/RDD; registrar fuente y runners. Capturar baseline y contratos completos de rutas, HTTP status, cookies y respuestas de la rama origen.
- [ ] Añadir fixtures sintéticos: cada rol, cuenta deshabilitada/no confirmada, PII v1, correo legado sin hash, tokens vigentes, certificado revocado/huérfano, encuestas versionadas y corridas antes/después de reinicio.
- [ ] Añadir diagnóstico de solo lectura e informe sin PII. Validar duplicados de correo, exenciones y versiones de cuestionario antes de admitir copia.
- [x] Restaurar una copia de solo lectura de las dos bases Compose en PostgreSQL temporal tmpfs y verificar las expansiones. Diagnóstico real: 12 cuentas; 2 huellas inconsistentes quedan bloqueadas por un grupo duplicado de 3 emails normalizados, sin reparación automática posible. En entrenamiento: 3 Assessment, 2 SUS, 5 exenciones; se mapearon 63 y 20 respuestas respectivamente, pero el corte no es seguro mientras existan exenciones. El origen no se modificó.

### T2 — Expandir las tablas de identidad y copiar sin modificar secretos

Ruta delegada: escritor acotado para schema, SQL y scripts. Archivos: `backend/prisma/identidad/schema.prisma`, nueva migración de expansión, nuevo `backend/prisma/migrate-normalized-identity.mts`.

- [ ] Crear seis entidades finales; schemas Prisma finales y migración de expansión permanecen compatibles con la fase de copia.
- [ ] Implementar y probar el migrador de identidad; informe sin PII, copia transaccional, preservación byte a byte y cotejo/idempotencia.
- [ ] Aplicar solo en copia restaurada: la paridad de identidad no se cumple por un grupo de tres correos normalizados duplicados y dos hashes inconsistentes; el corte abortó sin alterar datos. No hay decisión autorizada para reconciliar esas cuentas.
- [ ] Ejecutar commit de cierre de unidad de trabajo y registrar su identidad antes de marcar NDB-2 cerrada.

### T3 — Adaptar identidad y conservar login, administración y certificados

Ruta delegada: escritor para los servicios de identidad. Archivos: `auth/auth.service.ts`, `admin/admin.service.ts`, controladores/DTO administrativos vigentes, `certificados/certificados.service.ts`, `narracion/*`, `pii/email-hash-reconciliation.ts`, `libs/comun/src/{jwt-payload,jwt-auth.guard}.ts`; rutas relativas a `backend/apps/identidad/src` salvo libs.

- [ ] Adaptar selects/escrituras a Account/Profile/Role/StudyParticipant; centralizar construcción de DTO público para evitar filtrar relaciones nuevas. Transacción de alta y búsquedas únicas por huella de perfil.
- [ ] Mantener sesión y roles textuales según sección 4; guard PARTICIPANT exige seq válido. Verificar login/refresh anterior, reset/confirmación y no exposición de PII/secuencia en administración.
- [ ] Adaptar certificados/módulos, revocación administrativa vigente, borrado y correo/narración. No reactivar/reexpedir un revocado por accidente.
- [ ] Adaptar `seed.mts`, `seed-insignia-prueba.mts`, `backfill-pii.mts`, `reconcile-email-hashes.mts`, `reset-un-escenario.mts` y sus dependencias dentro del Dockerfile. Mantener seeds repetibles; no corregir hashes mediante búsquedas en entrenamiento.
- [ ] La suite de backend (`pnpm test`) pasa 37 suites/297 pruebas; `pnpm lint:ci`, `pnpm build` y `pnpm prisma:generate` pasan. La identidad de la copia real sigue bloqueada por paridad; no se ejecutó corte en Compose.
- [ ] Ejecutar commit de cierre de unidad de trabajo y registrar su identidad antes de marcar NDB-3 cerrada.

### T4 — Normalizar respuestas de entrenamiento y retirar la excepción del flujo

Ruta delegada: escritor para entrenamiento. Archivos: `backend/prisma/entrenamiento/schema.prisma`, nueva migración aditiva, nuevo `backend/prisma/migrate-normalized-training.mts`, `assessments/{assessments.service,questionnaire,create-assessment.dto}.ts`, `sus/{sus.service,sus-survey,create-sus-response.dto}.ts`, `runs/runs.service.ts` y pruebas asociadas.

- [ ] Crear AssessmentAnswer/SusAnswer. Implementar `migrateNormalizedTraining({ dryRun: boolean }): Promise<MigrationReport>` con mapeo por versión, conservación de score y transacciones idempotentes.
- [ ] Mantener API `answers[]`: insertar cabecera y respuestas atómicamente, reconstruir orden por cuestionario. Rechazar respuesta incompleta/extra/desconocida antes de persistir; probar entregas concurrentes y rollback sin cabecera huérfana.
- [ ] Exigir PRE real para participantes nuevos; eliminar bypass de exención del código y mantener baselineMissing=false en el contrato. Detener despliegue si se detecta cohorte histórica incompatible no resuelta.
- [ ] La integración PostgreSQL (6/6) y las pruebas e2e (6 suites/110 pruebas) verifican paridad, corte poblado y abortos seguros. En la copia real hay cinco exenciones, así que el intento de corte abortó conservando tablas, filas y arrays legacy.
- [ ] Ejecutar commit de cierre de unidad de trabajo y registrar su identidad antes de marcar NDB-4 cerrada.

### T5 — Ensayar integración, contratos y arranque de contenedores

Ruta delegada: comprobaciones y correcciones funcionales en archivos afectados. Archivos: `frontend/src/lib/api.ts`, AuthContext, RequireAuth, Assessment/Dashboard/Admin y certificados, sus pruebas; pruebas e2e backend, Dockerfile, CI y scripts de aislamiento.

- [ ] Comparar respuestas HTTP antes/después con fixtures equivalentes; frontend conserva cuerpos y campos. Actualizar fixtures/mensajes obsoletos si hace falta, sin rediseño visual.
- [ ] La copia real restaurada en PostgreSQL tmpfs fue diagnosticada y probada; todavía falta el ensayo coordinado de corte y arranque. La base Compose no recibió escrituras ni migraciones.
- [ ] Pruebas E2E: registro→confirmación→PRE→corridas/reinicio→POST→SUS→certificado→verificación→revocación; login de cuenta anterior; refresh/reset de contraseña; administración y tester; correos/narración simulados, sin enviar comunicaciones reales.
- [ ] `pnpm test:e2e`: 6 suites/110 pruebas pasan con pares de claves ES256 coincidentes. El primer intento falló por usar claves efímeras distintas entre servicios; se corrigió el fixture y el reintento pasó. `pnpm lint:ci`, `pnpm build`, generación Prisma y validación de ambos schemas pasan.
- [ ] No cerrar T5: el corte sobre la base Compose y la recuperación posterior a escrituras no están autorizados ni ensayados. Registrar commit de cierre cuando el resto de verificaciones permitidas esté comprometido.

### T6 — Retirada diferida y documentación final

Ruta delegada: SQL y documentación. Archivos: migraciones nuevas de ambas bases, `docs/ARQUITECTURA.md`, AGENTS si el mapa deja de ser válido, README/guías operativas relevantes y nuevo PUML de doce tablas.

- [ ] Las migraciones finales con timestamps `20261116210000` y `20261116211000` están implementadas con precondiciones y abortos seguros; los schemas Prisma finales contienen seis tablas por servicio (doce en total). No se aplicaron al Compose ni se retiraron estructuras legado de la copia real.
- [ ] La documentación y el PUML reflejan el modelo de doce tablas y distinguen el objetivo de la expansión vigente.
- [ ] Mantener NDB-6 abierto: la copia restaurada tiene problemas de paridad de identidad y cinco exenciones de entrenamiento. No eliminar ni reconciliar registros sin decisión autorizada; no ejecutar el corte en Compose. Falta commit de cierre de documentación/código.

## 7. Comprobaciones de aceptación

Desde `backend/`: `pnpm prisma:generate`, `pnpm exec prisma validate --config prisma.identidad.config.ts`, `pnpm exec prisma validate --config prisma.entrenamiento.config.ts`, `pnpm lint:ci`, `pnpm test`, `pnpm build` y `pnpm test:e2e` con PostgreSQL aislado y pares de claves ES256 coincidentes. `pnpm test -- --runInBand` no encontró pruebas por el argumento extra; el comando correcto `pnpm test` pasó 37 suites/297 pruebas. E2E: 6 suites/110 pruebas. Desde `frontend/`: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`. `scripts/check-db-isolation.sh` según sus parámetros reales. No ejecutar e2e contra el volumen operativo.

| Riesgo | Evidencia necesaria antes de desplegar |
|---|---|
| Cuenta antigua ya no puede ingresar | Mismo password autentica con copia del mismo hash; PII original se descifra; acceso y refresh conservan ID y rol. |
| Correo/cédula duplicados | Diagnóstico limpio y concurrencia de altas protegida por UNIQUE; sin cuentas parciales. |
| Corridas bajo otro seudónimo | Igualdad de IDs/seq históricos y generador futuro sin reutilización; staff no produce registros del estudio. |
| Respuestas desordenadas o perdidas | Ida/vuelta de cada versión reproduce arrays originales, score y CSV; inserción atómica y concurrencia controlada. |
| Revocado vuelve a ser válido o se manda por correo | Verificación false, PDF denegado y envío omitido después de reemisión/reintento. |
| Frontend y backend incompatibles | Contratos iguales, smoke E2E y pruebas de vistas con cuenta antigua y nueva. |
| Despliegue parcial | Imagen de fase correcta, escrituras congeladas en ambas bases y restauración ensayada. |

## 8. Estado de esta entrega

La rama contiene los schemas Prisma finales de doce tablas de negocio (seis por servicio), migraciones de expansión y retiro, adaptaciones backend, migradores y documentación. Las migraciones finales tienen timestamps `20261116210000` y `20261116211000`. `prisma:generate`, validación de ambos schemas, `pnpm lint:ci`, `pnpm build` y `pnpm test` pasan; la suite unitaria es 37 suites/297 pruebas. La integración PostgreSQL aislada pasó 6/6 (paridad, corte poblado y abortos seguros). E2E pasó 6 suites/110 pruebas con claves ES256 emparejadas. El primer intento e2e usó pares de claves efímeras distintos y falló; se corrigió el fixture y el reintento pasó. El primer comando `pnpm test -- --runInBand` no encontró pruebas; `pnpm test` fue el runner correcto.

Se restauraron dumps de solo lectura de ambas bases Compose exclusivamente en PostgreSQL tmpfs. Sobre esa copia, identidad abortó porque faltaba paridad: el diagnóstico previo encontró tres cuentas con email normalizado duplicado y dos hashes inconsistentes. Entrenamiento abortó al detectar cinco exenciones históricas. En ambos casos se verificó que tablas, filas y arrays legacy permanecen intactos. Compose no recibió escrituras ni migraciones.

NDB-1, NDB-5 y NDB-6 permanecen abiertos. No existe autorización para reconciliar/fusionar o descartar cuentas, eliminar las exenciones ni ejecutar el corte sobre Compose; no se inventa PRE ni se eliminan datos. La aplicación y migración física final no se consideran desplegadas. El usuario aceptó una sola rama/entrega (`single-pr`); las tareas no se marcan cerradas hasta tener commit de unidad de trabajo y evidencia. La copia Engram del seguimiento sigue pendiente.

Este documento conserva el diseño y criterios de aceptación; no reemplaza `odd/tasks/normalize-database-model.md` como registro de avance ni sirve como prueba de una migración aplicada.
