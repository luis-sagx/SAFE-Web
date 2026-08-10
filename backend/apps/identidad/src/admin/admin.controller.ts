import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, SupervisorGuard } from '@comun';
import { AdminService } from './admin.service';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto';

/// Gestión de cuentas de participante. Toda la ruta exige token válido (JwtAuthGuard)
/// y rol de supervisor (SupervisorGuard): un participante nunca la alcanza.
@UseGuards(JwtAuthGuard, SupervisorGuard)
@Controller('admin/participantes')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get()
  listar() {
    return this.admin.listar();
  }

  @Patch(':id/estado')
  cambiarEstado(@Param('id') id: string, @Body() dto: CambiarEstadoDto) {
    return this.admin.cambiarEstado(id, dto.activo);
  }

  @Post(':id/restablecer-password')
  @HttpCode(200)
  restablecerPassword(@Param('id') id: string) {
    return this.admin.restablecerPassword(id);
  }

  @Delete(':id')
  @HttpCode(204)
  async eliminar(@Param('id') id: string) {
    await this.admin.eliminar(id);
  }
}
