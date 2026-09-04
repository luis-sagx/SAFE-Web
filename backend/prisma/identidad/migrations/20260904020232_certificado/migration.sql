-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "modulos" TEXT[],
    "horas" INTEGER NOT NULL DEFAULT 4,
    "emitidoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revocadoAt" TIMESTAMP(3),

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_participantId_key" ON "Certificate"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_codigo_key" ON "Certificate"("codigo");
