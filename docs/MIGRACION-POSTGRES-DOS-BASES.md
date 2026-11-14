# Runbook: migrar PostgreSQL a dos bases lógicas

## Estado y alcance

Este procedimiento describe el corte futuro del despliegue en EC2. **El entorno de EC2 aún no se ha migrado**; los cambios y la recuperación realizados hasta ahora fueron solo en Docker local. Este documento no implica autorización para acceder a AWS ni ejecutar el corte.

El objetivo es conservar una sola instancia PostgreSQL y el volumen persistente actual, y trasladar el esquema `identidad` a una base propia y `entrenamiento` a otra. Cada servicio usará su rol y su URL. El nombre de `POSTGRES_DB` seguirá apuntando temporalmente a la base antigua porque desde ahí se extraen los dos esquemas.

Sigue este runbook durante una ventana de mantenimiento, después de que el cambio esté integrado y el pipeline esté verde. Si cualquier preflight falla o los conteos no coinciden, **detente**: no borres destinos ni el volumen para intentar continuar.

## Reglas de seguridad

- No ejecutar `docker compose down -v`, `docker volume rm`, `docker system prune --volumes` ni recrear `pgdata`.
- Nunca pasar `pg_restore --clean` contra la base antigua (`POSTGRES_DB`). El destino debe ser exclusivamente la base del servicio correspondiente.
- No iniciar `identidad`, `entrenamiento` ni `web` entre el respaldo de origen y la validación del restore: podrían aceptar escrituras mientras las bases nuevas todavía no contienen la copia.
- No regenerar ni cambiar `PII_ENCRYPTION_KEY`, `EMAIL_PEPPER`, `CEDULA_PEPPER` o las claves JWT durante este corte. Conservar las claves actuales en el gestor de secretos habitual. Los dumps no las contienen.
- No compartir `.env`, URLs resueltas, volcados SQL, hashes, PII ni logs sin revisar. `docker compose config` sin `--quiet` puede imprimir valores interpolados.
- Los respaldos de base incluyen datos personales cifrados, hashes de contraseña y huellas; trátalos como datos sensibles, con permisos privados y copia externa protegida.

## 1. Preparación y preflight

1. Confirma la ventana, el responsable de aprobar el retorno a servicio y una persona con acceso operativo autorizado a la EC2 y al volumen EBS. Este documento no autoriza ese acceso.
2. Usa el procedimiento normal de despliegue para preparar en el host la versión que incluye las dos bases. No levantes aún los servicios de aplicación.
3. Revisa en el gestor local de secretos que existen los nombres de base y credenciales que exige la nueva versión (`IDENTIDAD_DB_NAME`, `ENTRENAMIENTO_DB_NAME`, `IDENTIDAD_DB_PASSWORD`, `ENTRENAMIENTO_DB_PASSWORD`) sin copiar sus valores al terminal compartido o a un ticket. Mantén `POSTGRES_DB` con el nombre de la base antigua durante toda la extracción. Si la base antigua o los nombres destino no son los esperados, detén el corte y adapta la guía/script primero.

4. Desde el directorio del proyecto valida la interpolación sin imprimir la configuración:

   ```sh
   docker compose config --quiet
   docker compose ps
   ```

   Asegura que `db` sigue usando el Compose y el proyecto que montan el volumen PostgreSQL persistente actual. No levantes a la vez `docker-compose.db.yml`: puede compartir `pgdata`.

5. Confirma el espacio libre tanto para los dumps como para el margen temporal de la restauración:

   ```sh
   df -h /
   ```

   El filesystem del respaldo puede ser distinto; después de elegir la ruta protegida, comprueba también ese mount. No dejes que el respaldo ocupe el disco raíz hasta agotarlo.

