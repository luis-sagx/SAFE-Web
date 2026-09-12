import { createHmac, timingSafeEqual } from 'node:crypto';
import { registerDecorator, type ValidationOptions } from 'class-validator';

// Detecta cédulas INVENTADAS con el algoritmo módulo 10 del Registro Civil; no prueba
// identidad (una ajena pero válida pasa). Alcanza para el objetivo real: una cuenta
// por persona, no autenticación.
const COEFFICIENTS = [2, 1, 2, 1, 2, 1, 2, 1, 2];

export function isEcuadorianId(value: unknown): boolean {
  if (typeof value !== 'string' || !/^[0-9]{10}$/.test(value)) {
    return false;
  }

  const digits = [...value].map(Number);

  // Código de provincia: 01–24, más 30 para ecuatorianos registrados en el
  // exterior. El 00 y el 25–29 no existen.
  const province = digits[0] * 10 + digits[1];
  if ((province < 1 || province > 24) && province !== 30) {
    return false;
  }

  // Tercer dígito < 6 identifica a una persona natural. Del 6 en adelante son
  // entidades públicas y sociedades, que no son participantes del estudio.
  if (digits[2] >= 6) {
    return false;
  }

  const sum = COEFFICIENTS.reduce((total, coefficient, i) => {
    const product = digits[i] * coefficient;
    // Un producto de dos cifras se reduce restando 9, que equivale a sumar
    // sus dígitos.
    return total + (product >= 10 ? product - 9 : product);
  }, 0);

  const checkDigit = (10 - (sum % 10)) % 10;

  return checkDigit === digits[9];
}

/// Decorador para los DTO. Se declara aquí y no en libs/comun porque la cédula
/// es asunto exclusivo del servicio de identidad.
export function IsEcuadorianId(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'esCedulaEcuatoriana',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate: (value: unknown) => isEcuadorianId(value),
        defaultMessage: () => 'La cédula no es válida. Son 10 dígitos.',
      },
    });
  };
}

// Huella de la cédula, lo ÚNICO que se guarda. HMAC (con pepper) y no un hash a secas
// porque 10 dígitos se invierten por fuerza bruta sin secreto; y no bcrypt porque el
// valor debe ser DETERMINISTA para servir de índice único, no verificarse como password.
export function hashEcuadorianId(ecuadorianId: string, pepper: string): string {
  return createHmac('sha256', pepper).update(ecuadorianId).digest('hex');
}

/// Comparación en tiempo constante, por si alguna vez se usa fuera del índice
/// único de la base.
export function hasSameHash(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}
