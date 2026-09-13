import { Controller, HttpCode, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, SupervisorGuard } from '@comun';
import { CertificatesService } from '../certificados/certificados.service';

/// Revocación del certificado: solo un supervisor, por retiro de
/// consentimiento o incidencia. No existe revocación automática por bajar de
/// umbral (ver el comentario de `revocadoAt` en el schema y §5.3 del diseño).
@UseGuards(JwtAuthGuard, SupervisorGuard)
@Controller('admin/certificados')
export class AdminCertificatesController {
  constructor(private readonly certificates: CertificatesService) {}

  @Patch(':id/revocar')
  @HttpCode(204)
  async revoke(@Param('id') id: string) {
    await this.certificates.revoke(id);
  }
}
