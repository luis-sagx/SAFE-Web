-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PARTICIPANT', 'RESEARCHER');

-- CreateEnum
CREATE TYPE "RunOutcome" AS ENUM ('CORRECTO', 'PARCIAL', 'INCORRECTO');

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    "nombre" TEXT,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PARTICIPANT',
    "cohort" TEXT,
    "anonymizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioRun" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "outcome" "RunOutcome" NOT NULL,
    "score" INTEGER NOT NULL,
    "endingId" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "decisions" JSONB NOT NULL DEFAULT '[]',
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScenarioRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Participant_seq_key" ON "Participant"("seq");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_email_key" ON "Participant"("email");

-- CreateIndex
CREATE INDEX "ScenarioRun_participantId_scenarioId_idx" ON "ScenarioRun"("participantId", "scenarioId");

-- CreateIndex
CREATE INDEX "ScenarioRun_scenarioId_idx" ON "ScenarioRun"("scenarioId");

-- AddForeignKey
ALTER TABLE "ScenarioRun" ADD CONSTRAINT "ScenarioRun_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
