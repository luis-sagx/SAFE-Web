/*
  Warnings:

  - A unique constraint covering the columns `[emailConfirmationTokenHash]` on the table `Participant` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "emailConfirmationExpiresAt" TIMESTAMP(3),
ADD COLUMN     "emailConfirmationTokenHash" TEXT,
ADD COLUMN     "emailConfirmedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Participant_emailConfirmationTokenHash_key" ON "Participant"("emailConfirmationTokenHash");

-- Las cuentas que ya existían antes de este cambio nunca pasaron por un
-- flujo de confirmación (no existía), así que quedan confirmadas de una:
-- nadie que ya usa la app se queda afuera por una regla que se agregó
-- después de su registro. Se filtra por Role='PARTICIPANT' porque
-- TRAINER/ADMIN no nacen confirmados (no se les setea emailConfirmedAt al
-- crearse), pero tampoco se les exige confirmar para iniciar sesión (ver
-- el filtro por rol en AuthService.login), así que no hace falta tocarlos
-- aquí aunque tengan el campo nulo.
UPDATE "Participant"
SET "emailConfirmedAt" = now()
WHERE "role" = 'PARTICIPANT' AND "emailConfirmedAt" IS NULL;
