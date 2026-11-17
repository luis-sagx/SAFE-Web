import { createHash, randomBytes } from 'node:crypto';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import type { JwtPayload, RefreshTokenPayload } from '@comun';
import { hashEcuadorianId } from '../cedula/cedula';
import { MailService } from '../mail/mail.service';
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

/// Un solo mensaje para token inexistente, ya usado, vencido o de una cuenta
/// desactivada: distinguirlos le diría a quien lo intenta cuál de esas cosas
/// pasó, información que no necesita para nada legítimo (issue #256).
const RESET_LINK_INVALID = 'El enlace no es válido o ya venció.';

/// Mismo mensaje genérico que RESET_LINK_INVALID, mismo motivo: no hace
/// falta que quien lo intenta sepa si el token no existe, ya se usó, o venció.
const CONFIRMATION_LINK_INVALID = 'El enlace no es válido o ya venció.';

/// 32 bytes al azar, en base64url (sin +/ que compliquen la URL del correo).
const RESET_TOKEN_BYTES = 32;

/// 30 minutos: bastante para llegar al correo y volver, poco para que un
/// enlace olvidado en la bandeja siga sirviendo semanas después.
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

/// 24 horas: confirmar cuenta es menos urgente que resetear una clave
/// comprometida (30 minutos), pero no debe quedar vigente indefinidamente.
const EMAIL_CONFIRMATION_TTL_MS = 24 * 60 * 60 * 1000;

/// Un solo mensaje: no hace falta distinguir "nunca confirmaste" de
/// cualquier otra causa de rechazo del lado del participante.
const EMAIL_NOT_CONFIRMED =
  'Confirma tu correo antes de iniciar sesión. Revisa tu bandeja o pide que te lo reenviemos.';

/// El token viaja en claro solo por correo; en la base se guarda este hash
/// (SHA-256 alcanza: a diferencia de una contraseña, son 32 bytes al azar,
/// no algo que un diccionario pueda adivinar, así que no hace falta bcrypt).
/// Genérico a propósito: lo usan tanto el token de recuperación de clave
/// como el de confirmación de correo.
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export interface Profile {
  id: string;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
  role: string;
  onboardingVisto: boolean;
}

interface AccountWithOnboarding {
  id: string;
  profile: {
    nombre: string | null;
    apellido: string | null;
    email: string | null;
  } | null;
  role: { code: string };
  onboardingVistoAt: Date | null;
}

/// `seq` y `tokenVersion` solo hacen falta para firmar los tokens de sesión,
/// nunca salen en la respuesta (ver `session()` más abajo).
type AccountWithSession = AccountWithOnboarding & {
  studyParticipant: { seq: number } | null;
  tokenVersion: number;
};

/// Lo que la interfaz sabe del participante. No incluye el seudónimo (este
/// pertenece al análisis y el participante nunca debe verlo) ni `cedulaHash`,
/// que no tiene por qué salir del servidor.
const PROFILE_FIELDS = {
  id: true,
  profile: { select: { nombre: true, apellido: true, email: true } },
  role: { select: { code: true } },
  onboardingVistoAt: true,
} as const;

/// `seq` se necesita para firmar el token pero no se devuelve al cliente.
const SESSION_FIELDS = {
  ...PROFILE_FIELDS,
  studyParticipant: { select: { seq: true } },
  tokenVersion: true,
} as const;

