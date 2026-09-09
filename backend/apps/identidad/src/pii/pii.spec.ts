import { cifrar, descifrar, descifrarOpcional, huellaEmail } from './pii';

// Clave de 32 bytes real (openssl rand -base64 32), fija para que las pruebas
// sean deterministas — no es la clave de ningún entorno real.
const CLAVE = 'Zm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFyZm8=';
const OTRA_CLAVE = 'YmFyZm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFyZm9vYmE=';

describe('pii — cifrar/descifrar', () => {
  it('descifra exactamente lo que cifró', () => {
    const cifrado = cifrar('María Pérez', CLAVE);
    expect(descifrar(cifrado, CLAVE)).toBe('María Pérez');
  });

  it('dos cifrados del mismo texto no son iguales (IV aleatorio)', () => {
    const a = cifrar('ana@correo.com', CLAVE);
    const b = cifrar('ana@correo.com', CLAVE);
    expect(a).not.toBe(b);
    expect(descifrar(a, CLAVE)).toBe('ana@correo.com');
    expect(descifrar(b, CLAVE)).toBe('ana@correo.com');
  });

  it('el texto cifrado lleva el prefijo de versión', () => {
    expect(cifrar('x', CLAVE)).toMatch(/^v1:/);
  });

  it('un texto sin el prefijo se devuelve tal cual (compatibilidad con filas sin migrar)', () => {
    expect(descifrar('María Pérez', CLAVE)).toBe('María Pérez');
    expect(descifrar('', CLAVE)).toBe('');
  });

  it('descifrar con la clave equivocada falla en vez de devolver basura', () => {
    const cifrado = cifrar('dato sensible', CLAVE);
    expect(() => descifrar(cifrado, OTRA_CLAVE)).toThrow();
  });

  it('un texto cifrado alterado falla la verificación (autenticado, no solo confidencial)', () => {
    const cifrado = cifrar('dato sensible', CLAVE);
    const alterado = cifrado.slice(0, -4) + 'AAAA';
    expect(() => descifrar(alterado, CLAVE)).toThrow();
  });

  it('rechaza una clave que no mide 32 bytes', () => {
    expect(() => cifrar('x', 'Y29ydGE=')).toThrow(/32 bytes/);
  });

  it('acepta tildes, ñ y textos largos', () => {
    const texto = 'Iñaki Muñoz-Sáenz, correo con acentos: ñáéíóú@dominio.ec';
    expect(descifrar(cifrar(texto, CLAVE), CLAVE)).toBe(texto);
  });
});

describe('pii — descifrarOpcional', () => {
  it('devuelve null sin intentar descifrar', () => {
    expect(descifrarOpcional(null, CLAVE)).toBeNull();
  });

  it('descifra un valor no nulo normalmente', () => {
    const cifrado = cifrar('Ana', CLAVE);
    expect(descifrarOpcional(cifrado, CLAVE)).toBe('Ana');
  });
});

describe('pii — huellaEmail', () => {
  it('es determinista: el mismo correo da siempre la misma huella', () => {
    expect(huellaEmail('ana@correo.com', 'pepper')).toBe(
      huellaEmail('ana@correo.com', 'pepper'),
    );
  });

  it('un pepper distinto da una huella distinta', () => {
    expect(huellaEmail('ana@correo.com', 'pepper-a')).not.toBe(
      huellaEmail('ana@correo.com', 'pepper-b'),
    );
  });

  it('correos distintos dan huellas distintas', () => {
    expect(huellaEmail('ana@correo.com', 'pepper')).not.toBe(
      huellaEmail('otra@correo.com', 'pepper'),
    );
  });
});
