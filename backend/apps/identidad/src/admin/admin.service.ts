import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { hash } from 'bcryptjs';
import { pseudonym } from '@comun';
import { decryptOptional } from '../pii/pii';
import { PrismaService } from '../prisma/prisma.service';

/// Mismo factor que el registro (OWASP Password Storage >= 10).
const BCRYPT_ROUNDS = 12;

export interface AdminParticipant {
  id: string;
  /// El mismo código con el que salen los resultados en `entrenamiento`
  /// (P001). Es la única llave para parear cada corrida con el pre/post-test
  /// que el participante responde fuera de la plataforma; sin él el estudio
  /// no se puede analizar. Solo lo ve el supervisor, nunca el participante.
  seudonimo: string;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
  activo: boolean;
  createdAt: string;
}

/// Lo que el supervisor ve de cada cuenta. Sin `cedulaHash` ni `passwordHash`:
/// no tienen por qué salir del servidor. La cédula en claro no existe.
const ADMIN_FIELDS = {
  id: true,
  seq: true,
  nombre: true,
  apellido: true,
  email: true,
  disabledAt: true,
  createdAt: true,
} as const;

interface AdminRow {
  id: string;
  seq: number;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
  disabledAt: Date | null;
  createdAt: Date;
}

/// El supervisor sí necesita ver el nombre y el correo reales para poder
/// gestionar cuentas (a quién reactivar, a quién resetearle la contraseña):
/// se descifran aquí, el único punto por el que pasa la lista de camino a
/// la pantalla de administración.
function toView(p: AdminRow, piiKey: string): AdminParticipant {
  return {
    id: p.id,
    seudonimo: pseudonym(p.seq),
    nombre: decryptOptional(p.nombre, piiKey),
    apellido: decryptOptional(p.apellido, piiKey),
    email: decryptOptional(p.email, piiKey),
    activo: p.disabledAt === null,
    createdAt: p.createdAt.toISOString(),
  };
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

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.piiKey = config.getOrThrow<string>('PII_ENCRYPTION_KEY');
  }

  /// Solo participantes. Un supervisor no aparece en la lista ni puede ser
  /// gestionado por otro: las cuentas de supervisor se crean por script.
  async list(): Promise<AdminParticipant[]> {
    const rows = await this.prisma.participant.findMany({
      where: { role: 'PARTICIPANT' },
      orderBy: { createdAt: 'asc' },
      select: ADMIN_FIELDS,
    });
    return rows.map((p) => toView(p, this.piiKey));
  }

  /// Busca una cuenta que sea PARTICIPANT. Devolver el mismo 404 para "no
  /// existe" y para "no es participante" evita que se pueda sondear qué ids son
  /// de supervisores.
  private async participant(id: string): Promise<AdminRow> {
    const p = await this.prisma.participant.findFirst({
      where: { id, role: 'PARTICIPANT' },
      select: ADMIN_FIELDS,
    });
    if (!p) {
      throw new NotFoundException('No existe ese participante.');
    }
    return p;
  }

  async changeStatus(id: string, active: boolean): Promise<AdminParticipant> {
    await this.participant(id);
    const p = await this.prisma.participant.update({
      where: { id },
      data: { disabledAt: active ? null : new Date() },
      select: ADMIN_FIELDS,
    });
    return toView(p, this.piiKey);
  }

  /// Genera una contraseña nueva y la devuelve UNA vez: no se guarda en claro,
  /// solo su bcrypt. El supervisor se la entrega al participante por un canal
  /// aparte.
  async resetPassword(id: string): Promise<{ password: string }> {
    await this.participant(id);
    const password = generatePassword();
    await this.prisma.participant.update({
      where: { id },
      data: { passwordHash: await hash(password, BCRYPT_ROUNDS) },
    });
    return { password };
  }

  /// Borra la cuenta. Las corridas del estudio no se tocan: viven en otro
  /// servicio, ya seudonimizadas, sin llave hacia aquí. Es la anonimización de
  /// una sola persona.
  async delete(id: string): Promise<void> {
    const p = await this.prisma.participant.findFirst({
      where: { id, role: 'PARTICIPANT' },
      select: { id: true },
    });
    if (!p) {
      throw new NotFoundException('No existe ese participante.');
    }
    await this.prisma.participant.delete({ where: { id } });
  }
}
