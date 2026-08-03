import { Injectable } from '@nestjs/common';
import type { JwtPayload } from '@comun';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRunDto } from './dto/create-run.dto';
import { seudonimo } from './seudonimo';

const CSV_COLUMNS = [
  'seudonimo',
  'cohort',
  'scenarioId',
  'version',
  'outcome',
  'score',
  'endingId',
  'durationMs',
  'startedAt',
  'finishedAt',
] as const;

@Injectable()
export class RunsService {
  constructor(private readonly prisma: PrismaService) {}

  create(participante: JwtPayload, dto: CreateRunDto) {
    return this.prisma.scenarioRun.create({
      data: {
        participantId: participante.sub,
        participantSeq: participante.seq,
        participantCohort: participante.cohort,
        scenarioId: dto.scenarioId,
        version: dto.version,
        outcome: dto.outcome,
        score: dto.score,
        endingId: dto.endingId,
        durationMs: dto.durationMs,
        startedAt: new Date(dto.startedAt),
        decisions: dto.decisions ?? [],
      },
      select: { id: true, scenarioId: true, outcome: true, score: true },
    });
  }

  findMine(participantId: string) {
    return this.prisma.scenarioRun.findMany({
      where: { participantId },
      orderBy: { finishedAt: 'desc' },
      select: {
        id: true,
        scenarioId: true,
        version: true,
        outcome: true,
        score: true,
        endingId: true,
        durationMs: true,
        finishedAt: true,
      },
    });
  }

  /// Exporta todas las corridas en CSV para el análisis pre/post-test. Sale el
  /// código pseudónimo, nunca un dato personal: es la llave con la que el
  /// investigador cruza estos resultados con las respuestas de Forms.
  ///
  /// Ya no hay `join` con el participante ni forma de hacerlo: los datos
  /// personales viven en otro servicio, en otro schema, bajo otro rol de
  /// Postgres. Este método no podría filtrarlos aunque se escribiera mal.
  async exportCsv(): Promise<string> {
    const runs = await this.prisma.scenarioRun.findMany({
      orderBy: [{ participantSeq: 'asc' }, { finishedAt: 'asc' }],
    });

    const rows = runs.map((run) =>
      [
        seudonimo(run.participantSeq),
        run.participantCohort ?? '',
        run.scenarioId,
        run.version,
        run.outcome,
        run.score,
        run.endingId,
        run.durationMs,
        run.startedAt.toISOString(),
        run.finishedAt.toISOString(),
      ]
        .map((cell) => {
          const value = String(cell);
          return /[",\n]/.test(value)
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        })
        .join(','),
    );

    return [CSV_COLUMNS.join(','), ...rows].join('\n');
  }
}
