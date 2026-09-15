import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateTrainerDto } from './create-trainer.dto';

function validate(overrides: Record<string, unknown>) {
  return validateSync(plainToInstance(CreateTrainerDto, {
    nombre: 'Lucía',
    apellido: 'Mena',
    email: 'lucia@espe.edu.ec',
    ...overrides,
  })).map((error) => error.property);
}

describe('CreateTrainerDto', () => {
  it('acepta el nombre, apellido y correo de una cuenta TRAINER sin cédula', () => {
    expect(validate({})).toEqual([]);
  });

  it('rechaza un correo que no identifica una cuenta válida', () => {
    expect(validate({ email: 'no-es-correo' })).toContain('email');
  });
});
