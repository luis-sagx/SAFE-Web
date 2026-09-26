import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import {
  CurrentParticipant,
  emailTracker,
  JwtAuthGuard,
  type JwtPayload,
} from '@comun';
import { AuthService } from './auth.service';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { PatchMeDto } from './dto/patch-me.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendConfirmationDto } from './dto/resend-confirmation.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

/// Nombre de la cookie del refresh token.
const REFRESH_COOKIE = 'mic-refresh-token';

/// `path` la restringe a esta única ruta: el navegador no la manda en ninguna
/// otra petición (ni siquiera a /auth/login), así que un XSS en cualquier
/// otra pantalla no puede leerla vía red, y al ser httpOnly, tampoco vía
/// `document.cookie`. `sameSite: 'strict'` es lo que reemplaza a un token
/// CSRF: el navegador nunca la adjunta en una petición que no haya salido de
/// este mismo sitio, ni siquiera con `<img src>` o una navegación cross-site.
const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/auth/refresh',
};

/// Por correo y no por IP: un aula entera sale por la misma IP pública
/// (ver emailTracker). El techo por IP lo pone nginx.
const PER_EMAIL = { limit: 5, ttl: 60_000, getTracker: emailTracker };

/// Para rutas con un token de un solo uso: adivinarlo es inviable, así que
/// el límite por IP puede ser holgado y no bloquea a un aula que confirma su
/// correo a la vez.
const PER_IP_TOKEN = { limit: 30, ttl: 60_000 };

/// Por sesión y no por IP: los access tokens de un aula que entró a la vez
/// vencen a la vez, y 30 refrescos en el mismo minuto desde una sola IP
/// cerrarían la sesión de la mitad. Se usa el hash de la cookie (no el token
/// en sí) para no guardarlo en el almacén del límite.
function refreshCookieTracker(req: {
  cookies?: Record<string, string | undefined>;
  ip?: string;
}): string {
  const cookie = req.cookies?.[REFRESH_COOKIE];
  return cookie
    ? `refresh:${createHash('sha256').update(cookie).digest('hex')}`
    : `ip:${req.ip}`;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private setRefreshCookie(
    res: Response,
    refreshToken: string,
    expiresAt: Date,
  ): void {
    res.cookie(REFRESH_COOKIE, refreshToken, {
      ...COOKIE_OPTIONS,
      expires: expiresAt,
    });
  }

  /// Límite contra registro automatizado: 5 intentos por minuto y por correo.
  @Throttle({ default: PER_EMAIL })
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<{ email: string }> {
    return this.auth.register(dto);
  }

  /// Límite estricto contra fuerza bruta (OWASP Authentication):
  /// 5 intentos por minuto y por cuenta.
  @Throttle({ default: PER_EMAIL })
  @HttpCode(200)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.auth.login(dto);
    this.setRefreshCookie(
      res,
      session.refreshToken,
      session.refreshTokenExpiresAt,
    );
    return {
      accessToken: session.accessToken,
      participant: session.participant,
    };
  }

  /// No lleva JwtAuthGuard: es la ruta que se usa precisamente cuando el
  /// access token ya venció. El refresh token nunca viaja en el body ni lo
  /// toca JavaScript: llega solo (httpOnly) en la cookie que puso login o
  /// register. Límite más alto que login: el frontend lo llama solo
  /// automáticamente cuando un access token expira, no a golpe de teclado de
  /// un usuario, pero varias pestañas abiertas pueden refrescar a la vez.
  @Throttle({
    default: { limit: 20, ttl: 60_000, getTracker: refreshCookieTracker },
  })
  @HttpCode(200)
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      // `req.cookies` lo tipa `any` cookie-parser: se castea explícito para
      // no perder el chequeo del compilador en el resto del método.
      const cookie = req.cookies as
        Record<string, string | undefined> | undefined;
      const session = await this.auth.refreshSession(cookie?.[REFRESH_COOKIE]);
      this.setRefreshCookie(
        res,
        session.refreshToken,
        session.refreshTokenExpiresAt,
      );
      return {
        accessToken: session.accessToken,
        participant: session.participant,
      };
    } catch (error) {
      // Cookie inválida, vencida, o de una cuenta ya desactivada: se borra
      // para no dejar un rastro inútil que solo va a volver a fallar.
      res.clearCookie(REFRESH_COOKIE, COOKIE_OPTIONS);
      throw error;
    }
  }

  /// Mismo límite que login: 5 por minuto y por correo. La respuesta es
  /// idéntica exista o no la cuenta (ver AuthService.forgotPassword), así que
  /// 204 no filtra nada por sí solo.
  @Throttle({ default: PER_EMAIL })
  @HttpCode(204)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.auth.forgotPassword(dto.email);
  }

  @Throttle({ default: PER_IP_TOKEN })
  @HttpCode(204)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.auth.resetPassword(dto.token, dto.password);
  }

  @Throttle({ default: PER_IP_TOKEN })
  @HttpCode(204)
  @Post('confirm-email')
  async confirmEmail(@Body() dto: ConfirmEmailDto): Promise<void> {
    await this.auth.confirmEmail(dto.token);
  }

  /// Mismo límite que forgot-password: 5 por minuto y por correo, y misma
  /// respuesta genérica exista o no la cuenta (ver
  /// AuthService.resendConfirmation).
  @Throttle({ default: PER_EMAIL })
  @HttpCode(204)
  @Post('resend-confirmation')
  async resendConfirmation(@Body() dto: ResendConfirmationDto): Promise<void> {
    await this.auth.resendConfirmation(dto.email);
  }

  /// El access token lo descarta el propio frontend (vive en memoria/
  /// localStorage). Esta ruta existe para lo que el frontend no puede hacer
  /// solo: borrar la cookie httpOnly del refresh token. Sin ella, "cerrar
  /// sesión" en un equipo compartido no bastaría, la cookie seguiría viva y
  /// serviría para renovar la sesión de la persona anterior.
  @HttpCode(204)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(REFRESH_COOKIE, COOKIE_OPTIONS);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentParticipant() participant: JwtPayload) {
    return this.auth.me(participant.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(
    @CurrentParticipant() participant: JwtPayload,
    @Body() dto: PatchMeDto,
  ) {
    return this.auth.updateMe(participant.sub, dto);
  }
}
