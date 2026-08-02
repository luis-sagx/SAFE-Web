import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NormalizarEmail, TransformarTexto } from '../../common/transform';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @TransformarTexto((valor) => valor.trim())
  nombre: string;

  @IsEmail({}, { message: 'El correo no tiene un formato válido.' })
  @MaxLength(120)
  @NormalizarEmail()
  email: string;

  /// Se limpian espacios, guiones y paréntesis antes de validar.
  @IsString()
  @Matches(/^[0-9]{7,15}$/, {
    message: 'El teléfono debe tener entre 7 y 15 dígitos.',
  })
  @TransformarTexto((valor) => valor.replace(/[\s()+-]/g, ''))
  telefono: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @MaxLength(128)
  password: string;

  /// Grupo de la muestra; lo fija el investigador.
  @IsOptional()
  @IsString()
  @MaxLength(60)
  cohort?: string;
}
