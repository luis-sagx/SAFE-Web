# SAFE-Web: dos bases lógicas de PostgreSQL

## Objetivo

Separar Identidad y Entrenamiento en dos bases lógicas alojadas en la misma instancia PostgreSQL de EC2, conservar los esquemas existentes y todos los datos de prueba, y mantener un rol de servicio con acceso exclusivo a su base.

## Problema y motivo

Hoy Compose configura una sola `POSTGRES_DB` y dos esquemas con roles separados. Los permisos actuales limitan el acceso entre esquemas, pero la base compartida mantiene el aislamiento dependiente de esos permisos. La separación lógica propuesta endurece ese límite antes de incorporar usuarios reales.

## Alcance autorizado

- Cambios locales en Compose, bootstrap PostgreSQL, configuración de Prisma, CI, respaldo/restauración, scripts y documentación necesarios para la migración.
- Mantener un único servicio PostgreSQL y el volumen persistente actual.
- Conservar esquemas `identidad` y `entrenamiento` dentro de las nuevas bases.
- Preparar una ruta de migración que conserve datos; no ejecutarla en producción.
- No acceder a EC2/AWS, no leer secretos de archivos `.env`, no ejecutar migraciones contra producción, ni cambiar infraestructura remota.
- El usuario autoriza ejecutar ahora la migración solo en el Docker local para validarla antes de un despliegue; no se autoriza EC2.

## Restricciones

- No borrar ni recrear el volumen existente.
- `db-init` no se ejecuta para un directorio PGDATA ya inicializado; se requiere un procedimiento separado para el volumen actual.
- Cada servicio recibe solo su URL/rol de destino. Los scripts operativos que usan ambas bases quedan separados del runtime.
- Conservar historias Prisma y tablas `_prisma_migrations` al importar.
- Los archivos no rastreados que ya existían en el checkout se preservan y no se agregan a commits.

## Criterios de aceptación

- Compose y CI ejecutan un único PostgreSQL con dos bases lógicas.
- El rol de Identidad solo se conecta a Identidad; el rol de Entrenamiento solo se conecta a Entrenamiento.
- Los permisos de servicio no incluyen `CREATEDB`; las migraciones siguen siendo ejecutables con permisos limitados a la base propia.
- Los datos de cada esquema y su historial Prisma se pueden respaldar y restaurar por separado.
- Las aplicaciones conservan los flujos JWT y atestación sin acceso de base cruzado.
- La documentación describe tanto instalaciones nuevas como la preparación del volumen persistente existente.
- No se realiza el corte de producción ni se contacta AWS desde esta tarea.

## TDD y verificaciones

