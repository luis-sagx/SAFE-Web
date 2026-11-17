import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/entrenamiento/schema.prisma',
  migrations: {
    path: 'prisma/entrenamiento/cutover-migrations',
  },
  datasource: {
    url: process.env.ENTRENAMIENTO_DATABASE_URL as string,
    shadowDatabaseUrl: process.env.ENTRENAMIENTO_SHADOW_DATABASE_URL,
  },
});
