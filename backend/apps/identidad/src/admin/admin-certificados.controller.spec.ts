import { AdminCertificatesController } from './admin-certificados.controller';
import type { CertificatesService } from '../certificados/certificados.service';

describe('AdminCertificadosController', () => {
  it('restaurar usa el id del certificado de la ruta', async () => {
    const restore = jest.fn().mockResolvedValue(undefined);
    const service = { restore } as unknown as CertificatesService;

    await new AdminCertificatesController(service).restore('certificado-1');

    expect(restore).toHaveBeenCalledWith('certificado-1');
  });

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
