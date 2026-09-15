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

describe('RunsController.restart', () => {
  it('usa el participante autenticado y el módulo de la ruta', async () => {
    const restart = jest
      .fn()
      .mockResolvedValue({ escenarios: [], aprobados: 0 });
    const controller = new RunsController({
      restart,
    } as unknown as RunsService);

    await controller.restart(PARTICIPANT, 'phishing');

    expect(restart).toHaveBeenCalledWith(PARTICIPANT.sub, 'phishing');
  });
});
