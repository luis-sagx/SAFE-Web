#!/bin/sh
# Comprueba que cada rol conecta solo a su base de servicio.
set -eu

set +e
docker compose exec -T db sh -c '
  identity_database=${IDENTIDAD_DB_NAME:-$POSTGRES_DB}
  training_database=${ENTRENAMIENTO_DB_NAME:?falta ENTRENAMIENTO_DB_NAME}

  PGPASSWORD="$IDENTIDAD_DB_PASSWORD" psql \
    --no-password --host=127.0.0.1 --username=identidad \
    --dbname="$identity_database" --command="SELECT 1" >/dev/null 2>&1 || exit 20

  PGPASSWORD="$ENTRENAMIENTO_DB_PASSWORD" psql \
    --no-password --host=127.0.0.1 --username=entrenamiento \
    --dbname="$training_database" --command="SELECT 1" >/dev/null 2>&1 || exit 21

  if PGPASSWORD="$ENTRENAMIENTO_DB_PASSWORD" psql \
    --no-password --host=127.0.0.1 --username=entrenamiento \
    --dbname="$identity_database" --command="SELECT 1" >/dev/null 2>&1; then
    exit 10
  fi

  if PGPASSWORD="$IDENTIDAD_DB_PASSWORD" psql \
    --no-password --host=127.0.0.1 --username=identidad \
    --dbname="$training_database" --command="SELECT 1" >/dev/null 2>&1; then
    exit 11
  fi
' >/dev/null
result=$?
set -e

case "$result" in
  0)
    echo 'OK: cada servicio solo puede conectarse a su propia base.'
    ;;
  10)
    echo 'FALLO: entrenamiento pudo conectarse a la base de identidad.' >&2
    exit 1
    ;;
  11)
    echo 'FALLO: identidad pudo conectarse a la base de entrenamiento.' >&2
    exit 1
    ;;
  20)
    echo 'FALLO: identidad no pudo conectarse a su propia base.' >&2
    exit 1
    ;;
  21)
    echo 'FALLO: entrenamiento no pudo conectarse a su propia base.' >&2
    exit 1
    ;;
  *)
    echo "FALLO: no se pudo comprobar el aislamiento (código $result)." >&2
    exit 1
    ;;
esac
