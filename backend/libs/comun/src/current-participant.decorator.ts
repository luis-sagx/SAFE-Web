import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from './jwt-payload';
import type { AuthedRequest } from './jwt-auth.guard';

/// Inyecta el payload del JWT ya verificado por JwtAuthGuard.
export const CurrentParticipant = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtPayload => {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    return request.participant as JwtPayload;
  },
);
