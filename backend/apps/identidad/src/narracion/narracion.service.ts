import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { JwtPayload } from '@comun';
import { decryptOptional } from '../pii/pii';
import { PrismaService } from '../prisma/prisma.service';

const VOZ_ID = '3597a26f-80ef-4bd5-8101-9699bc764917';
const MODELO = 'sonic-2';

/// Igual que `firstName()` en frontend/src/context/AuthContext.tsx: recorta
/// y toma el primer token. Vive duplicada a propósito — un nombre es un
/// string, no vale la pena una dependencia compartida frontend/backend por
/// una línea, y así cada lado se puede tocar sin coordinar un release.
function primerNombre(nombreCompleto: string | null): string {
  return nombreCompleto?.trim().split(/\s+/)[0] ?? '';
}

function textoSaludo(nombre: string): string {
  return nombre
    ? `Hola, ${nombre}. Esto es lo que te está pasando:`
    : 'Hola. Esto es lo que te está pasando:';
}

@Injectable()
export class NarracionService {
  private readonly piiKey: string;
  private readonly cartesiaKey: string;
  // En memoria, no en disco (ver certificados.service.ts: un archivo
  // generado a partir de datos personales no se persiste a propósito).
  private readonly cache = new Map<string, Buffer>();

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.piiKey = config.getOrThrow<string>('PII_ENCRYPTION_KEY');
    this.cartesiaKey = config.getOrThrow<string>('CARTESIA_API_KEY');
  }

  async saludo(participant: JwtPayload): Promise<Buffer> {
    const person = await this.prisma.participant.findUnique({
      where: { id: participant.sub },
      select: { nombre: true },
    });

    const nombre = primerNombre(
      decryptOptional(person?.nombre ?? null, this.piiKey),
    );

    const cached = this.cache.get(nombre);
    if (cached) return cached;

    const audio = await this.sintetizar(textoSaludo(nombre));
    this.cache.set(nombre, audio);
    return audio;
  }

  private async sintetizar(texto: string): Promise<Buffer> {
    const response = await fetch('https://api.cartesia.ai/tts/bytes', {
      method: 'POST',
      headers: {
        'X-API-Key': this.cartesiaKey,
        'Cartesia-Version': '2024-11-13',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: MODELO,
        transcript: texto,
        voice: { mode: 'id', id: VOZ_ID },
        output_format: {
          container: 'mp3',
          sample_rate: 44100,
          bit_rate: 128000,
        },
        language: 'es',
      }),
      // Saludo corto en el camino crítico de un botón, no una generación en
      // batch: 15 s, no los 60 s que usa el script de generación en lote
      // (frontend/scripts/narracion.py).
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(`Cartesia respondió ${response.status}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }
}
