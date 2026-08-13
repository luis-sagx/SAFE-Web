import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import type { JwtPayload, RefreshTokenPayload } from '@comun';
import { huellaCedula } from '../cedula/cedula';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { PatchMeDto } from './dto/patch-me.dto';
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
  onboardingVisto: boolean;
}

interface ParticipantConOnboarding {
  id: string;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
  role: string;
  onboardingVistoAt: Date | null;
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
  onboardingVistoAt: true,
} as const;

/// `seq` se necesita para firmar el token pero no se devuelve al cliente.
const CAMPOS_SESION = { ...CAMPOS_PERFIL, seq: true } as const;

/// El perfil se construye campo por campo en vez de descartando los que
/// sobran: así, agregar una columna al modelo nunca la filtra a la respuesta
/// por olvidarse de excluirla. `onboardingVistoAt` se traduce a un booleano:
/// el cliente solo necesita saber si ya la vio, no cuándo.
function perfilPublico(participant: ParticipantConOnboarding): Perfil {
  return {
    id: participant.id,
    nombre: participant.nombre,
    apellido: participant.apellido,
    email: participant.email,
    role: participant.role,
    onboardingVisto: participant.onboardingVistoAt !== null,
  };
}

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
  private readonly refreshExpiresIn: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    // getOrThrow y no get: sin pepper, las huellas de cédula serían
    // reversibles por fuerza bruta. Mejor que el servicio no arranque.
    this.cedulaPepper = config.getOrThrow<string>('CEDULA_PEPPER');
    this.refreshExpiresIn = config.get('REFRESH_TOKEN_EXPIRES_IN', '12h');
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

    let participant: ParticipantConOnboarding & { seq: number };
    try {
      participant = await this.prisma.participant.create({
        data: {
          nombre: dto.nombre,
          apellido: dto.apellido,
          email: dto.email,
          cedulaHash,
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
      select: { ...CAMPOS_SESION, passwordHash: true, disabledAt: true },
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

    // La cuenta desactivada por un supervisor no entra. Se comprueba solo tras
    // validar la contraseña: sin credenciales correctas no se puede averiguar
    // si una cuenta existe y está desactivada.
    if (participant.disabledAt) {
      throw new ForbiddenException(
        'Tu cuenta está desactivada. Contacta al supervisor del estudio.',
      );
    }

    return this.sesion(participant);
  }

  async me(participantId: string) {
    const participant = await this.prisma.participant.findUnique({
      where: { id: participantId },
      select: { ...CAMPOS_PERFIL, disabledAt: true },
    });

    if (!participant) {
      throw new UnauthorizedException();
    }

    // Si un supervisor desactivó la cuenta mientras la sesión seguía viva, el
    // siguiente /auth/me la echa: el token vale hasta caducar, pero la app
    // consulta este endpoint y ahí se corta.
    if (participant.disabledAt) {
      throw new UnauthorizedException('Tu cuenta está desactivada.');
    }

    return perfilPublico(participant);
  }

  /// `onboardingVisto: true` marca la fecha (no vuelve a aparecer sola);
  /// `false` la borra (vuelve a aparecer en el siguiente inicio de sesión, y
  /// es lo que permite reactivarla desde el ícono ⓘ).
  async actualizarMe(participantId: string, dto: PatchMeDto) {
    const participant = await this.prisma.participant.update({
      where: { id: participantId },
      data: { onboardingVistoAt: dto.onboardingVisto ? new Date() : null },
      select: CAMPOS_PERFIL,
    });

    return perfilPublico(participant);
  }

  /// Cambia el access token (vida corta) por uno nuevo, junto con un refresh
  /// token nuevo. Relee el participante de la base en vez de confiar en lo que
  /// traía el refresh token: así una cuenta desactivada, o un cambio de rol,
  /// se refleja de inmediato en vez de esperar a que expire el refresh.
  ///
  /// `refreshToken` puede venir vacío: es lo que llega cuando la cookie
  /// httpOnly nunca se puso (primera visita) o ya la borró el navegador.
  async refrescar(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token inválido o expirado.');
    }

    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshTokenPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado.');
    }

    if (payload.typ !== 'refresh') {
      throw new UnauthorizedException('Refresh token inválido o expirado.');
    }

    const participant = await this.prisma.participant.findUnique({
      where: { id: payload.sub },
      select: { ...CAMPOS_SESION, disabledAt: true },
    });

    if (!participant || participant.disabledAt) {
      throw new UnauthorizedException('Refresh token inválido o expirado.');
    }

    return this.sesion(participant);
  }

  private async sesion(
    participant: ParticipantConOnboarding & { seq: number },
  ) {
    const payload: JwtPayload = {
      sub: participant.id,
      seq: participant.seq,
      role: participant.role,
      typ: 'access',
    };

    const refreshPayload: RefreshTokenPayload = {
      sub: participant.id,
      typ: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload),
      this.jwt.signAsync(refreshPayload, {
        // `expiresIn` viene de la config como string plano; el tipo de la
        // librería `ms` lo quiere como template literal, no como `string`.
        expiresIn: this.refreshExpiresIn,
      } as JwtSignOptions),
    ]);

    // Se decodifica en vez de volver a parsear `refreshExpiresIn`: así la
    // cookie expira exactamente cuando expira el JWT que contiene, sin
    // mantener la duración por dos caminos que se puedan desincronizar.
    const { exp } = this.jwt.decode<{ exp: number }>(refreshToken);

    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt: new Date(exp * 1000),
      participant: perfilPublico(participant),
    };
  }
}
