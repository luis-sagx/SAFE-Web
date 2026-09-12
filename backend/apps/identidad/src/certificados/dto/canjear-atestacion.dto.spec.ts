import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { RedeemAttestationDto } from './canjear-atestacion.dto';

function validate(attestation: unknown) {
  const dto = plainToInstance(RedeemAttestationDto, {
    atestacion: attestation,
  });
  return validateSync(dto).map((e) => e.property);
}

describe('CanjearAtestacionDto', () => {
  it('acepta una cadena con forma de JWT', () => {
    expect(validate('aaa.bbb.ccc')).toEqual([]);
  });

  it('rechaza una cadena sin la forma de un JWT', () => {
    expect(validate('no-es-un-jwt')).toContain('atestacion');
  });

  it('rechaza que falte el campo', () => {
    expect(validate(undefined)).toContain('atestacion');
  });
});
