import type { ConfigService } from '@nestjs/config';
import type { JwtPayload } from '@comun';
import { NarracionService } from './narracion.service';
import type { PrismaService } from '../prisma/prisma.service';

const PARTICIPANT: JwtPayload = {
  sub: 'uuid-a',
  seq: 7,
  role: 'PARTICIPANT',
  typ: 'access',
};

function fakeConfig(): ConfigService {
  return {
    getOrThrow: (key: string) => {
      if (key === 'PII_ENCRYPTION_KEY') return 'clave-de-prueba';
      if (key === 'CARTESIA_API_KEY') return 'sk_car_prueba';
      throw new Error(`config no esperada: ${key}`);
    },
  } as unknown as ConfigService;
}

function fakePrisma(nombre: string | null): PrismaService {
  return {
    participant: {
      findUnique: () =>
        Promise.resolve(nombre === undefined ? null : { nombre }),
    },
  } as unknown as PrismaService;
}

describe('NarracionService.saludo', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sintetiza "Hola, {primerNombre}. Esto es lo que te está pasando:" con Cartesia', async () => {
    const audio = Buffer.from('mp3-falso');
    // Node reutiliza un pool interno de 8KB para buffers pequeños, así que
    // `audio.buffer` no son solo los 9 bytes de 'mp3-falso': hay que recortar
    // al offset/longitud reales para simular lo que un `fetch` de verdad
    // devolvería en `arrayBuffer()`.
    const arrayBuffer = audio.buffer.slice(
      audio.byteOffset,
      audio.byteOffset + audio.byteLength,
    );
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(arrayBuffer),
    });
    jest.spyOn(global, 'fetch').mockImplementation(fetchMock as never);

    const service = new NarracionService(
      fakePrisma('Sebastián Parra'),
      fakeConfig(),
    );
    const result = await service.saludo(PARTICIPANT);

    expect(result).toEqual(audio);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.cartesia.ai/tts/bytes');
    const body = JSON.parse(init.body as string) as { transcript: string };
    expect(body.transcript).toBe(
      'Hola, Sebastián. Esto es lo que te está pasando:',
    );
  });

  it('cachea en memoria: la segunda llamada con el mismo nombre no vuelve a llamar a Cartesia', async () => {
    const audio = Buffer.from('mp3-falso');
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(audio.buffer),
    });
    jest.spyOn(global, 'fetch').mockImplementation(fetchMock as never);

    const service = new NarracionService(fakePrisma('Ana López'), fakeConfig());
    await service.saludo(PARTICIPANT);
    await service.saludo(PARTICIPANT);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('sin nombre (dato anonimizado), usa el saludo genérico y no revienta', async () => {
    const audio = Buffer.from('mp3-falso');
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(audio.buffer),
    });
    jest.spyOn(global, 'fetch').mockImplementation(fetchMock as never);

    const service = new NarracionService(fakePrisma(null), fakeConfig());
    await service.saludo(PARTICIPANT);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as { transcript: string };
    expect(body.transcript).toBe('Hola. Esto es lo que te está pasando:');
  });
});
