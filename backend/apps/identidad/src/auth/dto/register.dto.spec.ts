import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { RegisterDto } from './register.dto';

function validate(overrides: Record<string, unknown>) {
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
    expect(validate({ email: 'ana@gmail.com' })).toEqual([]);
    expect(validate({ email: 'ana@outlook.com' })).toEqual([]);
    expect(validate({ email: 'ana@yahoo.com' })).toEqual([]);
    expect(validate({ email: 'ana@icloud.com' })).toEqual([]);
    expect(validate({ email: 'ana@zoho.com' })).toEqual([]);
  });

  it('acepta cualquier dominio .ec', () => {
    expect(validate({ email: 'ana@espe.edu.ec' })).toEqual([]);
    expect(validate({ email: 'ana@epn.edu.ec' })).toEqual([]);
    expect(validate({ email: 'ana@miempresa.com.ec' })).toEqual([]);
    expect(validate({ email: 'ana@algo.ec' })).toEqual([]);
  });

  it('acepta un subdominio bajo .ec', () => {
    expect(validate({ email: 'ana@mail.usfq.edu.ec' })).toEqual([]);
  });

  it('normaliza antes de validar', () => {
    expect(validate({ email: '  Ana@GMAIL.com ' })).toEqual([]);
  });

  it('rechaza un proveedor desechable', () => {
    expect(validate({ email: 'ana@mailinator.com' })).toContain('email');
  });

  it('rechaza un dominio inventado que no es .ec', () => {
    expect(validate({ email: 'ana@dominioinventado.xyz' })).toContain('email');
  });

  it('no se deja engañar por un sufijo parecido a .ec', () => {
    expect(validate({ email: 'ana@midominio-ec.com' })).toContain('email');
  });

  it('un correo con formato inválido da un solo error', () => {
    expect(validate({ email: 'noesuncorreo' })).toEqual(['email']);
  });
});

describe('RegisterDto.password — política de fortaleza', () => {
  it('acepta una contraseña con mayúscula, número y carácter especial', () => {
    expect(validate({ password: 'Contraseña-larga1!' })).toEqual([]);
  });

  it('rechaza una contraseña solo con minúsculas y números', () => {
    expect(validate({ password: 'contraseñalarga1' })).toContain('password');
  });

  it('rechaza una contraseña sin número', () => {
    expect(validate({ password: 'Contraseña-larga!' })).toContain('password');
  });

  it('rechaza una contraseña sin carácter especial', () => {
    expect(validate({ password: 'Contrasenalarga1' })).toContain('password');
  });

  it('rechaza una contraseña débil aunque cumpla el largo mínimo', () => {
    expect(validate({ password: '12345678' })).toContain('password');
  });

  it('sigue exigiendo el mínimo de 8 caracteres', () => {
    expect(validate({ password: 'Ab1!' })).toContain('password');
  });
});

describe('RegisterDto.nombre / apellido — caracteres permitidos', () => {
  it('acepta un nombre simple', () => {
    expect(validate({ nombre: 'Ana' })).toEqual([]);
  });

  it('acepta tildes y ñ', () => {
    expect(validate({ nombre: 'José' })).toEqual([]);
    expect(validate({ nombre: 'Iñaki' })).toEqual([]);
  });

  it('acepta un nombre compuesto con espacio', () => {
    expect(validate({ nombre: 'María José' })).toEqual([]);
  });

  it('rechaza un apellido con guion', () => {
    expect(validate({ apellido: 'García-Torres' })).toContain('apellido');
  });

  it('rechaza un apóstrofe interno, aunque sea de un nombre compuesto real', () => {
    expect(validate({ nombre: "D'Ángelo" })).toContain('nombre');
  });

  it('rechaza una comilla simple suelta al final, el caso reportado', () => {
    expect(validate({ nombre: "nombre'" })).toContain('nombre');
  });

  it('rechaza dígitos', () => {
    expect(validate({ nombre: 'Ana123' })).toContain('nombre');
  });

  it('rechaza comillas dobles', () => {
    expect(validate({ nombre: '"Ana"' })).toContain('nombre');
  });

  it('rechaza puntuación de código', () => {
    expect(validate({ nombre: 'Ana;DROP' })).toContain('nombre');
    expect(validate({ apellido: '<script>' })).toContain('apellido');
  });

  it('rechaza un guion o apóstrofe en cualquier posición', () => {
    expect(validate({ nombre: '-Ana' })).toContain('nombre');
    expect(validate({ nombre: 'Ana-' })).toContain('nombre');
    expect(validate({ nombre: "'Ana" })).toContain('nombre');
  });

  it('rechaza separadores repetidos, como un espacio doble', () => {
    expect(validate({ nombre: 'Ana  María' })).toContain('nombre');
  });
});
