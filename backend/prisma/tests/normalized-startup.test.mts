import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runNormalizedStartup } from '../normalized-startup-flow.mts';

test('aplica expand, backfill, corte y arranca en ese orden', async () => {
  const steps: string[] = [];

  await runNormalizedStartup({
    readMigrationState: async () => ({ failed: [], cutoverApplied: false }),
    deployExpand: async () => { steps.push('expand'); },
    backfill: async () => {
      steps.push('backfill');
      return { cutoverSafe: true };
    },
    deployCutover: async () => { steps.push('cutover'); },
    startApplication: async () => { steps.push('app'); },
  });

  assert.deepEqual(steps, ['expand', 'backfill', 'cutover', 'app']);
});

test('no marca automáticamente como revertida una migración fallida', async () => {
  const steps: string[] = [];

  await assert.rejects(
    runNormalizedStartup({
      readMigrationState: async () => ({
        failed: ['20261116210000_normalized_identity_retire_legacy'],
        cutoverApplied: false,
      }),
      deployExpand: async () => { steps.push('expand'); },
      backfill: async () => ({ cutoverSafe: true }),
      deployCutover: async () => { steps.push('cutover'); },
      startApplication: async () => { steps.push('app'); },
    }),
    /migrate resolve --rolled-back/,
  );

  assert.deepEqual(steps, []);
});

test('un reinicio luego del corte no toca tablas legacy', async () => {
  const steps: string[] = [];

  await runNormalizedStartup({
    readMigrationState: async () => ({ failed: [], cutoverApplied: true }),
    deployExpand: async () => { steps.push('expand'); },
    backfill: async () => { steps.push('backfill'); return { cutoverSafe: true }; },
    deployCutover: async () => { steps.push('cutover'); },
    startApplication: async () => { steps.push('app'); },
  });

  assert.deepEqual(steps, ['expand', 'app']);
});

test('si el entrenamiento tiene participantes sin PRE, arranca sin retirar legacy', async () => {
  const steps: string[] = [];

  await runNormalizedStartup({
    readMigrationState: async () => ({ failed: [], cutoverApplied: false }),
    deployExpand: async () => { steps.push('expand'); },
    backfill: async () => { steps.push('backfill'); return { cutoverSafe: false }; },
    deployCutover: async () => { steps.push('cutover'); },
    startApplication: async () => { steps.push('app'); },
  });

  assert.deepEqual(steps, ['expand', 'backfill', 'app']);
});
