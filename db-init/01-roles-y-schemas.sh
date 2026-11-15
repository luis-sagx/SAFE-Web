#!/bin/sh
# Prepara dos bases aisladas. En un volumen existente se puede invocar a mano;
# nunca borra ni migra datos.
set -eu

: "${POSTGRES_USER:?falta POSTGRES_USER}"
: "${POSTGRES_DB:?falta POSTGRES_DB}"
: "${IDENTIDAD_DB_NAME:?falta IDENTIDAD_DB_NAME}"
: "${ENTRENAMIENTO_DB_NAME:?falta ENTRENAMIENTO_DB_NAME}"
: "${IDENTIDAD_DB_PASSWORD:?falta IDENTIDAD_DB_PASSWORD}"
: "${ENTRENAMIENTO_DB_PASSWORD:?falta ENTRENAMIENTO_DB_PASSWORD}"

check_name() {
  case "$1" in
    ''|*[!a-zA-Z0-9_]* )
      echo "Nombre de base no válido: $1" >&2
      exit 1
      ;;
  esac
  if [ "${#1}" -gt 63 ]; then
    echo 'El nombre de base excede los 63 bytes permitidos por PostgreSQL.' >&2
    exit 1
  fi
}

check_name "$POSTGRES_DB"
check_name "$IDENTIDAD_DB_NAME"
check_name "$ENTRENAMIENTO_DB_NAME"

if [ "$IDENTIDAD_DB_NAME" = "$ENTRENAMIENTO_DB_NAME" ] ||
  [ "$POSTGRES_DB" = "$IDENTIDAD_DB_NAME" ] ||
  [ "$POSTGRES_DB" = "$ENTRENAMIENTO_DB_NAME" ]; then
  echo 'La base de mantenimiento/origen y las bases de servicio deben ser distintas.' >&2
  exit 1
fi

if { [ -n "${IDENTIDAD_SHADOW_DB_NAME:-}" ] &&
  [ -z "${ENTRENAMIENTO_SHADOW_DB_NAME:-}" ]; } ||
  { [ -z "${IDENTIDAD_SHADOW_DB_NAME:-}" ] &&
    [ -n "${ENTRENAMIENTO_SHADOW_DB_NAME:-}" ]; }; then
  echo 'Configura las dos bases sombra locales o ninguna.' >&2
  exit 1
fi

for database in "${IDENTIDAD_SHADOW_DB_NAME:-}" "${ENTRENAMIENTO_SHADOW_DB_NAME:-}"; do
  [ -z "$database" ] && continue
  check_name "$database"
  if [ "$database" = "$POSTGRES_DB" ] ||
    [ "$database" = "$IDENTIDAD_DB_NAME" ] ||
    [ "$database" = "$ENTRENAMIENTO_DB_NAME" ]; then
    echo 'Las bases sombra deben tener nombres propios.' >&2
    exit 1
  fi
done

database_exists() {
  result=$(psql --no-psqlrc --tuples-only --no-align \
    --username "$POSTGRES_USER" --dbname postgres \
    --command="SELECT 1 FROM pg_database WHERE datname = '$1'") || {
    echo 'No se pudo consultar el catálogo de bases; no se hicieron cambios.' >&2
    exit 1
  }
  [ "$result" = 1 ]
}

database_has_objects() {
  database=$1
  schema=$2
  result=$(psql --no-psqlrc --tuples-only --no-align \
    --username "$POSTGRES_USER" --dbname "$database" \
    --command="SELECT EXISTS (
      SELECT 1
      FROM pg_class AS relation
      JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
      WHERE namespace.nspname NOT IN ('pg_catalog', 'information_schema')
        AND namespace.nspname NOT LIKE 'pg_toast%'
    ) OR EXISTS (
      SELECT 1 FROM pg_namespace
      WHERE nspname NOT IN ('pg_catalog', 'information_schema', 'public', '$schema')
        AND nspname NOT LIKE 'pg_toast%'
    )") || {
    echo "No se pudo revisar la base destino $database; no se hicieron cambios." >&2
    exit 1
  }
  [ "$result" = t ]
}

