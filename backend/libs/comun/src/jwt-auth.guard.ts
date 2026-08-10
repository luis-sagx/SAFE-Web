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
      request.participant = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Token inválido o expirado.');
    }

    return true;
  }
}

/// Solo un supervisor gestiona cuentas y ve los resultados del estudio. Un
/// participante nunca alcanza estas rutas.
@Injectable()
export class SupervisorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthedRequest>();

    if (request.participant?.role !== 'SUPERVISOR') {
      throw new ForbiddenException('Requiere rol de supervisor.');
    }

    return true;
  }
}
