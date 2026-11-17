import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import { hash } from 'bcrypt';
import { AuthService } from './auth.service';
import type { PrismaService } from '../prisma/prisma.service';
import { encrypt } from '../pii/pii';

// Clave de 32 bytes real y pepper cualquiera: los mismos que exige la
// política de `pii.ts`, fijos para que las pruebas sean deterministas, no
// son secretos de ningún entorno real.
const PII_KEY = 'Zm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFyZm8=';
const EMAIL_PEPPER = 'pepper-de-prueba';
const ECUADORIAN_ID_PEPPER = 'otro-pepper-de-prueba';

function fakeConfig() {
  const values: Record<string, string> = {
    CEDULA_PEPPER: ECUADORIAN_ID_PEPPER,
    EMAIL_PEPPER,
    PII_ENCRYPTION_KEY: PII_KEY,
  };
  return {
    getOrThrow: (password: string) => values[password],
    get: (_password: string, fallback: string) => fallback,
  } as unknown as ConfigService;
}

/// Firma y decodifica sin criptografía real: alcanza para probar qué le pasa
/// `AuthService` al `JwtService`, no para probar la librería de JWT.
function jwtFake(overrides: Partial<JwtService> = {}) {
  return {
    signAsync: (payload: unknown) =>
      Promise.resolve(`token(${JSON.stringify(payload)})`),
    verifyAsync: () =>
      Promise.reject(new Error('sin implementar en este fake')),
    decode: () => ({ exp: Math.floor(Date.now() / 1000) + 3600 }),
    ...overrides,
  } as unknown as JwtService;
}

function verifyPayload(payload: object): JwtService['verifyAsync'] {
  return <T extends object = object>() => Promise.resolve(payload as T);
}

function fakeMail(overrides: Record<string, unknown> = {}) {
  return {
    sendPasswordReset: () => Promise.resolve(true),
    sendEmailConfirmation: () => Promise.resolve(true),
    ...overrides,
  } as never;
}

function service(
  prisma: Partial<Record<string, unknown>>,
  jwt: JwtService = jwtFake(),
  mail: ReturnType<typeof fakeMail> = fakeMail(),
) {
  const normalize = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(normalize);
    if (!value || typeof value !== 'object') return value;
    const row = value as Record<string, unknown>;
    if ('role' in row && typeof row.role === 'string') {
      const { nombre, apellido, email, seq, role, ...account } = row;
      return {
        ...account,
        role: { code: role },
        profile: { nombre, apellido, email },
        studyParticipant: typeof seq === 'number' ? { seq } : null,
      };
    }
    return value;
  };
  const delegate = Object.fromEntries(
    Object.entries(prisma).map(([name, operation]) => [
      name,
      typeof operation === 'function'
        ? async (...args: unknown[]) => {
            const invoke = operation as (...values: unknown[]) => unknown;
            return normalize(await invoke(...args));
          }
        : operation,
    ]),
  );
  // `$transaction` corre el callback con el mismo cliente falso: alcanza
  // para ver qué se borra y qué se crea, sin simular el rollback.
  const client: Record<string, unknown> = { account: delegate };
  client.$queryRaw = delegate.$queryRaw ?? (() => Promise.resolve([]));
  client.$transaction = (fn: (tx: unknown) => Promise<unknown>) => fn(client);
  return new AuthService(
    client as unknown as PrismaService,
    jwt,
    fakeConfig(),
    mail,
  );
}

function participantRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    seq: 7,
    nombre: encrypt('Ana', PII_KEY),
    apellido: encrypt('Pérez', PII_KEY),
    email: encrypt('ana@correo.com', PII_KEY),
    role: 'PARTICIPANT',
    onboardingVistoAt: null,
    disabledAt: null,
    tokenVersion: 0,
    // Confirmada por defecto: los tests que necesitan probar el camino de
    // "no confirmada" la pisan explícitamente con `emailConfirmedAt: null`.
    emailConfirmedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('AuthService.register', () => {
  function registrationDto(overrides: Record<string, unknown> = {}) {
    return {
      nombre: 'Ana',
      apellido: 'Pérez',
      email: 'ana@correo.com',
      cedula: '1710034065',
      password: 'ClaveSegura123!',
      ...overrides,
    } as never;
  }

  it('cifra nombre, apellido y correo, y guarda la huella del correo', async () => {
    let createdData: Record<string, unknown> | undefined;
    const auth = service({
      findMany: () => Promise.resolve([]),
      create: ({ data }: { data: Record<string, unknown> }) => {
        createdData = data;
        return Promise.resolve(participantRow({ ...data, seq: 1 }));
      },
    });

    await auth.register(registrationDto());

    const profile = (
      createdData?.profile as { create: Record<string, unknown> }
    ).create;
    expect(profile.nombre).toMatch(/^v1:/);
    expect(profile.apellido).toMatch(/^v1:/);
    expect(profile.email).toMatch(/^v1:/);
    expect(profile.emailHash).toEqual(expect.any(String));
    expect(profile.nombre).not.toBe('Ana');
  });

  it('no arma sesión: crea la cuenta sin confirmar y manda el correo de confirmación', async () => {
    let createdData: Record<string, unknown> | undefined;
    const sendEmailConfirmation = jest.fn().mockResolvedValue(true);
    const auth = service(
      {
        findMany: () => Promise.resolve([]),
        create: ({ data }: { data: Record<string, unknown> }) => {
          createdData = data;
          return Promise.resolve(participantRow(data));
        },
      },
      jwtFake(),
      fakeMail({ sendEmailConfirmation }),
    );

    const result = await auth.register(registrationDto());

    expect(result).toEqual({ email: 'ana@correo.com' });
    expect(createdData?.emailConfirmedAt).toBeUndefined();
    expect(sendEmailConfirmation).toHaveBeenCalledTimes(1);
    const [emailArg, , linkArg] = sendEmailConfirmation.mock.calls[0] as [
      string,
      string,
      string,
    ];
    expect(emailArg).toBe('ana@correo.com');
    expect(linkArg).toContain('/confirmar-correo?token=');
  });

  it('bloquea por huella y vuelve a comprobar antes de crear la cuenta', async () => {
    const events: string[] = [];
    let lookups = 0;
    const auth = service({
      findMany: () => {
        lookups += 1;
        events.push(`lookup-${lookups}`);
        return Promise.resolve([]);
      },
      $queryRaw: () => {
        events.push('lock');
        return Promise.resolve([]);
      },
      create: () => {
        events.push('create');
        return Promise.resolve({ id: 'new-account' });
      },
    });

    await auth.register(registrationDto());

    expect(events).toEqual(['lookup-1', 'lock', 'lookup-2', 'create']);
  });

  it('rechaza un correo o cédula ya registrados con el mismo mensaje', async () => {
    const auth = service({
      findMany: () =>
        Promise.resolve([
          {
            id: 'ya-existe',
            role: 'PARTICIPANT',
            emailConfirmedAt: new Date(),
          },
        ]),
    });

    await expect(auth.register(registrationDto())).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  // Las cuentas pendientes siguen ocupando el correo y la cédula, sin borrarse.
  it('no borra una cuenta sin confirmar al registrar el mismo correo', async () => {
    const deleteMany = jest.fn();
    const auth = service({
      findMany: () =>
        Promise.resolve([
          { id: 'pendiente', role: 'PARTICIPANT', emailConfirmedAt: null },
        ]),
      deleteMany,
    });

    await expect(auth.register(registrationDto())).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it('no reemplaza si alguna coincidencia ya confirmó o no es participante', async () => {
    for (const match of [
      { id: 'a', role: 'PARTICIPANT', emailConfirmedAt: new Date() },
      { id: 'b', role: 'TRAINER', emailConfirmedAt: null },
    ]) {
      const deleteMany = jest.fn();
      const auth = service({
        findMany: () =>
          Promise.resolve([
            { id: 'pendiente', role: 'PARTICIPANT', emailConfirmedAt: null },
            match,
          ]),
        deleteMany,
      });

      await expect(auth.register(registrationDto())).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(deleteMany).not.toHaveBeenCalled();
    }
  });

  it('convierte una colisión de índice único (P2002) en el mismo 409', async () => {
    const auth = service({
      findMany: () => Promise.resolve([]),
      create: () =>
        Promise.reject(Object.assign(new Error('unique'), { code: 'P2002' })),
    });

    await expect(auth.register(registrationDto())).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('un error que no es una colisión de índice se propaga tal cual', async () => {
    const failure = new Error('la base no respondió');
    const auth = service({
      findMany: () => Promise.resolve([]),
      create: () => Promise.reject(failure),
    });

    await expect(auth.register(registrationDto())).rejects.toBe(failure);
  });
});

describe('AuthService.login', () => {
  it('con credenciales correctas, entrega una sesión con los datos descifrados', async () => {
    const auth = service({
      findMany: () =>
        Promise.resolve([
          {
            ...participantRow(),
            passwordHash: '$2b$12$hash-de-prueba',
          },
        ]),
    });
    // `bcrypt.compare` real contra un hash inventado siempre da falso; se
    // prueba aparte con un hash de verdad más abajo.
    await expect(
      auth.login({ email: 'ana@correo.com', password: 'lo-que-sea' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('sin ninguna cuenta con ese correo, 401 con el mensaje genérico', async () => {
    const auth = service({ findMany: () => Promise.resolve([]) });

    await expect(
      auth.login({ email: 'nadie@correo.com', password: 'x' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('una cuenta desactivada no entra, aunque la contraseña sea correcta', async () => {
    // bcrypt real: se genera un hash de verdad para que `compare` de
    // adentro del servicio lo acepte.
    const passwordHash = await hash('ClaveSegura123!', 4);
    const auth = service({
      findMany: () =>
        Promise.resolve([
          {
            ...participantRow({ disabledAt: new Date() }),
            passwordHash,
          },
        ]),
    });

    await expect(
      auth.login({
        email: 'ana@correo.com',
        password: 'ClaveSegura123!',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('con todo correcto, entrega la sesión', async () => {
    const passwordHash = await hash('ClaveSegura123!', 4);
    const auth = service({
      findMany: () => Promise.resolve([{ ...participantRow(), passwordHash }]),
    });

    const session = await auth.login({
      email: 'ana@correo.com',
      password: 'ClaveSegura123!',
    });

    expect(session.participant.email).toBe('ana@correo.com');
    expect(session.accessToken).toEqual(expect.any(String));
  });

  it('con correo repetido inicia sesión en la cuenta cuya contraseña coincide', async () => {
    const firstPasswordHash = await hash('OtraClave123!', 4);
    const matchingPasswordHash = await hash('ClaveSegura123!', 4);
    const auth = service({
      findMany: () =>
        Promise.resolve([
          {
            ...participantRow({ id: 'otra-cuenta' }),
            passwordHash: firstPasswordHash,
          },
          {
            ...participantRow({ id: 'cuenta-correcta' }),
            passwordHash: matchingPasswordHash,
          },
        ]),
    });

    const session = await auth.login({
      email: 'ana@correo.com',
      password: 'ClaveSegura123!',
    });

    expect(session.accessToken).toContain('cuenta-correcta');
  });

  it('rechaza a un PARTICIPANT que no confirmó su correo', async () => {
    const passwordHash = await hash('ClaveSegura123!', 4);
    const auth = service({
      findMany: () =>
        Promise.resolve([
          {
            ...participantRow({ emailConfirmedAt: null }),
            passwordHash,
          },
        ]),
    });

    await expect(
      auth.login({ email: 'ana@correo.com', password: 'ClaveSegura123!' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('una cuenta TRAINER o ADMIN sin emailConfirmedAt sí entra (no aplica el bloqueo)', async () => {
    const passwordHash = await hash('ClaveSegura123!', 4);
    const auth = service({
      findMany: () =>
        Promise.resolve([
          {
            ...participantRow({ role: 'ADMIN', emailConfirmedAt: null }),
            passwordHash,
          },
        ]),
    });

    const session = await auth.login({
      email: 'ana@correo.com',
      password: 'ClaveSegura123!',
    });

    expect(session.accessToken).toEqual(expect.any(String));
  });
});

describe('AuthService.me', () => {
  it('devuelve el perfil descifrado', async () => {
    const auth = service({
      findUnique: () => Promise.resolve(participantRow()),
    });

    const profile = await auth.me('p1');

    expect(profile.nombre).toBe('Ana');
    expect(profile.apellido).toBe('Pérez');
  });

  it('sin la cuenta, 401', async () => {
    const auth = service({ findUnique: () => Promise.resolve(null) });
    await expect(auth.me('p1')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('con la cuenta desactivada, 401', async () => {
    const auth = service({
      findUnique: () =>
        Promise.resolve(participantRow({ disabledAt: new Date() })),
    });
    await expect(auth.me('p1')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe('AuthService.updateMe', () => {
  it('marca onboardingVistoAt y devuelve el perfil descifrado', async () => {
    let receivedData: unknown;
    const auth = service({
      update: ({ data }: { data: unknown }) => {
        receivedData = data;
        return Promise.resolve(
          participantRow({ onboardingVistoAt: new Date() }),
        );
      },
    });

    const profile = await auth.updateMe('p1', {
      onboardingVisto: true,
    });

    expect(
      (receivedData as { onboardingVistoAt: Date }).onboardingVistoAt,
    ).toBeInstanceOf(Date);
    expect(profile.onboardingVisto).toBe(true);
  });

  // El ícono ⓘ reactiva el aviso: manda `onboardingVisto: false` para
  // volver a verlo, y eso debe limpiar la fecha, no dejarla puesta.
  it('con onboardingVisto false, borra onboardingVistoAt', async () => {
    let receivedData: unknown;
    const auth = service({
      update: ({ data }: { data: unknown }) => {
        receivedData = data;
        return Promise.resolve(participantRow({ onboardingVistoAt: null }));
      },
    });

    const profile = await auth.updateMe('p1', {
      onboardingVisto: false,
    });

    expect(
      (receivedData as { onboardingVistoAt: Date | null }).onboardingVistoAt,
    ).toBeNull();
    expect(profile.onboardingVisto).toBe(false);
  });
});

describe('AuthService.refrescar', () => {
  it('sin cookie, 401', async () => {
    const auth = service({});
    await expect(auth.refreshSession(undefined)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('con un token que no verifica, 401', async () => {
    const auth = service(
      {},
      jwtFake({ verifyAsync: () => Promise.reject(new Error('inválido')) }),
    );
    await expect(
      auth.refreshSession('token-cualquiera'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('con un access token en vez de un refresh token, 401', async () => {
    const auth = service(
      {},
      jwtFake({
        verifyAsync: verifyPayload({ sub: 'p1', typ: 'access' }),
      }),
    );
    await expect(
      auth.refreshSession('token-cualquiera'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('con la cuenta ya no encontrada o desactivada, 401', async () => {
    const auth = service(
      { findUnique: () => Promise.resolve(null) },
      jwtFake({
        verifyAsync: verifyPayload({
          sub: 'p1',
          typ: 'refresh',
          tokenVersion: 0,
        }),
      }),
    );
    await expect(
      auth.refreshSession('token-cualquiera'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('con todo válido, entrega una sesión nueva', async () => {
    const auth = service(
      { findUnique: () => Promise.resolve(participantRow()) },
      jwtFake({
        verifyAsync: verifyPayload({
          sub: 'p1',
          typ: 'refresh',
          tokenVersion: 0,
        }),
      }),
    );

    const session = await auth.refreshSession('token-cualquiera');

    expect(session.participant.email).toBe('ana@correo.com');
  });

  // Issue #256: restablecer la contraseña incrementa tokenVersion. Un refresh
  // token emitido antes de eso trae la versión vieja y debe dejar de servir,
  // sin necesidad de una lista de tokens revocados.
  it('con una versión de token desactualizada (tras restablecer la contraseña), 401', async () => {
    const auth = service(
      {
        findUnique: () => Promise.resolve(participantRow({ tokenVersion: 1 })),
      },
      jwtFake({
        verifyAsync: verifyPayload({
          sub: 'p1',
          typ: 'refresh',
          tokenVersion: 0,
        }),
      }),
    );

    await expect(
      auth.refreshSession('token-cualquiera'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe('AuthService.forgotPassword', () => {
  it('sin ninguna cuenta con ese correo, responde el mensaje genérico sin mandar correo', async () => {
    const sendPasswordReset = jest.fn();
    const auth = service(
      { findMany: () => Promise.resolve([]) },
      jwtFake(),
      fakeMail({ sendPasswordReset }),
    );

    await expect(
      auth.forgotPassword('nadie@correo.com'),
    ).resolves.toBeUndefined();
    expect(sendPasswordReset).not.toHaveBeenCalled();
  });

  it('con una cuenta real, guarda el hash del token (nunca en claro) y manda el correo', async () => {
    const sendPasswordReset = jest.fn().mockResolvedValue(true);
    let updateData: Record<string, unknown> | undefined;
    const auth = service(
      {
        findMany: () => Promise.resolve([participantRow()]),
        update: ({ data }: { data: Record<string, unknown> }) => {
          updateData = data;
          return Promise.resolve(participantRow());
        },
      },
      jwtFake(),
      fakeMail({ sendPasswordReset }),
    );

    await auth.forgotPassword('ana@correo.com');

    expect(updateData?.passwordResetTokenHash).toEqual(expect.any(String));
    expect(updateData?.passwordResetExpiresAt).toBeInstanceOf(Date);
    expect(sendPasswordReset).toHaveBeenCalledTimes(1);
    const [emailArg, , linkArg] = sendPasswordReset.mock.calls[0] as [
      string,
      string,
      string,
    ];
    expect(emailArg).toBe('ana@correo.com');
    // El enlace lleva el token EN CLARO; lo guardado en la base es su hash.
    expect(linkArg).not.toContain(updateData?.passwordResetTokenHash as string);
  });

  it('atiende todas las cuentas que comparten el correo con tokens independientes', async () => {
    const updates: Array<{
      where: { id: string };
      data: Record<string, unknown>;
    }> = [];
    const sendPasswordReset = jest.fn().mockResolvedValue(true);
    let releaseFirstUpdate = () => {};
    let signalSecondUpdate = () => {};
    const firstUpdatePending = new Promise<void>((resolve) => {
      releaseFirstUpdate = resolve;
    });
    const secondUpdateStarted = new Promise<void>((resolve) => {
      signalSecondUpdate = resolve;
    });
    const auth = service(
      {
        findMany: () =>
          Promise.resolve([
            participantRow({ id: 'cuenta-a' }),
            {
              id: 'cuenta-b',
              role: { code: 'PARTICIPANT' },
              profile: null,
              disabledAt: null,
            },
          ]),
        update: (args: {
          where: { id: string };
          data: Record<string, unknown>;
        }) => {
          updates.push(args);
          if (args.where.id === 'cuenta-a') {
            return firstUpdatePending.then(() => ({ id: args.where.id }));
          }
          signalSecondUpdate();
          return Promise.resolve({ id: args.where.id });
        },
      },
      jwtFake(),
      fakeMail({ sendPasswordReset }),
    );

    const operation = auth.forgotPassword('ana@correo.com');
    const concurrent = await Promise.race([
      secondUpdateStarted.then(() => true),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 50)),
    ]);
    releaseFirstUpdate();
    await operation;

    expect(concurrent).toBe(true);
    expect(updates.map(({ where }) => where.id)).toEqual([
      'cuenta-a',
      'cuenta-b',
    ]);
    expect(
      new Set(updates.map(({ data }) => data.passwordResetTokenHash)).size,
    ).toBe(2);
    expect(sendPasswordReset).toHaveBeenCalledTimes(2);
    expect(sendPasswordReset).toHaveBeenCalledWith(
      'ana@correo.com',
      '',
      expect.stringContaining('/restablecer-password?token='),
    );
  });

  it('una cuenta desactivada no recibe el correo, aunque exista', async () => {
    const sendPasswordReset = jest.fn();
    const auth = service(
      {
        findMany: () =>
          Promise.resolve([participantRow({ disabledAt: new Date() })]),
      },
      jwtFake(),
      fakeMail({ sendPasswordReset }),
    );

    await auth.forgotPassword('ana@correo.com');

    expect(sendPasswordReset).not.toHaveBeenCalled();
  });
});

describe('AuthService.resetPassword', () => {
  it('con un token que no corresponde a ninguna cuenta, rechaza', async () => {
    const auth = service({ findFirst: () => Promise.resolve(null) });

    await expect(
      auth.resetPassword('token-cualquiera', 'ClaveNueva123!'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('con el token ya vencido, rechaza', async () => {
    const auth = service({
      findFirst: () =>
        Promise.resolve(
          participantRow({
            passwordResetExpiresAt: new Date(Date.now() - 1000),
          }),
        ),
    });

    await expect(
      auth.resetPassword('token-cualquiera', 'ClaveNueva123!'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('con un token vigente, cambia la contraseña, lo borra e incrementa tokenVersion', async () => {
    let updateData: Record<string, unknown> | undefined;
    const auth = service({
      findFirst: () =>
        Promise.resolve(
          participantRow({
            passwordResetExpiresAt: new Date(Date.now() + 60_000),
            tokenVersion: 3,
          }),
        ),
      update: ({ data }: { data: Record<string, unknown> }) => {
        updateData = data;
        return Promise.resolve(participantRow());
      },
    });

    await auth.resetPassword('token-cualquiera', 'ClaveNueva123!');

    expect(updateData?.passwordResetTokenHash).toBeNull();
    expect(updateData?.passwordResetExpiresAt).toBeNull();
    expect(updateData?.tokenVersion).toEqual({ increment: 1 });
    expect(updateData?.passwordHash).toEqual(expect.any(String));
    expect(updateData?.passwordHash).not.toBe('ClaveNueva123!');
  });
});

describe('AuthService.confirmEmail', () => {
  it('con un token que no corresponde a ninguna cuenta, rechaza', async () => {
    const auth = service({ findFirst: () => Promise.resolve(null) });

    await expect(auth.confirmEmail('token-cualquiera')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('con el token ya vencido, rechaza', async () => {
    const auth = service({
      findFirst: () =>
        Promise.resolve(
          participantRow({
            emailConfirmationExpiresAt: new Date(Date.now() - 1000),
          }),
        ),
    });

    await expect(auth.confirmEmail('token-cualquiera')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('con un token vigente, marca emailConfirmedAt y limpia el token', async () => {
    let updateData: Record<string, unknown> | undefined;
    const auth = service({
      findFirst: () =>
        Promise.resolve(
          participantRow({
            emailConfirmationExpiresAt: new Date(Date.now() + 60_000),
            emailConfirmedAt: null,
          }),
        ),
      update: ({ data }: { data: Record<string, unknown> }) => {
        updateData = data;
        return Promise.resolve(participantRow());
      },
    });

    const session = await auth.confirmEmail('token-cualquiera');

    expect(updateData?.emailConfirmedAt).toBeInstanceOf(Date);
    expect(updateData?.emailConfirmationTokenHash).toBeNull();
    expect(updateData?.emailConfirmationExpiresAt).toBeNull();
    expect(session.accessToken).toEqual(expect.any(String));
    expect(session.refreshToken).toEqual(expect.any(String));
    expect(session.participant.email).toBe('ana@correo.com');
    expect(session.participant).not.toHaveProperty('seq');
  });

  it('con una cuenta desactivada, confirma el correo pero no arma sesión', async () => {
    let updateData: Record<string, unknown> | undefined;
    const auth = service({
      findFirst: () =>
        Promise.resolve(
          participantRow({
            emailConfirmationExpiresAt: new Date(Date.now() + 60_000),
            emailConfirmedAt: null,
            disabledAt: new Date(),
          }),
        ),
      update: ({ data }: { data: Record<string, unknown> }) => {
        updateData = data;
        return Promise.resolve(participantRow());
      },
    });

    await expect(auth.confirmEmail('token-cualquiera')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(updateData?.emailConfirmedAt).toBeInstanceOf(Date);
  });
});

describe('AuthService.resendConfirmation', () => {
  it('sin ninguna cuenta con ese correo, responde el mensaje genérico sin mandar correo', async () => {
    const sendEmailConfirmation = jest.fn();
    const auth = service(
      { findMany: () => Promise.resolve([]) },
      jwtFake(),
      fakeMail({ sendEmailConfirmation }),
    );

    await expect(
      auth.resendConfirmation('nadie@correo.com'),
    ).resolves.toBeUndefined();
    expect(sendEmailConfirmation).not.toHaveBeenCalled();
  });

  it('con la cuenta ya confirmada, responde igual sin mandar correo', async () => {
    const sendEmailConfirmation = jest.fn();
    const auth = service(
      {
        findMany: () =>
          Promise.resolve([participantRow({ emailConfirmedAt: new Date() })]),
      },
      jwtFake(),
      fakeMail({ sendEmailConfirmation }),
    );

    await auth.resendConfirmation('ana@correo.com');

    expect(sendEmailConfirmation).not.toHaveBeenCalled();
  });

  it('con una cuenta real sin confirmar, guarda un token nuevo y reenvía', async () => {
    const sendEmailConfirmation = jest.fn().mockResolvedValue(true);
    let updateData: Record<string, unknown> | undefined;
    const auth = service(
      {
        findMany: () =>
          Promise.resolve([participantRow({ emailConfirmedAt: null })]),
        update: ({ data }: { data: Record<string, unknown> }) => {
          updateData = data;
          return Promise.resolve(participantRow());
        },
      },
      jwtFake(),
      fakeMail({ sendEmailConfirmation }),
    );

    await auth.resendConfirmation('ana@correo.com');

    expect(updateData?.emailConfirmationTokenHash).toEqual(expect.any(String));
    expect(updateData?.emailConfirmationExpiresAt).toBeInstanceOf(Date);
    expect(sendEmailConfirmation).toHaveBeenCalledTimes(1);
  });

  it('reenvía confirmación por separado a todas las cuentas sin confirmar', async () => {
    const updates: Array<{
      where: { id: string };
      data: Record<string, unknown>;
    }> = [];
    const sendEmailConfirmation = jest.fn().mockResolvedValue(true);
    let releaseFirstUpdate = () => {};
    let signalSecondUpdate = () => {};
    const firstUpdatePending = new Promise<void>((resolve) => {
      releaseFirstUpdate = resolve;
    });
    const secondUpdateStarted = new Promise<void>((resolve) => {
      signalSecondUpdate = resolve;
    });
    const auth = service(
      {
        findMany: () =>
          Promise.resolve([
            participantRow({ id: 'cuenta-a', emailConfirmedAt: null }),
            {
              id: 'cuenta-b',
              role: { code: 'PARTICIPANT' },
              profile: null,
              emailConfirmedAt: null,
            },
          ]),
        update: (args: {
          where: { id: string };
          data: Record<string, unknown>;
        }) => {
          updates.push(args);
          if (args.where.id === 'cuenta-a') {
            return firstUpdatePending.then(() => ({ id: args.where.id }));
          }
          signalSecondUpdate();
          return Promise.resolve({ id: args.where.id });
        },
      },
      jwtFake(),
      fakeMail({ sendEmailConfirmation }),
    );

    const operation = auth.resendConfirmation('ana@correo.com');
    const concurrent = await Promise.race([
      secondUpdateStarted.then(() => true),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 50)),
    ]);
    releaseFirstUpdate();
    await operation;

    expect(concurrent).toBe(true);
    expect(updates.map(({ where }) => where.id)).toEqual([
      'cuenta-a',
      'cuenta-b',
    ]);
    expect(
      new Set(updates.map(({ data }) => data.emailConfirmationTokenHash)).size,
    ).toBe(2);
    expect(sendEmailConfirmation).toHaveBeenCalledTimes(2);
    expect(sendEmailConfirmation).toHaveBeenCalledWith(
      'ana@correo.com',
      '',
      expect.stringContaining('/confirmar-correo?token='),
    );
  });

  it('filtra por role: PARTICIPANT, para que un TRAINER/ADMIN no reciba reenvíos', async () => {
    // TRAINER/ADMIN no nacen confirmados (createTrainer nunca setea
    // emailConfirmedAt), así que sin este filtro cualquiera que supiera su
    // correo podría disparar un envío de "confirma tu cuenta" hacia esa
    // cuenta de staff desde este endpoint público.
    let whereClause: Record<string, unknown> | undefined;
    const sendEmailConfirmation = jest.fn();
    const auth = service(
      {
        findMany: ({ where }: { where: Record<string, unknown> }) => {
          whereClause = where;
          return Promise.resolve([]);
        },
      },
      jwtFake(),
      fakeMail({ sendEmailConfirmation }),
    );

    await auth.resendConfirmation('trainer@correo.com');

    expect(whereClause?.role).toEqual({ code: 'PARTICIPANT' });
    expect(sendEmailConfirmation).not.toHaveBeenCalled();
  });
});
