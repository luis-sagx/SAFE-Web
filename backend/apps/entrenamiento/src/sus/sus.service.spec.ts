import { ConflictException } from '@nestjs/common';
import { validate } from 'class-validator';
import type { JwtPayload } from '@comun';
import type { PrismaService } from '../prisma/prisma.service';
import { CreateSusResponseDto } from './create-sus-response.dto';
import { SusService } from './sus.service';
import { SUS_VERSION } from './sus-survey';
import { ASSESSMENT_SCENARIOS } from '../assessments/scenario-cohort';

const participant: JwtPayload = {
  sub: 'private-id',
  seq: 7,
  role: 'PARTICIPANT',
  typ: 'access',
};
const answers = [3, 2, 4, 1, 5, 1, 4, 2, 5, 1];

function fixture({ ids = [] as string[], existing = false } = {}) {
  const rows: Array<Record<string, unknown>> = existing
    ? [
        {
          participantId: participant.sub,
          participantSeq: participant.seq,
          version: SUS_VERSION,
          answers,
          score: 85,
        },
      ]
    : [];
  const prisma = {
    susResponse: {
      findUnique: () => Promise.resolve(rows[0] ?? null),
      findMany: () => Promise.resolve(rows),
      create: ({ data }: { data: Record<string, unknown> }) => {
        rows.push(data);
        return Promise.resolve(data);
      },
    },
    scenarioRun: {
      findMany: () =>
        Promise.resolve(ids.map((scenarioId) => ({ scenarioId }))),
    },
  } as unknown as PrismaService;
  return { service: new SusService(prisma), rows };
}

describe('Encuesta SUS', () => {
  it('habilita la encuesta al intentar todos los escenarios sin depender de aprobación o postest', async () => {
    expect(
      await fixture({ ids: [...ASSESSMENT_SCENARIOS] }).service.status(
        participant.sub,
      ),
    ).toEqual({ version: SUS_VERSION, available: true, completed: false });
  });

  it('mantiene la encuesta pendiente hasta intentar el último escenario', async () => {
    expect(
      await fixture({ ids: ASSESSMENT_SCENARIOS.slice(0, -1) }).service.status(
        participant.sub,
      ),
    ).toEqual({ version: SUS_VERSION, available: false, completed: false });
  });

  it('rechaza envíos antes de terminar la cohorte', async () => {
    await expect(
      fixture().service.create(participant, { version: SUS_VERSION, answers }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('calcula el SUS estándar y toma participante y seudónimo del JWT', async () => {
    const { service, rows } = fixture({ ids: [...ASSESSMENT_SCENARIOS] });
    const status = await service.create(participant, {
      version: SUS_VERSION,
      answers,
    });

    expect(rows[0]).toMatchObject({
      participantId: 'private-id',
      participantSeq: 7,
      version: SUS_VERSION,
      answers,
      score: 85,
    });
    expect(status).toEqual({
      version: SUS_VERSION,
      available: true,
      completed: true,
    });
    expect(JSON.stringify(status)).not.toContain('private-id');
  });

  it('rechaza una segunda entrega para la misma versión', async () => {
    await expect(
      fixture({
        ids: [...ASSESSMENT_SCENARIOS],
        existing: true,
      }).service.create(participant, { version: SUS_VERSION, answers }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('exporta respuestas y puntaje solo con seudónimo', async () => {
    const row = {
      participantId: 'private-id',
      participantSeq: 7,
      version: SUS_VERSION,
      answers,
      score: 85,
      submittedAt: new Date('2026-10-14T12:00:00.000Z'),
    };
    const { service } = fixture();
    const prisma = (service as unknown as { prisma: PrismaService }).prisma;
    jest
      .spyOn(prisma.susResponse, 'findMany')
      .mockResolvedValue([row] as never);

    const results = await service.results();
    expect(results).toEqual([
      { pseudonym: 'P007', version: SUS_VERSION, answers, score: 85 },
    ]);
    expect(JSON.stringify(results)).not.toContain('private-id');
    expect(JSON.stringify(results)).not.toContain('participantSeq');
  });
});

describe('CreateSusResponseDto', () => {
  it('exige diez respuestas enteras entre uno y cinco', async () => {
    const dto = Object.assign(new CreateSusResponseDto(), {
      version: SUS_VERSION,
      answers,
    });
    expect(await validate(dto)).toEqual([]);
    for (const invalidAnswers of [
      answers.slice(0, 9),
      [...answers, 3],
      [0, ...answers.slice(1)],
      [6, ...answers.slice(1)],
      [1.5, ...answers.slice(1)],
    ]) {
      const invalid = Object.assign(new CreateSusResponseDto(), {
        version: SUS_VERSION,
        answers: invalidAnswers,
      });
      expect(await validate(invalid)).not.toEqual([]);
    }
  });
});
