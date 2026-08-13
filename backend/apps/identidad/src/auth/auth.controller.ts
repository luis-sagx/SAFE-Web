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
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import { CurrentParticipant, JwtAuthGuard, type JwtPayload } from '@comun';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { PatchMeDto } from './dto/patch-me.dto';
import { RegisterDto } from './dto/register.dto';

/// Nombre de la cookie del refresh token.
const REFRESH_COOKIE = 'mic-refresh-token';

/// `path` la restringe a esta única ruta: el navegador no la manda en ninguna
/// otra petición (ni siquiera a /auth/login), así que un XSS en cualquier
/// otra pantalla no puede leerla vía red — y al ser httpOnly, tampoco vía
/// `document.cookie`. `sameSite: 'strict'` es lo que reemplaza a un token
/// CSRF: el navegador nunca la adjunta en una petición que no haya salido de
/// este mismo sitio, ni siquiera con `<img src>` o una navegación cross-site.
const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/auth/refresh',
};

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private ponerCookieRefresh(
    res: Response,
    refreshToken: string,
    expiresAt: Date,
  ): void {
    res.cookie(REFRESH_COOKIE, refreshToken, {
      ...COOKIE_OPTIONS,
      expires: expiresAt,
    });
  }

  /// Límite contra registro automatizado: 5 cuentas por minuto y por IP.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sesion = await this.auth.register(dto);
    this.ponerCookieRefresh(
      res,
      sesion.refreshToken,
      sesion.refreshTokenExpiresAt,
    );
    return { accessToken: sesion.accessToken, participant: sesion.participant };
  }

  /// Límite estricto contra fuerza bruta (OWASP Authentication):
  /// 5 intentos por minuto y por IP.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sesion = await this.auth.login(dto);
    this.ponerCookieRefresh(
      res,
      sesion.refreshToken,
      sesion.refreshTokenExpiresAt,
    );
    return { accessToken: sesion.accessToken, participant: sesion.participant };
  }

  /// No lleva JwtAuthGuard: es la ruta que se usa precisamente cuando el
  /// access token ya venció. El refresh token nunca viaja en el body ni lo
  /// toca JavaScript: llega solo — httpOnly— en la cookie que puso login o
  /// register. Límite más alto que login: el frontend lo llama solo
  /// automáticamente cuando un access token expira, no a golpe de teclado de
  /// un usuario, pero varias pestañas abiertas pueden refrescar a la vez.
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
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
      const sesion = await this.auth.refrescar(cookie?.[REFRESH_COOKIE]);
      this.ponerCookieRefresh(
        res,
        sesion.refreshToken,
        sesion.refreshTokenExpiresAt,
      );
      return {
        accessToken: sesion.accessToken,
        participant: sesion.participant,
      };
    } catch (error) {
      // Cookie inválida, vencida, o de una cuenta ya desactivada: se borra
      // para no dejar un rastro inútil que solo va a volver a fallar.
      res.clearCookie(REFRESH_COOKIE, COOKIE_OPTIONS);
      throw error;
    }
  }

  /// El access token lo descarta el propio frontend (vive en memoria/
  /// localStorage). Esta ruta existe para lo que el frontend no puede hacer
  /// solo: borrar la cookie httpOnly del refresh token. Sin ella, "cerrar
  /// sesión" en un equipo compartido no bastaría — la cookie seguiría viva y
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
  actualizarMe(
    @CurrentParticipant() participant: JwtPayload,
    @Body() dto: PatchMeDto,
  ) {
    return this.auth.actualizarMe(participant.sub, dto);
  }
}
