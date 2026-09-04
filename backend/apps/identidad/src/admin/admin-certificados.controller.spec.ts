import { AdminCertificadosController } from './admin-certificados.controller';
import type { CertificadosService } from '../certificados/certificados.service';

describe('AdminCertificadosController', () => {
  it('revocar delega en el servicio con el id de la ruta', async () => {
    let idRecibido: string | undefined;
    const servicio = {
      revocar: (id: string) => {
        idRecibido = id;
        return Promise.resolve();
      },
    } as unknown as CertificadosService;

    const controller = new AdminCertificadosController(servicio);
    await controller.revocar('c1');

    expect(idRecibido).toBe('c1');
  });
});
