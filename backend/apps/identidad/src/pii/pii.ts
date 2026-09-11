import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from 'node:crypto';

// Cifrado en reposo de nombre/apellido/correo (issue #95): protege contra quien se lleve
// SOLO la base de datos, no contra quien comprometa la app completa. AES-256-GCM porque
// es autenticado (`descifrar()` revienta si el texto fue alterado) y usa IV por valor.

const ALGORITMO = 'aes-256-gcm';
const LARGO_IV = 12;
const LARGO_ETIQUETA = 16;

// Prefijo que permite migrar en caliente: un valor sin él es texto plano de antes del
// cambio y `descifrar()` lo devuelve tal cual, así una fila que `backfill-pii.mts` no
// alcanzó todavía sigue legible sin romper login ni admin.
const PREFIJO = 'v1:';

function clave(claveBase64: string): Buffer {
  const buffer = Buffer.from(claveBase64, 'base64');
  if (buffer.length !== 32) {
    throw new Error(
      'PII_ENCRYPTION_KEY debe ser una clave de 32 bytes en base64 (openssl rand -base64 32).',
    );
  }
  return buffer;
}

export function cifrar(texto: string, claveBase64: string): string {
  const iv = randomBytes(LARGO_IV);
  const cipher = createCipheriv(ALGORITMO, clave(claveBase64), iv);
  const cifrado = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()]);
  const etiqueta = cipher.getAuthTag();

  return PREFIJO + Buffer.concat([iv, etiqueta, cifrado]).toString('base64');
}

export function descifrar(valor: string, claveBase64: string): string {
  if (!valor.startsWith(PREFIJO)) {
    return valor;
  }

  const datos = Buffer.from(valor.slice(PREFIJO.length), 'base64');
  const iv = datos.subarray(0, LARGO_IV);
  const etiqueta = datos.subarray(LARGO_IV, LARGO_IV + LARGO_ETIQUETA);
  const cifrado = datos.subarray(LARGO_IV + LARGO_ETIQUETA);

  const decipher = createDecipheriv(ALGORITMO, clave(claveBase64), iv);
  decipher.setAuthTag(etiqueta);

  return Buffer.concat([decipher.update(cifrado), decipher.final()]).toString(
    'utf8',
  );
}

/// Nullable de un lado a otro sin forzar `descifrar('')` en el camino: los
/// campos de la fila que consultan `select` a veces no vienen, y `null` no es
/// texto cifrado ni texto plano, es "no hay nada que descifrar".
export function descifrarOpcional(
  valor: string | null,
  claveBase64: string,
): string | null {
  return valor === null ? null : descifrar(valor, claveBase64);
}

// Mismo patrón que huellaCedula (HMAC determinista) para indexar por correo sin guardarlo
// en claro. Pepper propio, distinto del de la cédula, para que filtrarse uno no arrastre al otro.
export function huellaEmail(email: string, pepper: string): string {
  return createHmac('sha256', pepper).update(email).digest('hex');
}