preflight_database() {
  database=$1
  owner=$2
  schema=$3

  if ! database_exists "$database"; then
    return 0
  fi

  if database_has_objects "$database" "$schema"; then
    echo "La base destino $database ya contiene objetos; no se modificó." >&2
    exit 1
  fi

  current_owner=$(psql --no-psqlrc --tuples-only --no-align \
    --username "$POSTGRES_USER" --dbname postgres \
    --command="SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname = '$database'")
  if [ "$current_owner" != "$owner" ]; then
    echo "La base destino $database ya existe con otro propietario; no se modificó." >&2
    exit 1
  fi

  current_schema_owner=$(psql --no-psqlrc --tuples-only --no-align \
    --username "$POSTGRES_USER" --dbname "$database" \
    --command="SELECT pg_get_userbyid(namespace.nspowner)
      FROM pg_namespace AS namespace WHERE namespace.nspname = '$schema'")
  if [ -n "$current_schema_owner" ] && [ "$current_schema_owner" != "$owner" ]; then
    echo "El esquema $schema en $database ya tiene otro propietario; no se modificó." >&2
    exit 1
  fi
}

preflight_database "$IDENTIDAD_DB_NAME" identidad identidad
preflight_database "$ENTRENAMIENTO_DB_NAME" entrenamiento entrenamiento

if [ -n "${IDENTIDAD_SHADOW_DB_NAME:-}" ]; then
  preflight_database "$IDENTIDAD_SHADOW_DB_NAME" identidad identidad
  preflight_database "$ENTRENAMIENTO_SHADOW_DB_NAME" entrenamiento entrenamiento
fi

psql --no-psqlrc --set=ON_ERROR_STOP=1 --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --set=identidad_password="$IDENTIDAD_DB_PASSWORD" \
  --set=entrenamiento_password="$ENTRENAMIENTO_DB_PASSWORD" <<'EOSQL'
SELECT format('CREATE ROLE identidad LOGIN PASSWORD %L', :'identidad_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'identidad')
\gexec
ALTER ROLE identidad WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD :'identidad_password';

SELECT format('CREATE ROLE entrenamiento LOGIN PASSWORD %L', :'entrenamiento_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'entrenamiento')
\gexec
ALTER ROLE entrenamiento WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD :'entrenamiento_password';
EOSQL

create_database() {
  database=$1
  owner=$2

  if ! database_exists "$database"; then
    createdb --username "$POSTGRES_USER" --owner "$owner" "$database"
  fi
}

create_database "$IDENTIDAD_DB_NAME" identidad
create_database "$ENTRENAMIENTO_DB_NAME" entrenamiento

if [ -n "${IDENTIDAD_SHADOW_DB_NAME:-}" ]; then
  create_database "$IDENTIDAD_SHADOW_DB_NAME" identidad
  create_database "$ENTRENAMIENTO_SHADOW_DB_NAME" entrenamiento
fi

configure_database() {
  database=$1
  owner=$2
  other=$3
  schema=$4

  psql --no-psqlrc --set=ON_ERROR_STOP=1 --username "$POSTGRES_USER" \
    --dbname postgres \
    --command="REVOKE ALL ON DATABASE \"$database\" FROM PUBLIC, $other; GRANT CONNECT ON DATABASE \"$database\" TO $owner"

  psql --no-psqlrc --set=ON_ERROR_STOP=1 --username "$POSTGRES_USER" \
    --dbname "$database" <<EOSQL
  REVOKE ALL ON SCHEMA public FROM PUBLIC, $other;
  CREATE SCHEMA IF NOT EXISTS $schema AUTHORIZATION $owner;
  ALTER SCHEMA $schema OWNER TO $owner;
  REVOKE ALL ON SCHEMA $schema FROM $other;
EOSQL
}

configure_database "$IDENTIDAD_DB_NAME" identidad entrenamiento identidad
configure_database "$ENTRENAMIENTO_DB_NAME" entrenamiento identidad entrenamiento

if [ -n "${IDENTIDAD_SHADOW_DB_NAME:-}" ]; then
  configure_database "$IDENTIDAD_SHADOW_DB_NAME" identidad entrenamiento identidad
  configure_database "$ENTRENAMIENTO_SHADOW_DB_NAME" entrenamiento identidad entrenamiento
fi

# En un volumen existente POSTGRES_DB identifica el origen; en uno nuevo es la
# base de mantenimiento. Ningún rol de aplicación necesita conectarse ahí.
psql --no-psqlrc --set=ON_ERROR_STOP=1 --username "$POSTGRES_USER" \
  --dbname postgres \
  --command="REVOKE ALL ON DATABASE \"$POSTGRES_DB\" FROM PUBLIC, identidad, entrenamiento"

echo 'Bases y permisos preparados. Los datos del origen no se copiaron ni borraron.'
