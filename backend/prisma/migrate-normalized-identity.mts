/**
 * Copia Participant y Certificate.modulos al modelo expandido de identidad.
 * Por defecto solo analiza. Escribe únicamente con --apply y el conteo
 * confirmado del origen; la transacción es serializable.
 *
 *   node prisma/migrate-normalized-identity.mts
 *   node prisma/migrate-normalized-identity.mts --apply --expected-count N
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../generated/identidad/client.js';
import { decrypt } from '../apps/identidad/src/pii/pii.ts';
import {
  assertUniqueNormalizedEmails,
  transformLegacyCertificate,
  transformLegacyParticipant,
} from './identity-migration-transform.ts';

interface Options {
  apply: boolean;
  expectedCount?: number;
}

function secret(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la configuración ${name}.`);
  return value;
}

function parseOptions(args: string[]): Options {
  if (args.length === 0) return { apply: false };
  if (
    args.length !== 3 ||
    args[0] !== '--apply' ||
    args[1] !== '--expected-count' ||
    !/^(0|[1-9]\d*)$/.test(args[2] ?? '')
  ) {
    throw new Error('Uso: [--apply --expected-count N].');
  }
  const expectedCount = Number(args[2]);
  if (!Number.isSafeInteger(expectedCount)) {
    throw new Error('El conteo esperado debe ser un entero seguro.');
  }
  return { apply: true, expectedCount };
}

function prepareRows(
  participants: Awaited<ReturnType<PrismaClient['participant']['findMany']>>,
  certificates: Awaited<ReturnType<PrismaClient['certificate']['findMany']>>,
  piiKey: string,
  emailPepper: string,
) {
  const mappedParticipants = participants.map((row) =>
    transformLegacyParticipant(row, piiKey, emailPepper),
  );
  assertUniqueNormalizedEmails(mappedParticipants);

  const mappedCertificates = certificates.map(transformLegacyCertificate);
  const certificateModules = mappedCertificates.flatMap((row) => row.modules);
  return {
    accounts: mappedParticipants.map(({ account }) => account),
    profiles: mappedParticipants.map(({ profile }) => profile),
    studyParticipants: mappedParticipants.flatMap(({ studyParticipant }) =>
      studyParticipant ? [studyParticipant] : [],
    ),
    normalizedEmailHashes: mappedParticipants.map(
      ({ normalizedEmailHash }) => normalizedEmailHash,
    ),
    certificateModules,
  };
}

async function readLegacy(client: Prisma.TransactionClient | PrismaClient) {
  const [participants, certificates] = await Promise.all([
    client.participant.findMany({ orderBy: { id: 'asc' } }),
    client.certificate.findMany({ orderBy: { id: 'asc' } }),
  ]);
  return { participants, certificates };
}

async function assertRoleCatalog(
  client: Prisma.TransactionClient | PrismaClient,
): Promise<void> {
  const expected = new Map([
    ['PARTICIPANT', '00000000-0000-4000-8000-000000000001'],
    ['ADMIN', '00000000-0000-4000-8000-000000000002'],
    ['TRAINER', '00000000-0000-4000-8000-000000000003'],
  ]);
  const roles = await client.role.findMany({
    select: { id: true, code: true },
  });
  if (
    roles.length !== expected.size ||
    roles.some(({ id, code }) => expected.get(code) !== id)
  ) {
    throw new Error(
      'El catálogo de roles no coincide con los códigos esperados.',
    );
  }
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function assertAlreadyApplied(
  transaction: Prisma.TransactionClient,
  source: Awaited<ReturnType<typeof readLegacy>>,
  rows: ReturnType<typeof prepareRows>,
  piiKey: string,
): Promise<void> {
  const [accounts, profiles, studyParticipants, certificateModules] =
    await Promise.all([
      transaction.account.findMany({ orderBy: { id: 'asc' } }),
      transaction.accountProfile.findMany({ orderBy: { accountId: 'asc' } }),
      transaction.studyParticipant.findMany({ orderBy: { accountId: 'asc' } }),
      transaction.certificateModule.findMany({
        orderBy: [{ certificateId: 'asc' }, { position: 'asc' }],
      }),
    ]);

  if (
    accounts.length !== rows.accounts.length ||
    profiles.length !== rows.profiles.length ||
    studyParticipants.length !== rows.studyParticipants.length ||
    certificateModules.length !== rows.certificateModules.length
  ) {
    throw new Error(
      'El modelo nuevo contiene una copia parcial; se requiere revisión.',
    );
  }

  const sourceById = new Map(source.participants.map((row) => [row.id, row]));
  const profileMatches = profiles.every((profile) => {
    const old = sourceById.get(profile.accountId);
    const expected = rows.profiles.find(
      ({ accountId }) => accountId === profile.accountId,
    );
    if (!old) return false;
    if (
      !expected ||
      profile.emailHash !== expected.emailHash ||
      profile.cedulaHash !== old.cedulaHash
    ) {
      return false;
    }
    const fieldsMatch =
      decrypt(profile.nombre, piiKey) === decrypt(old.nombre, piiKey) &&
      decrypt(profile.apellido, piiKey) === decrypt(old.apellido, piiKey) &&
      decrypt(profile.email, piiKey) === decrypt(old.email, piiKey);
    const ciphertextsPreserved = [
      [old.nombre, profile.nombre],
      [old.apellido, profile.apellido],
      [old.email, profile.email],
    ].every(([sourceValue, targetValue]) =>
      typeof sourceValue === 'string' && sourceValue.startsWith('v1:')
        ? sourceValue === targetValue
        : true,
    );
    return fieldsMatch && ciphertextsPreserved;
  });

  if (
    !sameJson(accounts, rows.accounts) ||
    !profileMatches ||
    !sameJson(studyParticipants, rows.studyParticipants) ||
    !sameJson(certificateModules, rows.certificateModules)
  ) {
    throw new Error(
      'Los datos de destino no coinciden con el origen; no se aplicó nada.',
    );
  }
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const piiKey = secret('PII_ENCRYPTION_KEY');
  const emailPepper = secret('EMAIL_PEPPER');
  const connectionString = secret('IDENTIDAD_DATABASE_URL');
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }, { schema: 'identidad' }),
  });

  try {
    const result = await prisma.$transaction(
      async (transaction) => {
        await assertRoleCatalog(transaction);
        const source = await readLegacy(transaction);
        if (
          options.apply &&
          source.participants.length !== options.expectedCount
        ) {
          throw new Error('El conteo de cuentas cambió; no se aplicó nada.');
        }
        const rows = prepareRows(
          source.participants,
          source.certificates,
          piiKey,
          emailPepper,
        );
        const targetCounts = await Promise.all([
          transaction.account.count(),
          transaction.accountProfile.count(),
          transaction.studyParticipant.count(),
          transaction.certificateModule.count(),
        ]);
        const populated = targetCounts.some((count) => count > 0);

        if (populated) {
          await assertAlreadyApplied(transaction, source, rows, piiKey);
          return {
            alreadyApplied: true,
            accounts: rows.accounts.length,
            studyParticipants: rows.studyParticipants.length,
            certificateModules: rows.certificateModules.length,
          };
        }

        if (!options.apply) {
          return {
            alreadyApplied: false,
            accounts: rows.accounts.length,
            studyParticipants: rows.studyParticipants.length,
            certificates: source.certificates.length,
            certificateModules: rows.certificateModules.length,
          };
        }

        await transaction.account.createMany({ data: rows.accounts });
        await transaction.accountProfile.createMany({ data: rows.profiles });
        if (rows.studyParticipants.length > 0) {
          await transaction.studyParticipant.createMany({
            data: rows.studyParticipants,
          });
          await transaction.$queryRaw`
          SELECT setval(
            pg_get_serial_sequence('"identidad"."StudyParticipant"', 'seq'),
            COALESCE(MAX("seq"), 1),
            COUNT(*) > 0
          ) FROM "identidad"."StudyParticipant"
        `;
        }
        if (rows.certificateModules.length > 0) {
          await transaction.certificateModule.createMany({
            data: rows.certificateModules,
          });
        }

        return {
          alreadyApplied: false,
          accounts: rows.accounts.length,
          studyParticipants: rows.studyParticipants.length,
          certificates: source.certificates.length,
          certificateModules: rows.certificateModules.length,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 120_000,
      },
    );

    console.log(
      JSON.stringify({
        mode: options.apply ? 'apply' : 'diagnostic',
        ...result,
      }),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const code =
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string'
      ? error.code
      : undefined;
  console.error(
    JSON.stringify({ reason: 'Falló el diagnóstico o la migración.', code }),
  );
  process.exitCode = 1;
});
