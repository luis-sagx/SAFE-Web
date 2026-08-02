import { INestApplication, ValidationPipe } from '@nestjs/common';

/// Aparte de main.ts para que las pruebas end-to-end levanten la misma app que
/// corre en el servidor.
export function configurarApp(app: INestApplication): INestApplication {
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

  return app;
}
