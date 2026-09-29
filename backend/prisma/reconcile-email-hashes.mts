/**
 * Comprueba huellas de correo y, con aprobación explícita de la cifra observada,
 * reconcilia solo las de correo único con el EMAIL_PEPPER vigente. Las cuentas
 * con correo normalizado duplicado quedan intactas para resolución manual.
 *
 * pnpm --dir backend exec node prisma/reconcile-email-hashes.mts
 * pnpm --dir backend exec node prisma/reconcile-email-hashes.mts --apply --expected-count N
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../generated/identidad/client.js';
import {
  analyzeEmailHashReconciliation,
  planEmailHashReconciliation,
} from '../apps/identidad/src/pii/email-hash-reconciliation.ts';
import { decrypt, hashEmail } from '../apps/identidad/src/pii/pii.ts';

function secret(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta ${name} en el entorno.`);
  return value;
}

function parseOptions(args: string[]): {
  apply: boolean;
  expectedCount?: number;
} {
  if (args.length === 0) return { apply: false };
  if (
    args.length !== 3 ||
    args[0] !== '--apply' ||
    args[1] !== '--expected-count' ||
    !/^(0|[1-9]\d*)$/.test(args[2] ?? '')
  ) {
    throw new Error('Uso: [--apply --expected-count N].');
  }
  return { apply: true, expectedCount: Number(args[2]) };
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const piiKey = secret('PII_ENCRYPTION_KEY');
  const emailPepper = secret('EMAIL_PEPPER');
  const connectionString = secret('IDENTIDAD_DATABASE_URL');
  const decryptEmail = (value: string) => decrypt(value, piiKey);
  const hashNormalizedEmail = (value: string) => hashEmail(value, emailPepper);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }, { schema: 'identidad' }),
  });

  try {
    if (!options.apply) {
      const rows = await prisma.participant.findMany({
        select: { id: true, email: true, emailHash: true },
      });
      const analysis = analyzeEmailHashReconciliation(
        rows,
        decryptEmail,
        hashNormalizedEmail,
      );
      console.log(JSON.stringify(analysis.summary));
      return;
    }

    const result = await prisma.$transaction(
      async (transaction) => {
        const rows = await transaction.participant.findMany({
          select: { id: true, email: true, emailHash: true },
        });
        const changes = planEmailHashReconciliation(
          rows,
          decryptEmail,
          hashNormalizedEmail,
        );
        if (changes.length !== options.expectedCount) {
          throw new Error(
            'La cifra de huellas inconsistentes cambió; no se aplicó nada.',
          );
        }

        // Liberar primero todos los valores antiguos evita choques temporales
        // con el índice único cuando dos filas intercambiaron sus huellas.
        for (const change of changes) {
          const updated = await transaction.participant.updateMany({
            where: { id: change.id, emailHash: change.previousHash },
            data: { emailHash: null },
          });
          if (updated.count !== 1) {
            throw new Error(
              'Una cuenta cambió durante la reconciliación; no se aplicó nada.',
            );
          }
        }
        for (const change of changes) {
          const updated = await transaction.participant.updateMany({
            where: { id: change.id, emailHash: null },
            data: { emailHash: change.expectedHash },
          });
          if (updated.count !== 1) {
            throw new Error(
              'Una cuenta cambió durante la reconciliación; no se aplicó nada.',
            );
          }
        }
        return { total: rows.length, updated: changes.length };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    console.log(JSON.stringify(result));
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
  const reason =
    error instanceof Error &&
    [
      'Una huella de destino está ocupada por una cuenta excluida.',
      'La cifra de huellas inconsistentes cambió; no se aplicó nada.',
    ].includes(error.message)
      ? error.message
      : 'Error de conexión o de configuración.';
  console.error(JSON.stringify({ reason, code }));
  process.exitCode = 1;
});
