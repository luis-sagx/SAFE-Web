import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/identidad/schema.prisma',
  migrations: {
    path: 'prisma/identidad/migrations',
  },
  datasource: {
    // Se lee con process.env y no con el helper env() de Prisma a propósito:
    // env() lanza si la variable falta, y `prisma generate` debe poder correr
    // sin base de datos (build de Docker y pipeline de CI).
    //
    // Cada servicio tiene su propia URL, con su propio rol y su propio schema
    // de Postgres. No es cosmético: el rol `entrenamiento` no tiene permiso
    // sobre el schema `identidad`, así que ni siquiera con SQL crudo podría
    // leer un dato personal.
    url: process.env.IDENTIDAD_DATABASE_URL as string,
  },
});
