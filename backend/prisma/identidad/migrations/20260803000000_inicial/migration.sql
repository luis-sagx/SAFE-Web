-- El schema `identidad` ya existe: lo crea db-init/01-roles-y-schemas.sh junto
-- con el rol que lo posee. Esta migración solo crea objetos dentro de él, y se
-- aplica con el rol `identidad`, que no tiene permiso para tocar otro schema.

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PARTICIPANT', 'RESEARCHER');

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

-- CreateIndex
CREATE UNIQUE INDEX "Participant_seq_key" ON "Participant"("seq");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_email_key" ON "Participant"("email");
