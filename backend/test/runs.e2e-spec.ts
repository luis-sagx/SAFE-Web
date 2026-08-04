import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { PrismaService } from '../apps/entrenamiento/src/prisma/prisma.service';
import {
  corrida,
  crearApp,
  cuerpo,
  limpiar,
  type CorridaBody,
  type Entorno,
  type ProgresoBody,
} from './entrenamiento.e2e';

describe('Corridas (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: Entorno['token'];
  let deMaria: string;
  let deOtro: string;

  const server = () => request(app.getHttpServer() as App);

  beforeAll(async () => {
    ({ app, prisma, token } = await crearApp());
    await limpiar(prisma);

    deMaria = await token({ sub: 'maria', seq: 7, cohort: 'comerciantes' });
    deOtro = await token({ sub: 'otro', seq: 8 });
  });

  afterAll(async () => {
    await limpiar(prisma);
    await app.close();
  });

  // El servicio de identidad no está levantado en esta suite. Que todo lo de
  // abajo funcione es la prueba de que `entrenamiento` verifica el token
  // localmente y no depende de `identidad` en tiempo de ejecución.
  it('acepta un token firmado sin levantar el servicio de identidad', async () => {
    const res = await server()
      .post('/api/runs')
      .set('Authorization', `Bearer ${deMaria}`)
      .send(corrida())
      .expect(201);

    const resumen = cuerpo<CorridaBody>(res);
    expect(resumen).toMatchObject({
      scenarioId: 'phishing/factura-sri',
      outcome: 'CORRECTO',
      score: 100,
    });

    const guardada = await prisma.scenarioRun.findUnique({
      where: { id: resumen.id },
    });
    expect(guardada?.participantId).toBe('maria');
    expect(guardada?.decisions).toEqual([{ desde: 'n1', hacia: 'n2' }]);
  });

  // El seudónimo y la cohorte se copian del token, no del cuerpo: es lo que
  // permite exportar el CSV sin consultar jamás al servicio de identidad.
  it('etiqueta la corrida con el seudónimo y la cohorte del token', async () => {
    const res = await server()
      .post('/api/runs')
      .set('Authorization', `Bearer ${deMaria}`)
      .send(corrida({ scenarioId: 'phishing/clave-caducada' }))
      .expect(201);

    const guardada = await prisma.scenarioRun.findUnique({
      where: { id: cuerpo<CorridaBody>(res).id },
    });
    expect(guardada?.participantSeq).toBe(7);
    expect(guardada?.participantCohort).toBe('comerciantes');
  });

  it('exige token para escribir', async () => {
    await server().post('/api/runs').send(corrida()).expect(401);
  });

  // Aceptarlos del cuerpo dejaría escribir a nombre de otro participante o
  // falsear el seudónimo del análisis.
  it.each([
    ['participantId', { participantId: 'otro-id' }],
    ['participantSeq', { participantSeq: 999 }],
    ['participantCohort', { participantCohort: 'inventada' }],
  ])('rechaza %s enviado en el cuerpo', async (_caso, override) => {
    await server()
      .post('/api/runs')
      .set('Authorization', `Bearer ${deMaria}`)
      .send({ ...corrida(), ...override })
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
      .set('Authorization', `Bearer ${deMaria}`)
      .send(corrida(override))
      .expect(400);
  });

  it('GET /api/runs/me solo devuelve las corridas propias', async () => {
    await server()
      .post('/api/runs')
      .set('Authorization', `Bearer ${deOtro}`)
      .send(
        corrida({
          scenarioId: 'phishing/rol-de-pagos',
          outcome: 'INCORRECTO',
          score: 0,
        }),
      )
      .expect(201);

    const res = await server()
      .get('/api/runs/me')
      .set('Authorization', `Bearer ${deMaria}`)
      .expect(200);

    const mias = cuerpo<CorridaBody[]>(res);
    expect(mias.length).toBeGreaterThan(0);
    for (const run of mias) {
      expect(run.scenarioId).not.toBe('phishing/rol-de-pagos');
    }
  });

  describe('GET /api/runs/export.csv', () => {
    it('responde 403 a un participante', async () => {
      await server()
        .get('/api/runs/export.csv')
        .set('Authorization', `Bearer ${deMaria}`)
        .expect(403);
    });

    it('responde 401 sin token', async () => {
      await server().get('/api/runs/export.csv').expect(401);
    });

    it('entrega el CSV pseudonimizado al investigador', async () => {
      const investigador = await token({ role: 'RESEARCHER' });

      const res = await server()
        .get('/api/runs/export.csv')
        .set('Authorization', `Bearer ${investigador}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text.split('\n')[0]).toBe(
        'seudonimo,cohort,scenarioId,version,outcome,score,endingId,durationMs,startedAt,finishedAt',
      );
      expect(res.text).toContain('\nP007,comerciantes,');

      // La garantía de privacidad, contra la base real. Este servicio no tiene
      // ninguna tabla con datos personales ni permiso sobre el schema que las
      // tiene: no hay forma de que salgan.
      expect(res.text).not.toContain('María');
      expect(res.text).not.toContain('@ejemplo.com');
      expect(res.text).not.toContain('0991234567');
    });
  });

  describe('GET /api/runs/progreso/:modulo', () => {
    it('exige token', async () => {
      await server().get('/api/runs/progreso/phishing').expect(401);
    });

    it('responde 404 para un módulo que no existe', async () => {
      const propio = await token({ sub: 'progreso-1', seq: 50 });
      await server()
        .get('/api/runs/progreso/no-existe')
        .set('Authorization', `Bearer ${propio}`)
        .expect(404);
    });

    it('sin corridas, progreso vacío y no aprobado', async () => {
      const propio = await token({ sub: 'progreso-2', seq: 51 });
      const res = await server()
        .get('/api/runs/progreso/phishing')
        .set('Authorization', `Bearer ${propio}`)
        .expect(200);

      expect(cuerpo<ProgresoBody>(res)).toEqual({
        modulo: 'phishing',
        escenarios: [],
        aprobados: 0,
        requeridos: 6,
        aprobado: false,
      });
    });

    it('usa el último intento de cada escenario y no mezcla a otro participante', async () => {
      const propio = await token({ sub: 'progreso-3', seq: 52 });
      const otro = await token({ sub: 'progreso-3-otro', seq: 53 });

      // Repite el mismo escenario: la corrida más reciente es la que cuenta.
      await server()
        .post('/api/runs')
        .set('Authorization', `Bearer ${propio}`)
        .send(
          corrida({
            scenarioId: 'phishing/factura-sri',
            outcome: 'INCORRECTO',
            score: 0,
          }),
        )
        .expect(201);
      await server()
        .post('/api/runs')
        .set('Authorization', `Bearer ${propio}`)
        .send(
          corrida({
            scenarioId: 'phishing/factura-sri',
            outcome: 'CORRECTO',
            score: 100,
          }),
        )
        .expect(201);

      // De otro participante: no debe colarse en el progreso de "propio".
      await server()
        .post('/api/runs')
        .set('Authorization', `Bearer ${otro}`)
        .send(
          corrida({
            scenarioId: 'phishing/clave-caducada',
            outcome: 'CORRECTO',
            score: 100,
          }),
        )
        .expect(201);

      const res = await server()
        .get('/api/runs/progreso/phishing')
        .set('Authorization', `Bearer ${propio}`)
        .expect(200);

      const progreso = cuerpo<ProgresoBody>(res);
      expect(progreso.escenarios).toEqual([
        { id: 'phishing/factura-sri', ultimoOutcome: 'CORRECTO' },
      ]);
      expect(progreso.aprobados).toBe(1);
      expect(progreso.aprobado).toBe(false);
    });
  });
});
