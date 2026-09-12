import { generateCertificateCode } from './codigo';

describe('generarCodigoCertificado', () => {
  it('tiene el formato SW-XXXX-XXXX sin caracteres ambiguos', () => {
    const code = generateCertificateCode();

    expect(code).toMatch(/^SW-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  });

  // No es una prueba de aleatoriedad criptográfica: solo la regresión mínima
  // de que dos llamadas no devuelven exactamente el mismo código, que es lo
  // que un `Math.random()` mal sembrado o una constante olvidada rompería.
  it('no repite el mismo código en llamadas sucesivas', () => {
    const codes = new Set(
      Array.from({ length: 20 }, () => generateCertificateCode()),
    );

    expect(codes.size).toBe(20);
  });
});
