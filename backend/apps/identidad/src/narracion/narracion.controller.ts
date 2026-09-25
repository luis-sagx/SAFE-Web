import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import {
  CurrentParticipant,
  JwtAuthGuard,
  ParticipantGuard,
  type JwtPayload,
} from '@comun';
import { NarracionService } from './narracion.service';

@Controller('narracion')
export class NarracionController {
  constructor(private readonly narracion: NarracionService) {}

  @UseGuards(JwtAuthGuard, ParticipantGuard)
  @Get('saludo')
  async saludo(
    @CurrentParticipant() participant: JwtPayload,
    @Res() res: Response,
  ) {
    const audio = await this.narracion.saludo(participant);
    res
      .status(200)
      // El MP3 lleva el nombre real de la persona: no debe quedar en la
      // caché en disco del navegador (el servidor ya lo cachea en memoria).
      .set({ 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' })
      .send(audio);
  }
}
