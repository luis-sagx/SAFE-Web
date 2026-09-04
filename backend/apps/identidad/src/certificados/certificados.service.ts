import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { AtestacionPayload, JwtPayload } from '@comun';
import { PrismaService } from '../prisma/prisma.service';
import { generarCodigoCertificado } from './codigo';
import { generarCertificadoPdf } from './pdf';

/// Guardada en cada fila (§5.4 del diseño): un certificado ya emitido no debe
/// cambiar de duración si esta constante cambia después.
const HORAS_CERTIFICADO = 4;

/// P2002 es el código de Prisma para violación de índice único. Solo puede
/// chocar aquí por una colisión de `codigo` — astronómicamente rara con este
/// alfabeto, pero se reintenta en vez de fallar la petición del participante.
function esColisionDeUnicidad(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'P2002'
  );
}

export interface CertificadoPublico {
  codigo: string;
  emitidoAt: string;
  modulos: string[];
  horas: number;
}

/// Un código revocado responde exactamente igual que uno inexistente
/// (`{ valido: false }`, sin más campos): distinguirlos serviría de oráculo
/// sobre cuántos certificados existen (§5.6 del diseño).
export interface VerificacionCertificado {
  valido: boolean;
  emitidoAt?: string;
  horas?: number;
  modulos?: string[];
}

@Injectable()
export class CertificadosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /// Verifica el pase que firmó `entrenamiento` y exige que sea del mismo
  /// participante que lo presenta. Sin esto, la atestación de otra persona
  /// —copiada de un log, reenviada— serviría para emitirse un certificado con
  /// el progreso ajeno.
  private async canjear(
    atestacion: string,
    participant: JwtPayload,
  ): Promise<AtestacionPayload> {
    let payload: AtestacionPayload;
    try {
      payload = await this.jwt.verifyAsync<AtestacionPayload>(atestacion);
    } catch {
      throw new ForbiddenException('Atestación inválida o vencida.');
    }

    // Simétrico a lo que exige JwtAuthGuard con 'access': un access token no
    // debe poder canjearse como si fuera una atestación.
    if (payload.typ !== 'atestacion') {
      throw new ForbiddenException('Atestación inválida o vencida.');
    }

    if (payload.sub !== participant.sub) {
      throw new ForbiddenException('La atestación no es de este participante.');
    }

    return payload;
  }

  /// Emite el certificado, o lo actualiza si el recorrido creció desde la
  /// última vez (§5.4.1): mismo `codigo` siempre, para que un certificado
  /// impreso siga verificándose.
  async emitir(
    participant: JwtPayload,
    atestacion: string,
  ): Promise<CertificadoPublico> {
    const payload = await this.canjear(atestacion, participant);

    const existente = await this.prisma.certificate.findUnique({
      where: { participantId: participant.sub },
    });

    if (existente && payload.modulos.length <= existente.modulos.length) {
      return this.aPublico(existente);
    }

    if (existente) {
      const actualizado = await this.prisma.certificate.update({
        where: { id: existente.id },
        data: { modulos: payload.modulos, emitidoAt: new Date() },
      });
      return this.aPublico(actualizado);
    }

    for (let intento = 0; intento < 5; intento++) {
      try {
        const creado = await this.prisma.certificate.create({
          data: {
            participantId: participant.sub,
            codigo: generarCodigoCertificado(),
            modulos: payload.modulos,
            horas: HORAS_CERTIFICADO,
          },
        });
        return this.aPublico(creado);
      } catch (error) {
        if (!esColisionDeUnicidad(error) || intento === 4) throw error;
      }
    }

    // Inalcanzable: el bucle siempre retorna o lanza antes de agotarse.
    throw new Error('No se pudo generar el certificado.');
  }

  /// Regenera el PDF de la fila existente. No lo persiste (§5.4 del diseño):
  /// guardarlo dejaría en disco un archivo con datos personales.
  async generarPdf(
    participant: JwtPayload,
    atestacion: string,
  ): Promise<Buffer> {
    await this.canjear(atestacion, participant);

    const certificado = await this.prisma.certificate.findUnique({
      where: { participantId: participant.sub },
    });

    if (!certificado || certificado.revocadoAt) {
      throw new NotFoundException('No tienes un certificado vigente.');
    }

    const persona = await this.prisma.participant.findUnique({
      where: { id: participant.sub },
      select: { nombre: true, apellido: true },
    });

    if (!persona) {
      throw new NotFoundException('No tienes un certificado vigente.');
    }

    return generarCertificadoPdf({
      nombreCompleto: `${persona.nombre} ${persona.apellido}`.trim(),
      modulos: certificado.modulos,
      horas: certificado.horas,
      emitidoAt: certificado.emitidoAt,
      codigo: certificado.codigo,
      origen: this.config.get(
        'CERTIFICADO_ORIGEN',
        'https://safeweb.espe.edu.ec',
      ),
    });
  }

  /// Pública, sin sesión, con límite por IP (ver el controlador). Nunca
  /// devuelve el nombre: quien verifica ya tiene el PDF con el nombre
  /// delante, y publicarlo convertiría esta ruta en un directorio consultable
  /// de quién participó en el estudio (§5.6 del diseño).
  ///
  /// Un código inexistente responde en la misma forma que uno revocado
  /// —`{ valido: false }`, sin más campos— para no servir de oráculo sobre
  /// cuántos certificados existen.
  async verificar(codigo: string): Promise<VerificacionCertificado> {
    const certificado = await this.prisma.certificate.findUnique({
      where: { codigo },
    });

    if (!certificado || certificado.revocadoAt) {
      return { valido: false };
    }

    return {
      valido: true,
      emitidoAt: certificado.emitidoAt.toISOString(),
      horas: certificado.horas,
      modulos: certificado.modulos,
    };
  }

  /// Solo la usa un supervisor (retiro de consentimiento, incidencia). No hay
  /// revocación automática por bajar de umbral: ver el comentario de
  /// `revocadoAt` en el schema.
  async revocar(id: string): Promise<void> {
    await this.prisma.certificate.update({
      where: { id },
      data: { revocadoAt: new Date() },
    });
  }

  private aPublico(certificado: {
    codigo: string;
    emitidoAt: Date;
    modulos: string[];
    horas: number;
  }): CertificadoPublico {
    return {
      codigo: certificado.codigo,
      emitidoAt: certificado.emitidoAt.toISOString(),
      modulos: certificado.modulos,
      horas: certificado.horas,
    };
  }
}
