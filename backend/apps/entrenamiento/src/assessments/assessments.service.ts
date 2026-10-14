import { ConflictException, Injectable } from '@nestjs/common';
import { pseudonym } from '@comun';
import type { JwtPayload } from '@comun';
import { Prisma } from '../../../../generated/entrenamiento/client';
import type { Assessment } from '../../../../generated/entrenamiento/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssessmentDto } from './create-assessment.dto';
import { ASSESSMENT_VERSION, scoreAssessment } from './questionnaire';
import { ASSESSMENT_SCENARIOS } from './scenario-cohort';

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async status(participantId: string) {
    const [assessments, exemption, runs] = await Promise.all([
      this.prisma.assessment.findMany({
        where: { participantId, version: ASSESSMENT_VERSION },
      }),
      this.prisma.assessmentBaselineExemption.findUnique({
        where: { participantId },
      }),
      this.prisma.scenarioRun.findMany({
        where: { participantId },
        select: { scenarioId: true },
        distinct: ['scenarioId'],
      }),
    ]);
    const pretestCompleted = assessments.some((row) => row.phase === 'PRE');
    const posttestCompleted = assessments.some((row) => row.phase === 'POST');
    const baselineMissing = !!exemption && !pretestCompleted;
    const attempted = new Set(runs.map((run) => run.scenarioId));
    return {
      pretestRequired: !pretestCompleted && !exemption,
      baselineMissing,
      pretestCompleted,
      posttestAvailable:
        !posttestCompleted &&
        (pretestCompleted || baselineMissing) &&
        ASSESSMENT_SCENARIOS.every((id) => attempted.has(id)),
      posttestCompleted,
    };
  }

  async create(participant: JwtPayload, dto: CreateAssessmentDto) {
    const status = await this.status(participant.sub);
    if (dto.phase === 'PRE' && !status.pretestRequired) {
      throw new ConflictException(
        'La evaluación inicial ya existe o no corresponde a tu recorrido.',
      );
    }
    if (dto.phase === 'POST' && !status.posttestAvailable) {
      throw new ConflictException(
        'La evaluación final ya existe o aún debes terminar los escenarios.',
      );
    }
    try {
      await this.prisma.assessment.create({
        data: {
          participantId: participant.sub,
          participantSeq: participant.seq,
          version: dto.version,
          phase: dto.phase,
          ageRange: dto.ageRange,
          gender: dto.gender,
          answers: dto.answers,
          score: scoreAssessment(dto.answers),
          consentAccepted: dto.consentAccepted ?? null,
          consentVersion: dto.consentVersion ?? null,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ya enviaste esta evaluación.');
      }
      throw error;
    }
    return this.status(participant.sub);
  }

  async results() {
    const [assessments, exemptions] = await Promise.all([
      this.prisma.assessment.findMany({
        where: { version: ASSESSMENT_VERSION },
      }),
      this.prisma.assessmentBaselineExemption.findMany(),
    ]);
    const participants = new Map(
      exemptions.map((row) => [row.participantId, row.participantSeq]),
    );
    for (const row of assessments)
      participants.set(row.participantId, row.participantSeq);
    const byParticipant = new Map<string, Assessment[]>();
    for (const row of assessments) {
      const rows = byParticipant.get(row.participantId) ?? [];
      rows.push(row);
      byParticipant.set(row.participantId, rows);
    }
    const response = (row: Assessment | undefined) =>
      row
        ? {
            ageRange: row.ageRange,
            gender: row.gender,
            answers: row.answers,
            score: row.score,
          }
        : null;
    return [...participants]
      .sort((a, b) => a[1] - b[1])
      .map(([id, seq]) => {
        const rows = byParticipant.get(id) ?? [];
        const pretest = response(rows.find((row) => row.phase === 'PRE'));
        const posttest = response(rows.find((row) => row.phase === 'POST'));
        return {
          pseudonym: pseudonym(seq),
          version: ASSESSMENT_VERSION,
          baselineMissing: !pretest,
          pretest,
          posttest,
          improvement:
            pretest && posttest ? posttest.score - pretest.score : null,
        };
      });
  }
}
