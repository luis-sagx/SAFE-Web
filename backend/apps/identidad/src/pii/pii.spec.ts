import { encrypt, decrypt, decryptOptional, hashEmail } from './pii';

// Clave de 32 bytes real (openssl rand -base64 32), fija para que las pruebas
// sean deterministas — no es la clave de ningún entorno real.
const PASSWORD = 'Zm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFyZm8=';
const OTHER_KEY = 'YmFyZm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFyZm9vYmE=';

describe('pii — encrypt/decrypt', () => {
  it('descifra exactamente lo que cifró', () => {
    const encryptedValue = encrypt('María Pérez', PASSWORD);
    expect(decrypt(encryptedValue, PASSWORD)).toBe('María Pérez');
  });

  it('dos cifrados del mismo texto no son iguales (IV aleatorio)', () => {
    const a = encrypt('ana@correo.com', PASSWORD);
    const b = encrypt('ana@correo.com', PASSWORD);
    expect(a).not.toBe(b);
    expect(decrypt(a, PASSWORD)).toBe('ana@correo.com');
    expect(decrypt(b, PASSWORD)).toBe('ana@correo.com');
  });

  it('el texto cifrado lleva el prefijo de versión', () => {
    expect(encrypt('x', PASSWORD)).toMatch(/^v1:/);
  });

  it('un texto sin el prefijo se devuelve tal cual (compatibilidad con filas sin migrar)', () => {
    expect(decrypt('María Pérez', PASSWORD)).toBe('María Pérez');
    expect(decrypt('', PASSWORD)).toBe('');
  });

  it('descifrar con la clave equivocada falla en vez de devolver basura', () => {
    const encryptedValue = encrypt('dato sensible', PASSWORD);
    expect(() => decrypt(encryptedValue, OTHER_KEY)).toThrow();
  });

  it('un texto cifrado alterado falla la verificación (autenticado, no solo confidencial)', () => {
    const encryptedValue = encrypt('dato sensible', PASSWORD);
    const tampered = encryptedValue.slice(0, -4) + 'AAAA';
    expect(() => decrypt(tampered, PASSWORD)).toThrow();
  });

  it('rechaza una clave que no mide 32 bytes', () => {
    expect(() => encrypt('x', 'Y29ydGE=')).toThrow(/32 bytes/);
  });

  it('acepta tildes, ñ y textos largos', () => {
    const text = 'Iñaki Muñoz-Sáenz, correo con acentos: ñáéíóú@dominio.ec';
    expect(decrypt(encrypt(text, PASSWORD), PASSWORD)).toBe(text);
  });
});

describe('pii — decryptOptional', () => {
  it('devuelve null sin intentar descifrar', () => {
    expect(decryptOptional(null, PASSWORD)).toBeNull();
  });

  it('descifra un valor no nulo normalmente', () => {
    const encryptedValue = encrypt('Ana', PASSWORD);
    expect(decryptOptional(encryptedValue, PASSWORD)).toBe('Ana');
  });
});

describe('pii — huellaEmail', () => {
  it('es determinista: el mismo correo da siempre la misma huella', () => {
    expect(hashEmail('ana@correo.com', 'pepper')).toBe(
      hashEmail('ana@correo.com', 'pepper'),
    );
  });

  it('un pepper distinto da una huella distinta', () => {
    expect(hashEmail('ana@correo.com', 'pepper-a')).not.toBe(
      hashEmail('ana@correo.com', 'pepper-b'),
    );
  });

  it('correos distintos dan huellas distintas', () => {
    expect(hashEmail('ana@correo.com', 'pepper')).not.toBe(
      hashEmail('otra@correo.com', 'pepper'),
    );
  });
});
