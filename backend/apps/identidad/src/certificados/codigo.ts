import { randomInt } from 'node:crypto';

/// Sin O/0 ni I/1: el código se lee y se teclea desde un papel, y esos cuatro
/// caracteres son los que más se confunden a mano.
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function grupo(longitud: number): string {
  let s = '';
  for (let i = 0; i < longitud; i++) {
    s += ALFABETO[randomInt(ALFABETO.length)];
  }
  return s;
}

/**
 * Código del certificado: "SW-XXXX-XXXX". Aleatorio y sin relación con `seq`
 * ni con ningún dato personal — derivarlo filtraría el orden de registro o el
 * número de participantes del estudio a quien reúna dos códigos.
 */
export function generarCodigoCertificado(): string {
  return `SW-${grupo(4)}-${grupo(4)}`;
}
