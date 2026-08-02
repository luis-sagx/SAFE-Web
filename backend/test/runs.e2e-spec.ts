import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  corrida,
  crearApp,
  cuerpo,
  limpiar,
  registro,
  type CorridaBody,
  type SesionBody,
} from './app.e2e';

describe('Corridas (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let participantId: string;
  let tokenOtro: string;

  const server = () => request(app.getHttpServer() as App);

  beforeAll(async () => {
    ({ app, prisma } = await crearApp());
    await limpiar(prisma);

    const uno = cuerpo<SesionBody>(
      await server().post('/api/auth/register').send(registro('runs-1')),
    );
    token = uno.accessToken;
    participantId = uno.participant.id;

    const dos = cuerpo<SesionBody>(
      await server().post('/api/auth/register').send(registro('runs-2')),
    );
    tokenOtro = dos.accessToken;
  });

  afterAll(async () => {
    await limpiar(prisma);
    await app.close();
  });

  it('guarda una corrida y devuelve el resumen', async () => {
    const res = await server()
      .post('/api/runs')
      .set('Authorization', `Bearer ${token}`)
      .send(corrida())
      .expect(201);

    const resumen = cuerpo<CorridaBody>(res);
    expect(resumen).toMatchObject({
      scenarioId: 'suplantacion/cambio-numero',
      outcome: 'CORRECTO',
      score: 100,
    });

    const guardada = await prisma.scenarioRun.findUnique({
      where: { id: resumen.id },
    });
    expect(guardada?.participantId).toBe(participantId);
    expect(guardada?.decisions).toEqual([{ desde: 'n1', hacia: 'n2' }]);
  });

  it('exige token para escribir', async () => {
    await server().post('/api/runs').send(corrida()).expect(401);
  });

  // Aceptarlo del cuerpo dejaría escribir a nombre de otro participante.
  it('rechaza un participantId enviado en el cuerpo', async () => {
    await server()
      .post('/api/runs')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...corrida(), participantId: 'otro-id' })
      .expect(400);
  });

  it.each([
    ['scenarioId con formato libre', { scenarioId: 'sin-barra' }],
    ['puntaje fuera de rango', { score: 101 }],
    ['resultado que no está en el enum', { outcome: 'MAS_O_MENOS' }],
    ['fecha de inicio inválida', { startedAt: 'ayer' }],
    ['duración negativa', { durationMs: -1 }],
    ['versión cero', { version: 0 }],
  ])('rechaza la corrida con %s', async (_caso, override) => {
    await server()
      .post('/api/runs')
      .set('Authorization', `Bearer ${token}`)
      .send(corrida(override))
      .expect(400);
  });

  it('GET /api/runs/me solo devuelve las corridas propias', async () => {
    await server()
      .post('/api/runs')
      .set('Authorization', `Bearer ${tokenOtro}`)
      .send(
        corrida({
          scenarioId: 'phishing/factura-sri',
          outcome: 'INCORRECTO',
          score: 0,
        }),
      )
      .expect(201);

    const res = await server()
      .get('/api/runs/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const mias = cuerpo<CorridaBody[]>(res);
    expect(mias.length).toBeGreaterThan(0);
    for (const run of mias) {
      expect(run.scenarioId).not.toBe('phishing/factura-sri');
    }
  });

  describe('GET /api/runs/export.csv', () => {
    it('responde 403 a un participante', async () => {
      await server()
        .get('/api/runs/export.csv')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('responde 401 sin token', async () => {
      await server().get('/api/runs/export.csv').expect(401);
    });

    it('entrega el CSV pseudonimizado al investigador', async () => {
      await prisma.participant.update({
        where: { id: participantId },
        data: { role: 'RESEARCHER' },
      });

      // El rol viaja en el token: hace falta uno nuevo tras el cambio.
      const sesion = cuerpo<SesionBody>(
        await server()
          .post('/api/auth/login')
          .send({
            email: registro('runs-1').email,
            password: 'clave-larga-123',
          })
          .expect(200),
      );

      const res = await server()
        .get('/api/runs/export.csv')
        .set('Authorization', `Bearer ${sesion.accessToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text.split('\n')[0]).toBe(
        'seudonimo,cohort,scenarioId,version,outcome,score,endingId,durationMs,startedAt,finishedAt',
      );
      expect(res.text).toMatch(/\nP\d{3},/);

      // La garantía de privacidad, contra la base real.
      expect(res.text).not.toContain('María');
      expect(res.text).not.toContain('@ejemplo.com');
      expect(res.text).not.toContain('0991234567');
    });
  });
});
