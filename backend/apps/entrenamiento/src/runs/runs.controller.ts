import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentParticipant,
  JwtAuthGuard,
  ResearcherGuard,
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
  progreso(
    @CurrentParticipant() participant: JwtPayload,
    @Param('modulo') modulo: string,
  ) {
    return this.runs.progreso(participant.sub, modulo);
  }

  @UseGuards(ResearcherGuard)
  @Get('export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="corridas.csv"')
  exportCsv() {
    return this.runs.exportCsv();
  }
}
