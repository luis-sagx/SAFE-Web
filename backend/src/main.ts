import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configurarApp } from './app.setup';

async function bootstrap() {
  const app = configurarApp(await NestFactory.create(AppModule));

  // En producción comparten origen vía Nginx; CORS solo hace falta en dev.
  const origins = process.env.CORS_ORIGINS?.split(',').filter(Boolean) ?? [];
  if (origins.length > 0) {
    app.enableCors({ origin: origins, credentials: false });
  }

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
