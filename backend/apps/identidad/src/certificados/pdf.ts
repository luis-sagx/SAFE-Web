import { TOTALES_MODULOS } from '@comun';
import PDFDocument from 'pdfkit';
import { SAFEWEB_MARK_PNG_BASE64 } from './isotipo-safeweb';

// Denominador real de "aprobados/total", no un número fijo: antes decía
// literalmente "/48" (6 módulos de 8), correcto solo mientras nadie
// terminaba también asistentes-ia (4 escenarios, no 8) — con los 7 módulos
// aprobados el total real es 52. Un id que no está en TOTALES_MODULOS no
// aporta nada, en vez de romper el PDF.
export function totalEscenarios(modulos: string[]): number {
  return modulos.reduce(
    (total, modulo) => total + (TOTALES_MODULOS[modulo] ?? 0),
    0,
  );
}

const SAFEWEB_MARK = Buffer.from(SAFEWEB_MARK_PNG_BASE64, 'base64');

// Paleta propia del PDF, más ornamentada que la del sistema de diseño de la app: las
// reglas de DESIGN.md (un solo verde, sin degradados) son para la interfaz en pantalla,
// no para un documento que se imprime; el PDF tampoco tiene acceso a los tokens de Tailwind.
const DARK_GREEN = '#00341a';
const BRAND_GREEN = '#006837';
const GOLD = '#b6903f';
const LIGHT_GOLD = '#d9bd7a';
const PAPER = '#fbf9f3';
const INK = '#171717';
const TEXT_GRAY = '#4a4f57';
const LINE_GRAY = '#ddd5c2';

const PANEL_WIDTH = 214;
const MARGIN = 54;

export interface CertificateData {
  nombreCompleto: string;
  modulos: string[];
  horas: number;
  calificacion: number;
  emitidoAt: Date;
  codigo: string;
  /// Base para armar la URL de verificación, sin barra final
  /// (ej. "https://safeweb.espe.edu.ec").
  origen: string;
}

