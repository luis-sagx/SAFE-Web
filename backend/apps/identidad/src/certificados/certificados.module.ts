import { Module } from '@nestjs/common';
import { AuthJwtModule } from '@comun';
import { CertificadosController } from './certificados.controller';
import { CertificadosService } from './certificados.service';

/// `AuthJwtModule` por dos motivos: `JwtAuthGuard` verifica el access token, y
/// `JwtService` verifica la atestación que firma `entrenamiento` —mismo
/// secreto, sin llamada de red. `CertificadosService` se exporta porque
/// `AdminModule` la reutiliza para la revocación.
@Module({
  imports: [AuthJwtModule],
  controllers: [CertificadosController],
  providers: [CertificadosService],
  exports: [CertificadosService],
})
export class CertificadosModule {}
