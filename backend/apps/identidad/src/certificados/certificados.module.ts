import { Module } from '@nestjs/common';
import { AuthJwtModule } from '@comun';
import { MailModule } from '../mail/mail.module';
import { CertificatesController } from './certificados.controller';
import { CertificatesService } from './certificados.service';

/// `AuthJwtModule` por dos motivos: `JwtAuthGuard` verifica el access token, y
/// `JwtService` verifica la atestación que firma `entrenamiento` —mismo
/// secreto, sin llamada de red. `CertificadosService` se exporta porque
/// `AdminModule` la reutiliza para la revocación.
@Module({
  imports: [AuthJwtModule, MailModule],
  controllers: [CertificatesController],
  providers: [CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
