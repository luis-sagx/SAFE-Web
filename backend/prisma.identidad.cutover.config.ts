import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/identidad/schema.prisma',
  migrations: {
    path: 'prisma/identidad/cutover-migrations',
  },
  datasource: {
    url: process.env.IDENTIDAD_DATABASE_URL as string,
    shadowDatabaseUrl: process.env.IDENTIDAD_SHADOW_DATABASE_URL,
  },
});