- Estado efectivo TDD: activado por la skill de sesión `test-driven-development`; no existe otra configuración de proyecto/sesión observada. Runners: frontend `pnpm test:cov` (Vitest); backend `pnpm test:cov` (Jest); integración PostgreSQL `pnpm test:e2e` (Jest con `test/jest-e2e.json`).
- Configuración/deploy permite checks automatizados: se adapta CI existente; seguir RED-GREEN-REFACTOR para scripts/helpers verificables y observar fallos/éxitos antes de cerrar cada tarea.
- RDD: `gentle-ai` no está instalado/disponible en el entorno, por lo que no se pudo leer el switch ni evaluar candidatos. Mantener como no disponible; no inferir un nivel bajo.
- Comprobaciones PGDB-1 realizadas: aislamiento por conexión en PostgreSQL desechable (RED/GREEN), `bash -n` del bootstrap, `sh -n` del check y `git diff --check`.
- Comprobaciones PGDB-2: RED observado con el respaldo antiguo: produjo solo `safe-web-20261111-230744.dump`, sin archivos por servicio; assertion terminó con código 1. GREEN en PostgreSQL standalone temporal, tmpfs y datos sintéticos: modo normal produjo y restauró ambos dumps; modo `--source` produjo y restauró ambos schemas. Conteos verificados: Identidad 2 participantes/1 certificado; Entrenamiento 3 corridas/1 reinicio. `sh -n scripts/backup-db.sh`, `sh -n scripts/verify-backup.sh` y `git diff --check` pasan. El harness se limpió al terminar.
- Comprobaciones frontend: RED con paralelismo predeterminado (3–7 fallos reproducibles, mayormente timeouts de 5 s); los tres archivos más problemáticos pasan juntos (12/12). GREEN tras configurar `maxWorkers: 2`: `pnpm lint && pnpm test:cov && pnpm build` terminó con código 0; 127 archivos, 947 pruebas correctas, 4 omitidas y cobertura sobre todos los umbrales.
- Comprobaciones backend: `pnpm install --frozen-lockfile`, `pnpm prisma:generate`, `pnpm lint:ci`, `pnpm build` y `pnpm test:cov` terminaron con código 0; Jest reportó 33 suites y 276 pruebas correctas.
- Comprobaciones e2e: PostgreSQL 18 efímero y aislado; bootstrap de roles/bases y deploy de 13 migraciones de Identidad y 6 de Entrenamiento terminaron; `pnpm test:e2e` terminó con código 0 (6 suites, 110 pruebas).
- Comprobaciones Docker del job: GREEN en Compose con proyecto, imágenes, puerto y volumen propios. Build de tres imágenes, healthchecks, aislamiento, smoke HTTP/SPA/registro/login/corrida, respaldo/restauración de ambas bases y k6 terminaron con código 0. k6: 63/63 checks, 0 % de requests fallidos, p95 22.48 ms. El trap retiró solo los recursos temporales; no se consultó el Compose/volumen activo ni AWS.
- Auditorías: `pnpm audit --audit-level=high` terminó con código 0 en frontend y backend. Frontend: sin vulnerabilidades conocidas. Backend: 9 (2 bajas, 7 moderadas); ninguna supera el umbral `high`. Sonar y dependency-review quedan sin ejecutar porque requieren el contexto de GitHub.

## Estrategia de entrega

- Estrategia inicial: `ask-on-risk` (predeterminada). PGDB-1 acumuló 555 líneas editadas; el umbral ODD de ~400 se superó.
- La pregunta de estrategia de cadena está pendiente: `stacked-to-main` o `feature-branch-chain`. No crear más commits hasta resolverla.

## Tareas

- [x] **PGDB-1 — Bootstrap y conexión por servicio.** Actualizar Compose, inicialización para volúmenes nuevos, procedimiento para volumen existente, variables, configuraciones de Prisma, comandos de migración y arranque por app. Incluir documentación operativa de instalación/corte. Ruta: delegated direct; evidencia: más de dos archivos no triviales y lectura preparatoria de configuración. Commit de implementación: `09c516a` (`feat(db): separar conexiones por servicio`).
- [ ] **PGDB-2 — Respaldos, CI y recuperación.** Separar respaldos/restauración y sus verificaciones por base; adaptar CI para crear las dos bases y comprobar aislamiento; actualizar runbook de recuperación. Implementación y verificaciones locales listas; falta cerrar la unidad con commit porque la estrategia de ramas sigue sin respuesta. Ruta: delegated direct; evidencia: más de dos archivos no triviales y cambios coordinados de scripts/CI/documentación.
- [ ] **PGDB-3 — Estabilizar pruebas frontend para CI.** Limitar los workers de Vitest para evitar que el suite exceda los timeouts de 5 s en entornos con paralelismo reportado mayor que la CPU disponible. Implementación y comando CI exacto verificados; queda cerrar la unidad con commit por la estrategia de ramas pendiente. Ruta: direct inline; evidencia: configuración en un archivo y RED/GREEN observado.
- [x] **PGDB-4 — Migrar y validar el volumen Docker local existente.** Respaldar y verificar origen y destinos, preservar `mic`, copiar cada esquema a su base, corregir permisos sin recrear el volumen y validar conteos/descifrado/aislamiento. Alcance exclusivo del Docker local autorizado por el usuario; no EC2. Ruta: direct inline; evidencia: respaldos restaurados en PostgreSQL desechable y conteos comparados después de la restauración local.
- [x] **PGDB-5 — Recuperar el supervisor local.** Crear de nuevo `supervisor@espe.edu.ec` en la base activa mediante el seed existente, sin alterar las demás cuentas; guardar la contraseña generada solo para entregársela al usuario. Ruta: direct inline; evidencia: el seed terminó correctamente contra `safeweb_identidad`; consulta posterior confirma cuenta activa, rol `ADMIN` y hash de contraseña presente.
- [x] **PGDB-6 — Documentar el corte y reversión de despliegue.** Añadir una guía segura para migrar el volumen PostgreSQL persistente en EC2 cuando se autorice, con respaldo verificable, inventario/preflight, copia por esquema, permisos, validaciones, ventana de corte y reversión; no ejecutar ni contactar AWS. Ruta: delegated direct; evidencia: la lectura de cinco componentes se delegó; el runbook incluye preflight, respaldos, restore, migraciones Prisma, aislamiento, smoke checks y reversión.

