import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { AttestationPayload, JwtPayload } from '@comun';
import { CertificatesService } from './certificados.service';
import type { MailService } from '../mail/mail.service';
import type { PrismaService } from '../prisma/prisma.service';

const PARTICIPANT: JwtPayload = {
  sub: 'uuid-a',
  seq: 7,
  role: 'PARTICIPANT',
  typ: 'access',
};

function validAttestation(
  overrides: Partial<AttestationPayload> = {},
): AttestationPayload {
  return {
    sub: PARTICIPANT.sub,
    seq: PARTICIPANT.seq,
    modulos: ['phishing', 'smishing', 'vishing', 'suplantacion', 'estafa'],
    calificacion: 30,
    typ: 'atestacion',
    ...overrides,
  };
}

function jwtReturning(payload: unknown) {
  return {
    verifyAsync: () => Promise.resolve(payload),
  } as unknown as JwtService;
}

function fakeConfig() {
  return {
    get: () => 'https://safeweb.espe.edu.ec',
    // Valor fijo cualquiera: los fixtures de este archivo son texto plano
    // sin el prefijo "v1:", así que `decryptOptional()` los deja pasar tal
    // cual sin necesitar la clave real.
    getOrThrow: () => 'clave-de-prueba',
  } as unknown as ConfigService;
}

/// Se devuelve el mock aparte del objeto: usarlo como `mail.enviarCertificado`
/// en una aserción dispara `@typescript-eslint/unbound-method` (el método se
/// separa de su "this" al pasarlo a `expect`).
function fakeMail(): { mail: MailService; sendCertificate: jest.Mock } {
  const sendCertificate = jest.fn().mockResolvedValue(true);
  return {
    mail: { sendCertificate } as unknown as MailService,
    sendCertificate,
  };
}

