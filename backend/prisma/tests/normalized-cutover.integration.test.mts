import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient as IdentityClient } from '../../generated/identidad/client.js';
import { PrismaClient as TrainingClient } from '../../generated/entrenamiento/client.js';

const identityUrl = process.env.IDENTIDAD_DATABASE_URL;
const trainingUrl = process.env.ENTRENAMIENTO_DATABASE_URL;
const guardTestUrl = process.env.NORMALIZED_CUTOVER_GUARD_TEST_DATABASE_URL;

function runPsql(url: string, args: string[]) {
  return spawnSync(
    'psql',
    [
      url,
      '--no-psqlrc',
      '--tuples-only',
      '--no-align',
      '--set',
      'ON_ERROR_STOP=1',
      ...args,
    ],
    {
      encoding: 'utf8',
    },
  );
}

function schemaName(prefix: string): string {
  return `${prefix}_${randomUUID().replaceAll('-', '')}`;
}

const assessmentAnswers = Array.from({ length: 21 }, (_, index) => index % 4);
const susAnswers = [3, 2, 4, 1, 5, 1, 4, 2, 5, 1];

function applyMigration(url: string, schema: string, file: string) {
  return runPsql(url, [
    '--command',
    `SET search_path TO "${schema}"`,
    '--file',
    resolve(file),
  ]);
}

test(
  'el corte deja exactamente las doce tablas de negocio acordadas',
  { skip: !identityUrl || !trainingUrl },
  async () => {
    const identity = new IdentityClient({
      adapter: new PrismaPg(
        { connectionString: identityUrl! },
        { schema: 'identidad' },
      ),
    });
    const training = new TrainingClient({
      adapter: new PrismaPg(
        { connectionString: trainingUrl! },
        { schema: 'entrenamiento' },
      ),
    });

    try {
      const [identityTables, trainingTables] = await Promise.all([
        identity.$queryRaw<{ tableName: string }[]>`
          SELECT table_name AS "tableName"
          FROM information_schema.tables
          WHERE table_schema = 'identidad'
            AND table_type = 'BASE TABLE'
            AND table_name <> '_prisma_migrations'
          ORDER BY table_name
        `,
        training.$queryRaw<{ tableName: string }[]>`
          SELECT table_name AS "tableName"
          FROM information_schema.tables
          WHERE table_schema = 'entrenamiento'
            AND table_type = 'BASE TABLE'
            AND table_name <> '_prisma_migrations'
          ORDER BY table_name
        `,
      ]);

      assert.deepEqual(
        identityTables.map(({ tableName }) => tableName),
        [
          'Account',
          'AccountProfile',
          'Certificate',
          'CertificateModule',
          'Role',
          'StudyParticipant',
        ],
      );
      assert.deepEqual(
        trainingTables.map(({ tableName }) => tableName),
        [
          'Assessment',
          'AssessmentAnswer',
          'ModuleReset',
          'ScenarioRun',
          'SusAnswer',
          'SusResponse',
        ],
      );
    } finally {
      await Promise.all([identity.$disconnect(), training.$disconnect()]);
    }
  },
);

