export interface MigrationState {
  failed: string[];
  cutoverApplied: boolean;
}

export interface BackfillResult {
  cutoverSafe: boolean;
}

export interface NormalizedStartupOperations {
  readMigrationState(): Promise<MigrationState>;
  deployExpand(): Promise<void>;
  backfill(): Promise<BackfillResult>;
  deployCutover(): Promise<void>;
  startApplication(): Promise<void>;
}

function assertNoFailedMigrations(state: MigrationState): void {
  if (state.failed.length > 0) {
    const migrationNames = state.failed.join(', ');
    throw new Error(
      `Hay migraciones fallidas sin resolver: ${migrationNames}. Verifica el respaldo, la transacción y las tablas; luego ejecuta manualmente prisma migrate resolve --rolled-back <migration> con la configuración de cutover del servicio.`,
    );
  }
}

export async function runNormalizedStartup(
  operations: NormalizedStartupOperations,
): Promise<void> {
  assertNoFailedMigrations(await operations.readMigrationState());
  await operations.deployExpand();

  const state = await operations.readMigrationState();
  assertNoFailedMigrations(state);

  if (!state.cutoverApplied) {
    const result = await operations.backfill();
    if (result.cutoverSafe) {
      await operations.deployCutover();
    }
  }

  await operations.startApplication();
}
