import type { Request, Response } from 'express';
import type { JwtPayload } from '@comun';
import { AuthController } from './auth.controller';
import type { AuthService } from './auth.service';

const PARTICIPANT: JwtPayload = {
  sub: 'uuid-participante',
  seq: 7,
  role: 'PARTICIPANT',
  typ: 'access',
};

const SESSION = {
  accessToken: 'un.access.token',
  refreshToken: 'un.refresh.token',
  refreshTokenExpiresAt: new Date('2026-01-01T00:00:00.000Z'),
  participant: { id: PARTICIPANT.sub, nombre: 'Ana' },
};

/// Respuesta de Express falsa: solo lo que el controlador toca
/// (`cookie`/`clearCookie`), sin levantar Nest ni un servidor HTTP real,
/// igual que CertificadosController.spec.ts.
function fakeResponse() {
  const calls: {
    cookieName?: string;
    cookieValue?: string;
    cookieOptions?: Record<string, unknown>;
    cleared?: string;
  } = {};
  const res = {
    cookie: (name: string, value: string, options: Record<string, unknown>) => {
      calls.cookieName = name;
      calls.cookieValue = value;
      calls.cookieOptions = options;
      return res;
    },
    clearCookie: (name: string) => {
      calls.cleared = name;
      return res;
    },
  } as unknown as Response;
  return { res, calls };
}

function fakeRequest(
  cookies: Record<string, string | undefined> = {},
): Request {
  return { cookies } as unknown as Request;
}

describe('AuthController.register', () => {
  it('delega en el servicio y devuelve solo el correo, sin poner cookie', async () => {
    const service = {
      register: () => Promise.resolve({ email: 'ana@correo.com' }),
    } as unknown as AuthService;

    const controller = new AuthController(service);
    const result = await controller.register({
      nombre: 'Ana',
      apellido: 'Pérez',
      email: 'ana@correo.com',
      cedula: '1710034065',
      password: 'ClaveSegura123!',
    });

    expect(result).toEqual({ email: 'ana@correo.com' });
  });
});

describe('AuthController.login', () => {
  it('pone la cookie del refresh token y devuelve solo el access token y el participante', async () => {
    const service = {
      login: () => Promise.resolve(SESSION),
    } as unknown as AuthService;
    const { res, calls } = fakeResponse();

    const controller = new AuthController(service);
    const result = await controller.login(
      { email: 'ana@correo.com', password: 'Clave-Segura-123!' },
      res,
    );

    expect(calls.cookieValue).toBe(SESSION.refreshToken);
    expect(result).toEqual({
      accessToken: SESSION.accessToken,
      participant: SESSION.participant,
    });
  });
});

describe('AuthController.refresh', () => {
  it('con una cookie válida, la rota y devuelve la sesión nueva', async () => {
    const service = {
      refreshSession: (token: string | undefined) => {
        expect(token).toBe('el-refresh-token-viejo');
        return Promise.resolve(SESSION);
      },
    } as unknown as AuthService;
    const { res, calls } = fakeResponse();

    const controller = new AuthController(service);
    const result = await controller.refresh(
      fakeRequest({ 'mic-refresh-token': 'el-refresh-token-viejo' }),
      res,
    );

    expect(calls.cookieValue).toBe(SESSION.refreshToken);
    expect(result.accessToken).toBe(SESSION.accessToken);
  });

  // Sin cookie: `refreshSession` la rechaza como inválida; el controlador
  // debe borrar la cookie (aunque no exista) y no tragarse el error.
  it('cuando el servicio rechaza el token, borra la cookie y propaga el error', async () => {
    const failure = new Error('Refresh token inválido o expirado.');
    const service = {
      refreshSession: () => Promise.reject(failure),
    } as unknown as AuthService;
    const { res, calls } = fakeResponse();

    const controller = new AuthController(service);

    await expect(controller.refresh(fakeRequest({}), res)).rejects.toBe(
      failure,
    );
    expect(calls.cleared).toBe('mic-refresh-token');
  });
});

describe('AuthController.logout', () => {
  it('borra la cookie del refresh token', () => {
    const service = {} as unknown as AuthService;
    const { res, calls } = fakeResponse();

    const controller = new AuthController(service);
    controller.logout(res);

    expect(calls.cleared).toBe('mic-refresh-token');
  });
});

describe('AuthController.me', () => {
  it('delega en el servicio con el id del participante del token', () => {
    let receivedId: string | undefined;
    const service = {
      me: (id: string) => {
        receivedId = id;
        return Promise.resolve({ id });
      },
    } as unknown as AuthService;

    const controller = new AuthController(service);
    void controller.me(PARTICIPANT);

    expect(receivedId).toBe(PARTICIPANT.sub);
  });
});

describe('AuthController.updateMe', () => {
  it('delega en el servicio con el id del participante y el dto', () => {
    let received: { id: string; dto: unknown } | undefined;
    const service = {
      updateMe: (id: string, dto: unknown) => {
        received = { id, dto };
        return Promise.resolve({ id });
      },
    } as unknown as AuthService;

    const controller = new AuthController(service);
    void controller.updateMe(PARTICIPANT, { onboardingVisto: true });

    expect(received).toEqual({
      id: PARTICIPANT.sub,
      dto: { onboardingVisto: true },
    });
  });
});

describe('AuthController.forgotPassword', () => {
  it('delega en el servicio con el correo del dto', async () => {
    let receivedEmail: string | undefined;
    const service = {
      forgotPassword: (email: string) => {
        receivedEmail = email;
        return Promise.resolve(undefined);
      },
    } as unknown as AuthService;

    const controller = new AuthController(service);
    const result = await controller.forgotPassword({
      email: 'ana@correo.com',
    });

    expect(receivedEmail).toBe('ana@correo.com');
    expect(result).toBeUndefined();
  });
});

describe('AuthController.resetPassword', () => {
  it('delega en el servicio con el token y la contraseña del dto', async () => {
    let received: { token: string; password: string } | undefined;
    const service = {
      resetPassword: (token: string, password: string) => {
        received = { token, password };
        return Promise.resolve(undefined);
      },
    } as unknown as AuthService;

    const controller = new AuthController(service);
    await controller.resetPassword({
      token: 'un-token',
      password: 'Otra-Clave-123!',
    });

    expect(received).toEqual({
      token: 'un-token',
      password: 'Otra-Clave-123!',
    });
  });
});

describe('AuthController.confirmEmail', () => {
  it('delega en el servicio con el token del dto', async () => {
    let receivedToken: string | undefined;
    const service = {
      confirmEmail: (token: string) => {
        receivedToken = token;
        return Promise.resolve(undefined);
      },
    } as unknown as AuthService;

    const controller = new AuthController(service);
    const result = await controller.confirmEmail({ token: 'un-token' });

    expect(receivedToken).toBe('un-token');
    expect(result).toBeUndefined();
  });
});

describe('AuthController.resendConfirmation', () => {
  it('delega en el servicio con el correo del dto', async () => {
    let receivedEmail: string | undefined;
    const service = {
      resendConfirmation: (email: string) => {
        receivedEmail = email;
        return Promise.resolve(undefined);
      },
    } as unknown as AuthService;

    const controller = new AuthController(service);
    const result = await controller.resendConfirmation({
      email: 'ana@correo.com',
    });

    expect(receivedEmail).toBe('ana@correo.com');
    expect(result).toBeUndefined();
  });
});
