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

/// Solo letras (con tildes y ñ) y espacios entre palabras — y ningún espacio
/// como primer o último carácter, ni dos seguidos: eso es lo que distingue un
/// nombre compuesto real ("María José") de basura como " nombre" o "nombre  ".
/// Dígitos, guiones, apóstrofes y el resto de la puntuación de código (`;`,
/// `<`, `>`, etc.) quedan fuera por no estar en la lista, sin necesidad de
/// enumerarlos aparte.
///
/// Duplicado a propósito en `frontend/src/pages/Registro.tsx`: es el mismo
/// caso que `esCedulaEcuatoriana` (cedula.ts en los dos lados), no el del
/// dominio de correo — aquí sí hace falta la regla en el cliente para el
/// error antes de enviar, y no hay ningún endpoint al que consultarla.
export const NOMBRE_PATRON =
  /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?: [A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
const NOMBRE_MENSAJE = 'Solo se permiten letras y espacios entre palabras.';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Matches(NOMBRE_PATRON, { message: NOMBRE_MENSAJE })
  @TransformarTexto((valor) => valor.trim())
  nombre: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Matches(NOMBRE_PATRON, { message: NOMBRE_MENSAJE })
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
