-- Renombra el rol RESEARCHER a SUPERVISOR. Postgres remapea las filas que ya
-- tuvieran ese valor sin tocarlas.
ALTER TYPE "Role" RENAME VALUE 'RESEARCHER' TO 'SUPERVISOR';

-- Estado de la cuenta: null = activa. Un supervisor la usa para desactivar el
-- acceso de un participante sin borrar sus datos.
ALTER TABLE "Participant" ADD COLUMN "disabledAt" TIMESTAMP(3);
