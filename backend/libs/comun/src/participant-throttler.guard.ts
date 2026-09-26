import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  type ThrottlerModuleOptions,
  type ThrottlerStorage,
} from '@nestjs/throttler';
import type { Request } from 'express';
import type { JwtPayload } from './jwt-payload';

/// Límite por persona, no por IP: en un aula de la universidad 30 personas
/// salen por la misma IP pública (NAT), y un cubo por IP las bloquearía a
/// todas a la vez. Con un access token válido el cubo es el participante;
/// sin token (o con uno inválido) se vuelve a la IP. El token se verifica, no
/// solo se decodifica: si no, un atacante inventaría un `sub` por petición
/// y nunca llenaría un cubo.
@Injectable()
export class ParticipantThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storage: ThrottlerStorage,
    reflector: Reflector,
    private readonly jwt: JwtService,
  ) {
    super(options, storage, reflector);
  }

  protected async getTracker(req: Request): Promise<string> {
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    if (scheme === 'Bearer' && token) {
      try {
        const payload = await this.jwt.verifyAsync<JwtPayload>(token);
        if (payload.typ === 'access') return `participant:${payload.sub}`;
      } catch {
        // Token vencido o falso: cuenta contra la IP, como una petición anónima.
      }
    }
    return `ip:${req.ip}`;
  }
}

/// Para login, registro y correos de recuperación: el cubo es la cuenta que
/// se intenta, no la IP, así el aula entera puede entrar a la vez y la fuerza
/// bruta contra una cuenta sigue cortada a los 5 intentos. El techo por IP lo
/// pone nginx (`limit_req` en /api/auth). Corre antes de validar el DTO, por
/// eso comprueba el tipo del cuerpo.
export function emailTracker(req: { body?: unknown; ip?: string }): string {
  const email = (req.body as { email?: unknown } | undefined)?.email;
  return typeof email === 'string'
    ? `email:${email.trim().toLowerCase()}`
    : `ip:${req.ip}`;
}
