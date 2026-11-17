import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { hash } from 'bcrypt';
import { decryptOptional, encrypt, hashEmail } from '../pii/pii';
import { PrismaService } from '../prisma/prisma.service';

/// Mismo factor que el registro (OWASP Password Storage >= 10).
const BCRYPT_ROUNDS = 12;

/// Roles que el supervisor gestiona desde el panel. TRAINER se muestra como
/// "tester" en la interfaz.
type ManagedRole = 'PARTICIPANT' | 'TRAINER';

const NOT_FOUND: Record<ManagedRole, string> = {
  PARTICIPANT: 'No existe ese participante.',
  TRAINER: 'No existe ese tester.',
};

export interface AdminParticipant {
  id: string;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
  activo: boolean;
  certificado: AdminCertificateStatus | null;
}

export interface AdminCertificateStatus {
  id: string;
  emitidoAt: string;
  revocadoAt: string | null;
}

/// Lo que el supervisor ve de cada cuenta. Sin `cedulaHash` ni `passwordHash`:
/// no tienen por qué salir del servidor. La cédula en claro no existe.
///
/// Tampoco sale el seudónimo (P001) ni la fecha de alta: el seudónimo es el
/// número de orden de registro, así que cualquiera de los dos junto al nombre
/// enlaza a la persona con sus resultados. Identidad y resultados se ven en
/// pestañas separadas y nunca juntos.
const ADMIN_FIELDS = {
  id: true,
  profile: { select: { nombre: true, apellido: true, email: true } },
  disabledAt: true,
} as const;

interface AdminRow {
  id: string;
  profile: {
    nombre: string | null;
    apellido: string | null;
    email: string | null;
  } | null;
  disabledAt: Date | null;
}

interface AdminCertificateRow {
  id: string;
  participantId: string;
  emitidoAt: Date;
  revocadoAt: Date | null;
}

/// El supervisor sí necesita ver el nombre y el correo reales para poder
/// gestionar cuentas (a quién reactivar, a quién resetearle la contraseña):
/// se descifran aquí, el único punto por el que pasa la lista de camino a
/// la pantalla de administración.
function toView(p: AdminRow, piiKey: string): AdminParticipant {
  return {
    id: p.id,
    nombre: decryptOptional(p.profile?.nombre ?? null, piiKey),
    apellido: decryptOptional(p.profile?.apellido ?? null, piiKey),
    email: decryptOptional(p.profile?.email ?? null, piiKey),
    activo: p.disabledAt === null,
    certificado: null,
  };
}

/// Orden alfabético por nombre completo. Se ordena ya descifrado: en la base
/// solo hay texto cifrado. No se ordena por fecha de alta porque ese orden
/// coincide con el del seudónimo.
function byName(a: AdminParticipant, b: AdminParticipant): number {
  const name = (p: AdminParticipant) => `${p.nombre ?? ''} ${p.apellido ?? ''}`;
  return name(a).localeCompare(name(b), 'es', { sensitivity: 'base' });
}

/// ~60 bits de entropía y legible: se puede dictar en voz alta. Igual criterio
/// que la contraseña del seed del supervisor.
function generatePassword(): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789';
  return Array.from(
    randomBytes(12),
    (byte) => alphabet[byte % alphabet.length],
  ).join('');
}