test(
  'la migración de identidad conserva el origen cuando la copia no está completa',
  { skip: !guardTestUrl },
  () => {
    const schema = schemaName('identity_guard');
    const fixture = `
      CREATE SCHEMA "${schema}";
      CREATE TYPE "${schema}"."LegacyRole" AS ENUM ('PARTICIPANT', 'ADMIN', 'TRAINER');
      CREATE TABLE "${schema}"."Role" ("id" TEXT PRIMARY KEY, "code" TEXT NOT NULL UNIQUE);
      INSERT INTO "${schema}"."Role" VALUES
        ('00000000-0000-4000-8000-000000000001', 'PARTICIPANT'),
        ('00000000-0000-4000-8000-000000000002', 'ADMIN'),
        ('00000000-0000-4000-8000-000000000003', 'TRAINER');
      CREATE TABLE "${schema}"."Participant" ("id" TEXT PRIMARY KEY, "role" "${schema}"."LegacyRole" NOT NULL);
      INSERT INTO "${schema}"."Participant" VALUES ('legacy-account', 'PARTICIPANT');
      CREATE TABLE "${schema}"."Account" ("id" TEXT PRIMARY KEY);
      CREATE TABLE "${schema}"."AccountProfile" ("accountId" TEXT PRIMARY KEY);
      CREATE TABLE "${schema}"."StudyParticipant" ("accountId" TEXT PRIMARY KEY);
      CREATE TABLE "${schema}"."Certificate" ("id" TEXT PRIMARY KEY, "modulos" TEXT[]);
      CREATE TABLE "${schema}"."CertificateModule" ("certificateId" TEXT, "module" TEXT, "position" INTEGER);
    `;
    const created = runPsql(guardTestUrl!, ['--command', fixture]);
    assert.equal(created.status, 0, created.stderr);

    try {
      const migration = runPsql(guardTestUrl!, [
        '--command',
        `SET search_path TO "${schema}"`,
        '--file',
        resolve(
          'prisma/identidad/migrations/20261116210000_normalized_identity_retire_legacy/migration.sql',
        ),
      ]);
      assert.notEqual(migration.status, 0);
      assert.match(
        migration.stderr,
        /faltan filas normalizadas o hay filas extra/,
      );

      const preserved = runPsql(guardTestUrl!, [
        '--command',
        `SELECT COUNT(*) = 1 FROM "${schema}"."Participant"`,
      ]);
      assert.equal(preserved.status, 0, preserved.stderr);
      assert.equal(preserved.stdout.trim(), 't');
    } finally {
      const dropped = runPsql(guardTestUrl!, [
        '--command',
        `DROP SCHEMA "${schema}" CASCADE`,
      ]);
      assert.equal(dropped.status, 0, dropped.stderr);
    }
  },
);

test(
  'la migración de entrenamiento conserva exenciones y arrays si hay filas sin resolver',
  { skip: !guardTestUrl },
  () => {
    const schema = schemaName('training_guard');
    const fixture = `
      CREATE SCHEMA "${schema}";
      CREATE TABLE "${schema}"."AssessmentBaselineExemption" ("participantId" TEXT PRIMARY KEY, "participantSeq" INTEGER NOT NULL);
      INSERT INTO "${schema}"."AssessmentBaselineExemption" VALUES
        ('p-1', 1), ('p-2', 2), ('p-3', 3), ('p-4', 4), ('p-5', 5);
      CREATE TABLE "${schema}"."ScenarioRun" ("participantId" TEXT NOT NULL);
      CREATE TABLE "${schema}"."Assessment" ("id" TEXT, "participantId" TEXT, "phase" TEXT, "answers" INTEGER[]);
      CREATE TABLE "${schema}"."AssessmentAnswer" ("assessmentId" TEXT, "questionId" INTEGER, "answer" INTEGER);
      CREATE TABLE "${schema}"."SusResponse" ("id" TEXT, "answers" INTEGER[]);
      CREATE TABLE "${schema}"."SusAnswer" ("susResponseId" TEXT, "questionId" INTEGER, "answer" INTEGER);
    `;
    const created = runPsql(guardTestUrl!, ['--command', fixture]);
    assert.equal(created.status, 0, created.stderr);

    try {
      const migration = runPsql(guardTestUrl!, [
        '--command',
        `SET search_path TO "${schema}"`,
        '--file',
        resolve(
          'prisma/entrenamiento/migrations/20261116211000_normalized_training_retire_legacy/migration.sql',
        ),
      ]);
      assert.notEqual(migration.status, 0);
      assert.match(migration.stderr, /requiere resolución de datos/);

      const preserved = runPsql(guardTestUrl!, [
        '--command',
        `SELECT (SELECT COUNT(*) FROM "${schema}"."AssessmentBaselineExemption") = 5 AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = '${schema}' AND table_name IN ('Assessment', 'SusResponse') AND column_name = 'answers') = 2`,
      ]);
      assert.equal(preserved.status, 0, preserved.stderr);
      assert.equal(preserved.stdout.trim(), 't');
    } finally {
      const dropped = runPsql(guardTestUrl!, [
        '--command',
        `DROP SCHEMA "${schema}" CASCADE`,
      ]);
      assert.equal(dropped.status, 0, dropped.stderr);
    }
  },
);