6. Revisa quién puede administrar el estudio antes del corte. Si hay cuentas `ADMIN` creadas directamente en una base destino que no existen en el esquema `identidad` de la base antigua, regístralas para reponerlas después. No supongas que todos los administradores están en el origen: en la prueba local, `supervisor@espe.edu.ec` existía únicamente en el destino anterior y no en `mic`.
7. Si las dos bases destino existen, respáldalas también con el modo normal de `backup-db.sh`. Si solo existe una, ese modo fallará porque espera ambas: respalda la base existente por separado con `pg_dump -Fc -n identidad` o `pg_dump -Fc -n entrenamiento` (según corresponda) y verifícala en PostgreSQL desechable, o detén el corte hasta adaptar el script. El helper aborta si encuentra objetos o un propietario inesperado; ese rechazo es un control de seguridad, no una instrucción para borrar la base. Como EC2 aún no se ha migrado, la ruta prevista es que no haya bases destino preexistentes. Si aparecen bases con tablas/datos, **este runbook no autoriza reemplazarlas**: detente y acuerda una reconciliación explícita, incluyendo cuentas administrativas que existan solo allí.

## 2. Pausar escrituras y guardar respaldos

1. Activa mantenimiento a nivel de aplicación o balanceador, si aplica. Después detén todos los escritores de Compose y confirma que están detenidos:

   ```sh
   docker compose stop web identidad entrenamiento
   docker compose ps
   ```

   Mantén PostgreSQL corriendo para completar los dumps. No basta con parar solo `web` si hay otros procesos que escriben en la base.

2. Guarda la configuración anterior del despliegue y la información global de roles en una ruta privada fuera del checkout. El dump global puede contener hashes de contraseñas de roles; conserva el archivo con permisos restringidos:

   ```sh
   umask 077
   mkdir -p /var/backups/safe-web/pre-migracion
   docker compose exec -T db sh -ec 'pg_dumpall --username "$POSTGRES_USER" --globals-only' \
     > /var/backups/safe-web/pre-migracion/globals.sql
   ```

   Conserva además una copia protegida del `.env` anterior mediante el gestor de secretos aprobado, no en Git ni en el directorio público del sitio. No lo imprimas.

3. Crea los dumps independientes del origen. Los scripts invocan `pg_dump -Fc` por esquema y publican los archivos con permisos privados:

   ```sh
   BACKUP_DIR=/var/backups/safe-web BACKUP_KEEP_DAYS=365 \
     scripts/backup-db.sh --source
   ```

4. Si las bases destino ya existían, guarda también su estado actual:

   ```sh
   BACKUP_DIR=/var/backups/safe-web BACKUP_KEEP_DAYS=365 \
     scripts/backup-db.sh
   ```

   Si el modo normal falla porque una base destino aún no existe, no inventes un dump vacío: registra que el destino no existía y continúa solo si el preflight confirmó que no había datos independientes que conservar.

5. Verifica **cada dump de origen** con el restaurador desechable. Usa los nombres configurados en Compose; el script actual solo contempla `safeweb_identidad` y `safeweb_entrenamiento`:

   ```sh
   SOURCE_IDENTITY_DUMP='/var/backups/safe-web/RUTA_REAL_DEL_DUMP_SOURCE_IDENTIDAD'
   SOURCE_TRAINING_DUMP='/var/backups/safe-web/RUTA_REAL_DEL_DUMP_SOURCE_ENTRENAMIENTO'
   scripts/verify-backup.sh identidad "$SOURCE_IDENTITY_DUMP"
   scripts/verify-backup.sh entrenamiento "$SOURCE_TRAINING_DUMP"
   ```

   Debe terminar con `restauración OK` para ambos servicios. Si el despliegue usa nombres distintos, detente y adapta/verifica `scripts/verify-backup.sh` antes del corte; no cambies los nombres a ciegas en EC2.

6. Si había destinos previos, verifica también sus respaldos y guarda sus checksums. Confirma que los dumps estén completos y que exista una copia fuera de la EC2 antes de continuar. Usa el mecanismo cifrado ya aprobado; `BACKUP_REMOTE` permite que `backup-db.sh` use el destino configurado de `rclone`. Si no hay copia externa verificada, no continúes.

7. Registra conteos de referencia sin exportar datos personales: participantes y certificados en Identidad; corridas, reinicios, evaluaciones, exenciones y respuestas SUS en Entrenamiento; y número/estado de filas en `_prisma_migrations`. Esos conteos se compararán tras el restore.

8. Como salvaguarda adicional, se puede crear un snapshot EBS del volumen que contiene `pgdata` cuando las aplicaciones están detenidas y PostgreSQL se ha cerrado limpiamente. No sustituye los dumps por servicio ni su prueba de restauración. Requiere la autorización operativa AWS correspondiente; confirma el snapshot y su volumen antes de seguir. AWS recomienda pausar escrituras para que el snapshot sea consistente.

