import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard, JwtAuthGuard } from '@comun';
import { AdminService } from './admin.service';
import { ChangeStatusDto } from './dto/cambiar-estado.dto';
import { CreateTrainerDto } from './dto/create-trainer.dto';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/trainers')
export class TrainersController {
  constructor(private readonly admin: AdminService) {}

  @Post()
  create(@Body() dto: CreateTrainerDto) {
    return this.admin.createTrainer(dto);
  }

  @Get()
  list() {
    return this.admin.listTrainers();
  }

  @Patch(':id/estado')
  @HttpCode(200)
  changeStatus(@Param('id') id: string, @Body() dto: ChangeStatusDto) {
    return this.admin.changeTrainerStatus(id, dto.activo);
  }

  @Post(':id/restablecer-password')
  @HttpCode(200)
  resetPassword(@Param('id') id: string) {
    return this.admin.resetPassword(id, 'TRAINER');
  }
}
