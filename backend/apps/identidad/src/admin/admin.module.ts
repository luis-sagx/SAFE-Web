import { Module } from '@nestjs/common';
import { AuthJwtModule } from '@comun';
import { AdminController } from './admin.controller';
import { AdminCertificatesController } from './admin-certificados.controller';
import { AdminService } from './admin.service';
import { CertificatesModule } from '../certificados/certificados.module';

/// AuthJwtModule por el JwtAuthGuard, que verifica el token. PrismaService es
/// global, no hace falta importarlo. CertificadosModule por la revocación
/// —reutiliza el mismo servicio que emite, no una copia de la lógica.
@Module({
  imports: [AuthJwtModule, CertificatesModule],
  controllers: [AdminController, AdminCertificatesController],
  providers: [AdminService],
})
export class AdminModule {}
