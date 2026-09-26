#!/bin/sh
# Restaura un respaldo en un Postgres desechable y cuenta filas. Un respaldo
# que nunca se restauró no está probado; correr una vez al mes:
#
#   scripts/verify-backup.sh /var/backups/safe-web/safe-web-AAAAMMDD-HHMMSS.dump
#
# No toca la base real ni el volumen `pgdata`: el contenedor vive en memoria
# (tmpfs) y se borra al terminar. Usa el mismo db-init que producción, así
# también comprueba que el dump se restaura sobre los roles de verdad.
set -eu

dump="${1:?uso: verify-backup.sh <archivo.dump>}"
[ -r "$dump" ] || { echo "no se puede leer $dump" >&2; exit 1; }

cd "$(dirname "$0")/.."
name="safe-web-verify-$$"

# Contraseñas de usar y tirar: el contenedor no publica puertos y dura
# segundos.
docker run -d --rm --name "$name" --tmpfs /var/lib/postgresql \
  -e POSTGRES_USER=verify -e POSTGRES_PASSWORD=verify -e POSTGRES_DB=verify \
  -e IDENTIDAD_DB_PASSWORD=verify -e ENTRENAMIENTO_DB_PASSWORD=verify \
  -v "$PWD/db-init:/docker-entrypoint-initdb.d:ro" \
  postgres:18-alpine >/dev/null
trap 'docker rm -f "$name" >/dev/null 2>&1' EXIT

# El entrypoint reinicia Postgres tras correr db-init: se espera a que acepte
# conexiones por TCP, que solo abre el servidor definitivo.
until docker exec "$name" pg_isready -h 127.0.0.1 -U verify -d verify >/dev/null 2>&1; do
  sleep 1
done

# --clean: db-init ya creó los schemas vacíos; se reemplazan por los del dump.
docker exec -i "$name" pg_restore -U verify -d verify --clean --if-exists \
  --exit-on-error < "$dump"

docker exec "$name" psql -U verify -d verify -At -F ' ' -c "
  SELECT 'participantes', count(*) FROM identidad.\"Participant\"
  UNION ALL SELECT 'certificados', count(*) FROM identidad.\"Certificate\"
  UNION ALL SELECT 'corridas', count(*) FROM entrenamiento.\"ScenarioRun\"
  UNION ALL SELECT 'reinicios', count(*) FROM entrenamiento.\"ModuleReset\""
echo "restauración OK: $dump"
