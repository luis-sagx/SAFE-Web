/**
 * Diagnostica o copia respuestas legacy a tablas relacionales. Por defecto no
 * escribe. Ejecutar --apply --expected-count N solo durante mantenimiento,
 * con copia restaurable; N es assessments + respuestas SUS fuente.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../generated/entrenamiento/client.js';
import questionnaire from '../apps/entrenamiento/src/assessments/questionnaire.v1.json' with { type: 'json' };
import { SUS_VERSION } from '../apps/entrenamiento/src/sus/sus-survey.ts';
import {
  expandLegacyAnswers,
  findParticipantsMissingBaseline,
} from './normalized-training-data.ts';

interface Options {
  apply: boolean;
  expectedCount?: number;
}

function parseOptions(args: string[]): Options {
  if (args.length === 0) return { apply: false };
  if (
    args.length !== 3 ||
    args[0] !== '--apply' ||
    args[1] !== '--expected-count' ||
    !/^(0|[1-9]\d*)$/.test(args[2] ?? '')
  ) {
    throw new Error('Uso: [--apply --expected-count N].');
  }
  return { apply: true, expectedCount: Number(args[2]) };
}

function connectionString(): string {
  const value = process.env.ENTRENAMIENTO_DATABASE_URL;
  if (!value) throw new Error('Falta ENTRENAMIENTO_DATABASE_URL.');
  return value;
}

const assessmentQuestionIds = new Map([
  [questionnaire.version, questionnaire.items.map((_, index) => index + 1)],
]);
const susQuestionIds = new Map([[SUS_VERSION, Array.from({ length: 10 }, (_, i) => i + 1)]]);

type AssessmentAnswerRow = { assessmentId: string; questionId: number; answer: number };
type SusAnswerRow = { susResponseId: string; questionId: number; answer: number };
type LegacyAssessmentRow = {
  id: string;
  participantId: string;
  version: number;
  phase: 'PRE' | 'POST';
  answers: number[];
};
type LegacySusResponseRow = {
  id: string;
  participantId: string;
  version: number;
  answers: number[];
};

function assessmentRows(
  rows: { id: string; version: number; answers: number[] }[],
): AssessmentAnswerRow[] {
  return rows.flatMap((row) =>
    expandLegacyAnswers(row.version, row.answers, assessmentQuestionIds, 0, 3)
      .map(({ questionId, answer }) => ({ assessmentId: row.id, questionId, answer })),
  );
}

function susRows(
  rows: { id: string; version: number; answers: number[] }[],
): SusAnswerRow[] {
  return rows.flatMap((row) =>
    expandLegacyAnswers(row.version, row.answers, susQuestionIds, 1, 5)
      .map(({ questionId, answer }) => ({ susResponseId: row.id, questionId, answer })),
  );
}

function assertNoConflicts<T extends Record<string, string | number>>(
  expected: T[],
  existing: T[],
  parentKey: keyof T,
): T[] {
  const key = (row: T) => `${String(row[parentKey])}:${String(row.questionId)}`;
  const expectedByKey = new Map(expected.map((row) => [key(row), row]));
  const existingByKey = new Map(existing.map((row) => [key(row), row]));
  if (existingByKey.size !== existing.length) {
    throw new Error('Hay respuestas destino duplicadas.');
  }
  for (const [rowKey, row] of existingByKey) {
    const expectedRow = expectedByKey.get(rowKey);
    if (!expectedRow || expectedRow.answer !== row.answer) {
      throw new Error('Las respuestas destino no coinciden con la fuente.');
    }
  }
  return expected.filter((row) => !existingByKey.has(key(row)));
}

async function migrate(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const prisma = new PrismaClient({
    adapter: new PrismaPg(
      { connectionString: connectionString() },
      { schema: 'entrenamiento' },
    ),
  });

  try {
    const result = options.apply
      ? await prisma.$transaction(
          async (transaction) => {
            const [assessments, susResponses, exemptions, runs, assessmentRowsInDb, susRowsInDb] =
              await Promise.all([
                transaction.$queryRaw<LegacyAssessmentRow[]>`
                  SELECT "id", "participantId", "version", "phase"::text AS phase, "answers"
                  FROM "entrenamiento"."Assessment"
                `,
                transaction.$queryRaw<LegacySusResponseRow[]>`
                  SELECT "id", "participantId", "version", "answers"
                  FROM "entrenamiento"."SusResponse"
                `,
                transaction.$queryRaw<{ count: bigint }[]>`
                  SELECT COUNT(*) AS count
                  FROM "entrenamiento"."AssessmentBaselineExemption"
                `,
                transaction.scenarioRun.findMany({
                  distinct: ['participantId'],
                  select: { participantId: true },
                }),
                transaction.assessmentAnswer.findMany(),
                transaction.susAnswer.findMany(),
              ]);
            const expectedCount = assessments.length + susResponses.length;
            if (expectedCount !== options.expectedCount) {
              throw new Error('La cantidad de entregas cambió; no se aplicó nada.');
            }

            const expectedAssessments = assessmentRows(assessments);
            const expectedSus = susRows(susResponses);
            const missingAssessments = assertNoConflicts(
              expectedAssessments,
              assessmentRowsInDb,
              'assessmentId',
            );
            const missingSus = assertNoConflicts(expectedSus, susRowsInDb, 'susResponseId');
            if (missingAssessments.length) {
              await transaction.assessmentAnswer.createMany({ data: missingAssessments });
            }
            if (missingSus.length) {
              await transaction.susAnswer.createMany({ data: missingSus });
            }
            const missingBaseline = findParticipantsMissingBaseline(
              assessments,
              runs.map((run) => run.participantId),
            );
            return {
              assessments: assessments.length,
              susResponses: susResponses.length,
              assessmentAnswers: expectedAssessments.length,
              susAnswers: expectedSus.length,
              addedAssessmentAnswers: missingAssessments.length,
              addedSusAnswers: missingSus.length,
              baselineExemptionsToArchive: Number(exemptions[0]?.count ?? 0),
              participantsMissingBaseline: missingBaseline.length,
              cutoverSafe: missingBaseline.length === 0,
            };
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        )
      : await (async () => {
          const [assessments, susResponses, exemptions, runs] = await Promise.all([
            prisma.$queryRaw<LegacyAssessmentRow[]>`
              SELECT "id", "participantId", "version", "phase"::text AS phase, "answers"
              FROM "entrenamiento"."Assessment"
            `,
            prisma.$queryRaw<LegacySusResponseRow[]>`
              SELECT "id", "participantId", "version", "answers"
              FROM "entrenamiento"."SusResponse"
            `,
            prisma.$queryRaw<{ count: bigint }[]>`
              SELECT COUNT(*) AS count
              FROM "entrenamiento"."AssessmentBaselineExemption"
            `,
            prisma.scenarioRun.findMany({
              distinct: ['participantId'],
              select: { participantId: true },
            }),
          ]);
          const expectedAssessments = assessmentRows(assessments);
          const expectedSus = susRows(susResponses);
          const missingBaseline = findParticipantsMissingBaseline(
            assessments,
            runs.map((run) => run.participantId),
          );
          return {
            assessments: assessments.length,
            susResponses: susResponses.length,
            assessmentAnswers: expectedAssessments.length,
            susAnswers: expectedSus.length,
            baselineExemptionsToArchive: Number(exemptions[0]?.count ?? 0),
            participantsMissingBaseline: missingBaseline.length,
            cutoverSafe: missingBaseline.length === 0,
          };
        })();
    console.log(JSON.stringify(result));
  } finally {
    await prisma.$disconnect();
  }
}

migrate().catch((error: unknown) => {
  const code =
    error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
      ? error.code
      : undefined;
  const reason =
    error instanceof Error &&
    [
      'La cantidad de entregas cambió; no se aplicó nada.',
      'Hay respuestas destino duplicadas.',
      'Las respuestas destino no coinciden con la fuente.',
    ].includes(error.message)
      ? error.message
      : 'No se pudo migrar: conexión, versión, datos o destino incompatibles.';
  console.error(JSON.stringify({ reason, code }));
  process.exitCode = 1;
});
