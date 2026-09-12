import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { PrismaService } from '../apps/entrenamiento/src/prisma/prisma.service';
import {
  run,
  createTestApp,
  responseBody,
  cleanDatabase,
  type RunBody,
  type TestEnvironment,
  type ProgressBody,
} from './entrenamiento.e2e';

describe('Corridas (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: TestEnvironment['token'];
  let mariaToken: string;
  let otherToken: string;

  const server = () => request(app.getHttpServer() as App);

  beforeAll(async () => {
    ({ app, prisma, token } = await createTestApp());
    await cleanDatabase(prisma);

    mariaToken = await token({ sub: 'maria', seq: 7 });
    otherToken = await token({ sub: 'otro', seq: 8 });
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  // El servicio de identidad no está levantado en esta suite. Que todo lo de
  // abajo funcione es la prueba de que `entrenamiento` verifica el token
  // localmente y no depende de `identidad` en tiempo de ejecución.
  it('acepta un token firmado sin levantar el servicio de identidad', async () => {
    const res = await server()
      .post('/api/runs')
      .set('Authorization', `Bearer ${mariaToken}`)
      .send(run())
      .expect(201);

    const summary = responseBody<RunBody>(res);
    expect(summary).toMatchObject({
      scenarioId: 'phishing/factura-sri',
      outcome: 'CORRECTO',
      score: 100,
    });

    const saved = await prisma.scenarioRun.findUnique({
      where: { id: summary.id },
    });
    expect(saved?.participantId).toBe('maria');
    expect(saved?.decisions).toEqual([{ desde: 'n1', hacia: 'n2' }]);
  });

  // El seudónimo se copia del token, no del cuerpo: es lo que permite mostrar
  // los resultados sin consultar jamás al servicio de identidad.
  it('etiqueta la corrida con el seudónimo del token', async () => {
    const res = await server()
      .post('/api/runs')
      .set('Authorization', `Bearer ${mariaToken}`)
      .send(run({ scenarioId: 'phishing/clave-caducada' }))
      .expect(201);

    const saved = await prisma.scenarioRun.findUnique({
      where: { id: responseBody<RunBody>(res).id },
    });
    expect(saved?.participantSeq).toBe(7);
  });

  it('exige token para escribir', async () => {
    await server().post('/api/runs').send(run()).expect(401);
  });

  // Aceptarlos del cuerpo dejaría escribir a nombre de otro participante o
  // falsear el seudónimo del análisis.
  it.each([
    ['participantId', { participantId: 'otro-id' }],
    ['participantSeq', { participantSeq: 999 }],
  ])('rechaza %s enviado en el cuerpo', async (_case, override) => {
    await server()
      .post('/api/runs')
      .set('Authorization', `Bearer ${mariaToken}`)
      .send({ ...run(), ...override })
      .expect(400);
  });

  it.each([
    ['scenarioId con formato libre', { scenarioId: 'sin-barra' }],
    ['puntaje fuera de rango', { score: 101 }],
    ['resultado que no está en el enum', { outcome: 'MAS_O_MENOS' }],
    ['fecha de inicio inválida', { startedAt: 'ayer' }],
    ['duración negativa', { durationMs: -1 }],
    ['versión cero', { version: 0 }],
  ])('rechaza la corrida con %s', async (_case, override) => {
    await server()
      .post('/api/runs')
      .set('Authorization', `Bearer ${mariaToken}`)
      .send(run(override))
      .expect(400);
  });

  it('GET /api/runs/me solo devuelve las corridas propias', async () => {
    await server()
      .post('/api/runs')
      .set('Authorization', `Bearer ${otherToken}`)
      .send(
        run({
          scenarioId: 'phishing/rol-de-pagos',
          outcome: 'INCORRECTO',
          score: 0,
        }),
      )
      .expect(201);

    const res = await server()
      .get('/api/runs/me')
      .set('Authorization', `Bearer ${mariaToken}`)
      .expect(200);

    const ownRuns = responseBody<RunBody[]>(res);
    expect(ownRuns.length).toBeGreaterThan(0);
    for (const run of ownRuns) {
      expect(run.scenarioId).not.toBe('phishing/rol-de-pagos');
    }
  });

  describe('GET /api/runs/resultados', () => {
    it('responde 403 a un participante', async () => {
      await server()
        .get('/api/runs/resultados')
        .set('Authorization', `Bearer ${mariaToken}`)
        .expect(403);
    });

    it('responde 401 sin token', async () => {
      await server().get('/api/runs/resultados').expect(401);
    });

    it('entrega las corridas seudonimizadas al supervisor', async () => {
      const supervisor = await token({ role: 'SUPERVISOR' });

      const res = await server()
        .get('/api/runs/resultados')
        .set('Authorization', `Bearer ${supervisor}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('application/json');

      const rows = responseBody<Array<Record<string, unknown>>>(res);
      const pseudonymSeven = rows.find((f) => f.seudonimo === 'P007');
      expect(pseudonymSeven).toMatchObject({
        seudonimo: 'P007',
      });

      // La garantía de privacidad, contra la base real. Este servicio no tiene
      // ninguna tabla con datos personales ni permiso sobre el schema que las
      // tiene: no hay forma de que salgan.
      const text = res.text;
      expect(text).not.toContain('María');
      expect(text).not.toContain('@ejemplo.ec');
      expect(text).not.toContain('0991234567');
    });
  });

  describe('GET /api/runs/progreso/:modulo', () => {
    it('exige token', async () => {
      await server().get('/api/runs/progreso/phishing').expect(401);
    });

    it('responde 404 para un módulo que no existe', async () => {
      const ownToken = await token({ sub: 'progreso-1', seq: 50 });
      await server()
        .get('/api/runs/progreso/no-existe')
        .set('Authorization', `Bearer ${ownToken}`)
        .expect(404);
    });

    it('sin corridas, progreso vacío y no aprobado', async () => {
      const ownToken = await token({ sub: 'progreso-2', seq: 51 });
      const res = await server()
        .get('/api/runs/progreso/phishing')
        .set('Authorization', `Bearer ${ownToken}`)
        .expect(200);

      expect(responseBody<ProgressBody>(res)).toEqual({
        modulo: 'phishing',
        escenarios: [],
        aprobados: 0,
        requeridos: 6,
        aprobado: false,
        ronda: 1,
        rondaEnCurso: null,
      });
    });

    it('usa el último intento de cada escenario y no mezcla a otro participante', async () => {
      const ownToken = await token({ sub: 'progreso-3', seq: 52 });
      const other = await token({ sub: 'progreso-3-otro', seq: 53 });

      // Repite el mismo escenario: la corrida más reciente es la que cuenta.
      await server()
        .post('/api/runs')
        .set('Authorization', `Bearer ${ownToken}`)
        .send(
          run({
            scenarioId: 'phishing/factura-sri',
            outcome: 'INCORRECTO',
            score: 0,
          }),
        )
        .expect(201);
      await server()
        .post('/api/runs')
        .set('Authorization', `Bearer ${ownToken}`)
        .send(
          run({
            scenarioId: 'phishing/factura-sri',
            outcome: 'CORRECTO',
            score: 100,
          }),
        )
        .expect(201);

      // De otro participante: no debe colarse en el progreso de "propio".
      await server()
        .post('/api/runs')
        .set('Authorization', `Bearer ${other}`)
        .send(
          run({
            scenarioId: 'phishing/clave-caducada',
            outcome: 'CORRECTO',
            score: 100,
          }),
        )
        .expect(201);

      const res = await server()
        .get('/api/runs/progreso/phishing')
        .set('Authorization', `Bearer ${ownToken}`)
        .expect(200);

      const progress = responseBody<ProgressBody>(res);
      expect(progress.escenarios).toEqual([
        { id: 'phishing/factura-sri', ultimoOutcome: 'CORRECTO' },
      ]);
      expect(progress.aprobados).toBe(1);
      expect(progress.aprobado).toBe(false);
    });
  });
});
