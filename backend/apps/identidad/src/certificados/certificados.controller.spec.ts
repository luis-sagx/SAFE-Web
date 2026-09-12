import type { Response } from 'express';
import type { JwtPayload } from '@comun';
import { CertificatesController } from './certificados.controller';
import type { CertificatesService } from './certificados.service';

const PARTICIPANT: JwtPayload = {
  sub: 'uuid-participante',
  seq: 7,
  role: 'PARTICIPANT',
  typ: 'access',
};

/// Respuesta de Express falsa, con la misma cadena `.status().set().send()`
/// que usa el controlador — sin levantar Nest ni un servidor HTTP real, igual
/// que los demás tests de este proyecto instancian sus servicios a mano.
function fakeResponse() {
  const calls: {
    status?: number;
    headers?: Record<string, string>;
    body?: unknown;
  } = {};
  const res = {
    status: (code: number) => {
      calls.status = code;
      return res;
    },
    set: (headers: Record<string, string>) => {
      calls.headers = headers;
      return res;
    },
    send: (body: unknown) => {
      calls.body = body;
      return res;
    },
  } as unknown as Response;
  return { res, calls };
}

describe('CertificadosController', () => {
  it('emitir delega en el servicio con el participante del token, no del body', async () => {
    let received: { participante: JwtPayload; atestacion: string } | undefined;
    const service = {
      issue: (participant: JwtPayload, attestation: string) => {
        received = { participante: participant, atestacion: attestation };
        return Promise.resolve({
          codigo: 'SW-AAAA-BBBB',
          emitidoAt: 'x',
          modulos: [],
          horas: 4,
        });
      },
    } as unknown as CertificatesService;

    const controller = new CertificatesController(service);
    const result = await controller.issue(PARTICIPANT, {
      atestacion: 'un.jwt.valido',
    });

    expect(received).toEqual({
      participante: PARTICIPANT,
      atestacion: 'un.jwt.valido',
    });
    expect(result.codigo).toBe('SW-AAAA-BBBB');
  });

  it('pdf responde el buffer con el content-type y el nombre de archivo correctos', async () => {
    const buffer = Buffer.from('%PDF-simulado');
    const service = {
      generatePdf: () => Promise.resolve(buffer),
    } as unknown as CertificatesService;
    const { res, calls } = fakeResponse();

    const controller = new CertificatesController(service);
    await controller.pdf(PARTICIPANT, { atestacion: 'un.jwt.valido' }, res);

    expect(calls.status).toBe(200);
    expect(calls.headers).toMatchObject({
      'Content-Type': 'application/pdf',
    });
    expect(calls.headers?.['Content-Disposition']).toContain(
      'certificado-safe-web.pdf',
    );
    expect(calls.body).toBe(buffer);
  });

  it('verificar no exige participante y delega el código tal cual', () => {
    let codeReceived: string | undefined;
    const service = {
      verify: (code: string) => {
        codeReceived = code;
        return Promise.resolve({ valido: true });
      },
    } as unknown as CertificatesService;

    const controller = new CertificatesController(service);
    void controller.verify('SW-RQFS-XBC2');

    expect(codeReceived).toBe('SW-RQFS-XBC2');
  });
});
