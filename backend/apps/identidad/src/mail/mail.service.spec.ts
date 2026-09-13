import type { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

/// `resend.emails.send` es lo único que se llama: se mockea la clase entera
/// para no salir a la red real en un test unitario.
const sendMock = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: sendMock },
  })),
}));

function fakeConfig() {
  return {
    getOrThrow: () => 're_fake',
    get: (_key: string, def: string) => def,
  } as unknown as ConfigService;
}

describe('MailService.enviarCertificado', () => {
  beforeEach(() => {
    sendMock.mockReset();
  });

  it('devuelve true y manda el PDF adjunto cuando Resend no reporta error', async () => {
    sendMock.mockResolvedValue({ data: { id: 'abc' }, error: null });
    const mail = new MailService(fakeConfig());

    const pdf = Buffer.from('contenido-pdf');
    const sent = await mail.sendCertificate('ana@gmail.com', 'Ana', pdf);

    expect(sent).toBe(true);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ana@gmail.com',
        attachments: [{ filename: 'certificado-safe-web.pdf', content: pdf }],
      }),
    );
  });

  it('devuelve false y no lanza cuando Resend reporta error', async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: { message: 'dominio no verificado' },
    });
    const mail = new MailService(fakeConfig());

    const sent = await mail.sendCertificate(
      'ana@gmail.com',
      'Ana',
      Buffer.from(''),
    );

    expect(sent).toBe(false);
  });
});
