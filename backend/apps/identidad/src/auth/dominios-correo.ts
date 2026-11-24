import { registerDecorator, type ValidationOptions } from 'class-validator';

const ALLOWED_DOMAIN = 'espe.edu.ec';

export function allowedDomain(value: unknown): boolean {
  // Guarda contra el doble mensaje: si no es texto o no tiene "@", deja que
  // hable solo @IsEmail en vez de sumar un segundo error para el mismo dato.
  if (typeof value !== 'string') return true;
  const atSign = value.lastIndexOf('@');
  if (atSign === -1) return true;

  const domain = value.slice(atSign + 1);
  return domain === ALLOWED_DOMAIN;
}

/// No se normaliza dos veces: `@NormalizeEmail()` (`libs/comun/src/transform.ts`)
/// ya aplicó `trim().toLowerCase()` antes de que corran los validadores,
/// porque `plainToInstance` precede a `validate`.
export function IsAllowedDomain(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'esDominioPermitido',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate: (value: unknown) => allowedDomain(value),
        defaultMessage: () =>
          'El correo debe pertenecer al dominio @espe.edu.ec.',
      },
    });
  };
}
