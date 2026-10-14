import { Module } from '@nestjs/common';
import { AuthJwtModule } from '@comun';
import { SusController } from './sus.controller';
import { SusService } from './sus.service';

@Module({
  imports: [AuthJwtModule],
  controllers: [SusController],
  providers: [SusService],
})
export class SusModule {}
