import { IsBoolean } from 'class-validator';

export class CambiarEstadoDto {
  /// true = activa la cuenta; false = la desactiva.
  @IsBoolean()
  activo: boolean;
}
