import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NormalizarEmail, TransformarTexto } from '@comun';
import { EsCedulaEcuatoriana } from '../../cedula/cedula';
import { EsDominioPermitido } from '../dominios-correo';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @TransformarTexto((valor) => valor.trim())
  nombre: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @TransformarTexto((valor) => valor.trim())
  apellido: string;

  @IsEmail({}, { message: 'El correo no tiene un formato válido.' })
  @EsDominioPermitido()
  @MaxLength(120)
  @NormalizarEmail()
  email: string;

  /// Se limpian espacios, puntos y guiones antes de validar: mucha gente la
  /// escribe "1710034065" y mucha otra "171003406-5".
  ///
  /// El valor en claro se usa solo para calcular su HMAC y se descarta ahí
  /// mismo. Ver `apps/identidad/src/cedula/cedula.ts`.
  @EsCedulaEcuatoriana()
  @TransformarTexto((valor) => valor.replace(/[\s.-]/g, ''))
  cedula: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @MaxLength(128)
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message:
      'La contraseña debe incluir al menos una mayúscula, un número y un carácter especial.',
  })
  password: string;
}
