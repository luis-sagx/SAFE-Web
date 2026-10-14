import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  AdminGuard,
  CurrentParticipant,
  JwtAuthGuard,
  ParticipantGuard,
  type JwtPayload,
} from '@comun';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto } from './create-assessment.dto';
import { QUESTIONNAIRE } from './questionnaire';
@Controller('assessments')
@UseGuards(JwtAuthGuard)
export class AssessmentsController {
  constructor(private readonly assessments: AssessmentsService) {}
  @Get('questionnaire')
  @UseGuards(ParticipantGuard)
  questionnaire() {
    return QUESTIONNAIRE;
  }
  @Get('status')
  @UseGuards(ParticipantGuard)
  status(@CurrentParticipant() participant: JwtPayload) {
    return this.assessments.status(participant.sub);
  }
  @Post()
  @UseGuards(ParticipantGuard)
  create(
    @CurrentParticipant() participant: JwtPayload,
    @Body() dto: CreateAssessmentDto,
  ) {
    return this.assessments.create(participant, dto);
  }
  @Get('results')
  @UseGuards(AdminGuard)
  results() {
    return this.assessments.results();
  }
}
