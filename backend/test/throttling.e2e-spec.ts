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
      .useValue({
        enviarCertificado: () => Promise.resolve(true),
        sendPasswordReset: () => Promise.resolve(true),
      })
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

  it('corta el sexto intento de login a la misma cuenta', async () => {
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

  // Un aula sale por una sola IP pública (NAT): el límite de login es por
  // cuenta, así que 30 personas pueden entrar en el mismo minuto.
  it('no bloquea a cuentas distintas que salen por la misma IP', async () => {
    const login = (email: string) =>
      server()
        .post('/api/auth/login')
        .set('X-Forwarded-For', '203.0.113.10')
        .send({ email, password: 'adivinando' });

    for (let i = 0; i < 10; i++) {
      expect((await login(`alumno${i}@ejemplo.ec`)).status).toBe(401);
    }
  });

  // Cambiar de IP no reinicia el cubo: la fuerza bruta contra una cuenta
  // sigue cortada aunque venga repartida desde varias.
  it('mantiene el límite de una cuenta aunque cambie la IP', async () => {
    const login = (ip: string) =>
      server()
        .post('/api/auth/login')
        .set('X-Forwarded-For', ip)
        .send({ email: 'victima@ejemplo.ec', password: 'adivinando' });

    for (let i = 0; i < 5; i++) await login(`203.0.113.${20 + i}`);

    expect((await login('203.0.113.99')).status).toBe(429);
  });

  // Docker consulta el health check cada 30 s con su propia sonda.
  it('no aplica el límite estricto al health check', async () => {
    for (let i = 0; i < 10; i++) {
      await server().get('/api/health').expect(200);
    }
  });

  // Mismo límite que login (issue #256). Probar muchos correos distintos
  // buscando cuáles existen lo corta el techo por IP de nginx, no Nest.
  it('corta el sexto intento de forgot-password al mismo correo', async () => {
    const attempt = () =>
      server()
        .post('/api/auth/forgot-password')
        .send({ email: 'quien-sea@ejemplo.ec' });

    const responses: Awaited<ReturnType<typeof attempt>>[] = [];
    for (let i = 0; i < 6; i++) {
      responses.push(await attempt());
    }

    expect(responses.slice(0, 5).map((r) => r.status)).toEqual([
      204, 204, 204, 204, 204,
    ]);
    expect(responses[5].status).toBe(429);
  });
});
