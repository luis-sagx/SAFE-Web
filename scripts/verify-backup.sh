#!/bin/sh
# Restaura un dump de servicio en PostgreSQL desechable y cuenta sus filas.
# Un respaldo que nunca se restauró no está probado; correr una vez al mes:
#
#   scripts/verify-backup.sh identidad <archivo-identidad.dump>
#   scripts/verify-backup.sh entrenamiento <archivo-entrenamiento.dump>
#
# No toca el Compose ni el volumen persistente: usa un contenedor independiente,
# en memoria y con credenciales de prueba, que se elimina al terminar.
set -eu

if [ "$#" -ne 2 ]; then
  echo 'uso: verify-backup.sh <identidad|entrenamiento> <archivo.dump>' >&2
  exit 2
fi

service=$1
dump=$2
[ -r "$dump" ] || { echo "no se puede leer $dump" >&2; exit 1; }

case "$service" in
  identidad)
    database=safeweb_identidad
    ;;
  entrenamiento)
    database=safeweb_entrenamiento
    ;;
  *)
    echo "servicio no válido: $service (usa identidad o entrenamiento)" >&2
    exit 2
    ;;
esac

cd "$(dirname "$0")/.."
name="safe-web-verify-$service-$$"

# Nombres y contraseñas desechables: el contenedor no publica puertos y vive
# sobre tmpfs. Se usa el bootstrap real para validar roles, bases y permisos.
docker run -d --rm --name "$name" --tmpfs /var/lib/postgresql \
  -e POSTGRES_USER=verify -e POSTGRES_PASSWORD=verify -e POSTGRES_DB=verify \
  -e IDENTIDAD_DB_NAME=safeweb_identidad \
  -e ENTRENAMIENTO_DB_NAME=safeweb_entrenamiento \
  -e IDENTIDAD_DB_PASSWORD=verify -e ENTRENAMIENTO_DB_PASSWORD=verify \
  -v "$PWD/db-init:/docker-entrypoint-initdb.d:ro" \
  postgres:18-alpine >/dev/null
trap 'docker rm -f "$name" >/dev/null 2>&1 || true' EXIT

ready=false
attempt=0
while [ "$attempt" -lt 60 ]; do
  attempt=$((attempt + 1))
  if docker exec "$name" pg_isready -h 127.0.0.1 -U verify -d verify >/dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 1
done
[ "$ready" = true ] || { echo 'PostgreSQL desechable no quedó listo.' >&2; exit 1; }

# El archivo se restaura solo en la base asignada al servicio indicado. `clean`
# quita únicamente los objetos del dump dentro del contenedor vacío.
docker exec -i "$name" pg_restore --list < "$dump" >/dev/null
docker exec -i "$name" pg_restore -U verify -d "$database" \
  --clean --if-exists --exit-on-error < "$dump"

case "$service" in
  identidad)
    docker exec "$name" psql -v ON_ERROR_STOP=1 -U verify -d "$database" \
      -At -F ' ' -c "
        SELECT 'participantes', count(*) FROM identidad.\"Participant\"
        UNION ALL SELECT 'certificados', count(*) FROM identidad.\"Certificate\""
    ;;
  entrenamiento)
    docker exec "$name" psql -v ON_ERROR_STOP=1 -U verify -d "$database" \
      -At -F ' ' -c "
        SELECT 'corridas', count(*) FROM entrenamiento.\"ScenarioRun\"
        UNION ALL SELECT 'reinicios', count(*) FROM entrenamiento.\"ModuleReset\""
    ;;
esac

echo "restauración OK ($service): $dump"
