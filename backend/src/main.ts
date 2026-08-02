import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // forbidNonWhitelisted rechaza cualquier campo fuera del DTO: es lo que
  // impide que un cliente escriba datos arbitrarios en la tabla del estudio.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // En producción comparten origen vía Nginx; CORS solo hace falta en dev.
  const origins = process.env.CORS_ORIGINS?.split(',').filter(Boolean) ?? [];
  if (origins.length > 0) {
    app.enableCors({ origin: origins, credentials: false });
  }

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
