import { Injectable, NotFoundException } from '@nestjs/common';
import type { JwtPayload } from '@comun';
import { Prisma } from '../../../../generated/entrenamiento/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRunDto } from './dto/create-run.dto';
import { calcularProgreso, UMBRALES } from './progreso';
import { seudonimo } from './seudonimo';

export interface ResultadoCorrida {
  seudonimo: string;
  cohort: string | null;
  scenarioId: string;
  version: number;
  outcome: string;
  score: number;
  endingId: string;
  durationMs: number;
  startedAt: string;
  finishedAt: string;
}

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
        decisions: (dto.decisions ?? []) as Prisma.InputJsonValue,
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

  /// Gating del módulo: el último resultado de cada escenario que el
  /// participante intentó, contra el umbral que exige `modulo`. 404 si
  /// `modulo` no está en UMBRALES en vez de devolver un progreso vacío: un
  /// nombre de módulo mal escrito no debe leerse como "cero avance".
  async progreso(participantId: string, modulo: string) {
    const requeridos = UMBRALES[modulo];
    if (requeridos === undefined) {
      throw new NotFoundException(`No existe el módulo "${modulo}".`);
    }

    const corridas = await this.prisma.scenarioRun.findMany({
      where: { participantId, scenarioId: { startsWith: `${modulo}/` } },
      select: { scenarioId: true, outcome: true, finishedAt: true },
    });

    return calcularProgreso(modulo, requeridos, corridas);
  }

  /// Todas las corridas del estudio para el supervisor, seudonimizadas. Se
  /// devuelven como JSON para verlas dentro de la app; no se descargan.
  ///
  /// Sale el código pseudónimo (P001), nunca un dato personal: no hay `join`
  /// con el participante ni forma de hacerlo. Los datos personales viven en
  /// otro servicio, en otro schema, bajo otro rol de Postgres — este método no
  /// podría filtrarlos aunque se escribiera mal.
  async resultados(): Promise<ResultadoCorrida[]> {
    const runs = await this.prisma.scenarioRun.findMany({
      orderBy: [{ participantSeq: 'asc' }, { finishedAt: 'asc' }],
    });

    return runs.map((run) => ({
      seudonimo: seudonimo(run.participantSeq),
      cohort: run.participantCohort,
      scenarioId: run.scenarioId,
      version: run.version,
      outcome: run.outcome,
      score: run.score,
      endingId: run.endingId,
      durationMs: run.durationMs,
      startedAt: run.startedAt.toISOString(),
      finishedAt: run.finishedAt.toISOString(),
    }));
  }
}
