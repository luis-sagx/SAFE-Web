BEGIN;

-- No se fabrican PRE históricos ni se convierten exenciones en respuestas.
-- Una exención legacy solo permite archivar su propio ID durante este corte;
-- el runtime no consulta el archivo y las cuentas nuevas siguen requiriendo PRE.
-- El retiro también exige que las filas relacionales cotejen cada array.
DO $$
BEGIN
  -- Debe mantenerse alineado con questionnaire.v1.json (versión 1, 21
  -- respuestas de 0 a 3) y sus-survey.ts (versión 1, 10 respuestas de 1 a 5).
  IF EXISTS (
    SELECT 1
    FROM "Assessment"
    WHERE "version" <> 1
       OR cardinality("answers") IS DISTINCT FROM 21
       OR NOT ("answers" <@ ARRAY[0, 1, 2, 3])
  ) THEN
    RAISE EXCEPTION 'No se puede retirar Assessment.answers: versión o cantidad de respuestas no válida.'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "SusResponse"
    WHERE "version" <> 1
       OR cardinality("answers") IS DISTINCT FROM 10
       OR NOT ("answers" <@ ARRAY[1, 2, 3, 4, 5])
  ) THEN
    RAISE EXCEPTION 'No se puede retirar SusResponse.answers: versión o cantidad de respuestas no válida.'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    WITH participantsRequiringBaseline AS (
      SELECT "participantId" FROM "ScenarioRun"
      UNION
      SELECT "participantId" FROM "Assessment" WHERE "phase" = 'POST'
    )
    SELECT 1
    FROM participantsRequiringBaseline participant
    WHERE NOT EXISTS (
      SELECT 1
      FROM "Assessment" assessment
      WHERE assessment."participantId" = participant."participantId"
        AND assessment."version" = 1
        AND assessment."phase" = 'PRE'
    )
      AND NOT EXISTS (
        SELECT 1
        FROM "AssessmentBaselineExemption" exemption
        WHERE exemption."participantId" = participant."participantId"
      )
  ) THEN
    RAISE EXCEPTION 'No se puede retirar answers: hay corridas o POST sin evaluación PRE.'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    WITH expected AS (
      SELECT assessment."id" AS "assessmentId",
             answers.ordinality::INTEGER AS "questionId",
             answers.answer
      FROM "Assessment" assessment
      CROSS JOIN LATERAL unnest(assessment."answers")
        WITH ORDINALITY AS answers(answer, ordinality)
    ), differences AS (
      (SELECT * FROM expected
       EXCEPT
       SELECT "assessmentId", "questionId", answer FROM "AssessmentAnswer")
      UNION ALL
      (SELECT "assessmentId", "questionId", answer FROM "AssessmentAnswer"
       EXCEPT
       SELECT * FROM expected)
    )
    SELECT 1 FROM differences
  ) THEN
    RAISE EXCEPTION 'No se puede retirar Assessment.answers: las respuestas relacionales no coinciden.'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    WITH expected AS (
      SELECT response."id" AS "susResponseId",
             answers.ordinality::INTEGER AS "questionId",
             answers.answer
      FROM "SusResponse" response
      CROSS JOIN LATERAL unnest(response."answers")
        WITH ORDINALITY AS answers(answer, ordinality)
    ), differences AS (
      (SELECT * FROM expected
       EXCEPT
       SELECT "susResponseId", "questionId", answer FROM "SusAnswer")
      UNION ALL
      (SELECT "susResponseId", "questionId", answer FROM "SusAnswer"
       EXCEPT
       SELECT * FROM expected)
    )
    SELECT 1 FROM differences
  ) THEN
    RAISE EXCEPTION 'No se puede retirar SusResponse.answers: las respuestas relacionales no coinciden.'
      USING ERRCODE = '23514';
  END IF;

  ALTER TABLE "Assessment" DROP CONSTRAINT "Assessment_answers_check";
  ALTER TABLE "Assessment" DROP COLUMN "answers";
  ALTER TABLE "SusResponse" DROP CONSTRAINT "SusResponse_answers_check";
  ALTER TABLE "SusResponse" DROP COLUMN "answers";
  ALTER TABLE "AssessmentBaselineExemption"
    RENAME TO "AssessmentBaselineExemptionArchive";
  ALTER TABLE "AssessmentBaselineExemptionArchive"
    RENAME CONSTRAINT "AssessmentBaselineExemption_pkey"
    TO "AssessmentBaselineExemptionArchive_pkey";
END
$$;

COMMIT;