/// El perfil se construye campo por campo en vez de descartando los que
/// sobran: así, agregar una columna al modelo nunca la filtra a la respuesta
/// por olvidarse de excluirla. Descifra antes de devolver: lo que sale de
/// Prisma es el texto cifrado (o, en una fila sin migrar, texto plano,
/// `decryptOptional` reconoce cuál es cuál).
function publicProfile(
  participant: AccountWithOnboarding,
  piiKey: string,
): Profile {
  return {
    id: participant.id,
    nombre: decryptOptional(participant.profile?.nombre ?? null, piiKey),
    apellido: decryptOptional(participant.profile?.apellido ?? null, piiKey),
    email: decryptOptional(participant.profile?.email ?? null, piiKey),
    role: participant.role.code,
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
  // Mismo origen que usa el certificado para su enlace de verificación
  // (issue #214): un solo lugar donde apuntar cuando cambie el dominio.
  private readonly frontendOrigin: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    config: ConfigService,
    private readonly mail: MailService,
  ) {
    // getOrThrow y no get: sin estos secretos, las huellas serían reversibles
    // por fuerza bruta o los datos cifrados no se podrían leer nunca más.
    // Mejor que el servicio no arranque a que arranque roto.
    this.ecuadorianIdPepper = config.getOrThrow<string>('CEDULA_PEPPER');
    this.emailPepper = config.getOrThrow<string>('EMAIL_PEPPER');
    this.piiKey = config.getOrThrow<string>('PII_ENCRYPTION_KEY');
    this.refreshExpiresIn = config.get('REFRESH_TOKEN_EXPIRES_IN', '12h');
    this.frontendOrigin = config.get(
      'CERTIFICADO_ORIGEN',
      'https://safeweb.espe.edu.ec',
    );
  }

  async register(dto: RegisterDto): Promise<{ email: string }> {
    const ecuadorianIdHash = hashEcuadorianId(
      dto.cedula,
      this.ecuadorianIdPepper,
    );
    const emailHash = hashEmail(dto.email, this.emailPepper);

    // El `OR` con `email` cubre las cuentas que ya existían antes del
    // cifrado y que `backfill-pii.mts` todavía no alcanzó: esas todavía
    // guardan el correo en claro, sin huella con la que compararlas por
    // `emailHash`.
    const registrationLookup = {
      OR: [
        { profile: { is: { emailHash } } },
        { profile: { is: { email: dto.email } } },
        { profile: { is: { cedulaHash: ecuadorianIdHash } } },
      ],
    };
    const matches = await this.prisma.account.findMany({
      where: registrationLookup,
      select: { id: true },
    });

    // No se reemplaza ni borra una cuenta pendiente: puede ser una cuenta
    // legacy que debemos conservar aunque todavía no haya confirmado correo.
    if (matches.length > 0) {
      throw new ConflictException(ALREADY_REGISTERED);
    }

    // El token viaja en claro solo por correo; en la base se guarda su hash
    // (mismo criterio que el de recuperación de clave, ver hashToken más
    // abajo).
    const confirmationToken =
      randomBytes(RESET_TOKEN_BYTES).toString('base64url');

    // bcrypt fuera de la transacción: tarda lo suyo a propósito y no debe
    // mantenerla abierta.
    const passwordHash = await hash(dto.password, BCRYPT_ROUNDS);

    try {
      await this.prisma.$transaction(async (tx) => {
        // El índice ya no es único para conservar correos legacy repetidos;
        // este bloqueo serializa las altas nuevas con la misma huella.
        await tx.$queryRaw`
          SELECT pg_advisory_xact_lock(hashtextextended(${emailHash}, 0))::text
        `;
        const currentMatches = await tx.account.findMany({
          where: registrationLookup,
          select: { id: true },
        });
        if (currentMatches.length > 0) {
          throw new ConflictException(ALREADY_REGISTERED);
        }
        await tx.account.create({
          data: {
            role: { connect: { code: 'PARTICIPANT' } },
            passwordHash,
            emailConfirmationTokenHash: hashToken(confirmationToken),
            emailConfirmationExpiresAt: new Date(
              Date.now() + EMAIL_CONFIRMATION_TTL_MS,
            ),
            profile: {
              create: {
                nombre: encrypt(dto.nombre, this.piiKey),
                apellido: encrypt(dto.apellido, this.piiKey),
                email: encrypt(dto.email, this.piiKey),
                emailHash,
                cedulaHash: ecuadorianIdHash,
              },
            },
            studyParticipant: { create: {} },
          },
          select: { id: true },
        });
      });
    } catch (error) {
      // `cedulaHash` sigue siendo único; si dos registros simultáneos usan la
      // misma cédula, el segundo recibe un 409 en vez de un error interno.
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException(ALREADY_REGISTERED);
      }
      throw error;
    }

    const link = `${this.frontendOrigin}/confirmar-correo?token=${confirmationToken}`;
    await this.mail.sendEmailConfirmation(dto.email, dto.nombre, link);

    return { email: dto.email };
  }

  async login(dto: LoginDto) {
    // La huella puede repetirse en datos legacy. Se comprueban todas las
    // candidatas para que el correo junto con la contraseña identifique una.
    const candidates = await this.prisma.account.findMany({
      where: {
        OR: [
          {
            profile: {
              is: { emailHash: hashEmail(dto.email, this.emailPepper) },
            },
          },
          { profile: { is: { email: dto.email } } },
        ],
      },
      // `select` explícito, no el registro entero: sin esto el passwordHash
      // viaja hasta `sesion()` y termina en la respuesta al cliente.
      select: {
        ...SESSION_FIELDS,
        passwordHash: true,
        disabledAt: true,
        emailConfirmedAt: true,
      },
    });

    const matches = await Promise.all(
      candidates.map(async (candidate) =>
        (await compare(dto.password, candidate.passwordHash))
          ? candidate
          : null,
      ),
    );
    const authenticated = matches.filter(
      (candidate): candidate is NonNullable<typeof candidate> =>
        candidate !== null,
    );
    if (candidates.length === 0) {
      await compare(dto.password, DECOY_HASH);
    }

    // Un solo mensaje para correo inexistente y para contraseña incorrecta:
    // distinguirlos permitiría averiguar quién está registrado.
    if (authenticated.length !== 1) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }
    const participant = authenticated[0];

    // La cuenta desactivada por un supervisor no entra. Se comprueba solo tras
    // validar la contraseña: sin credenciales correctas no se puede averiguar
    // si una cuenta existe y está desactivada.
    if (participant.disabledAt) {
      throw new ForbiddenException(
        'Tu cuenta está desactivada. Contacta al supervisor del estudio.',
      );
    }

    if (
      participant.role.code === 'PARTICIPANT' &&
      !participant.emailConfirmedAt
    ) {
      throw new UnauthorizedException(EMAIL_NOT_CONFIRMED);
    }

    return this.session(participant);
  }

  async me(participantId: string) {
    const participant = await this.prisma.account.findUnique({
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
    const participant = await this.prisma.account.update({
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

    const participant = await this.prisma.account.findUnique({
      where: { id: payload.sub },
      select: { ...SESSION_FIELDS, disabledAt: true },
    });

    if (!participant || participant.disabledAt) {
      throw new UnauthorizedException('Refresh token inválido o expirado.');
    }

    // Un restablecimiento de contraseña incrementó tokenVersion después de
    // que se emitió este refresh token: se trata igual que uno robado o
    // vencido, en vez de dejarlo seguir sirviendo hasta su propio `exp`.
    if (payload.tokenVersion !== participant.tokenVersion) {
      throw new UnauthorizedException('Refresh token inválido o expirado.');
    }

    return this.session(participant);
  }

  /// Responde siempre lo mismo exista o no la cuenta (ver RESET_LINK_INVALID
  /// más abajo, mismo principio): de lo contrario, este formulario serviría
  /// para averiguar qué correos están registrados en la plataforma.
  async forgotPassword(email: string): Promise<void> {
    const participants = await this.prisma.account.findMany({
      where: {
        OR: [
          {
            profile: { is: { emailHash: hashEmail(email, this.emailPepper) } },
          },
          { profile: { is: { email } } },
        ],
      },
      select: {
        id: true,
        profile: { select: { nombre: true } },
        disabledAt: true,
      },
    });

    await Promise.all(
      participants
        .filter((participant) => !participant.disabledAt)
        .map(async (participant) => {
          const token = randomBytes(RESET_TOKEN_BYTES).toString('base64url');
          await this.prisma.account.update({
            where: { id: participant.id },
            data: {
              passwordResetTokenHash: hashToken(token),
              passwordResetExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
            },
          });

          const name =
            decryptOptional(participant.profile?.nombre ?? null, this.piiKey) ??
            '';
          const link = `${this.frontendOrigin}/restablecer-password?token=${token}`;
          // El mismo correo puede pertenecer a varias cuentas históricas; cada
          // token apunta a una sola cuenta y el endpoint sigue respondiendo igual.
          await this.mail.sendPasswordReset(email, name, link);
        }),
    );
  }

  /// Cambia la contraseña con un token de un solo uso. `RESET_LINK_INVALID`
  /// cubre token inexistente, ya usado (se borra al gastarse), vencido y
  /// cuenta desactivada con el mismo mensaje: distinguirlos no le sirve a
  /// nadie legítimo y sí le sirve a quien está probando tokens al azar.
  async resetPassword(token: string, password: string): Promise<void> {
    const participant = await this.prisma.account.findFirst({
      where: { passwordResetTokenHash: hashToken(token) },
      select: { id: true, disabledAt: true, passwordResetExpiresAt: true },
    });

    if (
      !participant ||
      participant.disabledAt ||
      !participant.passwordResetExpiresAt ||
      participant.passwordResetExpiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException(RESET_LINK_INVALID);
    }

    await this.prisma.account.update({
      where: { id: participant.id },
      data: {
        passwordHash: await hash(password, BCRYPT_ROUNDS),
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        // Invalida cualquier refresh token ya emitido (otros dispositivos
        // con sesión abierta): ver la comprobación en `refreshSession`.
        tokenVersion: { increment: 1 },
      },
    });
  }

  /// Mismo principio que resetPassword: un solo mensaje para token
  /// inexistente, vencido o ya usado.
  ///
  /// Devuelve una sesión: quien acaba de probar que controla el correo no
  /// tiene por qué volver al login a escribir la contraseña. El enlace pasa
  /// así a valer como credencial, igual que el de restablecer contraseña: un
  /// solo uso, con vencimiento, y solo su hash en la base.
  async confirmEmail(token: string) {
    const participant = await this.prisma.account.findFirst({
      where: { emailConfirmationTokenHash: hashToken(token) },
      select: { id: true, emailConfirmationExpiresAt: true, disabledAt: true },
    });

    if (
      !participant ||
      !participant.emailConfirmationExpiresAt ||
      participant.emailConfirmationExpiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException(CONFIRMATION_LINK_INVALID);
    }

    const confirmed = await this.prisma.account.update({
      where: { id: participant.id },
      data: {
        emailConfirmedAt: new Date(),
        emailConfirmationTokenHash: null,
        emailConfirmationExpiresAt: null,
      },
      select: SESSION_FIELDS,
    });

    // Mismo criterio que login: el correo queda confirmado, pero una cuenta
    // desactivada por un supervisor no recibe sesión.
    if (participant.disabledAt) {
      throw new ForbiddenException(
        'Tu cuenta está desactivada. Contacta al supervisor del estudio.',
      );
    }

    return this.session(confirmed);
  }

  /// Responde siempre lo mismo exista o no la cuenta, o ya esté confirmada
  /// (mismo principio que forgotPassword, issue #256): de lo contrario este
  /// formulario serviría para averiguar qué correos están registrados, o
  /// cuáles ya confirmaron.
  ///
  /// `role: 'PARTICIPANT'` a propósito: TRAINER/ADMIN no nacen confirmados
  /// (`createTrainer` nunca pone `emailConfirmedAt`), solo no se les exige
  /// confirmar para iniciar sesión (ver el filtro por rol en `login`). Sin
  /// este `role`, cualquiera que supiera el correo de un TRAINER/ADMIN podría
  /// disparar un envío de "confirma tu cuenta" hacia esa persona desde este
  /// endpoint público.
  async resendConfirmation(email: string): Promise<void> {
    const participants = await this.prisma.account.findMany({
      where: {
        role: { code: 'PARTICIPANT' },
        OR: [
          {
            profile: { is: { emailHash: hashEmail(email, this.emailPepper) } },
          },
          { profile: { is: { email } } },
        ],
      },
      select: {
        id: true,
        profile: { select: { nombre: true } },
        emailConfirmedAt: true,
      },
    });

    await Promise.all(
      participants
        .filter((participant) => !participant.emailConfirmedAt)
        .map(async (participant) => {
          const token = randomBytes(RESET_TOKEN_BYTES).toString('base64url');
          await this.prisma.account.update({
            where: { id: participant.id },
            data: {
              emailConfirmationTokenHash: hashToken(token),
              emailConfirmationExpiresAt: new Date(
                Date.now() + EMAIL_CONFIRMATION_TTL_MS,
              ),
            },
          });

          const name =
            decryptOptional(participant.profile?.nombre ?? null, this.piiKey) ??
            '';
          const link = `${this.frontendOrigin}/confirmar-correo?token=${token}`;
          await this.mail.sendEmailConfirmation(email, name, link);
        }),
    );
  }

  private async session(participant: AccountWithSession) {
    const payload: JwtPayload = {
      sub: participant.id,
      seq: participant.studyParticipant?.seq ?? 0,
      role: participant.role.code,
      typ: 'access',
    };

    const refreshPayload: RefreshTokenPayload = {
      sub: participant.id,
      tokenVersion: participant.tokenVersion,
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