## 3. Preparar las bases y permisos

Si se va a tomar el snapshot EBS, detén PostgreSQL de forma limpia antes de solicitarlo:

```sh
docker compose stop db
```

Después, vuelve a iniciarlo sin arrancar los servicios de aplicación:

```sh
docker compose up -d db
docker compose ps
```

Espera a que `db` esté `healthy`. El Compose monta el mismo volumen `pgdata` en `/var/lib/postgresql`; los scripts de `/docker-entrypoint-initdb.d` **no se ejecutan automáticamente** cuando ese directorio ya fue inicializado.

Invoca el bootstrap manualmente contra el cluster existente:

```sh
docker compose exec -T db sh /docker-entrypoint-initdb.d/01-roles-y-schemas.sh
```

El helper crea los roles/bases que falten, elimina `CREATEDB`/`CREATEROLE` de los roles de servicio, da `CONNECT` solo a la base propia, crea el schema esperado y revoca el acceso de esos roles a `POSTGRES_DB`. No copia los datos. Si aborta por objetos, dueño, variables faltantes o cualquier otro error, **detente**; no borres objetos manualmente para forzar el paso.

## 4. Restaurar cada esquema en su base

Identifica los dos dumps fuente verificados. Sustituye los valores de ejemplo por los nombres exactos impresos por `backup-db.sh`. Copia únicamente esos archivos al contenedor PostgreSQL; no los pongas en un directorio servido por Nginx:

```sh
db_container=$(docker compose ps -q db)
test -n "$db_container"
docker cp "$SOURCE_IDENTITY_DUMP" \
  "$db_container":/tmp/source-identidad.dump
docker cp "$SOURCE_TRAINING_DUMP" \
  "$db_container":/tmp/source-entrenamiento.dump
```

Confirma que cada archivo sea legible por `pg_restore` y restaura cada dump **solo** en su base de destino. `--clean` elimina objetos que coincidan dentro del destino indicado; no lo ejecutes contra la base antigua:

```sh
docker compose exec -T db sh -ec '
  pg_restore --list /tmp/source-identidad.dump >/dev/null
  pg_restore --username "$POSTGRES_USER" --dbname "$IDENTIDAD_DB_NAME" \
    --clean --if-exists --exit-on-error /tmp/source-identidad.dump
  pg_restore --list /tmp/source-entrenamiento.dump >/dev/null
  pg_restore --username "$POSTGRES_USER" --dbname "$ENTRENAMIENTO_DB_NAME" \
    --clean --if-exists --exit-on-error /tmp/source-entrenamiento.dump
  rm -f /tmp/source-identidad.dump /tmp/source-entrenamiento.dump
'
```

No habilites tráfico durante el restore ni cambies `POSTGRES_DB` a una de las nuevas bases. Mantenerla como origen ayuda a que healthcheck y bootstrap distingan la base antigua de las de servicio.

## 5. Verificaciones antes de volver a abrir el servicio

Con PostgreSQL activo y aplicaciones aún detenidas:

1. Compara los conteos anotados en el preflight con las bases destino. No aceptes una diferencia sin explicación documentada.
2. Compara `migration_name`, `finished_at` y `rolled_back_at` de `_prisma_migrations` con el origen. Deben conservarse los historiales de Identidad y Entrenamiento; cualquier migración nueva del release se aplicará cuando arranque su servicio.
3. Ejecuta el check de aislamiento:

   ```sh
   scripts/check-db-isolation.sh
   ```

   Debe responder `OK: cada servicio solo puede conectarse a su propia base.` Confirma además que ambos roles sigan sin privilegios de superusuario, creación de bases o roles.

4. Revisa que las dos bases tengan el owner/roles previstos y que las nuevas URLs de Compose apunten a la base de cada servicio. Para evitar filtrar configuración, usa `docker compose config --quiet`, no publiques la salida expandida de `docker compose config`.

Si cualquier punto falla, deja los servicios parados y usa la reversión previa a escrituras descrita abajo. No arranques el release confiando en que `prisma migrate deploy` corregirá conteos, permisos o un restore incompleto.

