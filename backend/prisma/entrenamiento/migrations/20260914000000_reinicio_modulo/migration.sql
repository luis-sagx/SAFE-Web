CREATE TABLE "ModuleReset" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ModuleReset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ModuleReset_participantId_module_createdAt_idx" ON "ModuleReset"("participantId", "module", "createdAt" DESC);
