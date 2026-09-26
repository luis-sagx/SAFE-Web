import { IsEmail, MaxLength } from 'class-validator';
import { NormalizeEmail } from '@comun';

export class ResendConfirmationDto {
  @IsEmail({}, { message: 'El correo no tiene un formato válido.' })
  @MaxLength(120)
  @NormalizeEmail()
  email: string;
}