test(
  'el corte exitoso conserva respuestas y módulos de certificado poblados',
  { skip: !guardTestUrl },
  () => {
    const identitySchema = schemaName('identity_success');
    const trainingSchema = schemaName('training_success');
    const identityFixture = `
      CREATE SCHEMA "${identitySchema}";
      CREATE TYPE "${identitySchema}"."LegacyRole" AS ENUM ('PARTICIPANT', 'ADMIN', 'TRAINER');
      CREATE TABLE "${identitySchema}"."Role" ("id" TEXT PRIMARY KEY, "code" TEXT NOT NULL UNIQUE);
      INSERT INTO "${identitySchema}"."Role" VALUES
        ('00000000-0000-4000-8000-000000000001', 'PARTICIPANT'),
        ('00000000-0000-4000-8000-000000000002', 'ADMIN'),
        ('00000000-0000-4000-8000-000000000003', 'TRAINER');
      CREATE TABLE "${identitySchema}"."Participant" (
        "id" TEXT PRIMARY KEY, "seq" SERIAL NOT NULL, "nombre" VARCHAR(255) NOT NULL,
        "apellido" VARCHAR(255) NOT NULL, "email" TEXT NOT NULL, "emailHash" TEXT,
        "cedulaHash" TEXT, "passwordHash" TEXT NOT NULL, "role" "${identitySchema}"."LegacyRole" NOT NULL,
        "passwordResetTokenHash" TEXT, "passwordResetExpiresAt" TIMESTAMP(3),
        "emailConfirmedAt" TIMESTAMP(3), "emailConfirmationTokenHash" TEXT,
        "emailConfirmationExpiresAt" TIMESTAMP(3), "tokenVersion" INTEGER NOT NULL,
        "onboardingVistoAt" TIMESTAMP(3), "disabledAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL
      );
      CREATE TABLE "${identitySchema}"."Account" (
        "id" TEXT PRIMARY KEY, "roleId" TEXT NOT NULL, "passwordHash" TEXT NOT NULL,
        "passwordResetTokenHash" TEXT, "passwordResetExpiresAt" TIMESTAMP(3),
        "emailConfirmedAt" TIMESTAMP(3), "emailConfirmationTokenHash" TEXT,
        "emailConfirmationExpiresAt" TIMESTAMP(3), "tokenVersion" INTEGER NOT NULL,
        "onboardingVistoAt" TIMESTAMP(3), "disabledAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL
      );
      CREATE TABLE "${identitySchema}"."AccountProfile" (
        "accountId" TEXT PRIMARY KEY, "nombre" VARCHAR(255) NOT NULL, "apellido" VARCHAR(255) NOT NULL,
        "email" TEXT NOT NULL, "emailHash" TEXT, "cedulaHash" TEXT
      );
      CREATE TABLE "${identitySchema}"."StudyParticipant" ("accountId" TEXT PRIMARY KEY, "seq" SERIAL NOT NULL);
      CREATE TABLE "${identitySchema}"."Certificate" (
        "id" TEXT PRIMARY KEY, "participantId" TEXT NOT NULL, "codigo" TEXT NOT NULL, "modulos" TEXT[],
        "horas" INTEGER NOT NULL, "emitidoAt" TIMESTAMP(3) NOT NULL, "revocadoAt" TIMESTAMP(3),
        "calificacion" INTEGER NOT NULL, "certificadoEnviadoAt" TIMESTAMP(3)
      );
      CREATE TABLE "${identitySchema}"."CertificateModule" ("certificateId" TEXT NOT NULL, "module" TEXT NOT NULL, "position" INTEGER NOT NULL);
      INSERT INTO "${identitySchema}"."Participant" ("id", "seq", "nombre", "apellido", "email", "emailHash", "cedulaHash", "passwordHash", "role", "tokenVersion", "createdAt")
        VALUES ('p-1', 9, 'v1:name', 'v1:last', 'v1:email', 'email-hmac', 'ced-hmac', 'bcrypt-hash', 'PARTICIPANT', 3, '2026-11-16 12:00:00');
      INSERT INTO "${identitySchema}"."Account" ("id", "roleId", "passwordHash", "tokenVersion", "createdAt")
        VALUES ('p-1', '00000000-0000-4000-8000-000000000001', 'bcrypt-hash', 3, '2026-11-16 12:00:00');
      INSERT INTO "${identitySchema}"."AccountProfile" VALUES ('p-1', 'v1:name', 'v1:last', 'v1:email', 'email-hmac', 'ced-hmac');
      INSERT INTO "${identitySchema}"."StudyParticipant" ("accountId", "seq") VALUES ('p-1', 9);
      INSERT INTO "${identitySchema}"."Certificate" VALUES ('cert-1', 'deleted-account', 'SW-AAAA-BBBB', ARRAY['mod-a','mod-b'], 4, '2026-11-16 12:00:00', NULL, 19, NULL);
      INSERT INTO "${identitySchema}"."CertificateModule" VALUES ('cert-1','mod-a',0), ('cert-1','mod-b',1);
      SELECT setval('"${identitySchema}"."Participant_seq_seq"', 12, true);
    `;
    const trainingFixture = `
      CREATE SCHEMA "${trainingSchema}";
      CREATE TABLE "${trainingSchema}"."ScenarioRun" ("participantId" TEXT NOT NULL);
      CREATE TABLE "${trainingSchema}"."AssessmentBaselineExemption" ("participantId" TEXT PRIMARY KEY, "participantSeq" INTEGER NOT NULL);
      CREATE TABLE "${trainingSchema}"."Assessment" (
        "id" TEXT PRIMARY KEY, "participantId" TEXT NOT NULL, "version" INTEGER NOT NULL,
        "phase" TEXT NOT NULL, "answers" INTEGER[] NOT NULL,
        CONSTRAINT "Assessment_answers_check" CHECK (TRUE)
      );
      CREATE TABLE "${trainingSchema}"."AssessmentAnswer" ("assessmentId" TEXT NOT NULL, "questionId" INTEGER NOT NULL, "answer" INTEGER NOT NULL);
      CREATE TABLE "${trainingSchema}"."SusResponse" (
        "id" TEXT PRIMARY KEY, "version" INTEGER NOT NULL, "answers" INTEGER[] NOT NULL,
        CONSTRAINT "SusResponse_answers_check" CHECK (TRUE)
      );
      CREATE TABLE "${trainingSchema}"."SusAnswer" ("susResponseId" TEXT NOT NULL, "questionId" INTEGER NOT NULL, "answer" INTEGER NOT NULL);
      INSERT INTO "${trainingSchema}"."ScenarioRun" VALUES ('p-1');
      INSERT INTO "${trainingSchema}"."Assessment" VALUES ('a-1', 'p-1', 1, 'PRE', ARRAY[${assessmentAnswers.join(',')}]);
      INSERT INTO "${trainingSchema}"."AssessmentAnswer"
        SELECT 'a-1', answer.ordinality::INTEGER, answer.value
        FROM unnest(ARRAY[${assessmentAnswers.join(',')}]) WITH ORDINALITY AS answer(value, ordinality);
      INSERT INTO "${trainingSchema}"."SusResponse" VALUES ('s-1', 1, ARRAY[${susAnswers.join(',')}]);
      INSERT INTO "${trainingSchema}"."SusAnswer"
        SELECT 's-1', answer.ordinality::INTEGER, answer.value
        FROM unnest(ARRAY[${susAnswers.join(',')}]) WITH ORDINALITY AS answer(value, ordinality);
    `;
    const identityCreated = runPsql(guardTestUrl!, [
      '--command',
      identityFixture,
    ]);
    assert.equal(identityCreated.status, 0, identityCreated.stderr);
    const trainingCreated = runPsql(guardTestUrl!, [
      '--command',
      trainingFixture,
    ]);
    assert.equal(trainingCreated.status, 0, trainingCreated.stderr);

    try {
      const identityMigration = applyMigration(
        guardTestUrl!,
        identitySchema,
        'prisma/identidad/migrations/20261116210000_normalized_identity_retire_legacy/migration.sql',
      );
      assert.equal(identityMigration.status, 0, identityMigration.stderr);
      const trainingMigration = applyMigration(
        guardTestUrl!,
        trainingSchema,
        'prisma/entrenamiento/migrations/20261116211000_normalized_training_retire_legacy/migration.sql',
      );
      assert.equal(trainingMigration.status, 0, trainingMigration.stderr);

      const identityPreserved = runPsql(guardTestUrl!, [
        '--command',
        `SELECT (SELECT COUNT(*) FROM "${identitySchema}"."CertificateModule") = 2 AND (SELECT string_agg("module", ',' ORDER BY "position") FROM "${identitySchema}"."CertificateModule") = 'mod-a,mod-b' AND (SELECT last_value FROM "${identitySchema}"."StudyParticipant_seq_seq") = 12 AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '${identitySchema}' AND table_name = 'Participant') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = '${identitySchema}' AND table_name = 'Certificate' AND column_name = 'modulos')`,
      ]);
      assert.equal(identityPreserved.status, 0, identityPreserved.stderr);
      assert.equal(identityPreserved.stdout.trim(), 't');

      const trainingPreserved = runPsql(guardTestUrl!, [
        '--command',
        `SELECT (SELECT COUNT(*) FROM "${trainingSchema}"."AssessmentAnswer") = 21 AND (SELECT COUNT(*) FROM "${trainingSchema}"."SusAnswer") = 10 AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = '${trainingSchema}' AND table_name IN ('Assessment', 'SusResponse') AND column_name = 'answers') AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '${trainingSchema}' AND table_name = 'AssessmentBaselineExemption')`,
      ]);
      assert.equal(trainingPreserved.status, 0, trainingPreserved.stderr);
      assert.equal(trainingPreserved.stdout.trim(), 't');
    } finally {
      const dropped = runPsql(guardTestUrl!, [
        '--command',
        `DROP SCHEMA "${identitySchema}" CASCADE; DROP SCHEMA "${trainingSchema}" CASCADE`,
      ]);
      assert.equal(dropped.status, 0, dropped.stderr);
    }
  },
);

