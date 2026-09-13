import { registerDecorator, type ValidationOptions } from 'class-validator';

// Filtro de dominio de correo (spec 2026-08-22): rechaza dominios inventados/desechables
// conocidos, pero no prueba que la casilla existe — eso lo cubre la verificación por
// enlace de AuthService.register(). Solo reduce ruido de registros con dominios inusados.

// Sufijo, no lista: `.ec` es el ccTLD de Ecuador, cubre .edu.ec/.com.ec/.gob.ec/etc. sin
// mantener catálogo de instituciones. endsWith incluye el punto, así que "midominio-ec.com"
// no pasa pero "mail.epn.edu.ec" sí.
const ALLOWED_SUFFIXES = ['.ec'];

// Aquí no hay regla posible, hay que enumerar (único lugar con la lista). Cubre los grandes
// proveedores y algunos genéricos internacionales para no bloquear a alguien legítimo; los
// desechables (mailinator) quedan fuera a propósito, igual que todo lo no listado ni en .ec.
const ALLOWED_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'hotmail.com',
  'hotmail.es',
  'hotmail.co.uk',
  'hotmail.com.mx',
  'outlook.com',
  'outlook.es',
  'live.com',
  'live.com.mx',
  'msn.com',
  'yahoo.com',
  'yahoo.es',
  'yahoo.com.mx',
  'ymail.com',
  'icloud.com',
  'me.com',
  'proton.me',
  'protonmail.com',
  'protonmail.ch',
  'aol.com',
  'mail.com',
  'gmx.com',
  'gmx.net',
  'zoho.com',
  'yandex.com',
  'fastmail.com',
]);

export function allowedDomain(value: unknown): boolean {
  // Guarda contra el doble mensaje: si no es texto o no tiene "@", deja que
  // hable solo @IsEmail en vez de sumar un segundo error para el mismo dato.
  if (typeof value !== 'string') return true;
  const atSign = value.lastIndexOf('@');
  if (atSign === -1) return true;

  const domain = value.slice(atSign + 1);
  return (
    ALLOWED_DOMAINS.has(domain) ||
    ALLOWED_SUFFIXES.some((suffix) => domain.endsWith(suffix))
  );
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
          'Ese proveedor de correo no está permitido para el registro.',
      },
    });
  };
}
