import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findParticipantsMissingBaseline } from '../normalized-training-data.ts';

test('el migrador solo acepta faltantes PRE cubiertos por una exención legacy exacta', () => {
  const missing = findParticipantsMissingBaseline(
    [],
    ['exempt-run', 'unmatched-run'],
    ['exempt-run'],
  );

  assert.deepEqual(missing, ['unmatched-run']);
});

test('una exención no cubre un POST de otra persona sin PRE', () => {
  const missing = findParticipantsMissingBaseline(
    [{ participantId: 'post-without-pre', version: 1, phase: 'POST' }],
    [],
    ['different-participant'],
  );

  assert.deepEqual(missing, ['post-without-pre']);
});
