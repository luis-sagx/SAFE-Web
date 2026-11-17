export interface NormalizedAnswer {
  questionId: number;
  answer: number;
}

export function expandLegacyAnswers(
  version: number,
  answers: readonly number[],
  questionIdsByVersion: ReadonlyMap<number, readonly number[]>,
  minAnswer: number,
  maxAnswer: number,
): NormalizedAnswer[] {
  const questionIds = questionIdsByVersion.get(version);
  if (!questionIds) {
    throw new Error(`No existe el mapeo de preguntas para la versión ${version}.`);
  }
  if (answers.length !== questionIds.length) {
    throw new Error(
      `La versión ${version} espera ${questionIds.length} respuestas y recibió ${answers.length}.`,
    );
  }

  return answers.map((answer, index) => {
    if (
      !Number.isInteger(answer) ||
      answer < minAnswer ||
      answer > maxAnswer
    ) {
      throw new Error(
        `La respuesta ${index + 1} no es válida para la versión ${version}.`,
      );
    }
    return { questionId: questionIds[index]!, answer };
  });
}

export interface AssessmentPhaseRecord {
  participantId: string;
  version: number;
  phase: 'PRE' | 'POST';
}

export function findParticipantsMissingBaseline(
  assessments: readonly AssessmentPhaseRecord[],
  participantIdsWithRuns: readonly string[],
  legacyExemptionParticipantIds: readonly string[] = [],
): string[] {
  const baselineIds = new Set(
    assessments
      .filter((row) => row.version === 1 && row.phase === 'PRE')
      .map((row) => row.participantId),
  );
  const relevantIds = new Set([
    ...participantIdsWithRuns,
    ...assessments.filter((row) => row.phase === 'POST').map((row) => row.participantId),
  ]);
  const grandfatheredIds = new Set(legacyExemptionParticipantIds);
  return [...relevantIds]
    .filter(
      (participantId) =>
        !baselineIds.has(participantId) && !grandfatheredIds.has(participantId),
    )
    .sort();
}