test(
  'la migración bloquea versiones desconocidas y arreglos incompletos antes del DDL',
  { skip: !guardTestUrl },
  () => {
    const cases = [
      {
        label: 'Assessment version',
        kind: 'assessment',
        version: 2,
        answers: assessmentAnswers,
      },
      {
        label: 'Assessment length',
        kind: 'assessment',
        version: 1,
        answers: assessmentAnswers.slice(0, 20),
      },
      { label: 'SUS version', kind: 'sus', version: 2, answers: susAnswers },
      {
        label: 'SUS length',
        kind: 'sus',
        version: 1,
        answers: susAnswers.slice(0, 9),
      },
    ] as const;

    for (const item of cases) {
      const schema = schemaName('training_invalid');
      const assessmentRow =
        item.kind === 'assessment'
          ? `INSERT INTO "${schema}"."Assessment" VALUES ('a-1', 'p-1', ${item.version}, 'PRE', ARRAY[${item.answers.join(',')}]); INSERT INTO "${schema}"."AssessmentAnswer" SELECT 'a-1', answer.ordinality::INTEGER, answer.value FROM unnest(ARRAY[${item.answers.join(',')}]) WITH ORDINALITY AS answer(value, ordinality);`
          : '';
      const susRow =
        item.kind === 'sus'
          ? `INSERT INTO "${schema}"."SusResponse" VALUES ('s-1', ${item.version}, ARRAY[${item.answers.join(',')}]); INSERT INTO "${schema}"."SusAnswer" SELECT 's-1', answer.ordinality::INTEGER, answer.value FROM unnest(ARRAY[${item.answers.join(',')}]) WITH ORDINALITY AS answer(value, ordinality);`
          : '';
      const fixture = `
        CREATE SCHEMA "${schema}";
        CREATE TABLE "${schema}"."AssessmentBaselineExemption" ("participantId" TEXT PRIMARY KEY, "participantSeq" INTEGER NOT NULL);
        CREATE TABLE "${schema}"."ScenarioRun" ("participantId" TEXT NOT NULL);
        CREATE TABLE "${schema}"."Assessment" ("id" TEXT PRIMARY KEY, "participantId" TEXT NOT NULL, "version" INTEGER NOT NULL, "phase" TEXT NOT NULL, "answers" INTEGER[] NOT NULL, CONSTRAINT "Assessment_answers_check" CHECK (TRUE));
        CREATE TABLE "${schema}"."AssessmentAnswer" ("assessmentId" TEXT NOT NULL, "questionId" INTEGER NOT NULL, "answer" INTEGER NOT NULL);
        CREATE TABLE "${schema}"."SusResponse" ("id" TEXT PRIMARY KEY, "version" INTEGER NOT NULL, "answers" INTEGER[] NOT NULL, CONSTRAINT "SusResponse_answers_check" CHECK (TRUE));
        CREATE TABLE "${schema}"."SusAnswer" ("susResponseId" TEXT NOT NULL, "questionId" INTEGER NOT NULL, "answer" INTEGER NOT NULL);
        ${assessmentRow}
        ${susRow}
      `;
      const created = runPsql(guardTestUrl!, ['--command', fixture]);
      assert.equal(created.status, 0, `${item.label}: ${created.stderr}`);

      try {
        const migration = applyMigration(
          guardTestUrl!,
          schema,
          'prisma/entrenamiento/migrations/20261116211000_normalized_training_retire_legacy/migration.sql',
        );
        assert.notEqual(
          migration.status,
          0,
          `${item.label} unexpectedly cut over`,
        );
        assert.match(migration.stderr, /versión o cantidad de respuestas/);

        const preserved = runPsql(guardTestUrl!, [
          '--command',
          `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = '${schema}' AND table_name = '${item.kind === 'assessment' ? 'Assessment' : 'SusResponse'}' AND column_name = 'answers')`,
        ]);
        assert.equal(preserved.status, 0, preserved.stderr);
        assert.equal(preserved.stdout.trim(), 't');
      } finally {
        const dropped = runPsql(guardTestUrl!, [
          '--command',
          `DROP SCHEMA "${schema}" CASCADE`,
        ]);
        assert.equal(dropped.status, 0, dropped.stderr);
      }
    }
  },
);

