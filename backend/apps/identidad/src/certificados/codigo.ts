import { randomInt } from 'node:crypto';

/// Sin O/0 ni I/1: el código se lee y se teclea desde un papel, y esos cuatro
/// caracteres son los que más se confunden a mano.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function group(length: number): string {
  let s = '';
  for (let i = 0; i < length; i++) {
    s += ALPHABET[randomInt(ALPHABET.length)];
  }
  return s;
}

// Código "SW-XXXX-XXXX": aleatorio y sin relación con `seq` ni datos personales, para no
// filtrar el orden de registro ni el número de participantes a quien reúna dos códigos.
export function generateCertificateCode(): string {
  return `SW-${group(4)}-${group(4)}`;
}
