import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Se lee con process.env y no con el helper env() de Prisma a propósito:
    // env() lanza si la variable falta, y `prisma generate` debe poder correr
    // sin base de datos (build de Docker y pipeline de CI).
    url: process.env.DATABASE_URL as string,
  },
});
