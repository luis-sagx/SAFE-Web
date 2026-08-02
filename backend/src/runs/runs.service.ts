import { Injectable } from '@nestjs/common';
import { seudonimo } from '../auth/seudonimo';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRunDto } from './dto/create-run.dto';

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

  create(participantId: string, dto: CreateRunDto) {
    return this.prisma.scenarioRun.create({
      data: {
        participantId,
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
  async exportCsv(): Promise<string> {
    const runs = await this.prisma.scenarioRun.findMany({
      orderBy: [{ participantId: 'asc' }, { finishedAt: 'asc' }],
      // `select` explícito y no `include`: así agregar un campo personal al
      // modelo nunca lo filtra al CSV por accidente. Del participante salen
      // exactamente dos cosas, y ninguna lo identifica.
      include: { participant: { select: { seq: true, cohort: true } } },
    });

    const rows = runs.map((run) =>
      [
        seudonimo(run.participant.seq),
        run.participant.cohort ?? '',
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
