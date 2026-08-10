import { Module } from '@nestjs/common';
import { AuthJwtModule } from '@comun';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

/// AuthJwtModule por el JwtAuthGuard, que verifica el token. PrismaService es
/// global, no hace falta importarlo.
@Module({
  imports: [AuthJwtModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
