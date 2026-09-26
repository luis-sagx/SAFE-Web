import { generateKeyPairSync } from 'node:crypto';
import type { ConfigService } from '@nestjs/config';
import { readPemKey } from './jwt-keys';

function configWith(value: string): ConfigService {
  return { getOrThrow: () => value } as unknown as ConfigService;
}

function base64Pem(namedCurve: string): string {
  const pem = generateKeyPairSync('ec', { namedCurve })
    .privateKey.export({ type: 'pkcs8', format: 'pem' })
    .toString();
  return Buffer.from(pem).toString('base64');
}

describe('readPemKey', () => {
  it('devuelve el PEM de una clave P-256 en base64', () => {
    expect(readPemKey(configWith(base64Pem('P-256')), 'CLAVE')).toContain(
      'BEGIN PRIVATE KEY',
    );
  });

  it('rechaza al arrancar un valor que no es una clave, nombrando la variable', () => {
    expect(() => readPemKey(configWith('no-es-una-clave'), 'CLAVE')).toThrow(
      'CLAVE no es una clave PEM válida en base64.',
    );
  });

  // ES256 exige P-256: con otra curva la firma fallaría recién en la primera
  // petición.
  it('rechaza una clave de otra curva', () => {
    expect(() => readPemKey(configWith(base64Pem('P-384')), 'CLAVE')).toThrow(
      'CLAVE debe ser una clave EC P-256 (ES256).',
    );
  });
});
