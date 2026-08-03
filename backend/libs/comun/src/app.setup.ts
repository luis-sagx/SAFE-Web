import { INestApplication, ValidationPipe } from '@nestjs/common';

/// Aparte de main.ts para que las pruebas end-to-end levanten la misma app que
/// corre en el servidor, y para que los dos servicios se configuren igual.
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

/// Arranque compartido: misma configuración, mismo CORS, distinto puerto.
export async function arrancar(
  crear: () => Promise<INestApplication>,
  puertoPorDefecto: number,
): Promise<void> {
  const app = configurarApp(await crear());

  // En producción comparten origen vía Nginx; CORS solo hace falta en dev.
  const origins = process.env.CORS_ORIGINS?.split(',').filter(Boolean) ?? [];
  if (origins.length > 0) {
    app.enableCors({ origin: origins, credentials: false });
  }

  await app.listen(process.env.PORT ?? puertoPorDefecto);
}