function service(
  prisma: Partial<{ certificate: unknown; participant: unknown }>,
  jwt: JwtService,
  mail: MailService = fakeMail().mail,
) {
  return new CertificatesService(
    prisma as unknown as PrismaService,
    jwt,
    fakeConfig(),
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
    const svc = service({ certificate: {} }, jwt);

    await expect(svc.issue(PARTICIPANT, 'token')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  // La comprobación que sostiene todo el flujo (§5.2.2 del diseño): sin ella,
  // la atestación de otra persona serviría para emitirse un certificado con
  // su progreso.
  it('rechaza una atestación cuyo sub no coincide con el participante', async () => {
    const jwt = jwtReturning(validAttestation({ sub: 'uuid-otro' }));
    const svc = service({ certificate: {} }, jwt);

    await expect(svc.issue(PARTICIPANT, 'token')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  // Un access token está firmado con el mismo secreto que una atestación: sin
  // comprobar `typ`, uno serviría por el otro.
  it('rechaza un token cuyo typ no es "atestacion" (p. ej. un access token)', async () => {
    const jwt = jwtReturning({ ...PARTICIPANT, typ: 'access' });
    const svc = service({ certificate: {} }, jwt);

    await expect(svc.issue(PARTICIPANT, 'token')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('emite un certificado nuevo cuando no existe ninguno', async () => {
    const jwt = jwtReturning(validAttestation());
    let createdData: unknown;
    const svc = service(
      {
        certificate: {
          findUnique: () => Promise.resolve(null),
          create: ({ data }: { data: unknown }) => {
            createdData = data;
            return Promise.resolve({
              ...(data as object),
              emitidoAt: new Date('2026-09-04T00:00:00.000Z'),
            });
          },
        },
      },
      jwt,
    );

    const result = await svc.issue(PARTICIPANT, 'token');

    expect(result.horas).toBe(4);
    expect(result.modulos).toEqual(validAttestation().modulos);
    expect((createdData as { calificacion: number }).calificacion).toBe(30);
    expect((createdData as { participantId: string }).participantId).toBe(
      PARTICIPANT.sub,
    );
    expect((createdData as { codigo: string }).codigo).toMatch(/^SW-/);
  });

  // `intentarEnviarPorCorreo` es privado y se llama sin `await` desde
  // `emitir()` (fire-and-forget a propósito, ver el comentario ahí): la
  // prueba espera a que su cadena de promesas resuelva en vez de asumir que
  // ya terminó cuando `emitir()` devuelve.
  // `generarCertificadoPdf` usa streams reales de pdfkit por debajo: no
  // resuelve en un puñado de microtasks, así que un poll con `setImmediate`
  // no basta de forma confiable. `setTimeout` sí le da tiempo real a las
  // fases de I/O de Node entre cada intento.
  async function waitForCall(mock: jest.Mock, attemptsMax = 40) {
    for (let i = 0; i < attemptsMax && mock.mock.calls.length === 0; i++) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  }

  it('manda el certificado por correo la primera vez que hay algo que mandar', async () => {
    const jwt = jwtReturning(validAttestation());
    const { mail, sendCertificate } = fakeMail();
    let updatedData: unknown;
    const svc = service(
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
            updatedData = data;
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

    await svc.issue(PARTICIPANT, 'token');
    await waitForCall(sendCertificate);

    expect(sendCertificate).toHaveBeenCalledWith(
      'ana@gmail.com',
      'Ana Pérez',
      expect.any(Buffer),
    );
    expect(
      (updatedData as { certificadoEnviadoAt: Date }).certificadoEnviadoAt,
    ).toBeInstanceOf(Date);
  });

  // La cuenta existe pero el correo no se pudo descifrar a nada útil (caso de
  // borde defensivo, no un flujo real): sin destinatario no hay a quién
  // mandarle el PDF, así que no debe intentarlo.
  it('sin correo del participante, no manda nada', async () => {
    const jwt = jwtReturning(validAttestation());
    const { mail, sendCertificate } = fakeMail();
    const svc = service(
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

    await svc.issue(PARTICIPANT, 'token');
    await waitForCall(sendCertificate);

    expect(sendCertificate).not.toHaveBeenCalled();
  });

  it('no reenvía si el certificado ya se mandó por correo antes', async () => {
    const jwt = jwtReturning(validAttestation());
    const { mail, sendCertificate } = fakeMail();
    const svc = service(
      {
        certificate: {
          findUnique: () =>
            Promise.resolve({
              id: 'cert-1',
              participantId: PARTICIPANT.sub,
              modulos: validAttestation().modulos,
              calificacion: validAttestation().calificacion,
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

    await svc.issue(PARTICIPANT, 'token');
    // No hay un segundo envío que esperar: si `intentarEnviarPorCorreo`
    // llamara a `enviarCertificado` igual, ya habría corrido para cuando
    // `emitir()` termina (el chequeo de `certificadoEnviadoAt` es lo primero
    // que hace, sin ningún `await` antes).
    expect(sendCertificate).not.toHaveBeenCalled();
  });

  // Astronómicamente raro con este alfabeto, pero si el código generado
  // choca con uno ya existente, se reintenta con uno nuevo en vez de fallar
  // la petición del participante.
  it('reintenta con otro código si el generado choca con uno existente', async () => {
    const jwt = jwtReturning(validAttestation());
    let attempts = 0;
    const svc = service(
      {
        certificate: {
          findUnique: () => Promise.resolve(null),
          create: () => {
            attempts += 1;
            if (attempts === 1) {
              // Un Error de verdad con `.code`, como el que lanza Prisma:
              // `esColisionDeUnicidad` no exige que sea una instancia de
              // Error, pero el objeto que se rechaza aquí sí debe serlo.
              const collisionError = Object.assign(new Error('P2002'), {
                code: 'P2002',
              });
              return Promise.reject(collisionError);
            }
            return Promise.resolve({
              codigo: 'SW-SEGUNDO-OK',
              modulos: validAttestation().modulos,
              horas: 4,
              emitidoAt: new Date('2026-09-04T00:00:00.000Z'),
            });
          },
        },
      },
      jwt,
    );

    const result = await svc.issue(PARTICIPANT, 'token');

    expect(attempts).toBe(2);
    expect(result.codigo).toBe('SW-SEGUNDO-OK');
  });

  // Un error que no es una colisión de índice único (o que ni siquiera trae
  // forma de error de Prisma) no debe reintentarse: hay que dejarlo subir tal
  // cual para que no se enmascare un fallo real de la base.
  it('un error que no es una colisión de código se propaga sin reintentar', async () => {
    const jwt = jwtReturning(validAttestation());
    let attempts = 0;
    const failure = new Error('la base no respondió');
    const svc = service(
      {
        certificate: {
          findUnique: () => Promise.resolve(null),
          create: () => {
            attempts += 1;
            return Promise.reject(failure);
          },
        },
      },
      jwt,
    );

    await expect(svc.issue(PARTICIPANT, 'token')).rejects.toBe(failure);
    expect(attempts).toBe(1);
  });

  // Idempotencia (§5.4 del diseño): pedirlo dos veces con el mismo recorrido
  // no debe crear una segunda fila ni cambiar el código.
  it('devuelve el mismo certificado si ya existe y el recorrido no creció', async () => {
    const existing = {
      id: 'c1',
      participantId: PARTICIPANT.sub,
      codigo: 'SW-AAAA-BBBB',
      modulos: validAttestation().modulos,
      horas: 4,
      calificacion: 30,
      emitidoAt: new Date('2026-09-01T00:00:00.000Z'),
    };
    let createWasCalled = false;
    let updateWasCalled = false;
    const jwt = jwtReturning(validAttestation());
    const svc = service(
      {
        certificate: {
          findUnique: () => Promise.resolve(existing),
          create: () => {
            createWasCalled = true;
            return Promise.resolve(existing);
          },
          update: () => {
            updateWasCalled = true;
            return Promise.resolve(existing);
          },
        },
      },
      jwt,
    );

    const result = await svc.issue(PARTICIPANT, 'token');

    expect(result.codigo).toBe('SW-AAAA-BBBB');
    expect(createWasCalled).toBe(false);
    expect(updateWasCalled).toBe(false);
  });

  // §5.4.1 del diseño: cuando THRESHOLDS crece y la atestación cubre más
  // módulos que la fila guardada, se actualiza `modulos`, pero el `codigo` no
  // cambia — el papel que la persona ya tiene sigue verificándose.
  it('actualiza los módulos y conserva el código cuando el recorrido creció', async () => {
    const existing = {
      id: 'c1',
      participantId: PARTICIPANT.sub,
      codigo: 'SW-AAAA-BBBB',
      modulos: ['phishing', 'smishing'],
      horas: 4,
      calificacion: 12,
      emitidoAt: new Date('2026-09-01T00:00:00.000Z'),
    };
    let updatedData: unknown;
    const jwt = jwtReturning(validAttestation());
    const svc = service(
      {
        certificate: {
          findUnique: () => Promise.resolve(existing),
          update: ({ data }: { data: unknown }) => {
            updatedData = data;
            return Promise.resolve({ ...existing, ...(data as object) });
          },
        },
      },
      jwt,
    );

    const result = await svc.issue(PARTICIPANT, 'token');

    expect(result.codigo).toBe('SW-AAAA-BBBB');
    expect((updatedData as { modulos: string[] }).modulos).toEqual(
      validAttestation().modulos,
    );
    expect((updatedData as { calificacion: number }).calificacion).toBe(30);
  });
});

describe('CertificadosService.verificar', () => {
  it('nunca devuelve nombre, apellido ni correo', async () => {
    const svc = service(
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
      jwtReturning(validAttestation()),
    );

    const result = await svc.verify('SW-AAAA-BBBB');
    const text = JSON.stringify(result);

    expect(text).not.toMatch(/nombre|apellido|email|correo/i);
    expect(result.valido).toBe(true);
  });

  // Un código inexistente responde igual, en forma, que uno revocado: ninguno
  // de los dos debe servir de oráculo sobre cuántos certificados existen.
  it('responde igual para un código inexistente que para uno revocado', async () => {
    const svcNonexistent = service(
      { certificate: { findUnique: () => Promise.resolve(null) } },
      jwtReturning(validAttestation()),
    );
    const svcRevoked = service(
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
      jwtReturning(validAttestation()),
    );

    const nonexistent = await svcNonexistent.verify('SW-0000-0000');
    const revoked = await svcRevoked.verify('SW-AAAA-BBBB');

    expect(nonexistent).toEqual({ valido: false });
    expect(revoked).toEqual({ valido: false });
  });
});

describe('CertificatesService.generatePdf', () => {
  const EXISTING_CERTIFICATE = {
    codigo: 'SW-AAAA-BBBB',
    modulos: ['phishing'],
    horas: 4,
    calificacion: 6,
    emitidoAt: new Date('2026-09-01T00:00:00.000Z'),
    revocadoAt: null as Date | null,
  };
  const PERSON = { nombre: 'Luis', apellido: 'Sagnay' };

  function serviceWithPerson(
    certificate: typeof EXISTING_CERTIFICATE | null,
    person: typeof PERSON | null,
  ) {
    return service(
      {
        certificate: { findUnique: () => Promise.resolve(certificate) },
        participant: { findUnique: () => Promise.resolve(person) },
      },
      jwtReturning(validAttestation()),
    );
  }

  it('regenera el PDF del certificado vigente con el nombre de la base', async () => {
    const svc = serviceWithPerson(EXISTING_CERTIFICATE, PERSON);

    const buffer = await svc.generatePdf(PARTICIPANT, 'token');

    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });

  it('sin certificado emitido, 404', async () => {
    const svc = serviceWithPerson(null, PERSON);

    await expect(svc.generatePdf(PARTICIPANT, 'token')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('un certificado revocado no genera PDF', async () => {
    const svc = serviceWithPerson(
      { ...EXISTING_CERTIFICATE, revocadoAt: new Date() },
      PERSON,
    );

    await expect(svc.generatePdf(PARTICIPANT, 'token')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // Caso de borde: la cuenta se eliminó entre emitir el certificado y pedir
  // el PDF. No debería poder pasar en operación normal, pero si pasa no debe
  // reventar con un nombre `undefined`.
  it('sin la cuenta del participante, 404', async () => {
    const svc = serviceWithPerson(EXISTING_CERTIFICATE, null);

    await expect(svc.generatePdf(PARTICIPANT, 'token')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('CertificadosService.revocar', () => {
  it('marca revocadoAt en la fila indicada', async () => {
    let updateArguments: unknown;
    const svc = service(
      {
        certificate: {
          update: (args: unknown) => {
            updateArguments = args;
            return Promise.resolve({});
          },
        },
      },
      jwtReturning(validAttestation()),
    );

    await svc.revoke('c1');

    expect(updateArguments).toMatchObject({ where: { id: 'c1' } });
    const data = (updateArguments as { data: { revocadoAt: Date } }).data;
    expect(data.revocadoAt).toBeInstanceOf(Date);
  });
});
