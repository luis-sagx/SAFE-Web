import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NormalizeEmail, TransformText } from '@comun';
import { IsAllowedDomain } from '../../auth/dominios-correo';
import { NAME_PATTERN } from '../../auth/dto/register.dto';

const MESSAGE_NAME = 'Solo se permiten letras y espacios entre palabras.';

export class CreateTrainerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Matches(NAME_PATTERN, { message: MESSAGE_NAME })
  @TransformText((value) => value.trim())
  nombre: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Matches(NAME_PATTERN, { message: MESSAGE_NAME })
  @TransformText((value) => value.trim())
  apellido: string;

  @IsEmail({}, { message: 'El correo no tiene un formato válido.' })
  @IsAllowedDomain()
  @MaxLength(120)
  @NormalizeEmail()
  email: string;
}
