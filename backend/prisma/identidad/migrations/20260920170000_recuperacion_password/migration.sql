-- Recuperación de contraseña (issue #256): token de un solo uso, con
-- expiración, y un contador de versión para invalidar sesiones existentes al
-- restablecer. Ver los comentarios del modelo Participant en schema.prisma.
ALTER TABLE "Participant" ADD COLUMN     "passwordResetExpiresAt" TIMESTAMP(3),
ADD COLUMN     "passwordResetTokenHash" TEXT,
ADD COLUMN     "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Participant_passwordResetTokenHash_key" ON "Participant"("passwordResetTokenHash");
