import request from 'supertest';
import type { App } from 'supertest/types';
import {
  createTestApp,
  cleanDatabase,
  responseBody,
  run,
  type TestEnvironment,
} from './entrenamiento.e2e';
import { ASSESSMENT_SCENARIOS } from '../apps/entrenamiento/src/assessments/scenario-cohort';

describe('Encuesta del estudio (e2e)', () => {
  let env: TestEnvironment;
  let access: string;
  const body = {
    phase: 'PRE',
    version: 1,
    ageRange: '18 - 29 años',
    gender: 'Femenino',
    answers: [1, 2, 0, 2, 0, 1, 0, 2, 1, 2, 0, 2, 1, 2, 0, 1, 2, 1, 2, 1, 0],
  };
  const server = () => request(env.app.getHttpServer() as App);
  beforeAll(async () => {
    env = await createTestApp();
    await cleanDatabase(env.prisma);
    access = await env.token({ sub: 'assessment-one', seq: 77 });
  });
  afterAll(async () => {
    await cleanDatabase(env.prisma);
    await env.app.close();
  });
  it('no permite omitir inicial desde API de corridas', async () => {
    await server()
      .post('/api/runs')
      .set('Authorization', `Bearer ${access}`)
      .send(run())
      .expect(409);
  });
  it('protege cuestionario y resultados por rol', async () => {
    await server().get('/api/assessments/questionnaire').expect(401);
    const tester = await env.token({ role: 'TRAINER' });
    await server()
      .get('/api/assessments/status')
      .set('Authorization', `Bearer ${tester}`)
      .expect(403);
    await server()
      .get('/api/assessments/results')
      .set('Authorization', `Bearer ${access}`)
      .expect(403);
    const res = await server()
      .get('/api/assessments/questionnaire')
      .set('Authorization', `Bearer ${access}`)
      .expect(200);
    expect(responseBody<{ questions: unknown[] }>(res).questions).toHaveLength(
      21,
    );
    expect(res.text).not.toContain('answerKey');
  });
  it.each([
    { participantId: 'otro' },
    { participantSeq: 9 },
    { answers: [] },
    { answers: Array.from({ length: 21 }, () => -1) },
    { consentAccepted: false },
    { consentVersion: 'antigua' },
  ])('rechaza datos manipulados %j', async (extra) => {
    await server()
      .post('/api/assessments')
      .set('Authorization', `Bearer ${access}`)
      .send({ ...body, ...extra })
      .expect(400);
  });
  it('una carrera guarda una sola inicial, puntúa servidor y desbloquea corridas', async () => {
    const responses = await Promise.all(
      [1, 2].map(() =>
        server()
          .post('/api/assessments')
          .set('Authorization', `Bearer ${access}`)
          .send(body),
      ),
    );
    expect(responses.map((res) => res.status).sort()).toEqual([201, 409]);
    const rows = await env.prisma.assessment.findMany({
      where: { participantId: 'assessment-one' },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      participantSeq: 77,
      score: 21,
      consentVersion: null,
      consentAccepted: null,
    });
    await server()
      .post('/api/runs')
      .set('Authorization', `Bearer ${access}`)
      .send(run())
      .expect(201);
  });
  it('conserva constancias válidas enviadas por clientes anteriores', async () => {
    const legacyConsent = await env.token({ sub: 'legacy-consent', seq: 79 });
    await server()
      .post('/api/assessments')
      .set('Authorization', `Bearer ${legacyConsent}`)
      .send({ ...body, consentAccepted: true, consentVersion: '2026-10-14' })
      .expect(201);
    expect(
      await env.prisma.assessment.findFirst({
        where: { participantId: 'legacy-consent' },
      }),
    ).toMatchObject({
      consentAccepted: true,
      consentVersion: '2026-10-14',
    });
    await env.prisma.assessment.deleteMany({
      where: { participantId: 'legacy-consent' },
    });
  });
  it('exige terminar cohortes y acepta final aunque todos los resultados sean incorrectos', async () => {
    await server()
      .post('/api/assessments')
      .set('Authorization', `Bearer ${access}`)
      .send({ ...body, phase: 'POST' })
      .expect(409);
    await env.prisma.scenarioRun.createMany({
      data: ASSESSMENT_SCENARIOS.map((scenarioId) => ({
        participantId: 'assessment-one',
        participantSeq: 77,
        scenarioId,
        version: 1,
        outcome: 'INCORRECTO',
        score: 0,
        endingId: 'fin',
        durationMs: 100,
        startedAt: new Date(),
      })),
    });
    await env.prisma.moduleReset.create({
      data: { participantId: 'assessment-one', module: 'phishing' },
    });
    await server()
      .post('/api/assessments')
      .set('Authorization', `Bearer ${access}`)
      .send({
        ...body,
        phase: 'POST',
        answers: Array.from({ length: 21 }, () => 3),
      })
      .expect(201);
    const admin = await env.token({ role: 'ADMIN' });
    const res = await server()
      .get('/api/assessments/results')
      .set('Authorization', `Bearer ${admin}`)
      .expect(200);
    expect(responseBody<unknown[]>(res)).toEqual([
      expect.objectContaining({
        pseudonym: 'P077',
        improvement: -21,
        baselineMissing: false,
      }),
    ]);
    expect(res.text).not.toContain('assessment-one');
    expect(res.text).not.toContain('participantId');
    expect(res.text).not.toContain('submittedAt');
  });
  it('cuentas sin medición previa conservan recorrido sin fabricar baseline', async () => {
    await env.prisma.assessmentBaselineExemption.create({
      data: { participantId: 'legacy', participantSeq: 78 },
    });
    const legacy = await env.token({ sub: 'legacy', seq: 78 });
    await server()
      .post('/api/runs')
      .set('Authorization', `Bearer ${legacy}`)
      .send(run())
      .expect(201);
    await server()
      .post('/api/assessments')
      .set('Authorization', `Bearer ${legacy}`)
      .send(body)
      .expect(409);
    const res = await server()
      .get('/api/assessments/status')
      .set('Authorization', `Bearer ${legacy}`)
      .expect(200);
    expect(responseBody<unknown>(res)).toMatchObject({
      baselineMissing: true,
      pretestRequired: false,
      posttestAvailable: false,
    });
  });
});
