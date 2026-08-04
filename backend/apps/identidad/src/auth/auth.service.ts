import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import type { JwtPayload } from '@comun';
import { huellaCedula } from '../cedula/cedula';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

/// Factor de costo de bcrypt. OWASP Password Storage recomienda >= 10.
const BCRYPT_ROUNDS = 12;

/// Hash señuelo contra el que se compara cuando el correo no existe, para que
/// el tiempo de respuesta no delate qué correos están registrados.
const HASH_SENUELO =
  '$2b$12$0000000000000000000000000000000000000000000000000000';

/// Un solo mensaje para "correo ya registrado" y "cédula ya registrada":
/// distinguirlos permitiría averiguar quién participó en el estudio.
const YA_REGISTRADO =
  'Ya existe una cuenta con esos datos. Inicia sesión o revisa lo que escribiste.';

export interface Perfil {
  id: string;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
  role: string;
  cohort: string | null;
}

/// Lo que la interfaz sabe del participante. No incluye el seudónimo —ese
/// pertenece al análisis y el participante nunca debe verlo— ni `cedulaHash`,
/// que no tiene por qué salir del servidor.
const CAMPOS_PERFIL = {
  id: true,
  nombre: true,
  apellido: true,
  email: true,
  role: true,
  cohort: true,
} as const;

/// `seq` se necesita para firmar el token pero no se devuelve al cliente.
const CAMPOS_SESION = { ...CAMPOS_PERFIL, seq: true } as const;

/// P2002 es el código de Prisma para violación de índice único.
function esColisionDeUnicidad(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'P2002'
  );
}

@Injectable()
export class AuthService {
  private readonly cedulaPepper: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    // getOrThrow y no get: sin pepper, las huellas de cédula serían
    // reversibles por fuerza bruta. Mejor que el servicio no arranque.
    this.cedulaPepper = config.getOrThrow<string>('CEDULA_PEPPER');
  }

  async register(dto: RegisterDto) {
    const cedulaHash = huellaCedula(dto.cedula, this.cedulaPepper);

    const yaExiste = await this.prisma.participant.findFirst({
      where: { OR: [{ email: dto.email }, { cedulaHash }] },
      select: { id: true },
    });

    if (yaExiste) {
      throw new ConflictException(YA_REGISTRADO);
    }

    let participant: Perfil & { seq: number };
    try {
      participant = await this.prisma.participant.create({
        data: {
          nombre: dto.nombre,
          apellido: dto.apellido,
          email: dto.email,
          cedulaHash,
          cohort: dto.cohort ?? null,
          passwordHash: await hash(dto.password, BCRYPT_ROUNDS),
        },
        select: CAMPOS_SESION,
      });
    } catch (error) {
      // Dos registros simultáneos pasan los dos la comprobación de arriba y
      // solo uno gana el índice único. Sin esto, el segundo recibe un 500 y
      // el participante se queda fuera del estudio sin saber por qué.
      if (esColisionDeUnicidad(error)) {
        throw new ConflictException(YA_REGISTRADO);
      }
      throw error;
    }

    return this.sesion(participant);
  }

  async login(dto: LoginDto) {
    const participant = await this.prisma.participant.findUnique({
      where: { email: dto.email },
      // `select` explícito, no el registro entero: sin esto el passwordHash
      // viaja hasta `sesion()` y termina en la respuesta al cliente.
      select: { ...CAMPOS_SESION, passwordHash: true },
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

  /// El perfil se construye campo por campo en vez de descartando los que
  /// sobran: así, agregar una columna al modelo nunca la filtra a la respuesta
  /// por olvidarse de excluirla.
  private async sesion(participant: Perfil & { seq: number }) {
    const payload: JwtPayload = {
      sub: participant.id,
      seq: participant.seq,
      cohort: participant.cohort,
      role: participant.role,
    };

    return {
      accessToken: await this.jwt.signAsync(payload),
      participant: {
        id: participant.id,
        nombre: participant.nombre,
        apellido: participant.apellido,
        email: participant.email,
        role: participant.role,
        cohort: participant.cohort,
      },
    };
  }
}
