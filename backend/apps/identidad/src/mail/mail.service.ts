import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

/// Única salida de correo del sistema (§11 del diseño MVP la excluía; esta
/// spec la reintroduce solo para la entrega del certificado — nada de
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

  async enviarCertificado(
    email: string,
    nombre: string,
    pdf: Buffer,
  ): Promise<boolean> {
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: email,
      subject: 'Tu certificado SAFE-Web',
      html: `<p>Hola ${nombre}, adjunto tu certificado del entrenamiento SAFE-Web.</p>`,
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
}
