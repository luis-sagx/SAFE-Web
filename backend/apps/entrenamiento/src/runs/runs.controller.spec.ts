import type { JwtPayload } from '@comun';
import { RunsController } from './runs.controller';
import type { RunsService } from './runs.service';

const PARTICIPANT: JwtPayload = {
  sub: 'uuid-a',
  seq: 7,
  role: 'PARTICIPANT',
  typ: 'access',
};

// Las demás rutas de este controlador solo se prueban por e2e, como el resto
// del repositorio; esta se agrega junto con `atestacion()`, la única que no
// tenían.
describe('RunsController.atestacion', () => {
  it('delega en el servicio con el participante del token', async () => {
    let received: JwtPayload | undefined;
    const service = {
      attestation: (participant: JwtPayload) => {
        received = participant;
        return Promise.resolve({ atestacion: 'un.jwt.firmado' });
      },
    } as unknown as RunsService;

    const controller = new RunsController(service);
    const result = await controller.attestation(PARTICIPANT);

    expect(received).toBe(PARTICIPANT);
    expect(result).toEqual({ atestacion: 'un.jwt.firmado' });
  });
});
