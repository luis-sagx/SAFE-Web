import { IsBoolean } from 'class-validator';

export class ChangeStatusDto {
  /// true = activa la cuenta; false = la desactiva.
  @IsBoolean()
  activo: boolean;
}
