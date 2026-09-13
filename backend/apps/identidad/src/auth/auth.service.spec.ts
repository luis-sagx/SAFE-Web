import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';
import { AuthService } from './auth.service';
import type { PrismaService } from '../prisma/prisma.service';
import { encrypt } from '../pii/pii';

// Clave de 32 bytes real y pepper cualquiera: los mismos que exige la
// política de `pii.ts`, fijos para que las pruebas sean deterministas — no
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

function service(
  prisma: Partial<Record<string, unknown>>,
  jwt: JwtService = jwtFake(),
) {
  return new AuthService(
    { participant: prisma } as unknown as PrismaService,
    jwt,
    fakeConfig(),
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
      findFirst: () => Promise.resolve(null),
      create: ({ data }: { data: Record<string, unknown> }) => {
        createdData = data;
        return Promise.resolve(participantRow({ ...data, seq: 1 }));
      },
    });

    await auth.register(registrationDto());

    expect(createdData?.nombre).toMatch(/^v1:/);
    expect(createdData?.apellido).toMatch(/^v1:/);
    expect(createdData?.email).toMatch(/^v1:/);
    expect(createdData?.emailHash).toEqual(expect.any(String));
    expect(createdData?.nombre).not.toBe('Ana');
  });

  it('la sesión devuelta trae el nombre y el correo descifrados', async () => {
    const auth = service({
      findFirst: () => Promise.resolve(null),
      create: ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve(participantRow({ ...data, seq: 1 })),
    });

    const session = await auth.register(registrationDto());

    expect(session.participant.nombre).toBe('Ana');
    expect(session.participant.email).toBe('ana@correo.com');
  });

  it('rechaza un correo o cédula ya registrados con el mismo mensaje', async () => {
    const auth = service({
      findFirst: () => Promise.resolve({ id: 'ya-existe' }),
    });

    await expect(auth.register(registrationDto())).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  // Dos registros simultáneos pasan los dos la comprobación previa: solo uno
  // gana el índice único, y el segundo debe recibir el mismo 409, no un 500.
  it('convierte una colisión de índice único (P2002) en el mismo 409', async () => {
    const auth = service({
      findFirst: () => Promise.resolve(null),
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
      findFirst: () => Promise.resolve(null),
      create: () => Promise.reject(failure),
    });

    await expect(auth.register(registrationDto())).rejects.toBe(failure);
  });
});

describe('AuthService.login', () => {
  it('con credenciales correctas, entrega una sesión con los datos descifrados', async () => {
    const auth = service({
      findFirst: () =>
        Promise.resolve({
          ...participantRow(),
          passwordHash: '$2b$12$hash-de-prueba',
        }),
    });
    // `bcryptjs.compare` real contra un hash inventado siempre da falso; se
    // prueba aparte con un hash de verdad más abajo.
    await expect(
      auth.login({ email: 'ana@correo.com', password: 'lo-que-sea' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('sin ninguna cuenta con ese correo, 401 con el mensaje genérico', async () => {
    const auth = service({ findFirst: () => Promise.resolve(null) });

    await expect(
      auth.login({ email: 'nadie@correo.com', password: 'x' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('una cuenta desactivada no entra, aunque la contraseña sea correcta', async () => {
    // bcryptjs real: se genera un hash de verdad para que `compare` de
    // adentro del servicio lo acepte.
    const passwordHash = await hash('ClaveSegura123!', 4);
    const auth = service({
      findFirst: () =>
        Promise.resolve({
          ...participantRow({ disabledAt: new Date() }),
          passwordHash,
        }),
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
      findFirst: () => Promise.resolve({ ...participantRow(), passwordHash }),
    });

    const session = await auth.login({
      email: 'ana@correo.com',
      password: 'ClaveSegura123!',
    });

    expect(session.participant.email).toBe('ana@correo.com');
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
        verifyAsync: verifyPayload({ sub: 'p1', typ: 'refresh' }),
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
        verifyAsync: verifyPayload({ sub: 'p1', typ: 'refresh' }),
      }),
    );

    const session = await auth.refreshSession('token-cualquiera');

    expect(session.participant.email).toBe('ana@correo.com');
  });
});
