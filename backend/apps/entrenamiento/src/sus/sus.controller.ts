import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  AdminGuard,
  CurrentParticipant,
  JwtAuthGuard,
  ParticipantGuard,
  type JwtPayload,
} from '@comun';
import { CreateSusResponseDto } from './create-sus-response.dto';
import { SusService } from './sus.service';

@Controller('sus')
@UseGuards(JwtAuthGuard)
export class SusController {
  constructor(private readonly sus: SusService) {}

  @Get('status')
  @UseGuards(ParticipantGuard)
  status(@CurrentParticipant() participant: JwtPayload) {
    return this.sus.status(participant.sub);
  }

  @Post()
  @UseGuards(ParticipantGuard)
  create(
    @CurrentParticipant() participant: JwtPayload,
    @Body() dto: CreateSusResponseDto,
  ) {
    return this.sus.create(participant, dto);
  }

  @Get('results')
  @UseGuards(AdminGuard)
  results() {
    return this.sus.results();
  }
}
