import { Module } from '@nestjs/common';
import { AuthJwtModule } from '@comun';
import { RunsController } from './runs.controller';
import { RunsService } from './runs.service';

@Module({
  // Solo la configuración del JWT para poder verificar el token. Este servicio
  // nunca firma tokens ni llama al servicio de identidad.
  imports: [AuthJwtModule],
  controllers: [RunsController],
  providers: [RunsService],
})
export class RunsModule {}
