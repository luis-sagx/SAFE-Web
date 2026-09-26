import { createPublicKey } from 'node:crypto';
import type { ConfigService } from '@nestjs/config';

/// ECDSA P-256. Asimétrico a propósito: con un secreto compartido (HS256),
/// quien comprometiera `entrenamiento` podría fabricar un access token de
/// supervisor y entrar a `identidad`. Con un par de claves por servicio, cada
/// uno solo puede firmar lo suyo y verificar lo del otro.
export const JWT_ALGORITHM = 'ES256';

/// Lee una clave PEM guardada en base64 (el .env no admite saltos de línea;
/// se generan con scripts/generate-jwt-keys.sh). Una clave mal copiada tumba
/// el arranque con el nombre de la variable, no la primera petición con un
/// error de firma.
export function readPemKey(config: ConfigService, name: string): string {
  const pem = Buffer.from(config.getOrThrow<string>(name), 'base64').toString(
    'utf8',
  );
  let curve: string | undefined;
  try {
    // Acepta una clave privada o pública: de una privada deriva la pública.
    curve = createPublicKey(pem).asymmetricKeyDetails?.namedCurve;
  } catch {
    throw new Error(`${name} no es una clave PEM válida en base64.`);
  }
  if (curve !== 'prime256v1') {
    throw new Error(`${name} debe ser una clave EC P-256 (ES256).`);
  }
  return pem;
}
