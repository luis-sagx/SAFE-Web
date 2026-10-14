CREATE TYPE "AssessmentPhase" AS ENUM ('PRE', 'POST');
CREATE TABLE "AssessmentBaselineExemption" ("participantId" TEXT PRIMARY KEY, "participantSeq" INTEGER NOT NULL);
-- Solo las corridas presentes al aplicar esta migración justifican ausencia de inicial.
INSERT INTO "AssessmentBaselineExemption" ("participantId", "participantSeq")
SELECT "participantId", MIN("participantSeq") FROM "ScenarioRun" GROUP BY "participantId";
CREATE TABLE "Assessment" (
 "id" TEXT PRIMARY KEY, "participantId" TEXT NOT NULL, "participantSeq" INTEGER NOT NULL,
 "version" INTEGER NOT NULL, "phase" "AssessmentPhase" NOT NULL,
 "ageRange" TEXT NOT NULL, "gender" TEXT NOT NULL, "answers" INTEGER[] NOT NULL,
 "score" INTEGER NOT NULL, "consentVersion" TEXT NOT NULL, "consentAccepted" BOOLEAN NOT NULL,
 "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "Assessment_answers_check" CHECK (cardinality("answers") = 21 AND "answers" <@ ARRAY[0,1,2,3]),
 CONSTRAINT "Assessment_score_check" CHECK ("score" BETWEEN 0 AND 21),
 CONSTRAINT "Assessment_consent_check" CHECK ("consentAccepted")
);
CREATE UNIQUE INDEX "Assessment_participantId_version_phase_key" ON "Assessment"("participantId", "version", "phase");
