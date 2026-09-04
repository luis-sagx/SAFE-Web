import PDFDocument from 'pdfkit';

/// El verde de marca de `docs/DESIGN.md` (`--color-primary`). El PDF no tiene
/// acceso a los tokens de Tailwind del frontend, así que se repite aquí una
/// sola vez.
const VERDE_MARCA = '#006837';

export interface DatosCertificado {
  nombreCompleto: string;
  modulos: string[];
  horas: number;
  emitidoAt: Date;
  codigo: string;
  /// Base para armar la URL de verificación, sin barra final
  /// (ej. "https://safeweb.espe.edu.ec").
  origen: string;
}

const FORMATO_FECHA = new Intl.DateTimeFormat('es-EC', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * Genera el PDF del certificado en memoria. `pdfkit` porque escribir un PDF
 * válido a mano no son "unas pocas líneas" (§10 de `ARQUITECTURA.md`), y un
 * navegador headless añadiría cientos de MB al contenedor por un documento de
 * una página.
 *
 * Sin fuente embebida: la Helvetica que trae pdfkit usa WinAnsi, que cubre
 * tildes y `ñ`. Sin escudo institucional ni firma: emitir con la identidad
 * visual de la ESPE necesita autorización del departamento; la línea del pie
 * sitúa el origen sin comprometer a nadie con un documento que no aprobó. Sin
 * cédula, nunca (§7.1 de `ARQUITECTURA.md`): no existe en claro en ningún
 * lugar del sistema, y este documento no es la excepción.
 */
export function generarCertificadoPdf(
  datos: DatosCertificado,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 56,
    });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const anchoUtil =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    doc.rect(0, 0, doc.page.width, 10).fill(VERDE_MARCA);

    doc
      .fillColor('#1a1a1a')
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('SAFE Web', doc.page.margins.left, 48);

    doc
      .fillColor(VERDE_MARCA)
      .font('Helvetica-Bold')
      .fontSize(30)
      .text('Certificado de aprovechamiento', doc.page.margins.left, 110, {
        width: anchoUtil,
        align: 'center',
      });

    doc
      .moveDown(1.4)
      .fillColor('#1a1a1a')
      .font('Helvetica')
      .fontSize(14)
      .text('Se certifica que', { align: 'center' });

    doc
      .moveDown(0.4)
      .font('Helvetica-Bold')
      .fontSize(22)
      .text(datos.nombreCompleto, { align: 'center' });

    doc
      .moveDown(0.6)
      .font('Helvetica')
      .fontSize(14)
      .text(
        `ha completado el entrenamiento SAFE Web en reconocimiento de ciberamenazas ` +
          `dirigidas a usuarios no técnicos, con una duración de ${datos.horas} horas.`,
        { align: 'center', width: anchoUtil },
      );

    doc
      .moveDown(0.8)
      .font('Helvetica-Oblique')
      .fontSize(11)
      .fillColor('#4a4a4a')
      .text(`Módulos: ${datos.modulos.join(' · ')}`, {
        align: 'center',
        width: anchoUtil,
      });

    const yPie = doc.page.height - doc.page.margins.bottom - 70;

    doc
      .fillColor('#1a1a1a')
      .font('Helvetica')
      .fontSize(10)
      .text(
        `Emitido el ${FORMATO_FECHA.format(datos.emitidoAt)}`,
        doc.page.margins.left,
        yPie,
      );

    doc.text(
      `Código: ${datos.codigo}   ·   Verificar en ${datos.origen}/verificar/${datos.codigo}`,
      doc.page.margins.left,
      yPie + 16,
    );

    doc
      .fillColor('#6a6a6a')
      .fontSize(9)
      .text(
        'Trabajo de Integración Curricular · Carrera de Software · ' +
          'Departamento de Ciencias de la Computación — ESPE',
        doc.page.margins.left,
        yPie + 34,
      );

    doc.end();
  });
}
