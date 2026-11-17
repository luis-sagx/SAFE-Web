BEGIN;

-- La aplicación debe estar en mantenimiento. La copia normalizada se coteja
-- aquí antes de retirar cualquier fuente legacy.
DO $$
DECLARE
  legacy_participant_count BIGINT;
  normalized_account_count BIGINT;
  participant_sequence_last BIGINT;
  participant_sequence_called BOOLEAN;
  normalized_sequence_value BIGINT;
BEGIN
  IF (SELECT COUNT(*) FROM "Role") <> 3
     OR EXISTS (
       SELECT 1
       FROM (VALUES
         ('00000000-0000-4000-8000-000000000001', 'PARTICIPANT'),
         ('00000000-0000-4000-8000-000000000002', 'ADMIN'),
         ('00000000-0000-4000-8000-000000000003', 'TRAINER')
       ) AS expected(id, code)
       LEFT JOIN "Role" actual ON actual."id" = expected.id
       WHERE actual."code" IS DISTINCT FROM expected.code
     ) THEN
    RAISE EXCEPTION 'No se puede retirar Participant: el catálogo Role no coincide.'
      USING ERRCODE = '23514';
  END IF;

  SELECT COUNT(*) INTO legacy_participant_count FROM "Participant";
  SELECT COUNT(*) INTO normalized_account_count FROM "Account";
  IF normalized_account_count <> legacy_participant_count
     OR (SELECT COUNT(*) FROM "AccountProfile") <> legacy_participant_count
     OR (SELECT COUNT(*) FROM "StudyParticipant") <>
       (SELECT COUNT(*) FROM "Participant" WHERE "role" = 'PARTICIPANT') THEN
    RAISE EXCEPTION 'No se puede retirar Participant: faltan filas normalizadas o hay filas extra.'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "Participant" legacy
    LEFT JOIN "Account" account ON account."id" = legacy."id"
    LEFT JOIN "Role" role ON role."id" = account."roleId"
    LEFT JOIN "AccountProfile" profile ON profile."accountId" = legacy."id"
    WHERE account."id" IS NULL
       OR role."code" IS DISTINCT FROM legacy."role"::TEXT
       OR account."passwordHash" IS DISTINCT FROM legacy."passwordHash"
       OR account."passwordResetTokenHash" IS DISTINCT FROM legacy."passwordResetTokenHash"
       OR account."passwordResetExpiresAt" IS DISTINCT FROM legacy."passwordResetExpiresAt"
       OR account."emailConfirmedAt" IS DISTINCT FROM legacy."emailConfirmedAt"
       OR account."emailConfirmationTokenHash" IS DISTINCT FROM legacy."emailConfirmationTokenHash"
       OR account."emailConfirmationExpiresAt" IS DISTINCT FROM legacy."emailConfirmationExpiresAt"
       OR account."tokenVersion" IS DISTINCT FROM legacy."tokenVersion"
       OR account."onboardingVistoAt" IS DISTINCT FROM legacy."onboardingVistoAt"
       OR account."disabledAt" IS DISTINCT FROM legacy."disabledAt"
       OR account."createdAt" IS DISTINCT FROM legacy."createdAt"
       OR profile."accountId" IS NULL
       OR profile."nombre" IS DISTINCT FROM legacy."nombre"
       OR profile."apellido" IS DISTINCT FROM legacy."apellido"
       OR profile."email" IS DISTINCT FROM legacy."email"
       OR profile."emailHash" IS DISTINCT FROM legacy."emailHash"
       OR profile."cedulaHash" IS DISTINCT FROM legacy."cedulaHash"
       OR legacy."emailHash" IS NULL
       OR legacy."nombre" NOT LIKE 'v1:%'
       OR legacy."apellido" NOT LIKE 'v1:%'
       OR legacy."email" NOT LIKE 'v1:%'
  ) THEN
    RAISE EXCEPTION 'No se puede retirar Participant: cuenta, huellas o ciphertext no coinciden.'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "Participant" legacy
    LEFT JOIN "StudyParticipant" study ON study."accountId" = legacy."id"
    WHERE (legacy."role" = 'PARTICIPANT'
           AND study."seq" IS DISTINCT FROM legacy."seq")
       OR (legacy."role" <> 'PARTICIPANT' AND study."accountId" IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'No se puede retirar Participant: las secuencias de estudio no coinciden.'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "Certificate" certificate
    LEFT JOIN LATERAL (
      SELECT array_agg(module."module" ORDER BY module."position") AS modules
      FROM "CertificateModule" module
      WHERE module."certificateId" = certificate."id"
    ) normalized ON TRUE
    WHERE COALESCE(certificate."modulos", ARRAY[]::TEXT[])
      IS DISTINCT FROM COALESCE(normalized.modules, ARRAY[]::TEXT[])
  ) THEN
    RAISE EXCEPTION 'No se puede retirar Certificate.modulos: los módulos no coinciden.'
      USING ERRCODE = '23514';
  END IF;

  -- No reciclar secuencias usadas por cuentas borradas o de personal.
  SELECT last_value, is_called
    INTO participant_sequence_last, participant_sequence_called
    FROM "Participant_seq_seq";
  SELECT COALESCE(MAX("seq"), 0)
    INTO normalized_sequence_value
    FROM "StudyParticipant";
  PERFORM setval(
    pg_get_serial_sequence(
      format('%I.%I', current_schema(), 'StudyParticipant'),
      'seq'
    )::REGCLASS,
    GREATEST(participant_sequence_last, normalized_sequence_value, 1),
    participant_sequence_called OR normalized_sequence_value > 0
  );

  DROP TABLE "Participant";
  DROP TYPE "LegacyRole";
  ALTER TABLE "Certificate" DROP COLUMN "modulos";
END
$$;

COMMIT;
