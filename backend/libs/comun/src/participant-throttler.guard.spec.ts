import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import {
  emailTracker,
  ParticipantThrottlerGuard,
} from './participant-throttler.guard';

const jwt = new JwtService({ secret: 'secreto-de-prueba' });

/// Expone getTracker (protegido) sin montar el módulo de Nest: lo único que
/// se prueba aquí es a qué cubo va cada petición.
class TestableGuard extends ParticipantThrottlerGuard {
  tracker(req: Request): Promise<string> {
    return this.getTracker(req);
  }
}

const guard = new TestableGuard(
  { throttlers: [] },
  { increment: jest.fn() },
  { get: jest.fn() } as never,
  jwt,
);

function request(authorization?: string): Request {
  return { headers: { authorization }, ip: '203.0.113.10' } as Request;
}

describe('ParticipantThrottlerGuard', () => {
  it('cuenta por participante cuando el access token es válido', async () => {
    const token = await jwt.signAsync({ sub: 'u1', typ: 'access' });

    expect(await guard.tracker(request(`Bearer ${token}`))).toBe(
      'participant:u1',
    );
  });

  it('cuenta por IP sin token, con token falso o con uno que no es de acceso', async () => {
    const forged = await new JwtService({ secret: 'otro' }).signAsync({
      sub: 'u1',
      typ: 'access',
    });
    const refresh = await jwt.signAsync({ sub: 'u1', typ: 'refresh' });

    for (const header of [undefined, `Bearer ${forged}`, `Bearer ${refresh}`]) {
      expect(await guard.tracker(request(header))).toBe('ip:203.0.113.10');
    }
  });
});

describe('emailTracker', () => {
  it('normaliza el correo para que mayúsculas o espacios no abran otro cubo', () => {
    expect(
      emailTracker({ body: { email: ' Ana@Ejemplo.EC ' }, ip: '1.2.3.4' }),
    ).toBe('email:ana@ejemplo.ec');
  });

  it('vuelve a la IP si el cuerpo no trae un correo', () => {
    expect(emailTracker({ body: { email: 5 }, ip: '1.2.3.4' })).toBe(
      'ip:1.2.3.4',
    );
    expect(emailTracker({ ip: '1.2.3.4' })).toBe('ip:1.2.3.4');
  });
});
