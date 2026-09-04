import { ForbiddenException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { AtestacionPayload, JwtPayload } from '@comun';
import { CertificadosService } from './certificados.service';
import type { PrismaService } from '../prisma/prisma.service';

const PARTICIPANTE: JwtPayload = {
  sub: 'uuid-a',
  seq: 7,
  role: 'PARTICIPANT',
  typ: 'access',
};

function atestacionValida(
  overrides: Partial<AtestacionPayload> = {},
): AtestacionPayload {
  return {
    sub: PARTICIPANTE.sub,
    seq: PARTICIPANTE.seq,
    modulos: ['phishing', 'smishing', 'vishing', 'suplantacion', 'estafa'],
    typ: 'atestacion',
    ...overrides,
  };
}

function jwtQueDevuelve(payload: unknown) {
  return {
    verifyAsync: () => Promise.resolve(payload),
  } as unknown as JwtService;
}

function configFake() {
  return {
    get: () => 'https://safeweb.espe.edu.ec',
  } as unknown as ConfigService;
}

function servicio(
  prisma: Partial<{ certificate: unknown; participant: unknown }>,
  jwt: JwtService,
) {
  return new CertificadosService(
    prisma as unknown as PrismaService,
    jwt,
    configFake(),
  );
}

describe('CertificadosService.emitir · el canje de la atestación', () => {
  // La comprobación que sostiene todo el flujo (§5.2.2 del diseño): sin ella,
  // la atestación de otra persona serviría para emitirse un certificado con
  // su progreso.
  it('rechaza una atestación cuyo sub no coincide con el participante', async () => {
    const jwt = jwtQueDevuelve(atestacionValida({ sub: 'uuid-otro' }));
    const svc = servicio({ certificate: {} }, jwt);

    await expect(svc.emitir(PARTICIPANTE, 'token')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  // Un access token está firmado con el mismo secreto que una atestación: sin
  // comprobar `typ`, uno serviría por el otro.
  it('rechaza un token cuyo typ no es "atestacion" (p. ej. un access token)', async () => {
    const jwt = jwtQueDevuelve({ ...PARTICIPANTE, typ: 'access' });
    const svc = servicio({ certificate: {} }, jwt);

    await expect(svc.emitir(PARTICIPANTE, 'token')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('emite un certificado nuevo cuando no existe ninguno', async () => {
    const jwt = jwtQueDevuelve(atestacionValida());
    let datosCreados: unknown;
    const svc = servicio(
      {
        certificate: {
          findUnique: () => Promise.resolve(null),
          create: ({ data }: { data: unknown }) => {
            datosCreados = data;
            return Promise.resolve({
              ...(data as object),
              emitidoAt: new Date('2026-09-04T00:00:00.000Z'),
            });
          },
        },
      },
      jwt,
    );

    const resultado = await svc.emitir(PARTICIPANTE, 'token');

    expect(resultado.horas).toBe(4);
    expect(resultado.modulos).toEqual(atestacionValida().modulos);
    expect((datosCreados as { participantId: string }).participantId).toBe(
      PARTICIPANTE.sub,
    );
    expect((datosCreados as { codigo: string }).codigo).toMatch(/^SW-/);
  });

  // Idempotencia (§5.4 del diseño): pedirlo dos veces con el mismo recorrido
  // no debe crear una segunda fila ni cambiar el código.
  it('devuelve el mismo certificado si ya existe y el recorrido no creció', async () => {
    const existente = {
      id: 'c1',
      participantId: PARTICIPANTE.sub,
      codigo: 'SW-AAAA-BBBB',
      modulos: atestacionValida().modulos,
      horas: 4,
      emitidoAt: new Date('2026-09-01T00:00:00.000Z'),
    };
    let seLlamoCreate = false;
    let seLlamoUpdate = false;
    const jwt = jwtQueDevuelve(atestacionValida());
    const svc = servicio(
      {
        certificate: {
          findUnique: () => Promise.resolve(existente),
          create: () => {
            seLlamoCreate = true;
            return Promise.resolve(existente);
          },
          update: () => {
            seLlamoUpdate = true;
            return Promise.resolve(existente);
          },
        },
      },
      jwt,
    );

    const resultado = await svc.emitir(PARTICIPANTE, 'token');

    expect(resultado.codigo).toBe('SW-AAAA-BBBB');
    expect(seLlamoCreate).toBe(false);
    expect(seLlamoUpdate).toBe(false);
  });

  // §5.4.1 del diseño: cuando UMBRALES crece y la atestación cubre más
  // módulos que la fila guardada, se actualiza `modulos`, pero el `codigo` no
  // cambia — el papel que la persona ya tiene sigue verificándose.
  it('actualiza los módulos y conserva el código cuando el recorrido creció', async () => {
    const existente = {
      id: 'c1',
      participantId: PARTICIPANTE.sub,
      codigo: 'SW-AAAA-BBBB',
      modulos: ['phishing', 'smishing'],
      horas: 4,
      emitidoAt: new Date('2026-09-01T00:00:00.000Z'),
    };
    let datosActualizados: unknown;
    const jwt = jwtQueDevuelve(atestacionValida());
    const svc = servicio(
      {
        certificate: {
          findUnique: () => Promise.resolve(existente),
          update: ({ data }: { data: unknown }) => {
            datosActualizados = data;
            return Promise.resolve({ ...existente, ...(data as object) });
          },
        },
      },
      jwt,
    );

    const resultado = await svc.emitir(PARTICIPANTE, 'token');

    expect(resultado.codigo).toBe('SW-AAAA-BBBB');
    expect((datosActualizados as { modulos: string[] }).modulos).toEqual(
      atestacionValida().modulos,
    );
  });
});

describe('CertificadosService.verificar', () => {
  it('nunca devuelve nombre, apellido ni correo', async () => {
    const svc = servicio(
      {
        certificate: {
          findUnique: () =>
            Promise.resolve({
              codigo: 'SW-AAAA-BBBB',
              modulos: ['phishing'],
              horas: 4,
              emitidoAt: new Date('2026-09-01T00:00:00.000Z'),
              revocadoAt: null,
            }),
        },
      },
      jwtQueDevuelve(atestacionValida()),
    );

    const resultado = await svc.verificar('SW-AAAA-BBBB');
    const texto = JSON.stringify(resultado);

    expect(texto).not.toMatch(/nombre|apellido|email|correo/i);
    expect(resultado.valido).toBe(true);
  });

  // Un código inexistente responde igual, en forma, que uno revocado: ninguno
  // de los dos debe servir de oráculo sobre cuántos certificados existen.
  it('responde igual para un código inexistente que para uno revocado', async () => {
    const svcInexistente = servicio(
      { certificate: { findUnique: () => Promise.resolve(null) } },
      jwtQueDevuelve(atestacionValida()),
    );
    const svcRevocado = servicio(
      {
        certificate: {
          findUnique: () =>
            Promise.resolve({
              codigo: 'SW-AAAA-BBBB',
              modulos: ['phishing'],
              horas: 4,
              emitidoAt: new Date(),
              revocadoAt: new Date(),
            }),
        },
      },
      jwtQueDevuelve(atestacionValida()),
    );

    const inexistente = await svcInexistente.verificar('SW-0000-0000');
    const revocado = await svcRevocado.verificar('SW-AAAA-BBBB');

    expect(inexistente).toEqual({ valido: false });
    expect(revocado).toEqual({ valido: false });
  });
});
