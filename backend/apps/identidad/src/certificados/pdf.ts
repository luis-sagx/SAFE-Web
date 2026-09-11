import PDFDocument from 'pdfkit';
import { ISOTIPO_SAFEWEB_PNG_BASE64 } from './isotipo-safeweb';

const ISOTIPO_SAFEWEB = Buffer.from(ISOTIPO_SAFEWEB_PNG_BASE64, 'base64');

// Paleta propia del PDF, más ornamentada que la del sistema de diseño de la app: las
// reglas de DESIGN.md (un solo verde, sin degradados) son para la interfaz en pantalla,
// no para un documento que se imprime; el PDF tampoco tiene acceso a los tokens de Tailwind.
const VERDE_OSCURO = '#00401f';
const VERDE_MARCA = '#006837';
const DORADO = '#b6903f';
const DORADO_CLARO = '#d9bd7a';
const CREMA = '#faf7ef';
const TINTA = '#1a1a1a';
const GRIS_TEXTO = '#4a4f57';
const GRIS_LINEA = '#d8cfb8';

const ALTO_BANNER = 148;
const MARGEN = 46;

export interface DatosCertificado {
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

const FORMATO_FECHA = new Intl.DateTimeFormat('es-EC', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const TITULO_MODULO: Record<string, string> = {
  phishing: 'Phishing',
  smishing: 'Smishing',
  vishing: 'Vishing',
  suplantacion: 'Suplantación de identidad',
  estafa: 'Estafa electrónica',
  fisico: 'Riesgo físico',
};

function tituloDe(modulo: string): string {
  return TITULO_MODULO[modulo] ?? modulo;
}

type Doc = PDFKit.PDFDocument;

function dibujarReloj(doc: Doc, cx: number, cy: number, r: number): void {
  doc.save();
  doc.lineWidth(1.4).strokeColor(DORADO).circle(cx, cy, r).stroke();
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

function dibujarCalendario(doc: Doc, cx: number, cy: number, r: number): void {
  const w = r * 1.8;
  const h = r * 1.6;
  const x = cx - w / 2;
  const y = cy - h / 2 + r * 0.15;
  doc.save();
  doc.lineWidth(1.4).strokeColor(DORADO).roundedRect(x, y, w, h, 1.5).stroke();
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
export function generarCertificadoPdf(
  datos: DatosCertificado,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const ancho = doc.page.width;
    const alto = doc.page.height;

    doc.rect(0, 0, ancho, alto).fill(CREMA);
    doc
      .rect(10, 10, ancho - 20, alto - 20)
      .lineWidth(1.5)
      .strokeColor(DORADO)
      .stroke();

    // Degradado vertical sutil, no el tricolor horizontal "brillo de plástico" de la v1:
    // un solo tono que oscurece hacia abajo lee como impreso, no como un ícono generado por IA.
    const degradado = doc.linearGradient(0, 0, 0, ALTO_BANNER);
    degradado.stop(0, VERDE_MARCA).stop(1, VERDE_OSCURO);
    doc.rect(0, 0, ancho, ALTO_BANNER).fill(degradado);
    doc.rect(0, ALTO_BANNER - 2, ancho, 2).fill(DORADO);

    // El lockup insignia + título se centra como grupo: se mide el texto
    // antes de dibujar nada, para no adivinar un ancho fijo que se
    // desalinee si el nombre "SAFE Web" cambiara de tamaño de fuente.
    doc.font('Times-Bold').fontSize(38);
    const anchoTitulo = doc.widthOfString('SAFE Web');
    const insigniaLado = 58;
    const espacioIconoTexto = 18;
    const anchoGrupo = insigniaLado + espacioIconoTexto + anchoTitulo;
    const xGrupo = (ancho - anchoGrupo) / 2;
    // Centrado más arriba de la mitad del banner, con hueco fijo debajo para el subtítulo:
    // pdfkit reserva el texto de 38pt más alto de lo que el ojo ve, y centrar ambos en el
    // mismo punto medio dejaba el subtítulo pegado contra la "W".
    const yLockup = ALTO_BANNER * 0.4;
    const ySubtitulo = yLockup + 34;

    // Isotipo real de SafeWeb sobre insignia blanca, para que su verde no se pierda contra
    // el del banner.
    const insigniaY = yLockup - insigniaLado / 2 - 4;
    doc
      .save()
      .circle(
        xGrupo + insigniaLado / 2,
        insigniaY + insigniaLado / 2,
        insigniaLado / 2,
      )
      .fill('#ffffff');
    const relleno = 9;
    doc.image(ISOTIPO_SAFEWEB, xGrupo + relleno / 2, insigniaY + relleno / 2, {
      width: insigniaLado - relleno,
      height: insigniaLado - relleno,
    });
    doc.restore();

    doc
      .fillColor('#ffffff')
      .font('Times-Bold')
      .fontSize(38)
      .text(
        'SAFE Web',
        xGrupo + insigniaLado + espacioIconoTexto,
        yLockup - 27,
        {
          width: anchoTitulo + 4,
          lineBreak: false,
        },
      );

    // characterSpacing (Tc, avance fijo en puntos) y no espacios literales: un espacio de
    // verdad mide distinto según la fuente que sustituya el lector, y con un título largo
    // eso bastaba para salirse de la página en algunos lectores.
    doc
      .fillColor(DORADO_CLARO)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('ENTRENAMIENTO EN CIBERSEGURIDAD', 0, ySubtitulo, {
        width: ancho,
        align: 'center',
        characterSpacing: 1.5,
      });

    let y = ALTO_BANNER + 34;

    doc
      .fillColor(TINTA)
      .font('Times-Bold')
      .fontSize(20)
      .text('CERTIFICADO DE APROVECHAMIENTO', MARGEN, y, {
        width: ancho - MARGEN * 2,
        align: 'center',
        characterSpacing: 2,
      });
    y += 44;

    // El tamaño baja hasta que el nombre quepa en una línea: un nombre ecuatoriano con dos
    // nombres y apellidos pasa fácil los ~28 caracteres a tamaño 40, y envolver a una segunda
    // línea empujaba el resto del certificado a desbordar a una página en blanco.
    doc.font('Times-BoldItalic');
    const anchoNombreDisponible = ancho - MARGEN * 2 - 20;
    let nombreFontSize = 40;
    while (
      nombreFontSize > 22 &&
      doc.fontSize(nombreFontSize).widthOfString(datos.nombreCompleto) >
        anchoNombreDisponible
    ) {
      nombreFontSize -= 2;
    }
    doc
      .fillColor(TINTA)
      .fontSize(nombreFontSize)
      .text(datos.nombreCompleto, MARGEN, y, {
        width: ancho - MARGEN * 2,
        align: 'center',
        lineBreak: false,
      });
    y = doc.y + 16;

    doc
      .fillColor(GRIS_TEXTO)
      .font('Helvetica')
      .fontSize(12)
      .text(
        'Ha completado satisfactoriamente el entrenamiento especializado en el ' +
          'reconocimiento de las principales ciberamenazas dirigidas a usuarios ' +
          'no técnicos en el Ecuador.',
        ancho * 0.14,
        y,
        { width: ancho * 0.72, align: 'center', lineGap: 3 },
      );
    y = doc.y + 22;

    doc
      .moveTo(ancho * 0.12, y)
      .lineTo(ancho * 0.88, y)
      .lineWidth(1)
      .strokeColor(GRIS_LINEA)
      .stroke();
    y += 28;

    // Tres columnas con espacio de sobra para su contenido más largo. La v1 las apretaba en
    // cuatro contra "temas de estudio" y ni la etiqueta ni la fecha cabían; separarlas en
    // dos filas les da el ancho que necesitan.
    const xCol1 = ancho * 0.06;
    const xCol2 = ancho * 0.37;
    const xCol3 = ancho * 0.68;
    const xFinFila = ancho * 0.94;
    const separador1 = (xCol1 + xCol2) / 2;
    const separador2 = (xCol2 + xCol3) / 2;
    const yColBase = y;

    dibujarReloj(doc, xCol1 + 9, yColBase + 9, 9);
    doc
      .fillColor(GRIS_TEXTO)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('DURACIÓN', xCol1 + 24, yColBase, { characterSpacing: 0.5 });
    doc
      .fillColor(TINTA)
      .font('Helvetica-Bold')
      .fontSize(13)
      .text(`${datos.horas} horas`, xCol1 + 24, yColBase + 15);

    doc
      .fillColor(GRIS_TEXTO)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('CALIFICACIÓN', xCol2, yColBase, {
        width: separador2 - xCol2 - 16,
        characterSpacing: 0.5,
      });
    doc
      .fillColor(TINTA)
      .font('Helvetica-Bold')
      .fontSize(13)
      .text(`${datos.calificacion}/48`, xCol2, yColBase + 15);

    dibujarCalendario(doc, xCol3 + 9, yColBase + 9, 9);
    doc
      .fillColor(GRIS_TEXTO)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('EMITIDO', xCol3 + 24, yColBase, { characterSpacing: 0.5 });
    doc
      .fillColor(TINTA)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(FORMATO_FECHA.format(datos.emitidoAt), xCol3 + 24, yColBase + 15, {
        width: xFinFila - (xCol3 + 24),
        lineBreak: false,
      });

    const altoFilaStats = 46;
    doc
      .moveTo(separador1, yColBase - 4)
      .lineTo(separador1, yColBase + altoFilaStats)
      .lineWidth(0.75)
      .strokeColor(GRIS_LINEA)
      .stroke();
    doc
      .moveTo(separador2, yColBase - 4)
      .lineTo(separador2, yColBase + altoFilaStats)
      .lineWidth(0.75)
      .strokeColor(GRIS_LINEA)
      .stroke();

    // Párrafo centrado con punto medio como separador, no una grilla con un glifo por
    // amenaza: los íconos a este tamaño se leían como emojis sueltos, no formales.
    let yTemas = yColBase + altoFilaStats + 14;
    doc
      .moveTo(MARGEN, yTemas - 10)
      .lineTo(ancho - MARGEN, yTemas - 10)
      .lineWidth(1)
      .strokeColor(GRIS_LINEA)
      .stroke();

    doc
      .fillColor(GRIS_TEXTO)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('TEMAS DE ESTUDIO', MARGEN, yTemas, {
        width: ancho - MARGEN * 2,
        align: 'center',
        characterSpacing: 0.5,
      });
    yTemas += 18;

    doc
      .fillColor(TINTA)
      .font('Helvetica')
      .fontSize(11)
      .text(
        datos.modulos.map((modulo) => tituloDe(modulo)).join('   ·   '),
        MARGEN,
        yTemas,
        { width: ancho - MARGEN * 2, align: 'center', lineGap: 4 },
      );
    yTemas = doc.y;

    // La línea sigue al contenido real (temas o fecha, lo que llegue más abajo) en vez de
    // una distancia fija: con 5 módulos en dos filas y 6 en tres, una posición fija dejaba
    // hueco muerto o apretaba. Con un mínimo, para que una lista corta no suba el pie.
    const finContenido = Math.max(yTemas, yColBase + 46);
    const yPie = Math.max(finContenido + 32, alto - 96);

    doc
      .moveTo(MARGEN, yPie)
      .lineTo(ancho - MARGEN, yPie)
      .lineWidth(1)
      .strokeColor(DORADO)
      .stroke();

    // Bloque centrado: sin el sello que ocupaba el centro, la verificación pegada al margen
    // dejaba la mitad derecha del pie vacía y descompensada.
    doc
      .fillColor(GRIS_TEXTO)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('CÓDIGO DE VERIFICACIÓN', 0, yPie + 20, {
        width: ancho,
        align: 'center',
      });
    doc
      .fillColor(TINTA)
      .font('Helvetica-Bold')
      .fontSize(15)
      .text(datos.codigo, 0, yPie + 33, { width: ancho, align: 'center' });
    doc
      .fillColor(GRIS_TEXTO)
      .font('Helvetica')
      .fontSize(9.5)
      .text(`${datos.origen}/verificar/${datos.codigo}`, 0, yPie + 53, {
        width: ancho,
        align: 'center',
      });

    doc.end();
  });
}
