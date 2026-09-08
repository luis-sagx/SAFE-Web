import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { RegisterDto } from './register.dto';

function validar(overrides: Record<string, unknown>) {
  const base = {
    nombre: 'Ana',
    apellido: 'Pérez',
    email: 'ana@gmail.com',
    cedula: '1710034065',
    password: 'Contraseña-larga1!',
  };
  const dto = plainToInstance(RegisterDto, { ...base, ...overrides });
  return validateSync(dto).map((e) => e.property);
}

describe('RegisterDto.email — dominios permitidos', () => {
  it('acepta un proveedor libre conocido', () => {
    expect(validar({ email: 'ana@gmail.com' })).toEqual([]);
    expect(validar({ email: 'ana@outlook.com' })).toEqual([]);
    expect(validar({ email: 'ana@yahoo.com' })).toEqual([]);
    expect(validar({ email: 'ana@icloud.com' })).toEqual([]);
    expect(validar({ email: 'ana@zoho.com' })).toEqual([]);
  });

  it('acepta cualquier dominio .ec', () => {
    expect(validar({ email: 'ana@espe.edu.ec' })).toEqual([]);
    expect(validar({ email: 'ana@epn.edu.ec' })).toEqual([]);
    expect(validar({ email: 'ana@miempresa.com.ec' })).toEqual([]);
    expect(validar({ email: 'ana@algo.ec' })).toEqual([]);
  });

  it('acepta un subdominio bajo .ec', () => {
    expect(validar({ email: 'ana@mail.usfq.edu.ec' })).toEqual([]);
  });

  it('normaliza antes de validar', () => {
    expect(validar({ email: '  Ana@GMAIL.com ' })).toEqual([]);
  });

  it('rechaza un proveedor desechable', () => {
    expect(validar({ email: 'ana@mailinator.com' })).toContain('email');
  });

  it('rechaza un dominio inventado que no es .ec', () => {
    expect(validar({ email: 'ana@dominioinventado.xyz' })).toContain('email');
  });

  it('no se deja engañar por un sufijo parecido a .ec', () => {
    expect(validar({ email: 'ana@midominio-ec.com' })).toContain('email');
  });

  it('un correo con formato inválido da un solo error', () => {
    expect(validar({ email: 'noesuncorreo' })).toEqual(['email']);
  });
});

describe('RegisterDto.password — política de fortaleza', () => {
  it('acepta una contraseña con mayúscula, número y carácter especial', () => {
    expect(validar({ password: 'Contraseña-larga1!' })).toEqual([]);
  });

  it('rechaza una contraseña solo con minúsculas y números', () => {
    expect(validar({ password: 'contraseñalarga1' })).toContain('password');
  });

  it('rechaza una contraseña sin número', () => {
    expect(validar({ password: 'Contraseña-larga!' })).toContain('password');
  });

  it('rechaza una contraseña sin carácter especial', () => {
    expect(validar({ password: 'Contrasenalarga1' })).toContain('password');
  });

  it('rechaza una contraseña débil aunque cumpla el largo mínimo', () => {
    expect(validar({ password: '12345678' })).toContain('password');
  });

  it('sigue exigiendo el mínimo de 8 caracteres', () => {
    expect(validar({ password: 'Ab1!' })).toContain('password');
  });
});
