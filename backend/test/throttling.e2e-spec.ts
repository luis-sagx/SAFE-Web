import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../apps/identidad/src/app.module';
import { configurarApp } from '@comun';
import { PrismaService } from '../apps/identidad/src/prisma/prisma.service';
import { limpiar } from './identidad.e2e';

/// Única suite con el límite activo: es lo que protege el login contra fuerza
/// bruta (OWASP Authentication).
describe('Límite de peticiones (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const server = () => request(app.getHttpServer() as App);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = configurarApp(moduleRef.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);
    await limpiar(prisma);
  });

  afterAll(async () => {
    await limpiar(prisma);
    await app.close();
  });

  it('corta el sexto intento de login del mismo origen', async () => {
    const intento = () =>
      server()
        .post('/api/auth/login')
        .send({ email: 'atacante@ejemplo.com', password: 'adivinando' });

    const codigos: number[] = [];
    for (let i = 0; i < 6; i++) {
      codigos.push((await intento()).status);
    }

    expect(codigos.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
    expect(codigos[5]).toBe(429);
  });

  // Docker consulta el health check cada 30 s con su propia sonda.
  it('no aplica el límite estricto al health check', async () => {
    for (let i = 0; i < 10; i++) {
      await server().get('/api/health').expect(200);
    }
  });
});
