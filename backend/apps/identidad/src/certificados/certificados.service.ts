import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { readPemKey, type AttestationPayload, type JwtPayload } from '@comun';
import { MailService } from '../mail/mail.service';
import { decryptOptional } from '../pii/pii';
import { PrismaService } from '../prisma/prisma.service';
import { generateCertificateCode } from './codigo';
import { generateCertificatePdf, type CertificateData } from './pdf';

/// Guardada en cada fila (§5.4 del diseño): un certificado ya emitido no debe
/// cambiar de duración si esta constante cambia después.
const CERTIFICATE_HOURS = 4;

function hasPrismaCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}

export interface PublicCertificate {
  codigo: string;
  emitidoAt: string;
  modulos: string[];
  horas: number;
  calificacion: number;
}

export interface CertificateStatus {
  estado: 'sin-emitir' | 'vigente' | 'revocado';
  modulos: string[];
}

/// Un código revocado responde exactamente igual que uno inexistente
/// (`{ valido: false }`, sin más campos): distinguirlos serviría de oráculo
/// sobre cuántos certificados existen (§5.6 del diseño).
export interface CertificateVerification {
  valido: boolean;
  emitidoAt?: string;
  horas?: number;
  calificacion?: number;
  modulos?: string[];
}

type CertificateModuleRow = { module: string; position: number };
type CertificateModules = {
  modules: CertificateModuleRow[];
};

