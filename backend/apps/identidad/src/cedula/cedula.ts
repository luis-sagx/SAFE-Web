import { createHmac, timingSafeEqual } from 'node:crypto';
import { registerDecorator, type ValidationOptions } from 'class-validator';

/**
 * Cédula de identidad ecuatoriana.
 *
 * LO QUE ESTO HACE: detectar cédulas INVENTADAS mediante el algoritmo módulo 10
 * del Registro Civil.
 *
 * LO QUE NO HACE: probar identidad. Una cédula ajena pero válida pasa la
 * validación. Es todo lo que se puede comprobar sin consultar al Registro
 * Civil, y alcanza para el objetivo declarado —una cuenta por persona—, que no
 * es autenticación.
 */

/// Coeficientes del módulo 10 para los nueve primeros dígitos.
const COEFICIENTES = [2, 1, 2, 1, 2, 1, 2, 1, 2];

export function esCedulaEcuatoriana(valor: unknown): boolean {
  if (typeof valor !== 'string' || !/^[0-9]{10}$/.test(valor)) {
    return false;
  }

  const digitos = [...valor].map(Number);

  // Código de provincia: 01–24, más 30 para ecuatorianos registrados en el
  // exterior. El 00 y el 25–29 no existen.
  const provincia = digitos[0] * 10 + digitos[1];
  if ((provincia < 1 || provincia > 24) && provincia !== 30) {
    return false;
  }

  // Tercer dígito < 6 identifica a una persona natural. Del 6 en adelante son
  // entidades públicas y sociedades, que no son participantes del estudio.
  if (digitos[2] >= 6) {
    return false;
  }

  const suma = COEFICIENTES.reduce((total, coeficiente, i) => {
    const producto = digitos[i] * coeficiente;
    // Un producto de dos cifras se reduce restando 9, que equivale a sumar
    // sus dígitos.
    return total + (producto >= 10 ? producto - 9 : producto);
  }, 0);

  const verificador = (10 - (suma % 10)) % 10;

  return verificador === digitos[9];
}

/// Decorador para los DTO. Se declara aquí y no en libs/comun porque la cédula
/// es asunto exclusivo del servicio de identidad.
export function EsCedulaEcuatoriana(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'esCedulaEcuatoriana',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate: (valor: unknown) => esCedulaEcuatoriana(valor),
        defaultMessage: () => 'La cédula no es válida. Son 10 dígitos.',
      },
    });
  };
}

/**
 * Huella de la cédula. Es lo ÚNICO que se guarda: la cédula en claro no entra
 * a la base, no sale en ninguna respuesta y no se registra en los logs.
 *
 * Se usa HMAC y no un hash a secas porque el espacio de cédulas son 10 dígitos:
 * un SHA-256 sin secreto se invierte por fuerza bruta en segundos. El pepper es
 * lo que lo hace irreversible.
 *
 * Y se usa HMAC y no bcrypt porque el valor tiene que ser DETERMINISTA para
 * servir de índice único — no es una contraseña que se verifique, es una llave
 * que se compara.
 *
 * Al cerrar la recolección, `pnpm anonimizar` destruye el pepper: sin él estos
 * hashes dejan de ser reversibles ni siquiera por fuerza bruta, y la
 * pseudonimización pasa a ser anonimización real (NIST SP 800-188).
 */
export function huellaCedula(cedula: string, pepper: string): string {
  return createHmac('sha256', pepper).update(cedula).digest('hex');
}

/// Comparación en tiempo constante, por si alguna vez se usa fuera del índice
/// único de la base.
export function mismaHuella(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}
