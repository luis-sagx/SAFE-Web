-- Registro nuevo: nombre + apellido + correo + cédula.
--
-- `telefono` se elimina: ya no se pide, no lo usa ninguna pantalla, y guardar
-- un dato personal sin uso contradice la regla de minimización del estudio.
--
-- `cedulaHash` guarda HMAC-SHA256(cédula, CEDULA_PEPPER). La cédula en claro
-- nunca entra a esta tabla. Es nullable porque la cuenta de investigador que
-- crea `pnpm seed` no tiene cédula, y porque `pnpm anonimizar` la pone en null.

ALTER TABLE "Participant" ADD COLUMN "apellido" TEXT;
ALTER TABLE "Participant" ADD COLUMN "cedulaHash" TEXT;
ALTER TABLE "Participant" DROP COLUMN "telefono";

-- Índice único: una cuenta por persona. Postgres permite varios NULL en un
-- índice único, así que las cuentas sin cédula (investigador, anonimizadas)
-- no chocan entre sí.
CREATE UNIQUE INDEX "Participant_cedulaHash_key" ON "Participant"("cedulaHash");
