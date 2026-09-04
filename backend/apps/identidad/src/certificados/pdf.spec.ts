import { generarCertificadoPdf, type DatosCertificado } from './pdf';

/// No es una prueba de diseño —eso se verificó a ojo, renderizando el PDF—
/// sino de que la función termina, no lanza, y produce un documento válido
/// para cualquier combinación real de módulos que pueda llegar: los seis
/// conocidos (que ejercitan cada ícono dibujado a mano, incluido el de
/// respaldo para uno que el mapa no reconoce), un nombre largo que fuerza el
/// ajuste de línea, y un número impar de módulos que deja una columna sin
/// pareja en la lista de temas.
function datosBase(overrides: Partial<DatosCertificado> = {}): DatosCertificado {
  return {
    nombreCompleto: 'Luis Sagnay',
    modulos: ['phishing', 'smishing', 'vishing', 'suplantacion', 'estafa'],
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
function esPdfValido(buffer: Buffer): boolean {
  return buffer.subarray(0, 5).toString('latin1') === '%PDF-';
}

describe('generarCertificadoPdf', () => {
  it('genera un PDF válido con los cinco módulos activos hoy', async () => {
    const buffer = await generarCertificadoPdf(datosBase());

    expect(esPdfValido(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it('incluye riesgo físico: el ícono de respaldo (escudo) para un módulo sin glifo propio', async () => {
    const buffer = await generarCertificadoPdf(
      datosBase({
        modulos: ['phishing', 'smishing', 'vishing', 'suplantacion', 'estafa', 'fisico'],
      }),
    );

    expect(esPdfValido(buffer)).toBe(true);
  });

  it('un id de módulo que no está en el catálogo cae en el ícono por defecto, no revienta', async () => {
    const buffer = await generarCertificadoPdf(datosBase({ modulos: ['un-modulo-inventado'] }));

    expect(esPdfValido(buffer)).toBe(true);
  });

  it('un número impar de módulos deja la última fila con una sola columna', async () => {
    const buffer = await generarCertificadoPdf(
      datosBase({ modulos: ['phishing', 'smishing', 'vishing'] }),
    );

    expect(esPdfValido(buffer)).toBe(true);
  });

  it('un nombre largo que ocupa dos líneas no rompe el resto del layout', async () => {
    const buffer = await generarCertificadoPdf(
      datosBase({
        nombreCompleto: 'María Fernanda Guanoluisa Chicaiza',
        modulos: ['phishing', 'smishing', 'vishing', 'suplantacion', 'estafa', 'fisico'],
      }),
    );

    expect(esPdfValido(buffer)).toBe(true);
  });
});
