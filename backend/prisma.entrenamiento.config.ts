import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/entrenamiento/schema.prisma',
  migrations: {
    path: 'prisma/entrenamiento/migrations',
  },
  datasource: {
    // Ver la nota en prisma.identidad.config.ts.
    url: process.env.ENTRENAMIENTO_DATABASE_URL as string,
  },
});