function moduleNames(certificate: CertificateModules): string[] {
  return [...certificate.modules]
    .sort((a, b) => a.position - b.position)
    .map((item) => item.module);
}

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);
  private readonly piiKey: string;
  /// Pública de `entrenamiento`: verifica atestaciones, no puede firmarlas.
  private readonly attestationKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {
    this.piiKey = config.getOrThrow<string>('PII_ENCRYPTION_KEY');
    this.attestationKey = readPemKey(config, 'ENTRENAMIENTO_JWT_PUBLIC_KEY');
  }

  private certificateOrigin(): string {
    return this.config.get('CERTIFICADO_ORIGEN', 'https://safeweb.espe.edu.ec');
  }

  private findByParticipant(participantId: string) {
    return this.prisma.certificate.findUnique({
      where: { participantId },
      include: { modules: { orderBy: { position: 'asc' } } },
    });
  }

  async getStatus(participantId: string): Promise<CertificateStatus> {
    const certificate = await this.findByParticipant(participantId);
    if (!certificate) return { estado: 'sin-emitir', modulos: [] };
    if (certificate.revocadoAt) return { estado: 'revocado', modulos: [] };
    return { estado: 'vigente', modulos: moduleNames(certificate) };
  }

  /// Verifica el pase que firmó `entrenamiento` y exige que sea del mismo
  /// participante que lo presenta. Sin esto, la atestación de otra persona
  /// Copiada de un log o reenviada, serviría para emitirse un certificado con
  /// el progreso ajeno.
  private async redeem(
    attestation: string,
    participant: JwtPayload,
  ): Promise<AttestationPayload> {
    let payload: AttestationPayload;
    try {
      payload = await this.jwt.verifyAsync<AttestationPayload>(attestation, {
        publicKey: this.attestationKey,
      });
    } catch {
      throw new ForbiddenException('Atestación inválida o vencida.');
    }

    // Simétrico a lo que exige JwtAuthGuard con 'access': un access token no
    // debe poder canjearse como si fuera una atestación.
    if (payload.typ !== 'atestacion') {
      throw new ForbiddenException('Atestación inválida o vencida.');
    }

    if (payload.sub !== participant.sub) {
      throw new ForbiddenException('La atestación no es de este participante.');
    }

    return payload;
  }

  /// Emite el certificado, o lo actualiza si el recorrido creció desde la
  /// última vez (§5.4.1): mismo `codigo` siempre, para que un certificado
  /// impreso siga verificándose.
  async issue(
    participant: JwtPayload,
    attestation: string,
  ): Promise<PublicCertificate> {
    const payload = await this.redeem(attestation, participant);

    const existing = await this.findByParticipant(participant.sub);

    if (existing) {
      if (existing.revocadoAt) {
        throw new ForbiddenException('Tu certificado fue revocado.');
      }

      const covered = new Set(payload.modulos);
      if (
        covered.size <= existing.modules.length ||
        !existing.modules.every(({ module }) => covered.has(module))
      ) {
        // Si el correo original falló, se puede volver a intentar su envío.
        void this.trySendingByEmail(existing);
        return this.toPublic(existing);
      }

      const pendingUpdate = this.prisma.certificate.update({
        where: { id: existing.id, revocadoAt: null },
        data: {
          modules: {
            deleteMany: {},
            create: payload.modulos.map((module, position) => ({
              module,
              position,
            })),
          },
          calificacion: payload.calificacion,
          emitidoAt: new Date(),
          // Issue #214: sin esto, `trySendingByEmail` seguía viendo la fecha
          // del primer envío y nunca mandaba el PDF con el recorrido nuevo.
          certificadoEnviadoAt: null,
        },
        include: { modules: { orderBy: { position: 'asc' } } },
      });
      const updated = await pendingUpdate.catch((error: unknown) => {
        // Una revocación entre la lectura y la actualización invalida el canje.
        if (hasPrismaCode(error, 'P2025')) {
          throw new ForbiddenException('Tu certificado no está vigente.');
        }
        throw error;
      });
      void this.trySendingByEmail(updated);
      return this.toPublic(updated);
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const createdCertificate = await this.prisma.certificate.create({
          data: {
            participantId: participant.sub,
            codigo: generateCertificateCode(),
            modules: {
              create: payload.modulos.map((module, position) => ({
                module,
                position,
              })),
            },
            horas: CERTIFICATE_HOURS,
            calificacion: payload.calificacion,
          },
          include: { modules: { orderBy: { position: 'asc' } } },
        });
        void this.trySendingByEmail(createdCertificate);
        return this.toPublic(createdCertificate);
      } catch (error) {
        // P2002 permite reintentar si el código generado ya está en uso.
        if (!hasPrismaCode(error, 'P2002') || attempt === 4) throw error;
      }
    }

    // Inalcanzable: el bucle siempre retorna o lanza antes de agotarse.
    throw new Error('No se pudo generar el certificado.');
  }

  /// Manda el PDF por correo la primera vez que hay algo que mandar (§ mail
  /// design): correo verificado y aún no enviado. Fire-and-forget desde
  /// `emitir` a propósito, el participante no debe esperar a Resend para
  /// obtener su respuesta, y ya puede descargar el PDF en la app sin esto.
  private async trySendingByEmail(certificate: {
    id: string;
    participantId: string;
    certificadoEnviadoAt: Date | null;
    revocadoAt: Date | null;
    modules: CertificateModuleRow[];
    horas: number;
    calificacion: number;
    emitidoAt: Date;
    codigo: string;
  }): Promise<void> {
    // Envuelto entero: se llama sin `await` desde `emitir()`, así que un
    // rechazo aquí sería una promesa no manejada, no un error que alguien
    // pueda capturar. El certificado ya se guardó; que el correo falle no
    // debe afectar nada más.
    try {
      if (certificate.revocadoAt || certificate.certificadoEnviadoAt) return;

      const person = await this.prisma.account.findUnique({
        where: { id: certificate.participantId },
        select: {
          profile: { select: { nombre: true, apellido: true, email: true } },
        },
      });

      const profile = person?.profile;
      const email = decryptOptional(profile?.email ?? null, this.piiKey);
      if (!email) return;

      const data: CertificateData = {
        nombreCompleto:
          `${decryptOptional(profile?.nombre ?? null, this.piiKey) ?? ''} ${decryptOptional(profile?.apellido ?? null, this.piiKey) ?? ''}`.trim(),
        modulos: moduleNames(certificate),
        horas: certificate.horas,
        calificacion: certificate.calificacion,
        emitidoAt: certificate.emitidoAt,
        codigo: certificate.codigo,
        origen: this.certificateOrigin(),
      };

      const pdf = await generateCertificatePdf(data);
      const sent = await this.mail.sendCertificate(
        email,
        data.nombreCompleto,
        pdf,
      );

      if (sent) {
        await this.prisma.certificate.update({
          where: { id: certificate.id },
          data: { certificadoEnviadoAt: new Date() },
        });
      }
    } catch (error) {
      this.logger.warn(
        `No se pudo enviar el certificado de ${certificate.participantId}: ${String(error)}`,
      );
    }
  }

  /// Regenera el PDF de la fila existente. No lo persiste (§5.4 del diseño):
  /// guardarlo dejaría en disco un archivo con datos personales.
  async generatePdf(
    participant: JwtPayload,
    attestation: string,
  ): Promise<Buffer> {
    await this.redeem(attestation, participant);
    return this.downloadPdf(participant.sub);
  }

  async downloadPdf(participantId: string): Promise<Buffer> {
    const certificate = await this.findByParticipant(participantId);

    if (!certificate || certificate.revocadoAt) {
      throw new NotFoundException('No tienes un certificado vigente.');
    }

    const person = await this.prisma.account.findUnique({
      where: { id: participantId },
      select: { profile: { select: { nombre: true, apellido: true } } },
    });

    if (!person?.profile) {
      throw new NotFoundException('No tienes un certificado vigente.');
    }

    return generateCertificatePdf({
      nombreCompleto:
        `${decryptOptional(person.profile.nombre, this.piiKey) ?? ''} ${decryptOptional(person.profile.apellido, this.piiKey) ?? ''}`.trim(),
      modulos: moduleNames(certificate),
      horas: certificate.horas,
      calificacion: certificate.calificacion,
      emitidoAt: certificate.emitidoAt,
      codigo: certificate.codigo,
      origen: this.certificateOrigin(),
    });
  }

  /// Pública, sin sesión, con límite por IP (ver el controlador). Nunca
  /// devuelve el nombre: quien verifica ya tiene el PDF con el nombre
  /// delante, y publicarlo convertiría esta ruta en un directorio consultable
  /// de quién participó en el estudio (§5.6 del diseño).
  ///
  /// Un código inexistente responde en la misma forma que uno revocado
  /// `{ valido: false }`, sin más campos, para no servir de oráculo sobre
  /// cuántos certificados existen.
  async verify(code: string): Promise<CertificateVerification> {
    const certificate = await this.prisma.certificate.findUnique({
      where: { codigo: code },
      include: { modules: { orderBy: { position: 'asc' } } },
    });

    if (!certificate || certificate.revocadoAt) {
      return { valido: false };
    }

    return {
      valido: true,
      emitidoAt: certificate.emitidoAt.toISOString(),
      horas: certificate.horas,
      calificacion: certificate.calificacion,
      modulos: moduleNames(certificate),
    };
  }

  /// Solo la usa un supervisor (retiro de consentimiento, incidencia). No hay
  /// revocación automática por bajar de umbral: ver el comentario de
  /// `revocadoAt` en el schema.
  async revoke(id: string): Promise<void> {
    await this.prisma.certificate.update({
      where: { id },
      data: { revocadoAt: new Date() },
    });
  }

  private toPublic(certificate: {
    codigo: string;
    emitidoAt: Date;
    modules: CertificateModuleRow[];
    horas: number;
    calificacion: number;
  }): PublicCertificate {
    return {
      codigo: certificate.codigo,
      emitidoAt: certificate.emitidoAt.toISOString(),
      modulos: moduleNames(certificate),
      horas: certificate.horas,
      calificacion: certificate.calificacion,
    };
  }
}