test(
  'el corte retira las columnas y el enum que solo existían para la migración',
  { skip: !identityUrl || !trainingUrl },
  async () => {
    const identity = new IdentityClient({
      adapter: new PrismaPg(
        { connectionString: identityUrl! },
        { schema: 'identidad' },
      ),
    });
    const training = new TrainingClient({
      adapter: new PrismaPg(
        { connectionString: trainingUrl! },
        { schema: 'entrenamiento' },
      ),
    });

    try {
      const [legacyIdentityColumns, legacyTrainingColumns, legacyTypes] =
        await Promise.all([
          identity.$queryRaw<{ tableName: string; columnName: string }[]>`
          SELECT table_name AS "tableName", column_name AS "columnName"
          FROM information_schema.columns
          WHERE table_schema = 'identidad'
            AND ((table_name = 'Certificate' AND column_name = 'modulos')
              OR table_name = 'Participant')
        `,
          training.$queryRaw<{ tableName: string; columnName: string }[]>`
          SELECT table_name AS "tableName", column_name AS "columnName"
          FROM information_schema.columns
          WHERE table_schema = 'entrenamiento'
            AND ((table_name = 'Assessment' AND column_name = 'answers')
              OR (table_name = 'SusResponse' AND column_name = 'answers')
              OR table_name = 'AssessmentBaselineExemption')
        `,
          identity.$queryRaw<{ typeName: string }[]>`
          SELECT typname AS "typeName"
          FROM pg_type
          WHERE typnamespace = 'identidad'::regnamespace
            AND typname = 'LegacyRole'
        `,
        ]);

      assert.deepEqual(legacyIdentityColumns, []);
      assert.deepEqual(legacyTrainingColumns, []);
      assert.deepEqual(legacyTypes, []);
    } finally {
      await Promise.all([identity.$disconnect(), training.$disconnect()]);
    }
  },
);
