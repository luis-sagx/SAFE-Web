#!/bin/sh
# Aislamiento de datos entre microservicios, a nivel de Postgres.
#
# Cada servicio recibe su propio rol y su propio schema, y NINGUNO tiene
# permiso sobre el schema del otro. Esto es lo que convierte la regla "la
# exportación del estudio no puede contener datos personales" en una
# imposibilidad técnica: el servicio de entrenamiento no puede leer la tabla
# de participantes ni con SQL crudo, porque su rol no la alcanza.
#
# Postgres ejecuta este script una sola vez, al inicializar el volumen. Si
# cambias los roles después, hay que recrear el volumen (`docker compose down -v`).
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE ROLE identidad LOGIN PASSWORD '${IDENTIDAD_DB_PASSWORD}';
  CREATE SCHEMA identidad AUTHORIZATION identidad;

  CREATE ROLE entrenamiento LOGIN PASSWORD '${ENTRENAMIENTO_DB_PASSWORD}';
  CREATE SCHEMA entrenamiento AUTHORIZATION entrenamiento;

  -- Sin esto, cualquier rol podría crear objetos en el schema public y
  -- usarlo como terreno común. No hay nada que compartir entre servicios.
  REVOKE ALL ON SCHEMA public FROM PUBLIC;

  -- Prisma necesita crear una base de datos sombra al correr \`migrate dev\`
  -- en desarrollo. En producción solo se usa \`migrate deploy\`, que no la
  -- necesita, pero el permiso no da acceso a datos ajenos.
  ALTER ROLE identidad CREATEDB;
  ALTER ROLE entrenamiento CREATEDB;
EOSQL
