import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readLegacyIdentity } from '../identity-migration-source.mts';

test('lee las tablas legacy con SQL aunque el cliente de destino ya esté normalizado', async () => {
  const statements: string[] = [];
  const legacy = await readLegacyIdentity(async <T,>(
    strings: TemplateStringsArray,
  ): Promise<T> => {
      const sql = strings.join('?');
      statements.push(sql);
      if (sql.includes('FROM "identidad"."Participant"')) {
        return [{ id: 'legacy-id', role: 'PARTICIPANT' }] as T;
      }
      if (sql.includes('FROM "identidad"."Certificate"')) {
        return [{ id: 'legacy-cert', modulos: ['m1'] }] as T;
      }
      throw new Error('Consulta legacy inesperada.');
    });

  assert.deepEqual(legacy.participants, [{ id: 'legacy-id', role: 'PARTICIPANT' }]);
  assert.deepEqual(legacy.certificates, [{ id: 'legacy-cert', modulos: ['m1'] }]);
  assert.equal(statements.length, 2);
  assert.ok(statements[0]?.includes('FROM "identidad"."Participant"'));
  assert.ok(statements[1]?.includes('FROM "identidad"."Certificate"'));
});
