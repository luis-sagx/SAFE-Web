import { ConflictException } from '@nestjs/common';
import { validate } from 'class-validator';
import type { JwtPayload } from '@comun';
import type { PrismaService } from '../prisma/prisma.service';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto } from './create-assessment.dto';
import { QUESTIONNAIRE, scoreAssessment } from './questionnaire';
import { ASSESSMENT_SCENARIOS } from './scenario-cohort';
const participant: JwtPayload = {
  sub: 'private-id',
  seq: 7,
  role: 'PARTICIPANT',
  typ: 'access',
};
const correct = [1, 0, 0, 2, 1, 1, 2, 0, 1, 2, 0, 2, 1, 2, 0, 1, 2, 1, 2, 0, 0];
const dto = {
  phase: 'PRE' as const,
  version: 1,
  ageRange: '18 - 29 años',
  gender: 'Femenino',
  answers: correct,
};
function fixture({ ids = [] as string[], phases = [] as string[] } = {}) {
  const rows = phases.map((phase) => ({
    ...dto,
    phase,
    participantId: participant.sub,
    participantSeq: 7,
    answerRows: [],
    score: phase === 'PRE' ? 10 : 20,
  }));
  const prisma = {
    assessment: {
      findMany: () => Promise.resolve(rows),
      create: ({ data }: { data: (typeof rows)[number] }) => {
        rows.push(data);
        return Promise.resolve(data);
      },
    },
    scenarioRun: {
      findMany: () =>
        Promise.resolve(ids.map((scenarioId) => ({ scenarioId }))),
    },
  } as unknown as PrismaService;
  return { service: new AssessmentsService(prisma), rows };
}
describe('Evaluaciones del estudio', () => {
  it('puntúa aciertos sin dar puntos a la incertidumbre', () => {
    expect(scoreAssessment(correct)).toBe(21);
    expect(scoreAssessment(Array.from({ length: 21 }, () => 3))).toBe(0);
    expect(QUESTIONNAIRE.questions).toHaveLength(21);
    expect(JSON.stringify(QUESTIONNAIRE)).not.toContain('answerKey');
  });
  it('exige inicial a una cuenta sin excepción aunque existan corridas posteriores', async () => {
    expect(
      await fixture({ ids: [...ASSESSMENT_SCENARIOS] }).service.status(
        participant.sub,
      ),
    ).toMatchObject({
      pretestRequired: true,
      baselineMissing: false,
      posttestAvailable: false,
    });
  });
  it('no permite omitir la inicial aunque se hayan jugado todos los escenarios', async () => {
    expect(
      await fixture({
        ids: [...ASSESSMENT_SCENARIOS],
      }).service.status(participant.sub),
    ).toMatchObject({
      pretestRequired: true,
      baselineMissing: false,
      posttestAvailable: false,
    });
  });
  it('no confunde 52 identificadores inventados con completar escenarios publicados', async () => {
    expect(
      (
        await fixture({
          phases: ['PRE'],
          ids: Array.from({ length: 52 }, (_, i) => `phishing/inventado-${i}`),
        }).service.status(participant.sub)
      ).posttestAvailable,
    ).toBe(false);
  });
  it('requiere también el último escenario de la cohorte', async () => {
    expect(
      (
        await fixture({
          phases: ['PRE'],
          ids: [...ASSESSMENT_SCENARIOS].slice(0, 51),
        }).service.status(participant.sub)
      ).posttestAvailable,
    ).toBe(false);
  });
  it('permite enviar PRE cuando todavía no hay una evaluación', async () => {
    await expect(
      fixture().service.create(participant, dto),
    ).resolves.toMatchObject({
      pretestCompleted: true,
    });
  });
  it('rechaza final antes de terminar o segunda respuesta', async () => {
    await expect(
      fixture({ phases: ['PRE'] }).service.create(participant, {
        ...dto,
        phase: 'POST',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      fixture({ phases: ['PRE'] }).service.create(participant, dto),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it('guarda puntaje e identificador del token sin revelarlos al participante', async () => {
    const { service, rows } = fixture();
    const status = await service.create(participant, dto);
    expect(rows[0]).toMatchObject({
      participantId: 'private-id',
      participantSeq: 7,
      score: 21,
      consentAccepted: null,
      consentVersion: null,
      answerRows: {
        create: correct.map((answer, index) => ({
          questionId: index + 1,
          answer,
        })),
      },
    });
    expect(rows[0]).not.toHaveProperty('answers');
    expect(status).toMatchObject({
      pretestCompleted: true,
      pretestRequired: false,
    });
    expect(status).not.toHaveProperty('score');
  });
  it('acepta respuestas sin nueva constancia de consentimiento', async () => {
    expect(
      await validate(Object.assign(new CreateAssessmentDto(), dto)),
    ).toEqual([]);
  });
  it('conserva la constancia válida de clientes anteriores', async () => {
    const legacy = {
      ...dto,
      consentAccepted: true,
      consentVersion: '2026-10-14',
    };
    expect(
      await validate(Object.assign(new CreateAssessmentDto(), legacy)),
    ).toEqual([]);
    const { service, rows } = fixture();
    await service.create(participant, legacy);
    expect(rows[0]).toMatchObject({
      consentAccepted: true,
      consentVersion: '2026-10-14',
    });
  });
  it('exporta pares con cambio y sin identificador interno', async () => {
    const { service, rows } = fixture({ phases: ['PRE', 'POST'] });
    rows[0].answerRows = correct.map((answer, index) => ({
      questionId: index + 1,
      answer,
    }));
    rows[1].answerRows = correct.map((answer, index) => ({
      questionId: index + 1,
      answer,
    }));
    rows[0].answers = [];
    rows[1].answers = [];
    const [row] = await service.results();
    expect(row).toMatchObject({
      pseudonym: 'P007',
      improvement: 10,
      baselineMissing: false,
    });
    expect(JSON.stringify(row)).not.toContain('private-id');
    expect(row).not.toHaveProperty('participantSeq');
  });
  it('mantiene sin comparación los finales sin inicial y pendientes migrados', async () => {
    const [row] = await fixture({
      phases: ['POST'],
    }).service.results();
    expect(row).toMatchObject({
      baselineMissing: true,
      pretest: null,
      improvement: null,
    });
    expect(await fixture().service.results()).toEqual([]);
  });
  it('no usa el arreglo legacy cuando no hay filas relacionales', async () => {
    const { service, rows } = fixture({ phases: ['PRE'] });
    const row = rows[0] as (typeof rows)[number] & {
      answerRows: { questionId: number; answer: number }[];
    };
    row.answerRows = [];

    const [result] = await service.results();

    expect(result.pretest?.answers).toEqual([]);
  });
  it.each([
    { answers: [] },
    { answers: [...correct.slice(0, 20), 4] },
    { gender: '' },
    { ageRange: '' },
    { consentAccepted: false },
    { consentVersion: 'antigua' },
    { phase: 'OTRA' },
    { version: 2 },
  ])('valida todas las respuestas y consentimiento %j', async (override) => {
    expect(
      (await validate(Object.assign(new CreateAssessmentDto(), dto, override)))
        .length,
    ).toBeGreaterThan(0);
  });
});
