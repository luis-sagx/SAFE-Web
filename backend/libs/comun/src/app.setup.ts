import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';

/// Aparte de main.ts para que las pruebas end-to-end levanten la misma app que
/// corre en el servidor, y para que los dos servicios se configuren igual.
export function configurarApp(app: INestApplication): INestApplication {
  app.setGlobalPrefix('api');

  // Un solo salto de proxy (nginx) delante. Sin esto Express ignora
  // X-Forwarded-For y `req.ip` es la IP del contenedor de nginx: el límite de
  // 5 logins/min por IP colapsa a un único cubo global —un atacante bloquea el
  // login de todos— en vez de aislar por origen. El backend no está expuesto
  // fuera de nginx, así que confiar en 1 salto no permite falsear la IP.
  (app as NestExpressApplication).set('trust proxy', 1);

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
