import PDFDocument from 'pdfkit';
import { SAFEWEB_MARK_PNG_BASE64 } from './isotipo-safeweb';

const SAFEWEB_MARK = Buffer.from(SAFEWEB_MARK_PNG_BASE64, 'base64');

// Paleta propia del PDF, más ornamentada que la del sistema de diseño de la app: las
// reglas de DESIGN.md (un solo verde, sin degradados) son para la interfaz en pantalla,
// no para un documento que se imprime; el PDF tampoco tiene acceso a los tokens de Tailwind.
const DARK_GREEN = '#00401f';
const BRAND_GREEN = '#006837';
const GOLD = '#b6903f';
const LIGHT_GOLD = '#d9bd7a';
const CREAM = '#faf7ef';
const INK = '#1a1a1a';
const TEXT_GRAY = '#4a4f57';
const LINE_GRAY = '#d8cfb8';

const BANNER_HEIGHT = 148;
const MARGIN = 46;

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
};

function getTitle(module: string): string {
  return MODULE_TITLE[module] ?? module;
}

type Doc = PDFKit.PDFDocument;

function drawClock(doc: Doc, cx: number, cy: number, r: number): void {
  doc.save();
  doc.lineWidth(1.4).strokeColor(GOLD).circle(cx, cy, r).stroke();
  doc
    .lineWidth(1.2)
    .lineCap('round')
    .moveTo(cx, cy)
    .lineTo(cx, cy - r * 0.55)
    .moveTo(cx, cy)
    .lineTo(cx + r * 0.4, cy + r * 0.12)
    .stroke();
  doc.restore();
}

