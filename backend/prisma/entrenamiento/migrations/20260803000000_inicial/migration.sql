-- El schema `entrenamiento` ya existe: lo crea db-init/01-roles-y-schemas.sh
-- junto con el rol que lo posee. Esta migración se aplica con el rol
-- `entrenamiento`, que no tiene permiso sobre el schema `identidad`.

-- CreateEnum
CREATE TYPE "RunOutcome" AS ENUM ('CORRECTO', 'PARCIAL', 'INCORRECTO');

-- CreateTable
CREATE TABLE "ScenarioRun" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "participantSeq" INTEGER NOT NULL,
    "participantCohort" TEXT,
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
CREATE INDEX "ScenarioRun_participantId_scenarioId_finishedAt_idx" ON "ScenarioRun"("participantId", "scenarioId", "finishedAt" DESC);

-- CreateIndex
CREATE INDEX "ScenarioRun_scenarioId_idx" ON "ScenarioRun"("scenarioId");
