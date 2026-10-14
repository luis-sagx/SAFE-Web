CREATE TABLE "SusResponse" (
  "id" TEXT PRIMARY KEY,
  "participantId" TEXT NOT NULL,
  "participantSeq" INTEGER NOT NULL,
  "version" INTEGER NOT NULL,
  "answers" INTEGER[] NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SusResponse_answers_check" CHECK (
    cardinality("answers") = 10 AND "answers" <@ ARRAY[1,2,3,4,5]
  ),
  CONSTRAINT "SusResponse_score_check" CHECK ("score" BETWEEN 0 AND 100)
);
CREATE UNIQUE INDEX "SusResponse_participantId_version_key"
  ON "SusResponse"("participantId", "version");
CREATE INDEX "SusResponse_version_participantSeq_idx"
  ON "SusResponse"("version", "participantSeq");
