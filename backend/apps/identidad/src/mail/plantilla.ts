/// Paleta de docs/DESIGN.md (sistema en pantalla), NO la del PDF del
/// certificado: esa es deliberadamente más ornamentada (dorado, crema) y
/// está reservada para el documento impreso (ver certificados/pdf.ts).
const PRIMARY = '#006837';
const INK = '#171717';
const CANVAS = '#f7f7f8';
const HAIRLINE = '#e6e6ea';
const MUTED = '#63676e';

/// Envuelve el cuerpo de un correo con encabezado, pie de página y la
/// paleta de marca. CSS inline a propósito: Gmail y otros clientes recortan
/// <style> en <head>, así que un bloque de estilos no llega a aplicarse de
/// forma confiable.
export function emailLayout(tituloVisible: string, cuerpoHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:${CANVAS};font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${CANVAS};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border:1px solid ${HAIRLINE};border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:24px 24px 16px 24px;border-bottom:1px solid ${HAIRLINE};">
                <span style="color:${PRIMARY};font-size:14px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">SAFE-Web</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;color:${INK};font-size:16px;line-height:1.5;">
                <h1 style="margin:0 0 16px 0;font-size:20px;color:${INK};">${tituloVisible}</h1>
                ${cuerpoHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;border-top:1px solid ${HAIRLINE};color:${MUTED};font-size:12px;">
                Este correo es automático; no respondas directamente a él.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
