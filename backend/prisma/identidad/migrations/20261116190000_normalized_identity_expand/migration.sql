-- Expansión aditiva. Participant y Certificate.modulos permanecen disponibles
-- mientras la aplicación anterior continúa activa.

-- Libera el nombre Role para el nuevo catálogo relacional. El tipo conserva
-- sus valores y OID; las filas Participant existentes no se reescriben.
ALTER TYPE "Role" RENAME TO "LegacyRole";

CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

INSERT INTO "Role" ("id", "code") VALUES
    ('00000000-0000-4000-8000-000000000001', 'PARTICIPANT'),
    ('00000000-0000-4000-8000-000000000002', 'ADMIN'),
    ('00000000-0000-4000-8000-000000000003', 'TRAINER');

CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordResetTokenHash" TEXT,
    "passwordResetExpiresAt" TIMESTAMP(3),
    "emailConfirmedAt" TIMESTAMP(3),
    "emailConfirmationTokenHash" TEXT,
    "emailConfirmationExpiresAt" TIMESTAMP(3),
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "onboardingVistoAt" TIMESTAMP(3),
    "disabledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Account_passwordResetTokenHash_key" ON "Account"("passwordResetTokenHash");
CREATE UNIQUE INDEX "Account_emailConfirmationTokenHash_key" ON "Account"("emailConfirmationTokenHash");
ALTER TABLE "Account" ADD CONSTRAINT "Account_roleId_fkey"
    FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "AccountProfile" (
    "accountId" TEXT NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "apellido" VARCHAR(255) NOT NULL,
    "email" TEXT NOT NULL,
    "emailHash" TEXT,
    "cedulaHash" TEXT,
    CONSTRAINT "AccountProfile_pkey" PRIMARY KEY ("accountId")
);
CREATE UNIQUE INDEX "AccountProfile_emailHash_key" ON "AccountProfile"("emailHash");
CREATE UNIQUE INDEX "AccountProfile_cedulaHash_key" ON "AccountProfile"("cedulaHash");
ALTER TABLE "AccountProfile" ADD CONSTRAINT "AccountProfile_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "StudyParticipant" (
    "accountId" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    CONSTRAINT "StudyParticipant_pkey" PRIMARY KEY ("accountId")
);
CREATE UNIQUE INDEX "StudyParticipant_seq_key" ON "StudyParticipant"("seq");
ALTER TABLE "StudyParticipant" ADD CONSTRAINT "StudyParticipant_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CertificateModule" (
    "certificateId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "CertificateModule_pkey" PRIMARY KEY ("certificateId", "module")
);
CREATE UNIQUE INDEX "CertificateModule_certificateId_position_key"
    ON "CertificateModule"("certificateId", "position");
ALTER TABLE "CertificateModule" ADD CONSTRAINT "CertificateModule_certificateId_fkey"
    FOREIGN KEY ("certificateId") REFERENCES "Certificate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
