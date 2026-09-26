import type { Response } from 'express';
import type { JwtPayload } from '@comun';
import { NarracionController } from './narracion.controller';
import type { NarracionService } from './narracion.service';

const PARTICIPANT: JwtPayload = {
  sub: 'uuid-a',
  seq: 7,
  role: 'PARTICIPANT',
  typ: 'access',
};

/// Misma respuesta de Express falsa que certificados.controller.spec.ts.
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

describe('NarracionController', () => {
  it('saludo delega en el servicio con el participante del token y responde audio/mpeg', async () => {
    const audio = Buffer.from('mp3-falso');
    let received: JwtPayload | undefined;
    const service = {
      saludo: (participant: JwtPayload) => {
        received = participant;
        return Promise.resolve(audio);
      },
    } as unknown as NarracionService;

    const controller = new NarracionController(service);
    const { res, calls } = fakeResponse();
    await controller.saludo(PARTICIPANT, res);

    expect(received).toEqual(PARTICIPANT);
    expect(calls.status).toBe(200);
    expect(calls.headers).toEqual({
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-store',
    });
    expect(calls.body).toBe(audio);
  });
});