function drawCalendar(doc: Doc, cx: number, cy: number, r: number): void {
  const w = r * 1.8;
  const h = r * 1.6;
  const x = cx - w / 2;
  const y = cy - h / 2 + r * 0.15;
  doc.save();
  doc.lineWidth(1.4).strokeColor(GOLD).roundedRect(x, y, w, h, 1.5).stroke();
  doc
    .moveTo(x, y + h * 0.32)
    .lineTo(x + w, y + h * 0.32)
    .stroke();
  doc
    .moveTo(x + w * 0.28, y - r * 0.12)
    .lineTo(x + w * 0.28, y + r * 0.14)
    .stroke();
  doc
    .moveTo(x + w * 0.72, y - r * 0.12)
    .lineTo(x + w * 0.72, y + r * 0.14)
    .stroke();
  doc.restore();
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

    doc.rect(0, 0, width, height).fill(CREAM);
    doc
      .rect(10, 10, width - 20, height - 20)
      .lineWidth(1.5)
      .strokeColor(GOLD)
      .stroke();

    // Degradado vertical sutil, no el tricolor horizontal "brillo de plástico" de la v1:
    // un solo tono que oscurece hacia abajo lee como impreso, no como un ícono generado por IA.
    const gradient = doc.linearGradient(0, 0, 0, BANNER_HEIGHT);
    gradient.stop(0, BRAND_GREEN).stop(1, DARK_GREEN);
    doc.rect(0, 0, width, BANNER_HEIGHT).fill(gradient);
    doc.rect(0, BANNER_HEIGHT - 2, width, 2).fill(GOLD);

    // El lockup insignia + título se centra como grupo: se mide el texto
    // antes de dibujar nada, para no adivinar un ancho fijo que se
    // desalinee si el nombre "SAFE Web" cambiara de tamaño de fuente.
    doc.font('Times-Bold').fontSize(38);
    const titleWidth = doc.widthOfString('SAFE Web');
    const badgeSide = 58;
    const iconTextSpacing = 18;
    const groupWidth = badgeSide + iconTextSpacing + titleWidth;
    const xGrupo = (width - groupWidth) / 2;
    // Centrado más arriba de la mitad del banner, con hueco fijo debajo para el subtítulo:
    // pdfkit reserva el texto de 38pt más alto de lo que el ojo ve, y centrar ambos en el
    // mismo punto medio dejaba el subtítulo pegado contra la "W".
    const yLockup = BANNER_HEIGHT * 0.4;
    const ySubtitle = yLockup + 34;

    // Isotipo real de SafeWeb sobre insignia blanca, para que su verde no se pierda contra
    // el del banner.
    const badgeY = yLockup - badgeSide / 2 - 4;
    doc
      .save()
      .circle(xGrupo + badgeSide / 2, badgeY + badgeSide / 2, badgeSide / 2)
      .fill('#ffffff');
    const padding = 9;
    doc.image(SAFEWEB_MARK, xGrupo + padding / 2, badgeY + padding / 2, {
      width: badgeSide - padding,
      height: badgeSide - padding,
    });
    doc.restore();

    doc
      .fillColor('#ffffff')
      .font('Times-Bold')
      .fontSize(38)
      .text('SAFE Web', xGrupo + badgeSide + iconTextSpacing, yLockup - 27, {
        width: titleWidth + 4,
        lineBreak: false,
      });

    // characterSpacing (Tc, avance fijo en puntos) y no espacios literales: un espacio de
    // verdad mide distinto según la fuente que sustituya el lector, y con un título largo
    // eso bastaba para salirse de la página en algunos lectores.
    doc
      .fillColor(LIGHT_GOLD)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('ENTRENAMIENTO EN CIBERSEGURIDAD', 0, ySubtitle, {
        width: width,
        align: 'center',
        characterSpacing: 1.5,
      });

    let y = BANNER_HEIGHT + 34;

    doc
      .fillColor(INK)
      .font('Times-Bold')
      .fontSize(20)
      .text('CERTIFICADO DE APROVECHAMIENTO', MARGIN, y, {
        width: width - MARGIN * 2,
        align: 'center',
        characterSpacing: 2,
      });
    y += 44;

    // El tamaño baja hasta que el nombre quepa en una línea: un nombre ecuatoriano con dos
    // nombres y apellidos pasa fácil los ~28 caracteres a tamaño 40, y envolver a una segunda
    // línea empujaba el resto del certificado a desbordar a una página en blanco.
    doc.font('Times-BoldItalic');
    const availableNameWidth = width - MARGIN * 2 - 20;
    let nameFontSize = 40;
    while (
      nameFontSize > 22 &&
      doc.fontSize(nameFontSize).widthOfString(data.nombreCompleto) >
        availableNameWidth
    ) {
      nameFontSize -= 2;
    }
    doc
      .fillColor(INK)
      .fontSize(nameFontSize)
      .text(data.nombreCompleto, MARGIN, y, {
        width: width - MARGIN * 2,
        align: 'center',
        lineBreak: false,
      });
    y = doc.y + 16;

    doc
      .fillColor(TEXT_GRAY)
      .font('Helvetica')
      .fontSize(12)
      .text(
        'Ha completado satisfactoriamente el entrenamiento especializado en el ' +
          'reconocimiento de las principales ciberamenazas dirigidas a usuarios ' +
          'no técnicos en el Ecuador.',
        width * 0.14,
        y,
        { width: width * 0.72, align: 'center', lineGap: 3 },
      );
    y = doc.y + 22;

    doc
      .moveTo(width * 0.12, y)
      .lineTo(width * 0.88, y)
      .lineWidth(1)
      .strokeColor(LINE_GRAY)
      .stroke();
    y += 28;

    // Tres columnas con espacio de sobra para su contenido más largo. La v1 las apretaba en
    // cuatro contra "temas de estudio" y ni la etiqueta ni la fecha cabían; separarlas en
    // dos filas les da el ancho que necesitan.
    const xCol1 = width * 0.06;
    const xCol2 = width * 0.37;
    const xCol3 = width * 0.68;
    const xFinRow = width * 0.94;
    const separator1 = (xCol1 + xCol2) / 2;
    const separator2 = (xCol2 + xCol3) / 2;
    const yColBase = y;

    drawClock(doc, xCol1 + 9, yColBase + 9, 9);
    doc
      .fillColor(TEXT_GRAY)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('DURACIÓN', xCol1 + 24, yColBase, { characterSpacing: 0.5 });
    doc
      .fillColor(INK)
      .font('Helvetica-Bold')
      .fontSize(13)
      .text(`${data.horas} horas`, xCol1 + 24, yColBase + 15);

    doc
      .fillColor(TEXT_GRAY)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('CALIFICACIÓN', xCol2, yColBase, {
        width: separator2 - xCol2 - 16,
        characterSpacing: 0.5,
      });
    doc
      .fillColor(INK)
      .font('Helvetica-Bold')
      .fontSize(13)
      .text(`${data.calificacion}/48`, xCol2, yColBase + 15);

    drawCalendar(doc, xCol3 + 9, yColBase + 9, 9);
    doc
      .fillColor(TEXT_GRAY)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('EMITIDO', xCol3 + 24, yColBase, { characterSpacing: 0.5 });
    doc
      .fillColor(INK)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(DATE_FORMAT.format(data.emitidoAt), xCol3 + 24, yColBase + 15, {
        width: xFinRow - (xCol3 + 24),
        lineBreak: false,
      });

    const statsRowHeight = 46;
    doc
      .moveTo(separator1, yColBase - 4)
      .lineTo(separator1, yColBase + statsRowHeight)
      .lineWidth(0.75)
      .strokeColor(LINE_GRAY)
      .stroke();
    doc
      .moveTo(separator2, yColBase - 4)
      .lineTo(separator2, yColBase + statsRowHeight)
      .lineWidth(0.75)
      .strokeColor(LINE_GRAY)
      .stroke();

    // Párrafo centrado con punto medio como separador, no una grilla con un glifo por
    // amenaza: los íconos a este tamaño se leían como emojis sueltos, no formales.
    let yTemas = yColBase + statsRowHeight + 14;
    doc
      .moveTo(MARGIN, yTemas - 10)
      .lineTo(width - MARGIN, yTemas - 10)
      .lineWidth(1)
      .strokeColor(LINE_GRAY)
      .stroke();

    doc
      .fillColor(TEXT_GRAY)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('TEMAS DE ESTUDIO', MARGIN, yTemas, {
        width: width - MARGIN * 2,
        align: 'center',
        characterSpacing: 0.5,
      });
    yTemas += 18;

    doc
      .fillColor(INK)
      .font('Helvetica')
      .fontSize(11)
      .text(
        data.modulos.map((module) => getTitle(module)).join('   ·   '),
        MARGIN,
        yTemas,
        { width: width - MARGIN * 2, align: 'center', lineGap: 4 },
      );
    yTemas = doc.y;

    // La línea sigue al contenido real (temas o fecha, lo que llegue más abajo) en vez de
    // una distancia fija: con 5 módulos en dos filas y 6 en tres, una posición fija dejaba
    // hueco muerto o apretaba. Con un mínimo, para que una lista corta no suba el pie.
    const contentEnd = Math.max(yTemas, yColBase + 46);
    const yPie = Math.max(contentEnd + 32, height - 96);

    doc
      .moveTo(MARGIN, yPie)
      .lineTo(width - MARGIN, yPie)
      .lineWidth(1)
      .strokeColor(GOLD)
      .stroke();

    // Bloque centrado: sin el sello que ocupaba el centro, la verificación pegada al margen
    // dejaba la mitad derecha del pie vacía y descompensada.
    doc
      .fillColor(TEXT_GRAY)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('CÓDIGO DE VERIFICACIÓN', 0, yPie + 20, {
        width: width,
        align: 'center',
      });
    doc
      .fillColor(INK)
      .font('Helvetica-Bold')
      .fontSize(15)
      .text(data.codigo, 0, yPie + 33, { width: width, align: 'center' });
    doc
      .fillColor(TEXT_GRAY)
      .font('Helvetica')
      .fontSize(9.5)
      .text(`${data.origen}/verificar/${data.codigo}`, 0, yPie + 53, {
        width: width,
        align: 'center',
      });

    doc.end();
  });
}
