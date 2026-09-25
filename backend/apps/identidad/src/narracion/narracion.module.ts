import { Module } from '@nestjs/common';
import { AuthJwtModule } from '@comun';
import { NarracionController } from './narracion.controller';
import { NarracionService } from './narracion.service';

@Module({
  imports: [AuthJwtModule],
  controllers: [NarracionController],
  providers: [NarracionService],
})
export class NarracionModule {}
