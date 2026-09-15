import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { JwtPayload } from './jwt-payload';

export interface AuthedRequest extends Request {
  participant?: JwtPayload;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const header = request.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Falta el token de acceso.');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);

      // Firmados con el mismo secreto: sin esto, un refresh token (vida
      // larga) serviría como token de acceso en cualquier ruta protegida.
      if (payload.typ !== 'access') {
        throw new UnauthorizedException('Token inválido o expirado.');
      }

      request.participant = payload;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado.');
    }

    return true;
  }
}

/// Solo un administrador gestiona cuentas y ve los resultados del estudio.
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthedRequest>();

    if (request.participant?.role !== 'ADMIN') {
      throw new ForbiddenException('Requiere rol ADMIN.');
    }

    return true;
  }
}

/// Las corridas, el progreso y certificados representan solo el recorrido de
/// una persona participante. La práctica de TRAINER nunca llega a esas rutas.
@Injectable()
export class ParticipantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthedRequest>();

    if (request.participant?.role !== 'PARTICIPANT') {
      throw new ForbiddenException('Requiere rol PARTICIPANT.');
    }

    return true;
  }
}
