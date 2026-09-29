import { decrypt, encrypt, hashEmail } from './pii';
import {
  analyzeEmailHashReconciliation,
  planEmailHashReconciliation,
} from './email-hash-reconciliation';

const KEY = Buffer.alloc(32, 7).toString('base64');
const PEPPER = 'pepper-de-prueba';
const decryptEmail = (value: string) => decrypt(value, KEY);
const hashNormalizedEmail = (value: string) => hashEmail(value, PEPPER);

describe('reconciliación de huellas de correo', () => {
  it('resume las cuentas reparables y bloqueadas por duplicados sin revelar correos', () => {
    const rows = [
      {
        id: 'uno',
        email: encrypt('Ana@ejemplo.ec', KEY),
        emailHash: 'viejo-1',
      },
      {
        id: 'dos',
        email: encrypt(' ana@ejemplo.ec ', KEY),
        emailHash: 'viejo-2',
      },
      {
        id: 'tres',
        email: encrypt('otro@ejemplo.ec', KEY),
        emailHash: 'viejo-3',
      },
      {
        id: 'cuatro',
        email: encrypt('listo@ejemplo.ec', KEY),
        emailHash: hashEmail('listo@ejemplo.ec', PEPPER),
      },
    ];

    const result = analyzeEmailHashReconciliation(
      rows,
      decryptEmail,
      hashNormalizedEmail,
    );

    expect(result.summary).toEqual({
      total: 4,
      inconsistent: 3,
      repairable: 1,
      blocked: 2,
      duplicateGroupSizes: [2],
    });
  });

  it('propone cambiar solo las huellas inconsistentes', () => {
    const current = hashEmail('uno@ejemplo.ec', PEPPER);
    const result = planEmailHashReconciliation(
      [
        {
          id: 'uno',
          email: encrypt('uno@ejemplo.ec', KEY),
          emailHash: current,
        },
        {
          id: 'dos',
          email: encrypt('dos@ejemplo.ec', KEY),
          emailHash: 'anterior',
        },
      ],
      decryptEmail,
      hashNormalizedEmail,
    );

    expect(result).toEqual([
      {
        id: 'dos',
        previousHash: 'anterior',
        expectedHash: hashEmail('dos@ejemplo.ec', PEPPER),
      },
    ]);
  });

  it('excluye los correos repetidos tras normalizar', () => {
    const rows = [
      {
        id: 'uno',
        email: encrypt('Ana@ejemplo.ec', KEY),
        emailHash: 'viejo-1',
      },
      {
        id: 'dos',
        email: encrypt(' ana@ejemplo.ec ', KEY),
        emailHash: 'viejo-2',
      },
    ];

    expect(
      planEmailHashReconciliation(rows, decryptEmail, hashNormalizedEmail),
    ).toEqual([]);
  });

  it('conserva el grupo duplicado y propone reparar una cuenta de correo único', () => {
    const rows = [
      {
        id: 'uno',
        email: encrypt('Ana@ejemplo.ec', KEY),
        emailHash: 'viejo-1',
      },
      {
        id: 'dos',
        email: encrypt(' ana@ejemplo.ec ', KEY),
        emailHash: 'viejo-2',
      },
      {
        id: 'tres',
        email: encrypt('otro@ejemplo.ec', KEY),
        emailHash: 'viejo-3',
      },
    ];

    expect(
      planEmailHashReconciliation(rows, decryptEmail, hashNormalizedEmail),
    ).toEqual([
      {
        id: 'tres',
        previousHash: 'viejo-3',
        expectedHash: hashEmail('otro@ejemplo.ec', PEPPER),
      },
    ]);
  });

  it('aborta si la huella esperada está ocupada por una cuenta excluida', () => {
    const occupiedHash = hashEmail('otro@ejemplo.ec', PEPPER);
    const rows = [
      {
        id: 'uno',
        email: encrypt('Ana@ejemplo.ec', KEY),
        emailHash: occupiedHash,
      },
      {
        id: 'dos',
        email: encrypt('ana@ejemplo.ec', KEY),
        emailHash: 'viejo-2',
      },
      {
        id: 'tres',
        email: encrypt('otro@ejemplo.ec', KEY),
        emailHash: 'viejo-3',
      },
    ];

    expect(() =>
      planEmailHashReconciliation(rows, decryptEmail, hashNormalizedEmail),
    ).toThrow('Una huella de destino está ocupada por una cuenta excluida.');
  });

  it('rechaza una fila que no puede descifrarse sin proponer cambios parciales', () => {
    const rows = [
      { id: 'uno', email: encrypt('uno@ejemplo.ec', KEY), emailHash: 'viejo' },
      {
        id: 'dos',
        email: encrypt(
          'dos@ejemplo.ec',
          Buffer.alloc(32, 8).toString('base64'),
        ),
        emailHash: 'viejo-2',
      },
    ];

    expect(() =>
      planEmailHashReconciliation(rows, decryptEmail, hashNormalizedEmail),
    ).toThrow();
  });
});
