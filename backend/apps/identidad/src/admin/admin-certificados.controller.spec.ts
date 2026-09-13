import { AdminCertificatesController } from './admin-certificados.controller';
import type { CertificatesService } from '../certificados/certificados.service';

describe('AdminCertificadosController', () => {
  it('revocar delega en el servicio con el id de la ruta', async () => {
    let idReceived: string | undefined;
    const service = {
      revoke: (id: string) => {
        idReceived = id;
        return Promise.resolve();
      },
    } as unknown as CertificatesService;

    const controller = new AdminCertificatesController(service);
    await controller.revoke('c1');

    expect(idReceived).toBe('c1');
  });
});
