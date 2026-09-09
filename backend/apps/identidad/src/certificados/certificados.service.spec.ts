import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { AtestacionPayload, JwtPayload } from '@comun';
import { CertificadosService } from './certificados.service';
import type { MailService } from '../mail/mail.service';
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
    calificacion: 30,
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
    // Valor fijo cualquiera: los fixtures de este archivo son texto plano
    // sin el prefijo "v1:", así que `descifrarOpcional()` los deja pasar tal
    // cual sin necesitar la clave real.
    getOrThrow: () => 'clave-de-prueba',
  } as unknown as ConfigService;
}

/// Se devuelve el mock aparte del objeto: usarlo como `mail.enviarCertificado`
/// en una aserción dispara `@typescript-eslint/unbound-method` (el método se
/// separa de su "this" al pasarlo a `expect`).
function mailFake(): { mail: MailService; enviarCertificado: jest.Mock } {
  const enviarCertificado = jest.fn().mockResolvedValue(true);
  return {
    mail: { enviarCertificado } as unknown as MailService,
    enviarCertificado,
  };
}

function servicio(
  prisma: Partial<{ certificate: unknown; participant: unknown }>,
  jwt: JwtService,
  mail: MailService = mailFake().mail,
) {
  return new CertificadosService(
    prisma as unknown as PrismaService,
    jwt,
    configFake(),
    mail,
  );
}

