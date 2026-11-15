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
    // Cada servicio tiene su propia URL, rol y base lógica; el schema se
    // conserva dentro de su base. El rol `entrenamiento` no puede conectarse
    // a esta base, así que ni siquiera con SQL crudo podría leer datos personales.
    url: process.env.IDENTIDAD_DATABASE_URL as string,
    shadowDatabaseUrl: process.env.IDENTIDAD_SHADOW_DATABASE_URL,
  },
});
