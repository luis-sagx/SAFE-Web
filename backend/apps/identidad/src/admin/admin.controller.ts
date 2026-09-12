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
import { ChangeStatusDto } from './dto/cambiar-estado.dto';

/// Gestión de cuentas de participante. Toda la ruta exige token válido (JwtAuthGuard)
/// y rol de supervisor (SupervisorGuard): un participante nunca la alcanza.
@UseGuards(JwtAuthGuard, SupervisorGuard)
@Controller('admin/participantes')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get()
  list() {
    return this.admin.list();
  }

  @Patch(':id/estado')
  changeStatus(@Param('id') id: string, @Body() dto: ChangeStatusDto) {
    return this.admin.changeStatus(id, dto.activo);
  }

  @Post(':id/restablecer-password')
  @HttpCode(200)
  resetPassword(@Param('id') id: string) {
    return this.admin.resetPassword(id);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string) {
    await this.admin.delete(id);
  }
}
