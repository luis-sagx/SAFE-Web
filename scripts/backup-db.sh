#!/bin/sh
# Respaldo diario de cada base, retención local y copia fuera del servidor.
#
#   0 3 * * * /ruta/safe-web/scripts/backup-db.sh >> /var/log/safe-web-backup.log 2>&1
#
# Para respaldar la base compartida de origen antes de migrar sus schemas:
#   scripts/backup-db.sh --source
#
# Variables (todas opcionales):
#   BACKUP_DIR        carpeta local de respaldos       (/var/backups/safe-web)
#   BACKUP_KEEP_DAYS  días que se conservan localmente (14)
#   BACKUP_REMOTE     destino de rclone, p. ej. `cifrado:safe-web`
#
# Se guarda un archivo independiente por servicio con su schema e historial
# Prisma. Nunca se copia en caliente el volumen `pgdata` ni se modifica la DB.
# Los respaldos de migración usan el prefijo `safe-web-source-` y quedan fuera
# de la rotación; los dumps combinados anteriores tampoco se reemplazan.
#
# Los dumps de identidad incluyen hashes de contraseñas y huellas de cédula;
# no son suficientes sin PII_ENCRYPTION_KEY, EMAIL_PEPPER y CEDULA_PEPPER. Esas
# claves se respaldan aparte en un gestor de contraseñas, nunca junto al dump.
set -eu

if [ "$#" -gt 1 ] || { [ "$#" -eq 1 ] && [ "$1" != --source ]; }; then
  echo 'uso: backup-db.sh [--source]' >&2
  exit 2
fi
source_mode=false
[ "$#" -eq 0 ] || source_mode=true

dir="${BACKUP_DIR:-/var/backups/safe-web}"
keep="${BACKUP_KEEP_DAYS:-14}"
stamp=$(date -u +%Y%m%d-%H%M%S)
if [ "$source_mode" = true ]; then
  identity_file="$dir/safe-web-source-identidad-$stamp.dump"
  training_file="$dir/safe-web-source-entrenamiento-$stamp.dump"
else
  identity_file="$dir/safe-web-identidad-$stamp.dump"
  training_file="$dir/safe-web-entrenamiento-$stamp.dump"
fi

case "$keep" in
  ''|*[!0-9]*)
    echo 'BACKUP_KEEP_DAYS debe ser un número entero no negativo.' >&2
    exit 1
    ;;
esac

# Los dumps contienen datos personales; solo el dueño puede leerlos.
umask 077
mkdir -p "$dir"

if [ -e "$identity_file" ] || [ -e "$training_file" ]; then
  echo "Ya existe un respaldo con la marca de tiempo $stamp; no se sobrescribió." >&2
  exit 1
fi

# Se selecciona por etiqueta para no interpolar el .env completo de Compose.
db=$(docker ps -q \
  --filter label=com.docker.compose.project="${COMPOSE_PROJECT_NAME:-safe-web}" \
  --filter label=com.docker.compose.service=db)
[ -n "$db" ] || {
  echo "$(date -Is) ERROR: el contenedor db no está corriendo" >&2
  exit 1
}

identity_part=''
training_part=''
cleanup() {
  [ -z "$identity_part" ] || rm -f "$identity_part"
  [ -z "$training_part" ] || rm -f "$training_part"
}
trap cleanup EXIT
identity_part=$(mktemp "$dir/.safe-web-identidad-$stamp.XXXXXX")
training_part=$(mktemp "$dir/.safe-web-entrenamiento-$stamp.XXXXXX")

# Las credenciales y nombres de base se leen desde el entorno del contenedor;
# el host no necesita abrir ni imprimir el archivo .env. --source conserva los
# schemas de la base compartida al preparar la migración inicial.
if [ "$source_mode" = true ]; then
  docker exec "$db" sh -c \
    'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -n identidad' \
    > "$identity_part"
  docker exec "$db" sh -c \
    'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -n entrenamiento' \
    > "$training_part"
else
  docker exec "$db" sh -c \
    'pg_dump -U "$POSTGRES_USER" -d "$IDENTIDAD_DB_NAME" -Fc -n identidad' \
    > "$identity_part"
  docker exec "$db" sh -c \
    'pg_dump -U "$POSTGRES_USER" -d "$ENTRENAMIENTO_DB_NAME" -Fc -n entrenamiento' \
    > "$training_part"
fi

# Enlaces en el mismo directorio publican solo archivos completos y fallan si
# otro proceso ya creó el nombre, en vez de truncar un respaldo previo.
ln "$identity_part" "$identity_file"
if ! ln "$training_part" "$training_file"; then
  rm -f "$identity_file"
  echo 'No se pudo publicar el respaldo de entrenamiento; no se sobrescribió nada.' >&2
  exit 1
fi
rm -f "$identity_part" "$training_part"
identity_part=''
training_part=''

echo "$(date -Is) respaldo $identity_file ($(du -h "$identity_file" | cut -f1))"
echo "$(date -Is) respaldo $training_file ($(du -h "$training_file" | cut -f1))"
if [ "$source_mode" = true ]; then
  echo "$(date -Is) origen: POSTGRES_DB (modo previo a migración)"
else
  echo "$(date -Is) bases destino: IDENTIDAD_DB_NAME y ENTRENAMIENTO_DB_NAME"
fi

# La rotación solo considera dumps de servicio (`safe-web-identidad-*` y
# `safe-web-entrenamiento-*`); no toca fuentes de migración ni dumps antiguos.
find "$dir" -name 'safe-web-identidad-*.dump' -mtime +"$keep" -delete
find "$dir" -name 'safe-web-entrenamiento-*.dump' -mtime +"$keep" -delete

if [ -n "${BACKUP_REMOTE:-}" ]; then
  rclone copy "$identity_file" "$BACKUP_REMOTE"
  rclone copy "$training_file" "$BACKUP_REMOTE"
  echo "$(date -Is) copiados ambos respaldos a $BACKUP_REMOTE"
else
  echo "$(date -Is) AVISO: sin BACKUP_REMOTE, los respaldos solo existen en este servidor" >&2
fi
