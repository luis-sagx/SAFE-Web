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
import { hashEcuadorianId } from '../cedula/cedula';
import { encrypt, decryptOptional, hashEmail } from '../pii/pii';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { PatchMeDto } from './dto/patch-me.dto';
import { RegisterDto } from './dto/register.dto';

/// Factor de costo de bcrypt. OWASP Password Storage recomienda >= 10.
const BCRYPT_ROUNDS = 12;

/// Hash señuelo contra el que se compara cuando el correo no existe, para que
/// el tiempo de respuesta no delate qué correos están registrados.
const DECOY_HASH =
  '$2b$12$0000000000000000000000000000000000000000000000000000';

/// Un solo mensaje para "correo ya registrado" y "cédula ya registrada":
/// distinguirlos permitiría averiguar quién participó en el estudio.
const ALREADY_REGISTERED =
  'Ya existe una cuenta con esos datos. Inicia sesión o revisa lo que escribiste.';

export interface Profile {
  id: string;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
  role: string;
  onboardingVisto: boolean;
}

interface ParticipantWithOnboarding {
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
const PROFILE_FIELDS = {
  id: true,
  nombre: true,
  apellido: true,
  email: true,
  role: true,
  onboardingVistoAt: true,
} as const;

/// `seq` se necesita para firmar el token pero no se devuelve al cliente.
const SESSION_FIELDS = { ...PROFILE_FIELDS, seq: true } as const;

/// El perfil se construye campo por campo en vez de descartando los que
/// sobran: así, agregar una columna al modelo nunca la filtra a la respuesta
/// por olvidarse de excluirla. Descifra antes de devolver: lo que sale de
/// Prisma es el texto cifrado (o, en una fila sin migrar, texto plano —
/// `decryptOptional` reconoce cuál es cuál).
function publicProfile(
  participant: ParticipantWithOnboarding,
  piiKey: string,
): Profile {
  return {
    id: participant.id,
    nombre: decryptOptional(participant.nombre, piiKey),
    apellido: decryptOptional(participant.apellido, piiKey),
    email: decryptOptional(participant.email, piiKey),
    role: participant.role,
    onboardingVisto: participant.onboardingVistoAt !== null,
  };
}

/// P2002 es el código de Prisma para violación de índice único.
function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'P2002'
  );
}

@Injectable()
export class AuthService {
  private readonly ecuadorianIdPepper: string;
  private readonly emailPepper: string;
  private readonly piiKey: string;
  private readonly refreshExpiresIn: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    // getOrThrow y no get: sin estos secretos, las huellas serían reversibles
    // por fuerza bruta o los datos cifrados no se podrían leer nunca más.
    // Mejor que el servicio no arranque a que arranque roto.
    this.ecuadorianIdPepper = config.getOrThrow<string>('CEDULA_PEPPER');
    this.emailPepper = config.getOrThrow<string>('EMAIL_PEPPER');
    this.piiKey = config.getOrThrow<string>('PII_ENCRYPTION_KEY');
    this.refreshExpiresIn = config.get('REFRESH_TOKEN_EXPIRES_IN', '12h');
  }

  async register(dto: RegisterDto) {
    const ecuadorianIdHash = hashEcuadorianId(
      dto.cedula,
      this.ecuadorianIdPepper,
    );
    const emailHash = hashEmail(dto.email, this.emailPepper);

    // El `OR` con `email` cubre las cuentas que ya existían antes del
    // cifrado y que `backfill-pii.mts` todavía no alcanzó: esas todavía
    // guardan el correo en claro, sin huella con la que compararlas por
    // `emailHash`.
    const alreadyExists = await this.prisma.participant.findFirst({
      where: {
        OR: [
          { emailHash },
          { email: dto.email },
          { cedulaHash: ecuadorianIdHash },
        ],
      },
      select: { id: true },
    });

    if (alreadyExists) {
      throw new ConflictException(ALREADY_REGISTERED);
    }

    let participant: ParticipantWithOnboarding & { seq: number };
    try {
      participant = await this.prisma.participant.create({
        data: {
          nombre: encrypt(dto.nombre, this.piiKey),
          apellido: encrypt(dto.apellido, this.piiKey),
          email: encrypt(dto.email, this.piiKey),
          emailHash,
          cedulaHash: ecuadorianIdHash,
          passwordHash: await hash(dto.password, BCRYPT_ROUNDS),
        },
        select: SESSION_FIELDS,
      });
    } catch (error) {
      // Dos registros simultáneos pasan los dos la comprobación de arriba y
      // solo uno gana el índice único. Sin esto, el segundo recibe un 500 y
      // el participante se queda fuera del estudio sin saber por qué.
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException(ALREADY_REGISTERED);
      }
      throw error;
    }

    return this.session(participant);
  }

  async login(dto: LoginDto) {
    // `findFirst` con `OR` y no `findUnique` por `emailHash`: una cuenta
    // creada antes del cifrado, que `backfill-pii.mts` todavía no alcanzó,
    // no tiene huella todavía y solo se encuentra por el `email` en claro
    // que aún conserva. Una vez migrada, esa segunda rama nunca vuelve a
    // igualar nada —"email" pasa a guardar texto cifrado, no el correo—, así
    // que dejarla no tiene costo ni riesgo.
    const participant = await this.prisma.participant.findFirst({
      where: {
        OR: [
          { emailHash: hashEmail(dto.email, this.emailPepper) },
          { email: dto.email },
        ],
      },
      // `select` explícito, no el registro entero: sin esto el passwordHash
      // viaja hasta `sesion()` y termina en la respuesta al cliente.
      select: { ...SESSION_FIELDS, passwordHash: true, disabledAt: true },
    });

    const ok = await compare(
      dto.password,
      participant?.passwordHash ?? DECOY_HASH,
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

    return this.session(participant);
  }

  async me(participantId: string) {
    const participant = await this.prisma.participant.findUnique({
      where: { id: participantId },
      select: { ...PROFILE_FIELDS, disabledAt: true },
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

    return publicProfile(participant, this.piiKey);
  }

  /// `onboardingVisto: true` marca la fecha (no vuelve a aparecer sola);
  /// `false` la borra (vuelve a aparecer en el siguiente inicio de sesión, y
  /// es lo que permite reactivarla desde el ícono ⓘ).
  async updateMe(participantId: string, dto: PatchMeDto) {
    const participant = await this.prisma.participant.update({
      where: { id: participantId },
      data: { onboardingVistoAt: dto.onboardingVisto ? new Date() : null },
      select: PROFILE_FIELDS,
    });

    return publicProfile(participant, this.piiKey);
  }

  /// Cambia el access token (vida corta) por uno nuevo, junto con un refresh
  /// token nuevo. Relee el participante de la base en vez de confiar en lo que
  /// traía el refresh token: así una cuenta desactivada, o un cambio de rol,
  /// se refleja de inmediato en vez de esperar a que expire el refresh.
  ///
  /// `refreshToken` puede venir vacío: es lo que llega cuando la cookie
  /// httpOnly nunca se puso (primera visita) o ya la borró el navegador.
  async refreshSession(refreshToken: string | undefined) {
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
      select: { ...SESSION_FIELDS, disabledAt: true },
    });

    if (!participant || participant.disabledAt) {
      throw new UnauthorizedException('Refresh token inválido o expirado.');
    }

    return this.session(participant);
  }

  private async session(
    participant: ParticipantWithOnboarding & { seq: number },
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
      participant: publicProfile(participant, this.piiKey),
    };
  }
}