## Progreso y siguiente paso

- Exploración previa confirmó Compose en EC2, un volumen persistente compartido, Prisma con configuración e historia separadas, y scripts de respaldo que actualmente filtran dos esquemas de una base.
- El checkout estaba en `main` y contenía archivos no rastreados ajenos a la tarea. Se creó la rama `feat/postgres-two-databases`; los archivos no rastreados no se han tocado.
- El usuario confirmó conservar los nombres de esquema y los datos de prueba.
- PGDB-1 se implementó por delegated direct. El bootstrap crea las bases destino y roles de privilegio mínimo, conserva los schemas, preasigna sombras solo en el Compose local y rechaza destinos existentes con objetos o propietarios inesperados. Para volúmenes existentes requiere invocación manual; no elimina, migra ni restaura datos. Los servicios reciben solo su URL de destino.
- TDD: RED observado en PostgreSQL desechable antes del cambio: `FALLO: entrenamiento pudo conectarse a la base de identidad.` GREEN observado tras el cambio y una extensión simétrica del check: `OK: cada servicio solo puede conectarse a su propia base.` Exit 0. El contenedor, red y volumen anónimo desechables se retiraron; no se consultó ni modificó el Compose live.
- Checks locales PGDB-1: `bash -n db-init/01-roles-y-schemas.sh`, `sh -n scripts/check-db-isolation.sh` y `git diff --check` pasaron. No se ejecutaron `pnpm test:e2e` ni el workflow completo; el job e2e de CI prepara dos bases para su ejecución.
- RDD/gentle-ai no estaba disponible; no se inició revisión nativa.
- PGDB-1 se cerró en el work-unit commit `09c516a` (`feat(db): separar conexiones por servicio`).
- PGDB-2 implementa archivos de respaldo separados por servicio, un modo `--source` para extraer los dos schemas de la base legacy, restauración verificable en un PostgreSQL efímero, rotación que conserva dumps fuente y anteriores, CI para verificar los dos destinos y runbook de corte/reversión sobre el mismo volumen persistente.
- La validación PGDB-2 usó un contenedor PostgreSQL standalone con nombre de proyecto único, datos y credenciales ficticias, sin puertos ni volumen persistente. No consultó ni modificó el stack Compose mostrado por el usuario ni AWS.
- Pipeline: la suite completa frontend falla bajo el paralelismo predeterminado en este entorno y pasa con `maxWorkers=2`; el runner informa 20 CPUs. La atribución a sobrecarga de workers es una inferencia, apoyada por las ejecuciones contrastadas.
- El job Docker se simuló en un proyecto Compose aislado porque su `docker compose down -v` no debe ejecutarse contra el Compose activo. E2E se probó con PostgreSQL temporal aislado. Sonar y dependency-review dependen de GitHub y quedan pendientes hasta un PR.
- Diagnóstico de claves en el origen, solo lectura: los 11 correos cifrados se descifraron con la clave PII local; las 11 filas tienen hash de correo y 9/11 coinciden con el pepper local. Esto descarta una clave PII incorrecta como causa de que no aparezcan filas, pues el listado descifra correos pero no filtra por su hash. Los dos hashes discordantes podrían afectar el login de esas cuentas; su origen queda pendiente de revisar si una cuenta afectada no puede ingresar. No se mostraron valores secretos ni PII.
- Respaldos locales de migración creados en `/home/luissagnay/.safe-web-pg-migration.YLf0p0` con permisos privados y verificados restaurando los cuatro dumps en contenedores desechables. Incluyen origen de Identidad/Entrenamiento y ambos destinos previos. No se configuró respaldo remoto.
- PGDB-4 ejecutado solo en Docker local: se detuvieron `web`, `identidad` y `entrenamiento`; se recrearon únicamente las bases `safeweb_identidad` y `safeweb_entrenamiento`, usando el helper de roles/permisos; se restauraron los schemas desde `mic`. La base `mic`, el contenedor PostgreSQL y el volumen `pgdata` no se eliminaron ni recrearon.
- Verificación posterior: Identidad contiene 11 participantes, 27 certificados y 13 migraciones; Entrenamiento contiene 329 corridas, 35 reinicios, 3 evaluaciones, 2 respuestas SUS y 6 migraciones. La agregación por rol reporta 5 `PARTICIPANT`, 3 `ADMIN` y 3 `TRAINER`; por ello la administración debe listar cinco participantes, no las 11 cuentas totales. Los dos roles no son superusuario ni tienen `CREATEDB`/`CREATEROLE`; `scripts/check-db-isolation.sh` pasa. Los servicios están saludables; web y endpoint de health respondieron HTTP 200.
- El usuario confirmó que ya pudo entrar usando otra cuenta. Diagnóstico posterior de solo lectura confirmó que `supervisor@espe.edu.ec` no está en el origen `mic` (11 filas), pero sí en el respaldo del destino anterior (una cuenta `ADMIN` activa con hash presente y compatible con el pepper actual). Esto explica por qué dejó de autenticar al sustituirse solo la base destino; el respaldo conserva esa fila.
- Encargo actual: recrear localmente el supervisor con el seed soportado (generará una contraseña nueva porque el hash existente no permite recuperar la anterior) y añadir una guía reproducible para el futuro despliegue. No se autoriza ni ejecutará acceso a EC2/AWS.
- PGDB-6 se documentó en `docs/MIGRACION-POSTGRES-DOS-BASES.md`; incluye gates de parada, detección de administradores solo en destino, nombres de base, respaldos off-host, restauración en bases propias, verificación de migraciones, smoke checks y condiciones de reversión. Se revisó el runbook y se corrigieron el orden de preflight/variables, los ejemplos de rutas de dumps y el momento del seed para que el contenedor exista. No se hizo contacto ni cambio en AWS.
- PGDB-5 ejecutado localmente con `node /app/prisma/seed.mts --email supervisor@espe.edu.ec --reset` después de crear la fila ausente; el primer seed generó la cuenta y el segundo dejó una contraseña nueva que se entregará al usuario. Solo se actualizó la contraseña de esa cuenta; no se alteraron datos de participantes ni otras cuentas. Verificación posterior: rol ADMIN, activa, hash presente, contenedores saludables y aislamiento entre bases pasa.
- Engram no está disponible entre las herramientas de esta sesión; queda pendiente sincronizar el documento completo con `odd/postgres-two-logical-databases/tasks`.
- Siguiente paso: ejecutar el seed solo contra la base local `safeweb_identidad`, confirmar existencia/rol sin exponer secretos, completar la guía, verificar el diff y cerrar con un commit local. No hacer push ni despliegue.
