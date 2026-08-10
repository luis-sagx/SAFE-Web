import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateRunDto } from './create-run.dto';

function validar(overrides: Record<string, unknown>) {
  const base = {
    scenarioId: 'phishing/factura-sri',
    version: 1,
    outcome: 'CORRECTO',
    score: 100,
    endingId: 'e_verifica',
    durationMs: 42_000,
    startedAt: '2026-08-01T10:00:00.000Z',
  };
  const dto = plainToInstance(CreateRunDto, { ...base, ...overrides });
  return validateSync(dto).map((e) => e.property);
}

describe('CreateRunDto.decisions', () => {
  it('acepta que se omita', () => {
    expect(validar({})).toEqual([]);
  });

  it('acepta un arreglo', () => {
    expect(validar({ decisions: [{ nodo: 'n1' }, { nodo: 'n2' }] })).toEqual(
      [],
    );
  });

  // Antes `decisions: unknown` dejaba entrar cualquier JSON a la tabla.
  it('rechaza un valor que no es arreglo', () => {
    expect(validar({ decisions: { forma: 'arbitraria' } })).toContain(
      'decisions',
    );
  });

  it('rechaza un arreglo desmesurado', () => {
    expect(validar({ decisions: Array(501).fill(0) })).toContain('decisions');
  });
});
