import { Module } from '@nestjs/common';
import { AuthJwtModule } from '@comun';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';
@Module({
  imports: [AuthJwtModule],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
