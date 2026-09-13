import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../apps/identidad/src/app.module';
import { configureApp } from '@comun';
import { MailService } from '../apps/identidad/src/mail/mail.service';
import { PrismaService } from '../apps/identidad/src/prisma/prisma.service';
import { responseBody, cleanDatabase, type ErrorBody } from './identidad.e2e';

/// Única suite con el límite activo: es lo que protege el login contra fuerza
/// bruta (OWASP Authentication).
describe('Límite de peticiones (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const server = () => request(app.getHttpServer() as App);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Sin RESEND_API_KEY en CI, MailService.getOrThrow tumbaría el arranque
      // (ver createTestApp() en identidad.e2e.ts, mismo override).
      .overrideProvider(MailService)
      .useValue({ enviarCertificado: () => Promise.resolve(true) })
      .compile();

    app = configureApp(moduleRef.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);
    await cleanDatabase(prisma);
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  it('corta el sexto intento de login del mismo origen', async () => {
    const attempt = () =>
      server()
        .post('/api/auth/login')
        .send({ email: 'atacante@ejemplo.ec', password: 'adivinando' });

    const responses: Awaited<ReturnType<typeof attempt>>[] = [];
    for (let i = 0; i < 6; i++) {
      responses.push(await attempt());
    }

    expect(responses.slice(0, 5).map((r) => r.status)).toEqual([
      401, 401, 401, 401, 401,
    ]);
    expect(responses[5].status).toBe(429);

    // Toda la app está en español; el 429 no puede llegar con el mensaje en
    // inglés que trae @nestjs/throttler por defecto.
    expect(responseBody<ErrorBody>(responses[5]).message).toBe(
      'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.',
    );
  });

  // El límite es por IP, no un cubo global. Depende de `trust proxy` (app.setup):
  // sin él Express ignora X-Forwarded-For y todo cae en el mismo cubo, con lo
  // que un atacante bloquearía el login de todos.
  it('aísla el límite por IP de X-Forwarded-For', async () => {
    const login = (ip: string) =>
      server()
        .post('/api/auth/login')
        .set('X-Forwarded-For', ip)
        .send({ email: 'otro@ejemplo.ec', password: 'adivinando' });

    // Agota el cubo de una IP.
    for (let i = 0; i < 6; i++) await login('203.0.113.10');

    // Otra IP sigue teniendo sus intentos: 401 (credenciales), no 429 (límite).
    expect((await login('203.0.113.20')).status).toBe(401);
  });

  // Docker consulta el health check cada 30 s con su propia sonda.
  it('no aplica el límite estricto al health check', async () => {
    for (let i = 0; i < 10; i++) {
      await server().get('/api/health').expect(200);
    }
  });
});