## 6. Volver a servicio y monitorear

Solo tras aprobar los checks, inicia primero los servicios de API y espera sus healthchecks. Al arrancar, el Dockerfile ejecuta `prisma migrate deploy` contra la URL propia de cada servicio, por lo que aplicará migraciones pendientes sin resetear la base:

```sh
docker compose up -d identidad entrenamiento
docker compose ps
```

Si ambos están saludables y las migraciones terminan correctamente, confirma administradores y cuentas sembradas. Si una cuenta necesaria estaba en el destino anterior y no en el origen, recréala mediante el seed soportado:

```sh
docker compose exec -T identidad node /app/prisma/seed.mts \
  --email supervisor@espe.edu.ec
```

Si la cuenta falta, el seed genera una contraseña nueva y la imprime una sola vez; guárdala fuera del servidor/repositorio y entrégala al responsable por un canal apropiado. Si ya existe, el seed no cambia su contraseña. No uses `--reset` sin autorización. No vuelvas a importar el dump completo del destino encima del origen, porque podría sobrescribir participantes actuales.

Solo tras aprobar ese paso, inicia la web:

```sh
docker compose up -d web
docker compose ps
```

Realiza un smoke test controlado: login de una cuenta ADMIN, lista de participantes, inicio de una corrida en entrenamiento y consulta de resultados esperados. Verifica que los datos existentes siguen visibles y que una cuenta no autorizada no puede conectar a la base del otro servicio. Monitorea healthchecks y errores de migración durante la ventana. No publiques logs sin revisar si pudieran contener información sensible.

## 7. Reversión

### Antes de permitir escrituras nuevas

Si no se han aceptado escrituras en las nuevas bases, se puede volver al release anterior:

1. Detén `web`, `identidad` y `entrenamiento`; conserva PostgreSQL y el volumen.
2. Restaura el release y la configuración de secretos previos, incluido el `.env` protegido y las credenciales que usaban los servicios anteriores.
3. Como el helper revoca `CONNECT` en la base antigua, devuelve acceso a los roles anteriores:

   ```sh
   docker compose exec -T db sh -ec \
     'psql --username "$POSTGRES_USER" --dbname postgres --set=ON_ERROR_STOP=1 \
       --command="GRANT CONNECT ON DATABASE \"$POSTGRES_DB\" TO identidad, entrenamiento"'
   ```

   Revisa también las propiedades y grants previos contra el respaldo de globals/configuración; no asumas que `GRANT CONNECT` por sí solo recompone una credencial cambiada.
4. Inicia el release anterior y confirma salud, login y conteos. Mantén intactas las bases nuevas y sus dumps hasta cerrar el incidente.

### Después de permitir escrituras nuevas

No apuntes la versión anterior directamente a `mic`: las nuevas altas, cambios o corridas podrían existir solo en las bases nuevas. Activa mantenimiento, detén todos los escritores y conserva nuevos dumps de ambas bases y del origen. Decide y ejecuta una reconciliación de datos revisada antes de volver a abrir; no borres bases ni el volumen. Si el impacto no está claro, mantén el servicio cerrado y escala al responsable técnico.

## Fuentes y comportamiento del repositorio

- [PostgreSQL 18: `pg_dump`](https://www.postgresql.org/docs/18/app-pgdump.html) y [`pg_restore`](https://www.postgresql.org/docs/18/app-pgrestore.html).
- [Docker Compose: validar/renderizar configuración](https://docs.docker.com/reference/cli/docker/compose/config/) y [volúmenes persistentes](https://docs.docker.com/reference/compose-file/volumes/).
- [Prisma: `migrate deploy`](https://docs.prisma.io/docs/cli/migrate/deploy).
- [AWS EBS: crear snapshots y consistencia de escritura](https://docs.aws.amazon.com/ebs/latest/userguide/ebs-creating-snapshot.html).
- Implementación actual: [`scripts/backup-db.sh`](../scripts/backup-db.sh), [`scripts/verify-backup.sh`](../scripts/verify-backup.sh), [`db-init/01-roles-y-schemas.sh`](../db-init/01-roles-y-schemas.sh), [`docker-compose.yml`](../docker-compose.yml) y [`docs/ARQUITECTURA.md`](ARQUITECTURA.md).
