import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from 'node:crypto';

/**
 * Cifrado en reposo de nombre, apellido y correo (issue #95): protege contra
 * quien se lleve SOLO la base de datos (un backup filtrado, un dump, un
 * acceso indebido a Postgres) sin comprometer también el servidor. No
 * protege contra quien comprometa la aplicación completa —ahí la clave está
 * en el mismo lugar que los datos—, pero ese ya no es el escenario que este
 * cambio busca cubrir.
 *
 * AES-256-GCM: cifrado autenticado, no solo confidencial — `descifrar()`
 * revienta si el texto cifrado fue alterado, en vez de devolver basura en
 * silencio. Un IV aleatorio por valor (no reutilizado) es obligatorio con
 * GCM: reusar uno con la misma clave rompe la confidencialidad del cifrado.
 */

const ALGORITMO = 'aes-256-gcm';
const LARGO_IV = 12;
const LARGO_ETIQUETA = 16;

/// Todo valor cifrado por esta versión lleva este prefijo. Es lo que permite
/// migrar en caliente: un valor sin el prefijo es texto plano de antes de
/// este cambio, y `descifrar()` lo devuelve tal cual en vez de fallar. Así
/// una fila que el script de `backfill-pii.mts` todavía no alcanzó sigue
/// siendo legible mientras tanto, sin ninguna ventana en la que el login o el
/// panel de administración dejen de funcionar.
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

/**
 * Huella del correo: el mismo patrón que `huellaCedula` (HMAC con un secreto
 * propio, determinista) y por el mismo motivo — sirve de índice único para
 * buscar por correo sin guardar el correo en claro. Un pepper aparte del de
 * la cédula: son dos secretos con propósitos distintos, y si algún día uno
 * se filtra, no arrastra al otro.
 */
export function huellaEmail(email: string, pepper: string): string {
  return createHmac('sha256', pepper).update(email).digest('hex');
}
