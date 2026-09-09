-- Cifrado en reposo de nombre, apellido y correo (issue #95).
--
-- Solo agrega: no toca ninguna fila existente ni exige nada todavía. `email`
-- deja de tener su propio índice único porque, de aquí en adelante, la
-- aplicación va a guardar ahí texto cifrado (con IV aleatorio -- el mismo
-- correo nunca cifra igual dos veces), así que ya no puede servir de índice
-- por sí solo. `emailHash` lo reemplaza para ese propósito: es la huella
-- HMAC del correo, determinista, calculada por la aplicación al escribir.
--
-- Las filas que existen hoy quedan con "email" en texto plano y "emailHash"
-- en null hasta que corra `prisma/backfill-pii.mts`. Mientras tanto siguen
-- siendo legibles y el login sigue funcionando (auth.service.ts cae a
-- buscar por el "email" en claro cuando la huella no encuentra nada), así
-- que no hace falta correr el backfill antes de desplegar este cambio.

-- DropIndex
DROP INDEX "Participant_email_key";

-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "emailHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Participant_emailHash_key" ON "Participant"("emailHash");
