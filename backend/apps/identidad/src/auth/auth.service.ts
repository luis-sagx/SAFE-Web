import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import type { JwtPayload } from '@comun';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

/// Factor de costo de bcrypt. OWASP Password Storage recomienda >= 10.
const BCRYPT_ROUNDS = 12;

/// Hash señuelo contra el que se compara cuando el correo no existe, para que
/// el tiempo de respuesta no delate qué correos están registrados.
const HASH_SENUELO =
  '$2b$12$0000000000000000000000000000000000000000000000000000';

export interface Perfil {
  id: string;
  nombre: string | null;
  email: string | null;
  role: string;
  cohort: string | null;
}

/// Lo que la interfaz sabe del participante. No incluye el seudónimo: ese
/// pertenece al análisis, y el participante nunca debe verlo.
const CAMPOS_PERFIL = {
  id: true,
  nombre: true,
  email: true,
  role: true,
  cohort: true,
} as const;

/// `seq` se necesita para firmar el token pero no se devuelve al cliente.
const CAMPOS_SESION = { ...CAMPOS_PERFIL, seq: true } as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const yaExiste = await this.prisma.participant.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (yaExiste) {
      throw new ConflictException(
        'Ese correo ya está registrado. Inicia sesión.',
      );
    }

    const participant = await this.prisma.participant.create({
      data: {
        nombre: dto.nombre,
        email: dto.email,
        telefono: dto.telefono,
        cohort: dto.cohort ?? null,
        passwordHash: await hash(dto.password, BCRYPT_ROUNDS),
      },
      select: CAMPOS_SESION,
    });

    return this.sesion(participant);
  }

  async login(dto: LoginDto) {
    const participant = await this.prisma.participant.findUnique({
      where: { email: dto.email },
    });

    const ok = await compare(
      dto.password,
      participant?.passwordHash ?? HASH_SENUELO,
    );

    // Un solo mensaje para correo inexistente y para contraseña incorrecta:
    // distinguirlos permitiría averiguar quién está registrado.
    if (!participant || !ok) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    return this.sesion(participant);
  }

  async me(participantId: string) {
    const participant = await this.prisma.participant.findUnique({
      where: { id: participantId },
      select: CAMPOS_PERFIL,
    });

    if (!participant) {
      throw new UnauthorizedException();
    }

    return participant;
  }

  private async sesion(participant: Perfil & { seq: number }) {
    const { seq, ...perfil } = participant;
    const payload: JwtPayload = {
      sub: perfil.id,
      seq,
      cohort: perfil.cohort,
      role: perfil.role,
    };

    return {
      accessToken: await this.jwt.signAsync(payload),
      participant: perfil,
    };
  }
}
