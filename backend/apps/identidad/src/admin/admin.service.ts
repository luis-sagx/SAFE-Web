import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { hash } from 'bcryptjs';
import { seudonimo } from '@comun';
import { PrismaService } from '../prisma/prisma.service';

/// Mismo factor que el registro (OWASP Password Storage >= 10).
const BCRYPT_ROUNDS = 12;

export interface ParticipanteAdmin {
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
const CAMPOS_ADMIN = {
  id: true,
  seq: true,
  nombre: true,
  apellido: true,
  email: true,
  disabledAt: true,
  createdAt: true,
} as const;

interface FilaAdmin {
  id: string;
  seq: number;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
  disabledAt: Date | null;
  createdAt: Date;
}

function vista(p: FilaAdmin): ParticipanteAdmin {
  return {
    id: p.id,
    seudonimo: seudonimo(p.seq),
    nombre: p.nombre,
    apellido: p.apellido,
    email: p.email,
    activo: p.disabledAt === null,
    createdAt: p.createdAt.toISOString(),
  };
}

/// ~60 bits de entropía y legible: se puede dictar en voz alta. Igual criterio
/// que la contraseña del seed del supervisor.
function generarPassword(): string {
  const alfabeto = 'abcdefghijkmnpqrstuvwxyz23456789';
  return Array.from(
    randomBytes(12),
    (byte) => alfabeto[byte % alfabeto.length],
  ).join('');
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /// Solo participantes. Un supervisor no aparece en la lista ni puede ser
  /// gestionado por otro: las cuentas de supervisor se crean por script.
  async listar(): Promise<ParticipanteAdmin[]> {
    const filas = await this.prisma.participant.findMany({
      where: { role: 'PARTICIPANT' },
      orderBy: { createdAt: 'asc' },
      select: CAMPOS_ADMIN,
    });
    return filas.map(vista);
  }

  /// Busca una cuenta que sea PARTICIPANT. Devolver el mismo 404 para "no
  /// existe" y para "no es participante" evita que se pueda sondear qué ids son
  /// de supervisores.
  private async participante(id: string): Promise<FilaAdmin> {
    const p = await this.prisma.participant.findFirst({
      where: { id, role: 'PARTICIPANT' },
      select: CAMPOS_ADMIN,
    });
    if (!p) {
      throw new NotFoundException('No existe ese participante.');
    }
    return p;
  }

  async cambiarEstado(id: string, activo: boolean): Promise<ParticipanteAdmin> {
    await this.participante(id);
    const p = await this.prisma.participant.update({
      where: { id },
      data: { disabledAt: activo ? null : new Date() },
      select: CAMPOS_ADMIN,
    });
    return vista(p);
  }

  /// Genera una contraseña nueva y la devuelve UNA vez: no se guarda en claro,
  /// solo su bcrypt. El supervisor se la entrega al participante por un canal
  /// aparte.
  async restablecerPassword(id: string): Promise<{ password: string }> {
    await this.participante(id);
    const password = generarPassword();
    await this.prisma.participant.update({
      where: { id },
      data: { passwordHash: await hash(password, BCRYPT_ROUNDS) },
    });
    return { password };
  }

  /// Borra la cuenta. Las corridas del estudio no se tocan: viven en otro
  /// servicio, ya seudonimizadas, sin llave hacia aquí. Es la anonimización de
  /// una sola persona.
  async eliminar(id: string): Promise<void> {
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
