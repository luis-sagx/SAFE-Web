import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  CurrentParticipant,
  JwtAuthGuard,
  SupervisorGuard,
  type JwtPayload,
} from '@comun';
import { CreateRunDto } from './dto/create-run.dto';
import { RunsService } from './runs.service';

@UseGuards(JwtAuthGuard)
@Controller('runs')
export class RunsController {
  constructor(private readonly runs: RunsService) {}

  /// El participantId y el seudónimo salen del token, nunca del body: así un
  /// participante no puede escribir resultados a nombre de otro.
  @Post()
  create(
    @CurrentParticipant() participant: JwtPayload,
    @Body() dto: CreateRunDto,
  ) {
    return this.runs.create(participant, dto);
  }

  @Get('me')
  findMine(@CurrentParticipant() participant: JwtPayload) {
    return this.runs.findMine(participant.sub);
  }

  @Get('progreso/:modulo')
  progress(
    @CurrentParticipant() participant: JwtPayload,
    @Param('modulo') module: string,
  ) {
    return this.runs.progress(participant.sub, module);
  }

  /// Pase para el certificado: 409 con los módulos que faltan si no están
  /// todos aprobados, o `{ atestacion }` firmada si lo están. `identidad` la
  /// verifica y le pega el nombre; este servicio nunca lo conoce.
  @Get('atestacion')
  attestation(@CurrentParticipant() participant: JwtPayload) {
    return this.runs.attestation(participant);
  }

  /// Resultados del estudio para el supervisor: se ven dentro de la app, no se
  /// descargan. Solo sale el seudónimo (P001), nunca un dato personal — este
  /// servicio no tiene la tabla de participantes ni permiso para alcanzarla.
  @UseGuards(SupervisorGuard)
  @Get('resultados')
  results() {
    return this.runs.results();
  }
}
