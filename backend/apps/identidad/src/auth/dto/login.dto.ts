import { IsEmail, IsString, MaxLength } from 'class-validator';
import { NormalizarEmail } from '@comun';

export class LoginDto {
  @IsEmail({}, { message: 'El correo no tiene un formato válido.' })
  @MaxLength(120)
  @NormalizarEmail()
  email: string;

  // Sin MinLength: acá no se valida la política de contraseñas, solo se
  // comprueba. Un mínimo en el login le diría a un atacante cuándo una
  // contraseña es demasiado corta para siquiera existir.
  @IsString()
  @MaxLength(128)
  password: string;
}
