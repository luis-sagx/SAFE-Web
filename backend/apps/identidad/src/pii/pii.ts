import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from 'node:crypto';

// Cifrado en reposo de nombre/apellido/correo (issue #95): protege contra quien se lleve
// SOLO la base de datos, no contra quien comprometa la app completa. AES-256-GCM porque
// es autenticado (`decrypt()` revienta si el texto fue alterado) y usa IV por valor.

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

// Prefijo que permite migrar en caliente: un valor sin él es texto plano de antes del
// cambio y `decrypt()` lo devuelve tal cual, así una fila que `backfill-pii.mts` no
// alcanzó todavía sigue legible sin romper login ni admin.
const PREFIX = 'v1:';

function password(passwordBase64: string): Buffer {
  const buffer = Buffer.from(passwordBase64, 'base64');
  if (buffer.length !== 32) {
    throw new Error(
      'PII_ENCRYPTION_KEY debe ser una clave de 32 bytes en base64 (openssl rand -base64 32).',
    );
  }
  return buffer;
}

export function encrypt(text: string, passwordBase64: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, password(passwordBase64), iv);
  const encryptedValue = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);
  const label = cipher.getAuthTag();

  return PREFIX + Buffer.concat([iv, label, encryptedValue]).toString('base64');
}

export function decrypt(value: string, passwordBase64: string): string {
  if (!value.startsWith(PREFIX)) {
    return value;
  }

  const data = Buffer.from(value.slice(PREFIX.length), 'base64');
  const iv = data.subarray(0, IV_LENGTH);
  const label = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encryptedValue = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, password(passwordBase64), iv);
  decipher.setAuthTag(label);

  return Buffer.concat([
    decipher.update(encryptedValue),
    decipher.final(),
  ]).toString('utf8');
}

/// Nullable de un lado a otro sin forzar `decrypt('')` en el camino: los
/// campos de la fila que consultan `select` a veces no vienen, y `null` no es
/// texto cifrado ni texto plano, es "no hay nada que descifrar".
export function decryptOptional(
  value: string | null,
  passwordBase64: string,
): string | null {
  return value === null ? null : decrypt(value, passwordBase64);
}

// Mismo patrón que huellaCedula (HMAC determinista) para indexar por correo sin guardarlo
// en claro. Pepper propio, distinto del de la cédula, para que filtrarse uno no arrastre al otro.
export function hashEmail(email: string, pepper: string): string {
  return createHmac('sha256', pepper).update(email).digest('hex');
}