describe('CertificadosService.emitir · el canje de la atestación', () => {
  // Firma inválida, vencida, o simplemente basura: `jwt.verifyAsync` la
  // rechaza antes de que el servicio llegue a mirar ningún campo del payload.
  it('rechaza una atestación que no verifica (vencida o con firma inválida)', async () => {
    const jwt = {
      verifyAsync: () => Promise.reject(new Error('jwt expired')),
    } as unknown as JwtService;
    const svc = servicio({ certificate: {} }, jwt);

    await expect(svc.emitir(PARTICIPANTE, 'token')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

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
    expect((datosCreados as { calificacion: number }).calificacion).toBe(30);
    expect((datosCreados as { participantId: string }).participantId).toBe(
      PARTICIPANTE.sub,
    );
    expect((datosCreados as { codigo: string }).codigo).toMatch(/^SW-/);
  });

  // `intentarEnviarPorCorreo` es privado y se llama sin `await` desde
  // `emitir()` (fire-and-forget a propósito, ver el comentario ahí): la
  // prueba espera a que su cadena de promesas resuelva en vez de asumir que
  // ya terminó cuando `emitir()` devuelve.
  // `generarCertificadoPdf` usa streams reales de pdfkit por debajo: no
  // resuelve en un puñado de microtasks, así que un poll con `setImmediate`
  // no basta de forma confiable. `setTimeout` sí le da tiempo real a las
  // fases de I/O de Node entre cada intento.
  async function esperarLlamada(mock: jest.Mock, intentosMax = 40) {
    for (let i = 0; i < intentosMax && mock.mock.calls.length === 0; i++) {
      await new Promise((resolver) => setTimeout(resolver, 5));
    }
  }

  it('manda el certificado por correo la primera vez que hay algo que mandar', async () => {
    const jwt = jwtQueDevuelve(atestacionValida());
    const { mail, enviarCertificado } = mailFake();
    let datosActualizados: unknown;
    const svc = servicio(
      {
        certificate: {
          findUnique: () => Promise.resolve(null),
          create: ({ data }: { data: unknown }) =>
            Promise.resolve({
              id: 'cert-1',
              ...(data as object),
              emitidoAt: new Date('2026-09-04T00:00:00.000Z'),
              certificadoEnviadoAt: null,
            }),
          update: ({ data }: { data: unknown }) => {
            datosActualizados = data;
            return Promise.resolve({});
          },
        },
        participant: {
          findUnique: () =>
            Promise.resolve({
              nombre: 'Ana',
              apellido: 'Pérez',
              email: 'ana@gmail.com',
            }),
        },
      },
      jwt,
      mail,
    );

    await svc.emitir(PARTICIPANTE, 'token');
    await esperarLlamada(enviarCertificado);

    expect(enviarCertificado).toHaveBeenCalledWith(
      'ana@gmail.com',
      'Ana Pérez',
      expect.any(Buffer),
    );
    expect(
      (datosActualizados as { certificadoEnviadoAt: Date })
        .certificadoEnviadoAt,
    ).toBeInstanceOf(Date);
  });

  // La cuenta existe pero el correo no se pudo descifrar a nada útil (caso de
  // borde defensivo, no un flujo real): sin destinatario no hay a quién
  // mandarle el PDF, así que no debe intentarlo.
  it('sin correo del participante, no manda nada', async () => {
    const jwt = jwtQueDevuelve(atestacionValida());
    const { mail, enviarCertificado } = mailFake();
    const svc = servicio(
      {
        certificate: {
          findUnique: () => Promise.resolve(null),
          create: ({ data }: { data: unknown }) =>
            Promise.resolve({
              id: 'cert-1',
              ...(data as object),
              emitidoAt: new Date('2026-09-04T00:00:00.000Z'),
              certificadoEnviadoAt: null,
            }),
        },
        participant: {
          findUnique: () =>
            Promise.resolve({ nombre: 'Ana', apellido: 'Pérez', email: '' }),
        },
      },
      jwt,
      mail,
    );

    await svc.emitir(PARTICIPANTE, 'token');
    await esperarLlamada(enviarCertificado);

    expect(enviarCertificado).not.toHaveBeenCalled();
  });

  it('no reenvía si el certificado ya se mandó por correo antes', async () => {
    const jwt = jwtQueDevuelve(atestacionValida());
    const { mail, enviarCertificado } = mailFake();
    const svc = servicio(
      {
        certificate: {
          findUnique: () =>
            Promise.resolve({
              id: 'cert-1',
              participantId: PARTICIPANTE.sub,
              modulos: atestacionValida().modulos,
              calificacion: atestacionValida().calificacion,
              horas: 4,
              codigo: 'SW-AAAA-BBBB',
              emitidoAt: new Date('2026-09-04T00:00:00.000Z'),
              certificadoEnviadoAt: new Date('2026-09-04T00:00:00.000Z'),
            }),
        },
        participant: {
          findUnique: () =>
            Promise.resolve({
              nombre: 'Ana',
              apellido: 'Pérez',
              email: 'ana@gmail.com',
            }),
        },
      },
      jwt,
      mail,
    );

    await svc.emitir(PARTICIPANTE, 'token');
    // No hay un segundo envío que esperar: si `intentarEnviarPorCorreo`
    // llamara a `enviarCertificado` igual, ya habría corrido para cuando
    // `emitir()` termina (el chequeo de `certificadoEnviadoAt` es lo primero
    // que hace, sin ningún `await` antes).
    expect(enviarCertificado).not.toHaveBeenCalled();
  });

  // Astronómicamente raro con este alfabeto, pero si el código generado
  // choca con uno ya existente, se reintenta con uno nuevo en vez de fallar
  // la petición del participante.
  it('reintenta con otro código si el generado choca con uno existente', async () => {
    const jwt = jwtQueDevuelve(atestacionValida());
    let intentos = 0;
    const svc = servicio(
      {
        certificate: {
          findUnique: () => Promise.resolve(null),
          create: () => {
            intentos += 1;
            if (intentos === 1) {
              // Un Error de verdad con `.code`, como el que lanza Prisma:
              // `esColisionDeUnicidad` no exige que sea una instancia de
              // Error, pero el objeto que se rechaza aquí sí debe serlo.
              const colision = Object.assign(new Error('P2002'), {
                code: 'P2002',
              });
              return Promise.reject(colision);
            }
            return Promise.resolve({
              codigo: 'SW-SEGUNDO-OK',
              modulos: atestacionValida().modulos,
              horas: 4,
              emitidoAt: new Date('2026-09-04T00:00:00.000Z'),
            });
          },
        },
      },
      jwt,
    );

    const resultado = await svc.emitir(PARTICIPANTE, 'token');

    expect(intentos).toBe(2);
    expect(resultado.codigo).toBe('SW-SEGUNDO-OK');
  });

  // Un error que no es una colisión de índice único (o que ni siquiera trae
  // forma de error de Prisma) no debe reintentarse: hay que dejarlo subir tal
  // cual para que no se enmascare un fallo real de la base.
  it('un error que no es una colisión de código se propaga sin reintentar', async () => {
    const jwt = jwtQueDevuelve(atestacionValida());
    let intentos = 0;
    const fallo = new Error('la base no respondió');
    const svc = servicio(
      {
        certificate: {
          findUnique: () => Promise.resolve(null),
          create: () => {
            intentos += 1;
            return Promise.reject(fallo);
          },
        },
      },
      jwt,
    );

    await expect(svc.emitir(PARTICIPANTE, 'token')).rejects.toBe(fallo);
    expect(intentos).toBe(1);
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
      calificacion: 30,
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
      calificacion: 12,
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
    expect((datosActualizados as { calificacion: number }).calificacion).toBe(
      30,
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
              calificacion: 6,
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

describe('CertificadosService.generarPdf', () => {
  const CERTIFICADO_EXISTENTE = {
    codigo: 'SW-AAAA-BBBB',
    modulos: ['phishing'],
    horas: 4,
    calificacion: 6,
    emitidoAt: new Date('2026-09-01T00:00:00.000Z'),
    revocadoAt: null as Date | null,
  };
  const PERSONA = { nombre: 'Luis', apellido: 'Sagnay' };

  function servicioConPersona(
    certificado: typeof CERTIFICADO_EXISTENTE | null,
    persona: typeof PERSONA | null,
  ) {
    return servicio(
      {
        certificate: { findUnique: () => Promise.resolve(certificado) },
        participant: { findUnique: () => Promise.resolve(persona) },
      },
      jwtQueDevuelve(atestacionValida()),
    );
  }

  it('regenera el PDF del certificado vigente con el nombre de la base', async () => {
    const svc = servicioConPersona(CERTIFICADO_EXISTENTE, PERSONA);

    const buffer = await svc.generarPdf(PARTICIPANTE, 'token');

    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });

  it('sin certificado emitido, 404', async () => {
    const svc = servicioConPersona(null, PERSONA);

    await expect(svc.generarPdf(PARTICIPANTE, 'token')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('un certificado revocado no genera PDF', async () => {
    const svc = servicioConPersona(
      { ...CERTIFICADO_EXISTENTE, revocadoAt: new Date() },
      PERSONA,
    );

    await expect(svc.generarPdf(PARTICIPANTE, 'token')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // Caso de borde: la cuenta se eliminó entre emitir el certificado y pedir
  // el PDF. No debería poder pasar en operación normal, pero si pasa no debe
  // reventar con un nombre `undefined`.
  it('sin la cuenta del participante, 404', async () => {
    const svc = servicioConPersona(CERTIFICADO_EXISTENTE, null);

    await expect(svc.generarPdf(PARTICIPANTE, 'token')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('CertificadosService.revocar', () => {
  it('marca revocadoAt en la fila indicada', async () => {
    let argumentos: unknown;
    const svc = servicio(
      {
        certificate: {
          update: (args: unknown) => {
            argumentos = args;
            return Promise.resolve({});
          },
        },
      },
      jwtQueDevuelve(atestacionValida()),
    );

    await svc.revocar('c1');

    expect(argumentos).toMatchObject({ where: { id: 'c1' } });
    const data = (argumentos as { data: { revocadoAt: Date } }).data;
    expect(data.revocadoAt).toBeInstanceOf(Date);
  });
});
