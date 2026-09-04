import PDFDocument from 'pdfkit';

/// Paleta propia del PDF, más ornamentada que la del sistema de diseño de la
/// app: un certificado se guarda e imprime, y ahí las reglas de `DESIGN.md`
/// (un solo verde de marca, nada de degradados) no aplican — son para la
/// interfaz que se usa en pantalla, no para este documento aparte. El PDF no
/// tiene acceso a los tokens de Tailwind de todos modos.
const VERDE_OSCURO = '#00401f';
const VERDE_MARCA = '#006837';
const VERDE_CLARO = '#0d7a42';
const DORADO = '#b6903f';
const DORADO_CLARO = '#d9bd7a';
const CREMA = '#faf7ef';
const TINTA = '#1a1a1a';
const GRIS_TEXTO = '#4a4f57';
const GRIS_LINEA = '#d8cfb8';

const ALTO_BANNER = 132;
const MARGEN = 46;

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

/// El escudo con check del banner. Silueta de escudo real —hombros curvos,
/// punta abajo— y no un círculo: es lo que distingue a un sello de seguridad
/// de un simple ok. Dibujado con las primitivas de pdfkit, sin ninguna
/// imagen: un ícono de este tamaño no justifica cargar un asset.
function dibujarEscudo(
  doc: Doc,
  cx: number,
  topY: number,
  ancho: number,
  alto: number,
): void {
  const mitad = ancho / 2;
  doc.save();
  doc
    .moveTo(cx - mitad, topY + alto * 0.16)
    .lineTo(cx - mitad, topY)
    .quadraticCurveTo(cx, topY - alto * 0.08, cx + mitad, topY)
    .lineTo(cx + mitad, topY + alto * 0.16)
    .quadraticCurveTo(cx + mitad, topY + alto * 0.62, cx, topY + alto)
    .quadraticCurveTo(
      cx - mitad,
      topY + alto * 0.62,
      cx - mitad,
      topY + alto * 0.16,
    )
    .closePath()
    .fillColor(DORADO)
    .fill();
  doc
    .lineWidth(alto * 0.09)
    .strokeColor('#ffffff')
    .lineJoin('round')
    .lineCap('round')
    .moveTo(cx - mitad * 0.5, topY + alto * 0.5)
    .lineTo(cx - mitad * 0.1, topY + alto * 0.76)
    .lineTo(cx + mitad * 0.55, topY + alto * 0.28)
    .stroke();
  doc.restore();
}

/// Puntos y líneas sueltas a los lados del banner, muy tenues: la textura de
/// "red" que trae la referencia, sin repetir un patrón exacto ni cargar un
/// SVG. Confinada a una franja para no cruzarse con el título.
function dibujarTramaDeRed(
  doc: Doc,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
): void {
  const nodos: [number, number][] = [];
  const columnas = 4;
  const filas = 3;
  for (let c = 0; c < columnas; c++) {
    for (let f = 0; f < filas; f++) {
      const px =
        x0 + ((x1 - x0) * (c + 0.5)) / columnas + (f % 2 === 0 ? 10 : -10);
      const py = y0 + ((y1 - y0) * (f + 0.5)) / filas;
      nodos.push([px, py]);
    }
  }
  doc.save();
  doc.opacity(0.12);
  doc.strokeColor('#ffffff').lineWidth(0.75);
  for (let i = 0; i < nodos.length - 1; i++) {
    const [ax, ay] = nodos[i];
    const [bx, by] = nodos[i + 1];
    if (Math.abs(ax - bx) < 90) {
      doc.moveTo(ax, ay).lineTo(bx, by).stroke();
    }
  }
  doc.fillColor('#ffffff');
  for (const [px, py] of nodos) {
    doc.circle(px, py, 1.6).fill();
  }
  doc.opacity(1);
  doc.restore();
}

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

