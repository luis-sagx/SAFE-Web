import {
  generateCertificatePdf,
  totalEscenarios,
  type CertificateData,
} from './pdf';

/// No es una prueba de diseño (eso se verificó a ojo, renderizando el PDF)
/// sino de que la función termina, no lanza, y produce un documento válido
/// para cualquier combinación real de módulos que pueda llegar: los seis
/// conocidos (que ejercitan cada ícono dibujado a mano, incluido el de
/// respaldo para uno que el mapa no reconoce), un nombre largo que fuerza el
/// ajuste de línea, y un número impar de módulos que deja una columna sin
/// pareja en la lista de temas.
function baseData(overrides: Partial<CertificateData> = {}): CertificateData {
  return {
    nombreCompleto: 'Luis Sagnay',
    modulos: ['phishing', 'smishing', 'vishing', 'suplantacion', 'estafa'],
    calificacion: 30,
    horas: 4,
    emitidoAt: new Date('2026-09-04T00:00:00.000Z'),
    codigo: 'SW-RQFS-XBC2',
    origen: 'https://safeweb.espe.edu.ec',
    ...overrides,
  };
}

/// Todo PDF empieza con esta cabecera; es la comprobación mínima de que el
/// buffer devuelto es un documento real y no una promesa rota o un stream
/// vacío.
function isValidPdf(buffer: Buffer): boolean {
  return buffer.subarray(0, 5).toString('latin1') === '%PDF-';
}

// El PDF mostraba literalmente "/48": correcto por casualidad mientras nadie
// terminaba asistentes-ia (4 escenarios, no 8) además de los otros 6 módulos
// de 8. Con los 7 aprobados el total real es 52, no 48.
describe('totalEscenarios', () => {
  it('sobre los 7 módulos completos, suma 52 (6×8 + 4 de asistentes-ia), no 48', () => {
    const modulos = [
      'phishing',
      'smishing',
      'vishing',
      'suplantacion',
      'estafa',
      'fisico',
      'asistentes-ia',
    ];
    expect(totalEscenarios(modulos)).toBe(52);
  });

  it('con solo los cinco módulos de baseData, suma 40 (5×8)', () => {
    expect(
      totalEscenarios([
        'phishing',
        'smishing',
        'vishing',
        'suplantacion',
        'estafa',
      ]),
    ).toBe(40);
  });

  it('un id de módulo desconocido no aporta al total, no revienta', () => {
    expect(totalEscenarios(['phishing', 'un-modulo-inventado'])).toBe(8);
  });
});

describe('generarCertificadoPdf', () => {
  it('genera un PDF válido con los cinco módulos activos hoy', async () => {
    const buffer = await generateCertificatePdf(baseData());

    expect(isValidPdf(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it('incluye riesgo físico: el ícono de respaldo (escudo) para un módulo sin glifo propio', async () => {
    const buffer = await generateCertificatePdf(
      baseData({
        modulos: [
          'phishing',
          'smishing',
          'vishing',
          'suplantacion',
          'estafa',
          'fisico',
        ],
      }),
    );

    expect(isValidPdf(buffer)).toBe(true);
  });

  it('un id de módulo que no está en el catálogo cae en el ícono por defecto, no revienta', async () => {
    const buffer = await generateCertificatePdf(
      baseData({ modulos: ['un-modulo-inventado'] }),
    );

    expect(isValidPdf(buffer)).toBe(true);
  });

  it('un número impar de módulos deja la última fila con una sola columna', async () => {
    const buffer = await generateCertificatePdf(
      baseData({ modulos: ['phishing', 'smishing', 'vishing'] }),
    );

    expect(isValidPdf(buffer)).toBe(true);
  });

  it('un nombre largo que ocupa dos líneas no rompe el resto del layout', async () => {
    const buffer = await generateCertificatePdf(
      baseData({
        nombreCompleto: 'María Fernanda Guanoluisa Chicaiza',
        modulos: [
          'phishing',
          'smishing',
          'vishing',
          'suplantacion',
          'estafa',
          'fisico',
        ],
      }),
    );

    expect(isValidPdf(buffer)).toBe(true);
  });
});
