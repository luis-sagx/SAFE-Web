import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../../../../generated/entrenamiento/client';
import type { SusResponse } from '../../../../generated/entrenamiento/client';
import { pseudonym } from '@comun';
import type { JwtPayload } from '@comun';
import { ASSESSMENT_VERSION } from '../assessments/questionnaire';
import { ASSESSMENT_SCENARIOS } from '../assessments/scenario-cohort';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSusResponseDto } from './create-sus-response.dto';
import { scoreSus, SUS_VERSION } from './sus-survey';

@Injectable()
export class SusService {
  constructor(private readonly prisma: PrismaService) {}

  async status(participantId: string) {
    const [response, runs, posttest] = await Promise.all([
      this.prisma.susResponse.findUnique({
        where: {
          participantId_version: {
            participantId,
            version: SUS_VERSION,
          },
        },
        select: { id: true },
      }),
      this.prisma.scenarioRun.findMany({
        where: { participantId },
        select: { scenarioId: true },
        distinct: ['scenarioId'],
      }),
      this.prisma.assessment.findUnique({
        where: {
          participantId_version_phase: {
            participantId,
            version: ASSESSMENT_VERSION,
            phase: 'POST',
          },
        },
        select: { id: true },
      }),
    ]);
    const attempted = new Set(runs.map((run) => run.scenarioId));

    return {
      version: SUS_VERSION,
      available:
        !!posttest && ASSESSMENT_SCENARIOS.every((id) => attempted.has(id)),
      completed: !!response,
    };
  }

  async create(participant: JwtPayload, dto: CreateSusResponseDto) {
    const status = await this.status(participant.sub);
    if (!status.available) {
      throw new ConflictException(
        'Completa todos los escenarios y la evaluación final antes de responder la encuesta.',
      );
    }
    if (status.completed) {
      throw new ConflictException('Ya enviaste la encuesta de usabilidad.');
    }

    try {
      await this.prisma.susResponse.create({
        data: {
          participantId: participant.sub,
          participantSeq: participant.seq,
          version: dto.version,
          answers: dto.answers,
          score: scoreSus(dto.answers),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ya enviaste la encuesta de usabilidad.');
      }
      throw error;
    }
    return this.status(participant.sub);
  }

  async results() {
    const responses: SusResponse[] = await this.prisma.susResponse.findMany({
      where: { version: SUS_VERSION },
      orderBy: { participantSeq: 'asc' },
    });
    return responses.map((response) => ({
      pseudonym: pseudonym(response.participantSeq),
      version: response.version,
      answers: response.answers,
      score: response.score,
    }));
  }
}
