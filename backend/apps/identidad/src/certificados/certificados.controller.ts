import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { CurrentParticipant, JwtAuthGuard, type JwtPayload } from '@comun';
import { CanjearAtestacionDto } from './dto/canjear-atestacion.dto';
import { CertificadosService } from './certificados.service';

@Controller('certificados')
export class CertificadosController {
  constructor(private readonly certificados: CertificadosService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  emitir(
    @CurrentParticipant() participant: JwtPayload,
    @Body() dto: CanjearAtestacionDto,
  ) {
    return this.certificados.emitir(participant, dto.atestacion);
  }

  /// `POST` y no `GET`: la atestación es un JWT, y en la query string acabaría
  /// en los logs de nginx y en el historial del navegador.
  @UseGuards(JwtAuthGuard)
  @Post('pdf')
  async pdf(
    @CurrentParticipant() participant: JwtPayload,
    @Body() dto: CanjearAtestacionDto,
    @Res() res: Response,
  ) {
    const buffer = await this.certificados.generarPdf(
      participant,
      dto.atestacion,
    );
    res
      .status(200)
      .set({
        'Content-Type': 'application/pdf',
        'Content-Disposition':
          'attachment; filename="certificado-safe-web.pdf"',
      })
      .send(buffer);
  }

  /// La única ruta pública de este controlador: sin `JwtAuthGuard`, y con
  /// límite propio (§5.6 del diseño) porque el guard de `ThrottlerModule`
  /// global (120/min) no basta para una ruta sin sesión.
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get('verificar/:codigo')
  verificar(@Param('codigo') codigo: string) {
    return this.certificados.verificar(codigo);
  }
}
