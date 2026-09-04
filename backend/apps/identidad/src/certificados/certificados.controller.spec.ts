import type { Response } from 'express';
import type { JwtPayload } from '@comun';
import { CertificadosController } from './certificados.controller';
import type { CertificadosService } from './certificados.service';

const PARTICIPANTE: JwtPayload = {
  sub: 'uuid-participante',
  seq: 7,
  role: 'PARTICIPANT',
  typ: 'access',
};

/// Respuesta de Express falsa, con la misma cadena `.status().set().send()`
/// que usa el controlador — sin levantar Nest ni un servidor HTTP real, igual
/// que los demás tests de este proyecto instancian sus servicios a mano.
function respuestaFalsa() {
  const llamadas: {
    status?: number;
    headers?: Record<string, string>;
    body?: unknown;
  } = {};
  const res = {
    status: (codigo: number) => {
      llamadas.status = codigo;
      return res;
    },
    set: (headers: Record<string, string>) => {
      llamadas.headers = headers;
      return res;
    },
    send: (body: unknown) => {
      llamadas.body = body;
      return res;
    },
  } as unknown as Response;
  return { res, llamadas };
}

describe('CertificadosController', () => {
  it('emitir delega en el servicio con el participante del token, no del body', async () => {
    let recibido: { participante: JwtPayload; atestacion: string } | undefined;
    const servicio = {
      emitir: (participante: JwtPayload, atestacion: string) => {
        recibido = { participante, atestacion };
        return Promise.resolve({
          codigo: 'SW-AAAA-BBBB',
          emitidoAt: 'x',
          modulos: [],
          horas: 4,
        });
      },
    } as unknown as CertificadosService;

    const controller = new CertificadosController(servicio);
    const resultado = await controller.emitir(PARTICIPANTE, {
      atestacion: 'un.jwt.valido',
    });

    expect(recibido).toEqual({
      participante: PARTICIPANTE,
      atestacion: 'un.jwt.valido',
    });
    expect(resultado.codigo).toBe('SW-AAAA-BBBB');
  });

  it('pdf responde el buffer con el content-type y el nombre de archivo correctos', async () => {
    const buffer = Buffer.from('%PDF-simulado');
    const servicio = {
      generarPdf: () => Promise.resolve(buffer),
    } as unknown as CertificadosService;
    const { res, llamadas } = respuestaFalsa();

    const controller = new CertificadosController(servicio);
    await controller.pdf(PARTICIPANTE, { atestacion: 'un.jwt.valido' }, res);

    expect(llamadas.status).toBe(200);
    expect(llamadas.headers).toMatchObject({
      'Content-Type': 'application/pdf',
    });
    expect(llamadas.headers?.['Content-Disposition']).toContain(
      'certificado-safe-web.pdf',
    );
    expect(llamadas.body).toBe(buffer);
  });

  it('verificar no exige participante y delega el código tal cual', () => {
    let codigoRecibido: string | undefined;
    const servicio = {
      verificar: (codigo: string) => {
        codigoRecibido = codigo;
        return Promise.resolve({ valido: true });
      },
    } as unknown as CertificadosService;

    const controller = new CertificadosController(servicio);
    void controller.verificar('SW-RQFS-XBC2');

    expect(codigoRecibido).toBe('SW-RQFS-XBC2');
  });
});