@Injectable()
export class AdminService {
  private readonly piiKey: string;
  private readonly emailPepper: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.piiKey = config.getOrThrow<string>('PII_ENCRYPTION_KEY');
    this.emailPepper = config.getOrThrow<string>('EMAIL_PEPPER');
  }

  async createTrainer(dto: {
    nombre: string;
    apellido: string;
    email: string;
  }): Promise<{ password: string }> {
    const email = dto.email.toLowerCase();
    const emailHash = hashEmail(email, this.emailPepper);
    const password = generatePassword();
    const passwordHash = await hash(password, BCRYPT_ROUNDS);
    await this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw`
        SELECT pg_advisory_xact_lock(hashtextextended(${emailHash}, 0))
      `;
      const existing = await transaction.account.findFirst({
        where: { profile: { is: { OR: [{ emailHash }, { email }] } } },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException('Ya existe una cuenta con ese correo.');
      }

      await transaction.account.create({
        data: {
          role: { connect: { code: 'TRAINER' } },
          passwordHash,
          profile: {
            create: {
              nombre: encrypt(dto.nombre, this.piiKey),
              apellido: encrypt(dto.apellido, this.piiKey),
              email: encrypt(email, this.piiKey),
              emailHash,
            },
          },
        },
      });
    });
    return { password };
  }

  async listTrainers(): Promise<AdminParticipant[]> {
    const rows = await this.prisma.account.findMany({
      where: { role: { code: 'TRAINER' } },
      select: ADMIN_FIELDS,
    });
    return rows.map((trainer) => toView(trainer, this.piiKey)).sort(byName);
  }

  async changeTrainerStatus(
    id: string,
    active: boolean,
  ): Promise<AdminParticipant> {
    await this.account(id, 'TRAINER');
    const updated = await this.prisma.account.update({
      where: { id },
      data: { disabledAt: active ? null : new Date() },
      select: ADMIN_FIELDS,
    });
    return toView(updated, this.piiKey);
  }

  /// Solo participantes. Un supervisor no aparece en la lista ni puede ser
  /// gestionado por otro: las cuentas de supervisor se crean por script.
  async list(): Promise<AdminParticipant[]> {
    const rows = await this.prisma.account.findMany({
      where: { role: { code: 'PARTICIPANT' } },
      select: ADMIN_FIELDS,
    });
    const certificates: AdminCertificateRow[] = rows.length
      ? await this.prisma.certificate.findMany({
          where: { participantId: { in: rows.map((p) => p.id) } },
          select: {
            id: true,
            participantId: true,
            emitidoAt: true,
            revocadoAt: true,
          },
        })
      : [];
    const certificateByParticipant = new Map(
      certificates.map((certificate) => [
        certificate.participantId,
        certificate,
      ]),
    );

    return rows
      .map((p) => {
        const participant = toView(p, this.piiKey);
        const certificate = certificateByParticipant.get(p.id);
        if (certificate) {
          participant.certificado = {
            id: certificate.id,
            emitidoAt: certificate.emitidoAt.toISOString(),
            revocadoAt: certificate.revocadoAt?.toISOString() ?? null,
          };
        }
        return participant;
      })
      .sort(byName);
  }

  /// Busca una cuenta del rol pedido. Devolver el mismo 404 para "no existe"
  /// y para "es de otro rol" evita que se pueda sondear qué ids son de
  /// supervisores.
  private async account(
    id: string,
    role: ManagedRole = 'PARTICIPANT',
  ): Promise<AdminRow> {
    const p = await this.prisma.account.findFirst({
      where: { id, role: { code: role } },
      select: ADMIN_FIELDS,
    });
    if (!p) {
      throw new NotFoundException(NOT_FOUND[role]);
    }
    return p;
  }

  async changeStatus(id: string, active: boolean): Promise<AdminParticipant> {
    await this.account(id);
    const p = await this.prisma.account.update({
      where: { id },
      data: { disabledAt: active ? null : new Date() },
      select: ADMIN_FIELDS,
    });
    return toView(p, this.piiKey);
  }

  /// Genera una contraseña nueva y la devuelve UNA vez: no se guarda en claro,
  /// solo su bcrypt. El supervisor se la entrega a la persona por un canal
  /// aparte. Vale para participantes y testers.
  async resetPassword(
    id: string,
    role: ManagedRole = 'PARTICIPANT',
  ): Promise<{ password: string }> {
    await this.account(id, role);
    const password = generatePassword();
    await this.prisma.account.update({
      where: { id },
      data: {
        passwordHash: await hash(password, BCRYPT_ROUNDS),
        // Cierra cualquier sesión ya abierta en otro dispositivo, igual que
        // el autoservicio por correo (issue #256, ver auth.service.ts).
        tokenVersion: { increment: 1 },
      },
    });
    return { password };
  }

  /// Borra la cuenta. Las corridas del estudio no se tocan: viven en otro
  /// servicio, ya seudonimizadas, sin llave hacia aquí. Es la anonimización de
  /// una sola persona.
  async delete(id: string): Promise<void> {
    const p = await this.prisma.account.findFirst({
      where: { id, role: { code: 'PARTICIPANT' } },
      select: { id: true },
    });
    if (!p) {
      throw new NotFoundException('No existe ese participante.');
    }
    await this.prisma.account.delete({ where: { id } });
  }
}
