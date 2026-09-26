import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { emailLayout } from './plantilla';

/// Única salida de correo del sistema (§11 del diseño MVP la excluía; esta
/// spec la reintroduce solo para la entrega del certificado, nada de
/// verificación de cuenta, newsletters ni notificaciones de progreso. La
/// cédula ya es la garantía de una cuenta por persona; verificar el correo
/// además de eso no aportaba nada que justifique el paso extra en el
/// registro.
///
/// Sin cola de reintento a propósito: si Resend falla, el participante sigue
/// pudiendo descargar el certificado en la app (`POST /certificados/pdf` ya
/// existe). Ver el catch en quien llama a esta clase.
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly from: string;

  constructor(config: ConfigService) {
    this.resend = new Resend(config.getOrThrow<string>('RESEND_API_KEY'));
    this.from = config.get('MAIL_FROM', 'SAFE-Web <noreply@luis-sagx.xyz>');
  }

  async sendCertificate(
    email: string,
    name: string,
    pdf: Buffer,
  ): Promise<boolean> {
    // Misma razón que en los otros dos correos: una versión en texto plano
    // ayuda a que el correo no caiga en spam.
    const text = `Hola ${name}, adjunto tu certificado del entrenamiento SAFE-Web.`;

    const html = emailLayout(
      'Tu certificado SAFE-Web',
      `<p>Hola ${name}, adjunto tu certificado del entrenamiento SAFE-Web.</p>`,
    );

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: email,
      subject: 'Tu certificado SAFE-Web',
      html,
      text,
      attachments: [{ filename: 'certificado-safe-web.pdf', content: pdf }],
    });

    if (error) {
      this.logger.warn(
        `No se pudo enviar certificado a ${email}: ${error.message}`,
      );
      return false;
    }

    return true;
  }

  /// El enlace ya trae el token: nada que adjuntar. Sin cola de reintento,
  /// igual que `sendCertificate` — si Resend falla, quien llama responde el
  /// mismo mensaje genérico igualmente (ver AuthService.forgotPassword), así
  /// que un fallo aquí no revela si la cuenta existe.
  async sendPasswordReset(
    email: string,
    name: string,
    resetLink: string,
  ): Promise<boolean> {
    // La versión en texto plano no es decorativa: varios filtros de spam
    // desconfían de un correo que solo trae HTML, sobre todo uno con un
    // único enlace y ningún historial de envíos previos a ese buzón.
    const text = `Hola ${name}, alguien pidió restablecer tu contraseña de SAFE-Web.

Elige una contraseña nueva aquí: ${resetLink}

Si no fuiste tú, ignora este correo: tu contraseña sigue siendo la misma.
El enlace vence en 30 minutos.`;

    const html = emailLayout(
      'Restablecer tu contraseña',
      `<p>Hola ${name}, alguien pidió restablecer tu contraseña de SAFE-Web.</p>
<p><a href="${resetLink}" style="color:#006837;">Elegir una contraseña nueva</a></p>
<p>Si no fuiste tú, ignora este correo: tu contraseña sigue siendo la misma.</p>
<p>El enlace vence en 30 minutos.</p>`,
    );

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: email,
      subject: 'Restablecer tu contraseña',
      html,
      text,
    });

    if (error) {
      this.logger.warn(
        `No se pudo enviar el restablecimiento a ${email}: ${error.message}`,
      );
      return false;
    }

    return true;
  }

  /// Sin cola de reintento, mismo criterio que los otros dos: si Resend
  /// falla, quien llama (AuthService.register) responde el mismo mensaje
  /// genérico igual, y hay un botón de "reenviar" en el frontend.
  async sendEmailConfirmation(
    email: string,
    name: string,
    confirmLink: string,
  ): Promise<boolean> {
    const text = `Hola ${name}, gracias por crear tu cuenta en SAFE-Web.

Confirma tu correo aquí: ${confirmLink}

El enlace vence en 24 horas. Si no creaste esta cuenta, ignora este correo.`;

    const html = emailLayout(
      'Confirma tu correo',
      `<p>Hola ${name}, gracias por crear tu cuenta en SAFE-Web.</p>
<p><a href="${confirmLink}" style="color:#006837;">Confirmar mi correo</a></p>
<p>El enlace vence en 24 horas. Si no creaste esta cuenta, ignora este correo.</p>`,
    );

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: email,
      subject: 'Confirma tu correo en SAFE-Web',
      html,
      text,
    });

    if (error) {
      this.logger.warn(
        `No se pudo enviar la confirmación a ${email}: ${error.message}`,
      );
      return false;
    }

    return true;
  }
}
