-- Conserva las constancias históricas sin inventar una nueva aceptación.
ALTER TABLE "Assessment"
  ALTER COLUMN "consentVersion" DROP NOT NULL,
  ALTER COLUMN "consentAccepted" DROP NOT NULL;
