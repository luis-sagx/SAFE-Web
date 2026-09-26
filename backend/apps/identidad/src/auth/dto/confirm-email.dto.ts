import { IsString, MaxLength } from 'class-validator';

export class ConfirmEmailDto {
  /// El token de un solo uso que llegó por correo (ver AuthService.register).
  @IsString()
  @MaxLength(128)
  token: string;
}
