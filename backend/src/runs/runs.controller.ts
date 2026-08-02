import { Body, Controller, Get, Header, Post, UseGuards } from '@nestjs/common';
import type { JwtPayload } from '../auth/auth.service';
import { CurrentParticipant } from '../auth/current-participant.decorator';
import { JwtAuthGuard, ResearcherGuard } from '../auth/jwt-auth.guard';
import { CreateRunDto } from './dto/create-run.dto';
import { RunsService } from './runs.service';

@UseGuards(JwtAuthGuard)
@Controller('runs')
export class RunsController {
  constructor(private readonly runs: RunsService) {}

  /// El participantId sale del token, nunca del body: así un participante no
  /// puede escribir resultados a nombre de otro.
  @Post()
  create(
    @CurrentParticipant() participant: JwtPayload,
    @Body() dto: CreateRunDto,
  ) {
    return this.runs.create(participant.sub, dto);
  }

  @Get('me')
  findMine(@CurrentParticipant() participant: JwtPayload) {
    return this.runs.findMine(participant.sub);
  }

  @UseGuards(ResearcherGuard)
  @Get('export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="corridas.csv"')
  exportCsv() {
    return this.runs.exportCsv();
  }
}
