import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentParticipant, JwtAuthGuard, type JwtPayload } from '@comun';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { PatchMeDto } from './dto/patch-me.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /// Límite contra registro automatizado: 5 cuentas por minuto y por IP.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  /// Límite estricto contra fuerza bruta (OWASP Authentication):
  /// 5 intentos por minuto y por IP.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  /// No lleva JwtAuthGuard: es la ruta que se usa precisamente cuando el
  /// access token ya venció. Límite más alto que login: el frontend lo llama
  /// solo automáticamente cuando un access token expira, no a golpe de teclado
  /// de un usuario, pero varias pestañas abiertas pueden refrescar a la vez.
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(200)
  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refrescar(dto.refreshToken);
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
