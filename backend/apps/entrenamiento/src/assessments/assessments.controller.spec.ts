import type { INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { configureApp, type JwtPayload } from '@comun';
import { PrismaService } from '../prisma/prisma.service';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';
import type { CreateAssessmentDto } from './create-assessment.dto';

interface StoredAssessment extends CreateAssessmentDto {
  participantId: string;
  participantSeq: number;
  score: number;
}

// La base es la única frontera externa: rutas, DTO, guardias y puntuación son reales.
describe('Contrato HTTP de las evaluaciones', () => {
  let app: INestApplication;
  let jwt: JwtService;
  const rows: StoredAssessment[] = [];
  const submission = {
    phase: 'PRE',
    version: 1,
    ageRange: '18 - 29 años',
    gender: 'Femenino',
    answers: [1, 2, 0, 2, 0, 1, 0, 2, 1, 2, 0, 2, 1, 2, 0, 1, 2, 1, 2, 1, 0],
  };
  const server = () => request(app.getHttpServer() as App);
  const token = (role = 'PARTICIPANT', sub = 'owner', seq = 77) =>
    jwt.signAsync({ sub, seq, role, typ: 'access' } satisfies JwtPayload);

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        JwtModule.register({ secret: 'synthetic-assessment-test-only' }),
      ],
      controllers: [AssessmentsController],
      providers: [
        AssessmentsService,
        {
          provide: PrismaService,
          useValue: {
            assessment: {
              findMany: ({
                where,
              }: {
                where: { version: number; participantId?: string };
              }) =>
                Promise.resolve(
                  rows.filter(
                    (row) =>
                      row.version === where.version &&
                      (!where.participantId ||
                        row.participantId === where.participantId),
                  ),
                ),
              create: ({ data }: { data: StoredAssessment }) => {
                rows.push(data);
                return Promise.resolve(data);
              },
            },
            assessmentBaselineExemption: {
              findUnique: () => Promise.resolve(null),
              findMany: () => Promise.resolve([]),
            },
            scenarioRun: { findMany: () => Promise.resolve([]) },
          },
        },
      ],
    }).compile();
    jwt = module.get(JwtService);
    app = configureApp(module.createNestApplication());
    await app.init();
  });
  beforeEach(() => {
    rows.length = 0;
  });
  afterAll(async () => app.close());

  it.each([
    '/api/assessments/questionnaire',
    '/api/assessments/status',
    '/api/assessments/results',
  ])('exige autenticación para %s', async (path) => {
    await server().get(path).expect(401);
  });
  it('exige autenticación para enviar respuestas', async () => {
    await server().post('/api/assessments').send(submission).expect(401);
    expect(rows).toHaveLength(0);
  });
  it('rechaza un refresh token aunque la firma sea válida', async () => {
    const refresh = await jwt.signAsync({ sub: 'owner', typ: 'refresh' });
    await server()
      .get('/api/assessments/questionnaire')
      .set('Authorization', `Bearer ${refresh}`)
      .expect(401);
  });
  it.each(['TRAINER', 'ADMIN'])(
    'impide que %s contamine las respuestas del estudio',
    async (role) => {
      const access = await token(role);
      await server()
        .get('/api/assessments/questionnaire')
        .set('Authorization', `Bearer ${access}`)
        .expect(403);
      await server()
        .get('/api/assessments/status')
        .set('Authorization', `Bearer ${access}`)
        .expect(403);
      await server()
        .post('/api/assessments')
        .set('Authorization', `Bearer ${access}`)
        .send(submission)
        .expect(403);
      expect(rows).toHaveLength(0);
    },
  );
  it('entrega preguntas sin la clave privada de corrección', async () => {
    const res = await server()
      .get('/api/assessments/questionnaire')
      .set('Authorization', `Bearer ${await token()}`)
      .expect(200);
    const body = res.body as { questions: { id: number; options: string[] }[] };
    expect(body.questions).toHaveLength(21);
    expect(body.questions.map((question) => question.id)).toEqual(
      Array.from({ length: 21 }, (_, index) => index + 1),
    );
    expect(
      body.questions.every((question) => question.options.length === 4),
    ).toBe(true);
    expect(res.text).not.toContain('answerKey');
  });
  it.each([
    { participantId: 'victim' },
    { participantSeq: 9 },
    { score: 21 },
    { answers: [] },
    { answers: Array.from({ length: 21 }, () => 4) },
    { version: 2 },
  ])('rechaza envío manipulado sin guardar datos %j', async (override) => {
    await server()
      .post('/api/assessments')
      .set('Authorization', `Bearer ${await token()}`)
      .send({ ...submission, ...override })
      .expect(400);
    expect(rows).toHaveLength(0);
  });
  it('guarda la identidad del JWT y solo devuelve estado al participante', async () => {
    const access = await token();
    const res = await server()
      .post('/api/assessments')
      .set('Authorization', `Bearer ${access}`)
      .send(submission)
      .expect(201);
    expect(rows[0]).toMatchObject({
      participantId: 'owner',
      participantSeq: 77,
      score: 21,
    });
    expect(res.body as unknown).toMatchObject({
      pretestCompleted: true,
      pretestRequired: false,
      posttestAvailable: false,
    });
    expect(res.body as unknown).not.toHaveProperty('score');
    expect(res.text).not.toContain('owner');
    await server()
      .post('/api/assessments')
      .set('Authorization', `Bearer ${access}`)
      .send(submission)
      .expect(409);
    expect(rows).toHaveLength(1);
  });
  it('consulta el estado propio sin mezclar evaluaciones de otra cuenta', async () => {
    await server()
      .post('/api/assessments')
      .set('Authorization', `Bearer ${await token()}`)
      .send(submission)
      .expect(201);
    const res = await server()
      .get('/api/assessments/status')
      .set('Authorization', `Bearer ${await token('PARTICIPANT', 'other', 78)}`)
      .expect(200);
    expect(res.body as unknown).toMatchObject({
      pretestRequired: true,
      pretestCompleted: false,
    });
  });
  it.each(['PARTICIPANT', 'TRAINER'])(
    'no revela resultados administrativos al rol %s',
    async (role) => {
      await server()
        .get('/api/assessments/results')
        .set('Authorization', `Bearer ${await token(role)}`)
        .expect(403);
    },
  );
  it('permite exportar resultados al administrador solo con seudónimo', async () => {
    await server()
      .post('/api/assessments')
      .set('Authorization', `Bearer ${await token()}`)
      .send(submission)
      .expect(201);
    const res = await server()
      .get('/api/assessments/results')
      .set('Authorization', `Bearer ${await token('ADMIN')}`)
      .expect(200);
    expect(res.body as unknown).toEqual([
      expect.objectContaining({
        pseudonym: 'P077',
        pretest: expect.objectContaining({ score: 21 }) as unknown,
        posttest: null,
        improvement: null,
      }),
    ]);
    expect(res.text).not.toContain('owner');
    expect(res.text).not.toContain('participantId');
    expect(res.text).not.toContain('participantSeq');
  });
});