const DATE_FORMAT = new Intl.DateTimeFormat('es-EC', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const MODULE_TITLE: Record<string, string> = {
  phishing: 'Phishing',
  smishing: 'Smishing',
  vishing: 'Vishing',
  suplantacion: 'Suplantación de identidad',
  estafa: 'Estafa electrónica',
  fisico: 'Riesgo físico',
  'asistentes-ia': 'Asistentes de IA',
};

function getTitle(module: string): string {
  return MODULE_TITLE[module] ?? module;
}

type Doc = PDFKit.PDFDocument;

// Roseta de círculos desplazados, el patrón de seguridad de diplomas y billetes: da
// textura de documento oficial con unas pocas líneas, sin imágenes que engorden el PDF.
function drawRosette(
  doc: Doc,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  opacity: number,
): void {
  doc.save();
  doc.lineWidth(0.6).strokeColor(color).strokeOpacity(opacity);
  const circles = 36;
  for (let i = 0; i < circles; i++) {
    const angle = (i / circles) * Math.PI * 2;
    const offset = radius * 0.42;
    doc
      .circle(
        cx + Math.cos(angle) * offset,
        cy + Math.sin(angle) * offset,
        radius * 0.58,
      )
      .stroke();
  }
  doc.circle(cx, cy, radius).stroke();
  doc.circle(cx, cy, radius * 1.04).stroke();
  doc.restore();
}

function drawLabel(doc: Doc, text: string, x: number, y: number): void {
  doc
    .fillColor(BRAND_GREEN)
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .text(text, x, y, { characterSpacing: 2, lineBreak: false });
}

// pdfkit porque escribir un PDF a mano no son "unas pocas líneas" (§10 ARQUITECTURA.md) y
// un navegador headless costaría cientos de MB por una página. Sin QR ni firma (el código
// de verificación basta), sin escudo ESPE (requiere autorización) y sin cédula (§7.1).
export function generateCertificatePdf(data: CertificateData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const width = doc.page.width;
    const height = doc.page.height;

    doc.rect(0, 0, width, height).fill(PAPER);

    // Panel lateral de marca, como los certificados de plataformas de cursos: la
    // identidad queda a un lado y el contenido se lee de corrido, alineado a la izquierda.
    doc.rect(0, 0, PANEL_WIDTH, height).fill(DARK_GREEN);
    doc.save();
    doc.rect(0, 0, PANEL_WIDTH, height).clip();
    drawRosette(doc, PANEL_WIDTH / 2, height - 40, 170, '#ffffff', 0.07);
    doc.restore();
    doc.rect(PANEL_WIDTH - 3, 0, 3, height).fill(GOLD);

    const panelCenter = (PANEL_WIDTH - 3) / 2;
    const badgeSide = 96;
    const badgeY = 148;
    // Isotipo real sobre insignia blanca, para que su verde no se pierda contra el panel.
    doc
      .circle(panelCenter, badgeY + badgeSide / 2, badgeSide / 2 + 5)
      .lineWidth(1)
      .strokeColor(LIGHT_GOLD)
      .stroke();
    doc
      .circle(panelCenter, badgeY + badgeSide / 2, badgeSide / 2)
      .fill('#ffffff');
    const padding = 14;
    doc.image(
      SAFEWEB_MARK,
      panelCenter - badgeSide / 2 + padding / 2,
      badgeY + padding / 2,
      { width: badgeSide - padding, height: badgeSide - padding },
    );

    doc
      .fillColor('#ffffff')
      .font('Times-Bold')
      .fontSize(28)
      .text('SAFE Web', 0, badgeY + badgeSide + 24, {
        width: PANEL_WIDTH - 3,
        align: 'center',
      });
    // characterSpacing (Tc, avance fijo en puntos) y no espacios literales: un espacio de
    // verdad mide distinto según la fuente que sustituya el lector.
    doc
      .fillColor(LIGHT_GOLD)
      .font('Helvetica-Bold')
      .fontSize(8)
      .text('ENTRENAMIENTO EN\nCIBERSEGURIDAD', 0, doc.y + 8, {
        width: PANEL_WIDTH - 3,
        align: 'center',
        characterSpacing: 1.8,
        lineGap: 3,
      });

    const x = PANEL_WIDTH + MARGIN;
    const contentWidth = width - x - MARGIN;

    // Filete interior y roseta tenue: el papel no queda liso y el marco cierra la hoja.
    drawRosette(doc, x + contentWidth * 0.72, height * 0.47, 190, GOLD, 0.1);
    doc
      .rect(PANEL_WIDTH + 14, 14, width - PANEL_WIDTH - 28, height - 28)
      .lineWidth(0.75)
      .strokeColor(LIGHT_GOLD)
      .stroke();

    let y = 60;
    doc
      .fillColor(INK)
      .font('Times-Bold')
      .fontSize(21)
      .text('CERTIFICADO DE APROVECHAMIENTO', x, y, {
        width: contentWidth,
        characterSpacing: 2,
        lineBreak: false,
      });
    y += 32;
    doc.rect(x, y, 48, 2).fill(GOLD);
    y += 30;

    drawLabel(doc, 'SE OTORGA A', x, y);
    y += 18;

    // El tamaño baja hasta que el nombre quepa en una línea: un nombre ecuatoriano con dos
    // nombres y apellidos pasa fácil del ancho disponible, y envolver a una segunda línea
    // empujaba el resto del certificado a desbordar a una página en blanco.
    doc.font('Times-Bold');
    let nameFontSize = 40;
    while (
      nameFontSize > 22 &&
      doc.fontSize(nameFontSize).widthOfString(data.nombreCompleto) >
        contentWidth
    ) {
      nameFontSize -= 2;
    }
    doc.fillColor(INK).fontSize(nameFontSize).text(data.nombreCompleto, x, y, {
      width: contentWidth,
      lineBreak: false,
    });
    y += 62;

    drawLabel(doc, 'POR COMPLETAR SATISFACTORIAMENTE', x, y);
    y += 18;
    doc
      .fillColor(INK)
      .font('Times-Bold')
      .fontSize(19)
      .text('Reconocimiento de ciberamenazas en el Ecuador', x, y, {
        width: contentWidth,
      });
    y = doc.y + 6;
    doc
      .fillColor(TEXT_GRAY)
      .font('Helvetica')
      .fontSize(10.5)
      .text(
        'Entrenamiento especializado con escenarios simulados de las principales ' +
          'ciberamenazas dirigidas a usuarios no técnicos.',
        x,
        y,
        { width: contentWidth * 0.8, lineGap: 3 },
      );
    y = doc.y + 26;

    const stats: [string, string][] = [
      ['DURACIÓN', `${data.horas} horas`],
      [
        'CALIFICACIÓN',
        `${data.calificacion} / ${totalEscenarios(data.modulos)} escenarios`,
      ],
      ['EMITIDO', DATE_FORMAT.format(data.emitidoAt)],
    ];
    const columnWidth = contentWidth / stats.length;
    stats.forEach(([label, value], i) => {
      const xCol = x + columnWidth * i;
      drawLabel(doc, label, xCol, y);
      doc
        .fillColor(INK)
        .font('Helvetica-Bold')
        .fontSize(12.5)
        .text(value, xCol, y + 15, {
          width: columnWidth - 12,
          lineBreak: false,
        });
    });
    y += 54;

    drawLabel(doc, 'TEMAS DE ESTUDIO', x, y);
    y += 16;
    doc
      .fillColor(INK)
      .font('Helvetica')
      .fontSize(10.5)
      .text(
        data.modulos.map((module) => getTitle(module)).join('  ·  '),
        x,
        y,
        { width: contentWidth, lineGap: 4 },
      );

    // Con un mínimo, para que una lista corta de temas no suba el pie.
    const yFooter = Math.max(doc.y + 28, height - 100);
    doc
      .moveTo(x, yFooter)
      .lineTo(x + contentWidth, yFooter)
      .lineWidth(0.75)
      .strokeColor(LINE_GRAY)
      .stroke();

    drawLabel(doc, 'CÓDIGO DE VERIFICACIÓN', x, yFooter + 18);
    doc
      .fillColor(INK)
      .font('Courier-Bold')
      .fontSize(15)
      .text(data.codigo, x, yFooter + 33, {
        characterSpacing: 1,
        lineBreak: false,
      });

    const verifyX = x + contentWidth / 2;
    const verifyWidth = contentWidth / 2;
    doc
      .fillColor(TEXT_GRAY)
      .font('Helvetica')
      .fontSize(9)
      .text(
        'Verifique la autenticidad de este certificado en',
        verifyX,
        yFooter + 18,
        {
          width: verifyWidth,
          align: 'right',
        },
      );
    doc
      .fillColor(BRAND_GREEN)
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .text(`${data.origen}/verificar/${data.codigo}`, verifyX, yFooter + 33, {
        width: verifyWidth,
        align: 'right',
      });

    doc.end();
  });
}
