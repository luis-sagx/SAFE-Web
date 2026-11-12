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

- Estado efectivo TDD: activado por la skill de sesión `test-driven-development`; no existe otra configuración de proyecto/sesión observada. Runner: backend `pnpm test` (Jest); integración con PostgreSQL `pnpm test:e2e` (Jest con `test/jest-e2e.json`).
- Configuración/deploy permite checks automatizados: se adapta CI existente; seguir RED-GREEN-REFACTOR para scripts/helpers verificables y observar fallos/éxitos antes de cerrar cada tarea.
- RDD: `gentle-ai` no está instalado/disponible en el entorno, por lo que no se pudo leer el switch ni evaluar candidatos. Mantener como no disponible; no inferir un nivel bajo.
- Comprobaciones previstas una vez autorizadas: CI backend e2e con dos DBs, verificación de aislamiento por conexión, restauración de respaldos en PostgreSQL temporal, y checks de backend aplicables.

## Tareas

- [ ] **PGDB-1 — Bootstrap y conexión por servicio.** Actualizar Compose, inicialización para volúmenes nuevos, procedimiento para volumen existente, variables, configuraciones de Prisma, comandos de migración y arranque por app. Incluir documentación operativa de instalación/corte. Ruta: delegated direct; evidencia: más de dos archivos no triviales y lectura preparatoria de configuración. El resultado y los checks están observados; marcar completa al registrar el commit de implementación.
- [ ] **PGDB-2 — Respaldos, CI y recuperación.** Separar respaldos/restauración y sus verificaciones por base; adaptar CI para crear las dos bases y comprobar aislamiento; actualizar runbook de recuperación. Ruta: delegated direct; evidencia: más de dos archivos no triviales y cambios coordinados de scripts/CI/documentación.

## Progreso y siguiente paso

- Exploración previa confirmó Compose en EC2, un volumen persistente compartido, Prisma con configuración e historia separadas, y scripts de respaldo que actualmente filtran dos esquemas de una base.
- El checkout estaba en `main` y contenía archivos no rastreados ajenos a la tarea. Se creó la rama `feat/postgres-two-databases`; los archivos no rastreados no se han tocado.
- El usuario confirmó conservar los nombres de esquema y los datos de prueba.
- PGDB-1 se implementó por delegated direct. El bootstrap crea las bases destino y roles de privilegio mínimo, conserva los schemas, preasigna sombras solo en el Compose local y rechaza destinos existentes con objetos o propietarios inesperados. Para volúmenes existentes requiere invocación manual; no elimina, migra ni restaura datos. Los servicios reciben solo su URL de destino.
- TDD: RED observado en PostgreSQL desechable antes del cambio: `FALLO: entrenamiento pudo conectarse a la base de identidad.` GREEN observado tras el cambio y una extensión simétrica del check: `OK: cada servicio solo puede conectarse a su propia base.` Exit 0. El contenedor, red y volumen anónimo desechables se retiraron; no se consultó ni modificó el Compose live.
- Checks locales PGDB-1: `bash -n db-init/01-roles-y-schemas.sh`, `sh -n scripts/check-db-isolation.sh` y `git diff --check` pasaron. No se ejecutaron `pnpm test:e2e` ni el workflow completo; el job e2e de CI prepara dos bases para su ejecución.
- RDD/gentle-ai no estaba disponible; no se inició revisión nativa.
- Siguiente paso: implementar PGDB-2 (respaldos, transferencia/restauración y verificaciones por base), sin ejecutar corte remoto. Confirmar después los nombres definitivos de las bases en `.env` de EC2 antes del despliegue.
