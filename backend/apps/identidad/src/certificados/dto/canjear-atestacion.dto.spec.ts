import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CanjearAtestacionDto } from './canjear-atestacion.dto';

function validar(atestacion: unknown) {
  const dto = plainToInstance(CanjearAtestacionDto, { atestacion });
  return validateSync(dto).map((e) => e.property);
}

describe('CanjearAtestacionDto', () => {
  it('acepta una cadena con forma de JWT', () => {
    expect(validar('aaa.bbb.ccc')).toEqual([]);
  });

  it('rechaza una cadena sin la forma de un JWT', () => {
    expect(validar('no-es-un-jwt')).toContain('atestacion');
  });

  it('rechaza que falte el campo', () => {
    expect(validar(undefined)).toContain('atestacion');
  });
});
