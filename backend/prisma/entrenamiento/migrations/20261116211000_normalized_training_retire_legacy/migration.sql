BEGIN;

-- No se fabrican PRE históricos ni se convierten exenciones en respuestas.
-- El retiro solo se habilita cuando las filas relacionales cotejan cada array.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "AssessmentBaselineExemption") THEN
    RAISE EXCEPTION 'No se puede retirar AssessmentBaselineExemption: requiere resolución de datos.'
      USING ERRCODE = '23514';
  END IF;

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
    SELECT 1
    FROM "ScenarioRun" run
    WHERE NOT EXISTS (
      SELECT 1
      FROM "Assessment" assessment
      WHERE assessment."participantId" = run."participantId"
        AND assessment."phase" = 'PRE'
    )
  ) THEN
    RAISE EXCEPTION 'No se puede retirar answers: hay corridas sin evaluación PRE.'
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
  DROP TABLE "AssessmentBaselineExemption";
END
$$;

COMMIT;
