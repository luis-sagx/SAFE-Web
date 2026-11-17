import { spawn, spawnSync } from 'node:child_process';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient as IdentityClient } from '../generated/identidad/client.js';
import { PrismaClient as TrainingClient } from '../generated/entrenamiento/client.js';
import { runNormalizedStartup } from './normalized-startup-flow.mts';

type App = 'identidad' | 'entrenamiento';

interface MigrationRow {
  migrationName: string;
  finishedAt: Date | null;
  rolledBackAt: Date | null;
}

interface BackfillDiagnostic {
  accounts?: number;
  assessments?: number;
  susResponses?: number;
  cutoverSafe?: boolean;
}

function appName(): App {
  const value = process.env.APP;
  if (value !== 'identidad' && value !== 'entrenamiento') {
    throw new Error('APP debe ser identidad o entrenamiento.');
  }
  return value;
}

function run(command: string, args: string[]): string {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} terminó con código ${result.status}.`);
  }
  return result.stdout;
}

function prismaConfig(app: App, cutover = false): string {
  return `prisma.${app}${cutover ? '.cutover' : ''}.config.ts`;
}

async function migrationState(app: App) {
  const connectionString = process.env[
    app === 'identidad' ? 'IDENTIDAD_DATABASE_URL' : 'ENTRENAMIENTO_DATABASE_URL'
  ];
  if (!connectionString) throw new Error(`Falta la URL de base para ${app}.`);

  const client = app === 'identidad'
    ? new IdentityClient({ adapter: new PrismaPg({ connectionString }, { schema: app }) })
    : new TrainingClient({ adapter: new PrismaPg({ connectionString }, { schema: app }) });

  try {
    const [migrationTable] = await client.$queryRaw<{ exists: boolean }[]>`
      SELECT to_regclass(${`"${app}"."_prisma_migrations"`}) IS NOT NULL AS exists
    `;
    if (!migrationTable?.exists) return { failed: [], cutoverApplied: false };

    const rows = await client.$queryRawUnsafe<MigrationRow[]>(`
      SELECT migration_name AS "migrationName",
             finished_at AS "finishedAt",
             rolled_back_at AS "rolledBackAt"
      FROM "${app}"."_prisma_migrations"
    `);
    const cutoverName = app === 'identidad'
      ? '20261116210000_normalized_identity_retire_legacy'
      : '20261116211000_normalized_training_retire_legacy';
    return {
      failed: rows
        .filter(({ finishedAt, rolledBackAt }) => !finishedAt && !rolledBackAt)
        .map(({ migrationName }) => migrationName),
      cutoverApplied: rows.some(
        ({ migrationName, finishedAt }) => migrationName === cutoverName && finishedAt,
      ),
    };
  } finally {
    await client.$disconnect();
  }
}

function runBackfill(app: App): BackfillDiagnostic {
  const script = app === 'identidad'
    ? 'prisma/migrate-normalized-identity.mts'
    : 'prisma/migrate-normalized-training.mts';
  const diagnostic = JSON.parse(run(process.execPath, [script])) as BackfillDiagnostic;
  const expectedCount = app === 'identidad'
    ? diagnostic.accounts
    : (diagnostic.assessments ?? 0) + (diagnostic.susResponses ?? 0);
  if (!Number.isSafeInteger(expectedCount) || expectedCount! < 0) {
    throw new Error(`El diagnóstico de ${app} no devolvió un conteo válido.`);
  }
  const applied = JSON.parse(run(process.execPath, [
    script,
    '--apply',
    '--expected-count',
    String(expectedCount),
  ])) as BackfillDiagnostic;
  return {
    cutoverSafe: app === 'identidad' || applied.cutoverSafe === true,
  };
}

function startApplication(app: App): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [`dist/apps/${app}/src/main`], {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'inherit',
    });
    const forwardSignal = (signal: NodeJS.Signals) => child.kill(signal);
    process.on('SIGTERM', forwardSignal);
    process.on('SIGINT', forwardSignal);
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      process.off('SIGTERM', forwardSignal);
      process.off('SIGINT', forwardSignal);
      if (signal) process.kill(process.pid, signal);
      else process.exitCode = code ?? 1;
      resolve();
    });
  });
}

async function main(): Promise<void> {
  const app = appName();
  await runNormalizedStartup({
    readMigrationState: () => migrationState(app),
    deployExpand: async () => {
      run('node_modules/.bin/prisma', [
        'migrate', 'deploy', '--config', prismaConfig(app),
      ]);
    },
    backfill: async () => ({
      cutoverSafe: runBackfill(app).cutoverSafe === true,
    }),
    deployCutover: async () => {
      run('node_modules/.bin/prisma', [
        'migrate', 'deploy', '--config', prismaConfig(app, true),
      ]);
    },
    startApplication: () => startApplication(app),
  });
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Falló el inicio del servicio.');
  process.exitCode = 1;
});
