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
const correct = [1, 2, 0, 2, 0, 1, 0, 2, 1, 2, 0, 2, 1, 2, 0, 1, 2, 1, 2, 1, 0];
const dto = {
  phase: 'PRE' as const,
  version: 1,
  ageRange: '18 - 29 años',
  gender: 'Femenino',
  answers: correct,
  consentAccepted: true,
  consentVersion: '2026-10-14',
};
function fixture({
  prior = false,
  ids = [] as string[],
  phases = [] as string[],
} = {}) {
  const rows = phases.map((phase) => ({
    ...dto,
    phase,
    participantId: participant.sub,
    participantSeq: 7,
    score: phase === 'PRE' ? 10 : 20,
  }));
  const exempt = prior
    ? [{ participantId: participant.sub, participantSeq: 7 }]
    : [];
  const prisma = {
    assessment: {
      findMany: () => Promise.resolve(rows),
      create: ({ data }: { data: (typeof rows)[number] }) => {
        rows.push(data);
        return Promise.resolve(data);
      },
    },
    assessmentBaselineExemption: {
      findUnique: () => Promise.resolve(exempt[0] ?? null),
      findMany: () => Promise.resolve(exempt),
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
  it('habilita final sin inicial solo para la instantánea anterior', async () => {
    expect(
      await fixture({
        prior: true,
        ids: [...ASSESSMENT_SCENARIOS],
      }).service.status(participant.sub),
    ).toMatchObject({
      pretestRequired: false,
      baselineMissing: true,
      posttestAvailable: true,
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
  it('rechaza inicial tardía en una cuenta migrada', async () => {
    await expect(
      fixture({ prior: true }).service.create(participant, dto),
    ).rejects.toBeInstanceOf(ConflictException);
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
      consentAccepted: true,
      consentVersion: '2026-10-14',
    });
    expect(status).toMatchObject({
      pretestCompleted: true,
      pretestRequired: false,
    });
    expect(status).not.toHaveProperty('score');
  });
  it('exporta pares con cambio y sin identificador interno', async () => {
    const [row] = await fixture({ phases: ['PRE', 'POST'] }).service.results();
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
      prior: true,
      phases: ['POST'],
    }).service.results();
    expect(row).toMatchObject({
      baselineMissing: true,
      pretest: null,
      improvement: null,
    });
    expect(
      (await fixture({ prior: true }).service.results())[0].posttest,
    ).toBeNull();
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
