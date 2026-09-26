#!/bin/sh
# Respaldo diario de la base: pg_dump de los dos schemas, retención local y
# copia fuera del servidor. Pensado para cron en el servidor:
#
#   0 3 * * * /ruta/safe-web/scripts/backup-db.sh >> /var/log/safe-web-backup.log 2>&1
#
# Variables (todas opcionales):
#   BACKUP_DIR        carpeta local de respaldos        (/var/backups/safe-web)
#   BACKUP_KEEP_DAYS  días que se conservan localmente  (14)
#   BACKUP_REMOTE     destino de rclone, p. ej. `cifrado:safe-web`. Sin ella
#                     el respaldo queda solo en este disco, y muere con él.
#
# pg_dump y no una copia del volumen `pgdata`: copiar los archivos de un
# Postgres en marcha da un respaldo corrupto (el mismo problema de WAL que
# levantar dos composes sobre el volumen).
#
# El dump NO sirve sin PII_ENCRYPTION_KEY, EMAIL_PEPPER y CEDULA_PEPPER del
# .env: sin ellas nombres y correos quedan ilegibles y ninguna cédula vuelve a
# coincidir. Se respaldan aparte (gestor de contraseñas), nunca junto al dump:
# quien robe los dos tiene los datos personales en claro.
set -eu

dir="${BACKUP_DIR:-/var/backups/safe-web}"
keep="${BACKUP_KEEP_DAYS:-14}"
file="$dir/safe-web-$(date +%Y%m%d-%H%M%S).dump"

# Contiene hashes de contraseñas y huellas de cédula: solo lo lee el dueño.
umask 077
mkdir -p "$dir"

# Por etiqueta y no con `docker compose exec`: compose valida el .env entero
# antes de ejecutar nada, y una variable ajena que falte (la API key de un
# proveedor) dejaría al servidor sin respaldos. El proyecto se llama
# `safe-web` fijo en docker-compose.yml.
db="$(docker ps -q \
  --filter label=com.docker.compose.project="${COMPOSE_PROJECT_NAME:-safe-web}" \
  --filter label=com.docker.compose.service=db)"
[ -n "$db" ] || { echo "$(date -Is) ERROR: el contenedor db no está corriendo" >&2; exit 1; }

# Se escribe a un temporal y se renombra al final: un dump cortado a la mitad
# nunca queda con nombre de respaldo válido. Las credenciales se leen dentro
# del contenedor, así este script no necesita el .env.
trap 'rm -f "$file.part"' EXIT
docker exec "$db" sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -n identidad -n entrenamiento' \
  > "$file.part"
mv "$file.part" "$file"
echo "$(date -Is) respaldo $file ($(du -h "$file" | cut -f1))"

find "$dir" -name 'safe-web-*.dump' -mtime +"$keep" -delete

if [ -n "${BACKUP_REMOTE:-}" ]; then
  rclone copy "$file" "$BACKUP_REMOTE"
  echo "$(date -Is) copiado a $BACKUP_REMOTE"
else
  echo "$(date -Is) AVISO: sin BACKUP_REMOTE, el respaldo solo existe en este servidor" >&2
fi
