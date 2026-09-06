import PDFDocument from 'pdfkit';
import { ISOTIPO_SAFEWEB_PNG_BASE64 } from './isotipo-safeweb';

const ISOTIPO_SAFEWEB = Buffer.from(ISOTIPO_SAFEWEB_PNG_BASE64, 'base64');

/// Paleta propia del PDF, más ornamentada que la del sistema de diseño de la
/// app: un certificado se guarda e imprime, y ahí las reglas de `DESIGN.md`
/// (un solo verde de marca, nada de degradados) no aplican — son para la
/// interfaz que se usa en pantalla, no para este documento aparte. El PDF no
/// tiene acceso a los tokens de Tailwind de todos modos.
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

/**
 * Genera el PDF del certificado en memoria. `pdfkit` porque escribir un PDF
 * válido a mano no son "unas pocas líneas" (§10 de `ARQUITECTURA.md`), y un
 * navegador headless añadiría cientos de MB al contenedor por un documento de
 * una página.
 *
 * El estilo —banner verde con degradado, escudo dorado, marco crema, sello
 * circular— sigue el patrón de certificado corporativo (el que pidió
 * reemplazar al primer diseño, más plano). Sin código QR: el código de
 * verificación en texto ya cumple esa función y un QR mal escaneado en una
 * impresión no aportaba nada que el texto no diera. Sin firma: a diferencia
 * de un certificado de instructor, este no tiene una persona que lo respalde
 * a título propio — el sello y el código verificable hacen ese papel.
 *
 * Sin fuente embebida: Times y Helvetica, las que trae pdfkit, usan WinAnsi,
 * que cubre tildes y `ñ`. Sin escudo institucional ni mención de la ESPE en
 * ningún lugar del documento: emitir con la identidad visual de la
 * universidad necesita autorización del departamento. Sin cédula, nunca
 * (§7.1 de `ARQUITECTURA.md`): no existe en claro en ningún lugar del
 * sistema, y este documento no es la excepción.
 */
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

    // --- Fondo y marco ----------------------------------------------------
    doc.rect(0, 0, ancho, alto).fill(CREMA);
    doc
      .rect(10, 10, ancho - 20, alto - 20)
      .lineWidth(1.5)
      .strokeColor(DORADO)
      .stroke();

    // --- Banner -------------------------------------------------------
    // Degradado vertical y sutil, no el tricolor horizontal "brillo de
    // plástico" de la v1: un solo tono que oscurece hacia abajo lee como
    // impreso, no como un ícono de app generado por IA.
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
    // El lockup se centra más arriba de la mitad del banner, no en ella: deja
    // un hueco fijo debajo para el subtítulo en vez de calcularlo a partir
    // del alto real del texto de 38pt (el "SAFE Web" bold), que pdfkit
    // reserva más alto de lo que el ojo ve — con los dos centrados en el
    // mismo punto medio, el subtítulo terminaba pegado contra la "W".
    const yLockup = ALTO_BANNER * 0.4;
    const ySubtitulo = yLockup + 34;

    // El isotipo real de SafeWeb, no un escudo dibujado a mano: sobre una
    // insignia blanca para que el verde del ícono no se pierda contra el
    // verde del banner.
    const insigniaY = yLockup - insigniaLado / 2 - 4;
    doc
      .save()
      .circle(xGrupo + insigniaLado / 2, insigniaY + insigniaLado / 2, insigniaLado / 2)
      .fill('#ffffff');
    const relleno = 9;
    doc.image(
      ISOTIPO_SAFEWEB,
      xGrupo + relleno / 2,
      insigniaY + relleno / 2,
      { width: insigniaLado - relleno, height: insigniaLado - relleno },
    );
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

    // El tracking usa `characterSpacing` (el operador `Tc` del PDF, un avance
    // fijo en puntos) y no letras separadas por espacios literales: un
    // espacio de verdad mide distinto según qué fuente sustituya el lector
    // de PDF por "Helvetica"/"Times", y con un título largo esa diferencia
    // bastaba para que el texto se saliera de la página en algunos lectores
    // aunque en este cuadraba bien. `Tc` es un desplazamiento fijo, no un
    // glifo — no depende de qué fuente termine dibujando el texto.
    doc
      .fillColor(DORADO_CLARO)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('ENTRENAMIENTO EN CIBERSEGURIDAD', 0, ySubtitulo, {
        width: ancho,
        align: 'center',
        characterSpacing: 1.5,
      });

    // --- Cuerpo -------------------------------------------------------
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

    // El tamaño baja hasta que el nombre completo cabe en una sola línea: un
    // nombre ecuatoriano con dos nombres y dos apellidos fácilmente pasa los
    // ~28 caracteres que "Luis Sagnay" ocupa a tamaño 40, y dejarlo envolver
    // a una segunda línea corría el resto del certificado hacia abajo hasta
    // desbordar la página (el bug real: no eran letras montadas, era
    // contenido empujado a una segunda hoja en blanco).
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

    // Fila de tres columnas —duración, calificación, emitido—, cada una con
    // espacio de sobra para su contenido más largo ("CALIFICACIÓN" a la
    // izquierda, la fecha completa a la derecha). La v1 apretaba esto en
    // cuatro columnas contra "temas de estudio", y ni la etiqueta ni la fecha
    // cabían: se cortaban y se montaban sobre el valor de abajo. Separarlas
    // en dos filas —esta y la de temas, más abajo— les da a las tres el
    // ancho que de verdad necesitan.
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

    // --- Temas de estudio -------------------------------------------------
    // Un párrafo centrado, no una grilla con un glifo por amenaza: los
    // íconos a este tamaño se leían como emojis sueltos, no como algo propio
    // de un certificado formal. El punto medio como separador es suficiente
    // para distinguir cada tema sin necesitar una viñeta por línea.
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

    // --- Pie ------------------------------------------------------------
    // La línea sigue al contenido real (el final de "temas de estudio" o el
    // de la columna de fecha, lo que llegue más abajo) en vez de una
    // distancia fija al borde: con 5 módulos en dos filas y con 6 en tres,
    // una posición fija dejaba un hueco muerto entre la lista y el pie, o lo
    // apretaba demasiado. Con un mínimo, para que una lista corta no suba el
    // pie hasta la mitad de la página.
    const finContenido = Math.max(yTemas, yColBase + 46);
    const yPie = Math.max(finContenido + 32, alto - 96);

    doc
      .moveTo(MARGEN, yPie)
      .lineTo(ancho - MARGEN, yPie)
      .lineWidth(1)
      .strokeColor(DORADO)
      .stroke();

    // Un solo bloque centrado: sin el sello que ocupaba el centro, dejar la
    // verificación pegada al margen izquierdo dejaba la mitad derecha del
    // pie vacía y el conjunto descompensado.
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
