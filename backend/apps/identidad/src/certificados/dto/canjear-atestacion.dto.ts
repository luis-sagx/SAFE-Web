import { IsJWT } from 'class-validator';

/// Lo único que viaja en el cuerpo: el pase que firmó `entrenamiento`. El
/// resto (nombre, progreso) sale de verificarlo, no de lo que declare quien
/// llama — nada de eso se acepta suelto en el body.
export class CanjearAtestacionDto {
  @IsJWT({ message: 'La atestación no tiene un formato válido.' })
  atestacion: string;
}
