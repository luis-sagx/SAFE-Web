CREATE TABLE "AssessmentAnswer" (
  "assessmentId" TEXT NOT NULL,
  "questionId" INTEGER NOT NULL,
  "answer" INTEGER NOT NULL,
  CONSTRAINT "AssessmentAnswer_pkey" PRIMARY KEY ("assessmentId", "questionId"),
  CONSTRAINT "AssessmentAnswer_assessmentId_fkey"
    FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AssessmentAnswer_questionId_check" CHECK ("questionId" > 0),
  CONSTRAINT "AssessmentAnswer_answer_check" CHECK ("answer" BETWEEN 0 AND 3)
);

CREATE INDEX "AssessmentAnswer_questionId_idx"
  ON "AssessmentAnswer"("questionId");

CREATE TABLE "SusAnswer" (
  "susResponseId" TEXT NOT NULL,
  "questionId" INTEGER NOT NULL,
  "answer" INTEGER NOT NULL,
  CONSTRAINT "SusAnswer_pkey" PRIMARY KEY ("susResponseId", "questionId"),
  CONSTRAINT "SusAnswer_susResponseId_fkey"
    FOREIGN KEY ("susResponseId") REFERENCES "SusResponse"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SusAnswer_questionId_check" CHECK ("questionId" > 0),
  CONSTRAINT "SusAnswer_answer_check" CHECK ("answer" BETWEEN 1 AND 5)
);

CREATE INDEX "SusAnswer_questionId_idx"
  ON "SusAnswer"("questionId");
