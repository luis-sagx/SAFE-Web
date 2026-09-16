-- Los nombres se validan en texto plano por `RegisterDto` antes de cifrarse.
-- Aquí se limita el tamaño del valor cifrado para que ninguna escritura que
-- eluda la aplicación pueda almacenar una carga desproporcionada. 255 cubre
-- ampliamente el cifrado AES-256-GCM codificado de los 50 caracteres válidos.
ALTER TABLE "Participant"
  ALTER COLUMN "nombre" SET DATA TYPE VARCHAR(255),
  ALTER COLUMN "apellido" SET DATA TYPE VARCHAR(255);
