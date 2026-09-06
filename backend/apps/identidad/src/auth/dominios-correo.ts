import { registerDecorator, type ValidationOptions } from 'class-validator';

/**
 * Filtro de dominio de correo para el registro (spec 2026-08-22, revisado:
 * el sufijo institucional pasó de `.edu.ec` al ccTLD `.ec` completo).
 *
 * LO QUE ESTO HACE: rechazar dominios inventados y proveedores desechables
 * conocidos (`mailinator.com`, `dominioinventado.xyz`).
 *
 * LO QUE NO HACE: probar que la casilla existe ni que la persona la
 * controla. Una cuenta Gmail nueva se crea en treinta segundos y pasa este
 * filtro igual. La defensa real contra eso es la verificación por enlace que
 * ya manda `AuthService.register()` — este filtro solo reduce el ruido de
 * registros con dominios que nadie usa de verdad.
 *
 * Dos mecanismos complementarios:
 */

/// Sufijo, no lista: `.ec` es el ccTLD que NIC.EC asigna en Ecuador. Cubre
/// `.edu.ec`, `.com.ec`, `.gob.ec`, `.med.ec` y cualquier dominio propio
/// registrado como `.ec`, sin mantener un catálogo de instituciones que
/// envejece al primer convenio nuevo. `endsWith('.ec')` incluye el punto
/// inicial, así que `midominio-ec.com` no pasa y `mail.epn.edu.ec` sí, sin
/// registrarlo aparte.
const SUFIJOS_PERMITIDOS = ['.ec'];

/// Aquí no hay regla posible; hay que enumerar. Añadir un proveedor es editar
/// este Set, el único lugar donde vive la lista.
///
/// Cubre Google, Microsoft, Yahoo, Apple y Proton con sus variantes
/// regionales/legadas más comunes en Ecuador, más un puñado de proveedores
/// internacionales genéricos (GMX, Zoho, Yandex, AOL, mail.com) para no
/// bloquear a alguien legítimo que no usa ninguno de los cuatro grandes. La
/// lista de desechables (mailinator y similares) sigue sin entrar aquí a
/// propósito: por diseño, todo lo que no está en este Set ni termina en
/// `.ec` queda fuera, sin necesidad de mantener también una lista negra.
const DOMINIOS_PERMITIDOS = new Set([
  // Google
  'gmail.com',
  'googlemail.com',
  // Microsoft
  'hotmail.com',
  'hotmail.es',
  'hotmail.co.uk',
  'hotmail.com.mx',
  'outlook.com',
  'outlook.es',
  'live.com',
  'live.com.mx',
  'msn.com',
  // Yahoo
  'yahoo.com',
  'yahoo.es',
  'yahoo.com.mx',
  'ymail.com',
  // Apple
  'icloud.com',
  'me.com',
  // Proton
  'proton.me',
  'protonmail.com',
  'protonmail.ch',
  // Otros proveedores internacionales de uso corriente
  'aol.com',
  'mail.com',
  'gmx.com',
  'gmx.net',
  'zoho.com',
  'yandex.com',
  'fastmail.com',
]);

export function dominioPermitido(valor: unknown): boolean {
  // Guarda contra el doble mensaje: si no es texto o no tiene "@", deja que
  // hable solo @IsEmail en vez de sumar un segundo error para el mismo dato.
  if (typeof valor !== 'string') return true;
  const arroba = valor.lastIndexOf('@');
  if (arroba === -1) return true;

  const dominio = valor.slice(arroba + 1);
  return (
    DOMINIOS_PERMITIDOS.has(dominio) ||
    SUFIJOS_PERMITIDOS.some((sufijo) => dominio.endsWith(sufijo))
  );
}

/// No se normaliza dos veces: `@NormalizarEmail()` (`libs/comun/src/transform.ts`)
/// ya aplicó `trim().toLowerCase()` antes de que corran los validadores,
/// porque `plainToInstance` precede a `validate`.
export function EsDominioPermitido(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'esDominioPermitido',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate: (valor: unknown) => dominioPermitido(valor),
        defaultMessage: () =>
          'Ese proveedor de correo no está permitido para el registro.',
      },
    });
  };
}