/// Un glifo simple por amenaza: no una ilustración detallada, solo lo mínimo
/// para que la lista de temas se lea como iconos y no como una lista de
/// texto plano. `fisico` reutiliza el mismo escudo del banner, a menor escala.
function dibujarIconoTema(
  doc: Doc,
  modulo: string,
  x: number,
  y: number,
  s: number,
): void {
  doc.save();
  doc.lineWidth(1.1).strokeColor(VERDE_MARCA).fillColor(VERDE_MARCA);

  switch (modulo) {
    case 'phishing':
      // Sobre: rectángulo con la solapa en V.
      doc.roundedRect(x, y, s, s * 0.72, 1).stroke();
      doc
        .moveTo(x, y)
        .lineTo(x + s / 2, y + s * 0.42)
        .lineTo(x + s, y)
        .stroke();
      break;
    case 'smishing':
      // Burbuja de chat con colita.
      doc.roundedRect(x, y, s, s * 0.66, s * 0.18).stroke();
      doc
        .moveTo(x + s * 0.22, y + s * 0.66)
        .lineTo(x + s * 0.16, y + s * 0.88)
        .lineTo(x + s * 0.42, y + s * 0.66)
        .fill();
      break;
    case 'vishing':
      // Teléfono: cuerpo redondeado, altavoz y botón de inicio.
      doc.roundedRect(x + s * 0.24, y, s * 0.52, s * 1.02, s * 0.1).stroke();
      doc
        .moveTo(x + s * 0.4, y + s * 0.14)
        .lineTo(x + s * 0.6, y + s * 0.14)
        .lineWidth(1.4)
        .stroke();
      doc.circle(x + s * 0.5, y + s * 0.88, s * 0.06).fill();
      break;
    case 'suplantacion':
      // Silueta de persona: cabeza + hombros.
      doc.circle(x + s / 2, y + s * 0.28, s * 0.22).fill();
      doc
        .moveTo(x + s * 0.1, y + s)
        .quadraticCurveTo(x + s / 2, y + s * 0.52, x + s * 0.9, y + s)
        .fill();
      break;
    case 'estafa':
      // Carrito de compras: canasta trapezoidal, mango y dos ruedas. Se
      // descartó la bolsa con asa —a este tamaño se leía como un candado—;
      // un carrito no tiene esa ambigüedad.
      doc
        .moveTo(x, y)
        .lineTo(x + s * 0.12, y)
        .lineTo(x + s * 0.28, y + s * 0.62)
        .lineTo(x + s * 0.92, y + s * 0.62)
        .lineTo(x + s, y + s * 0.16)
        .lineTo(x + s * 0.2, y + s * 0.16)
        .stroke();
      doc.circle(x + s * 0.38, y + s * 0.84, s * 0.09).fill();
      doc.circle(x + s * 0.78, y + s * 0.84, s * 0.09).fill();
      break;
    default:
      dibujarEscudo(doc, x + s / 2, y, s * 0.85, s);
  }

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
    const degradado = doc.linearGradient(0, 0, ancho, 0);
    degradado
      .stop(0, VERDE_OSCURO)
      .stop(0.5, VERDE_CLARO)
      .stop(1, VERDE_OSCURO);
    doc.rect(0, 0, ancho, ALTO_BANNER).fill(degradado);
    doc.rect(0, ALTO_BANNER - 3, ancho, 3).fill(DORADO);

    dibujarTramaDeRed(doc, 20, ancho * 0.22, 20, ALTO_BANNER - 20);
    dibujarTramaDeRed(doc, ancho * 0.78, ancho - 20, 20, ALTO_BANNER - 20);

    // El lockup escudo + título se centra como grupo: se mide el texto antes
    // de dibujar nada, para no adivinar un ancho fijo que se desalinee si el
    // nombre "SAFE Web" cambiara de tamaño de fuente.
    doc.font('Times-Bold').fontSize(38);
    const anchoTitulo = doc.widthOfString('SAFE Web');
    const altoEscudo = 52;
    const anchoEscudo = 44;
    const espacioIconoTexto = 16;
    const anchoGrupo = anchoEscudo + espacioIconoTexto + anchoTitulo;
    const xGrupo = (ancho - anchoGrupo) / 2;
    const yBannerCentro = ALTO_BANNER / 2;

    dibujarEscudo(
      doc,
      xGrupo + anchoEscudo / 2,
      yBannerCentro - altoEscudo / 2 - 6,
      anchoEscudo,
      altoEscudo,
    );

    doc
      .fillColor('#ffffff')
      .font('Times-Bold')
      .fontSize(38)
      .text(
        'SAFE Web',
        xGrupo + anchoEscudo + espacioIconoTexto,
        yBannerCentro - 30,
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
      .text('ENTRENAMIENTO EN CIBERSEGURIDAD', 0, yBannerCentro + 18, {
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

    doc
      .fillColor(TINTA)
      .font('Times-BoldItalic')
      .fontSize(40)
      .text(datos.nombreCompleto, MARGEN, y, {
        width: ancho - MARGEN * 2,
        align: 'center',
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
    y = doc.y + 30;

    doc
      .moveTo(ancho * 0.12, y)
      .lineTo(ancho * 0.88, y)
      .lineWidth(1)
      .strokeColor(GRIS_LINEA)
      .stroke();
    y += 34;

    // Fila de tres columnas: duración, emitido, temas de estudio — separadas
    // por una línea vertical fina, como en la referencia. Los separadores se
    // calculan a partir del mismo punto medio entre columnas que limita el
    // ancho del texto, para que uno nunca pueda quedar más adentro que el
    // otro (era el bug de la v1: la fecha se metía debajo de la línea).
    const xCol1 = ancho * 0.08;
    const xCol2 = ancho * 0.26;
    const xCol3 = ancho * 0.56;
    const xFinTemas = ancho * 0.92;
    const separador1 = (xCol1 + xCol2) / 2 + 4;
    const separador2 = (xCol2 + xCol3) / 2 + 20;
    const yColBase = y;

    dibujarReloj(doc, xCol1 + 9, yColBase + 9, 9);
    doc
      .fillColor(GRIS_TEXTO)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('DURACIÓN', xCol1 + 24, yColBase);
    doc
      .fillColor(TINTA)
      .font('Helvetica-Bold')
      .fontSize(13)
      .text(`${datos.horas} horas`, xCol1 + 24, yColBase + 13);

    dibujarCalendario(doc, xCol2 + 9, yColBase + 9, 9);
    doc
      .fillColor(GRIS_TEXTO)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('EMITIDO', xCol2 + 24, yColBase);
    doc
      .fillColor(TINTA)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(FORMATO_FECHA.format(datos.emitidoAt), xCol2 + 24, yColBase + 13, {
        width: separador2 - (xCol2 + 24) - 10,
      });

    doc
      .moveTo(separador1, yColBase - 4)
      .lineTo(separador1, yColBase + 46)
      .lineWidth(0.75)
      .strokeColor(GRIS_LINEA)
      .stroke();
    doc
      .moveTo(separador2, yColBase - 4)
      .lineTo(separador2, yColBase + 46)
      .lineWidth(0.75)
      .strokeColor(GRIS_LINEA)
      .stroke();

    doc
      .fillColor(GRIS_TEXTO)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('TEMAS DE ESTUDIO', xCol3, yColBase);

    // Dos columnas dentro de la tercera: los módulos se reparten alternados
    // (0 y 1 en la primera fila, 2 y 3 en la segunda...), así que la lista
    // crece o se achica sola con cinco o con seis módulos, sin coordenadas
    // fijas por escenario.
    const anchoSubcol = (xFinTemas - xCol3 - 18) / 2;
    const iconoTema = 11;
    let yTemas = yColBase + 18;
    for (let i = 0; i < datos.modulos.length; i += 2) {
      const par = [datos.modulos[i], datos.modulos[i + 1]].filter(
        (m): m is string => m !== undefined,
      );
      par.forEach((modulo, offset) => {
        const xItem = xCol3 + offset * (anchoSubcol + 18);
        dibujarIconoTema(doc, modulo, xItem, yTemas + 1, iconoTema);
        doc
          .fillColor(TINTA)
          .font('Helvetica')
          .fontSize(10)
          .text(tituloDe(modulo), xItem + iconoTema + 6, yTemas, {
            width: anchoSubcol - iconoTema - 6,
          });
      });
      const lineasMax = Math.max(
        ...par.map((m) =>
          doc.heightOfString(tituloDe(m), {
            width: anchoSubcol - iconoTema - 6,
          }),
        ),
      );
      yTemas += Math.max(21, lineasMax + 9);
    }

    // --- Pie ------------------------------------------------------------
    // La línea sigue al contenido real (el final de "temas de estudio" o el
    // de la columna de fecha, lo que llegue más abajo) en vez de una
    // distancia fija al borde: con 5 módulos en dos filas y con 6 en tres,
    // una posición fija dejaba un hueco muerto entre la lista y el pie, o lo
    // apretaba demasiado. Con un mínimo, para que una lista corta no suba el
    // pie hasta la mitad de la página.
    const finContenido = Math.max(yTemas, yColBase + 46);
    const yPie = Math.max(finContenido + 46, alto - 96);

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
