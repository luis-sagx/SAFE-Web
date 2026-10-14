import {
  ArrayMaxSize,
  ArrayMinSize,
  Equals,
  IsArray,
  IsInt,
  Max,
  Min,
} from 'class-validator';
import { SUS_VERSION } from './sus-survey';

export class CreateSusResponseDto {
  @Equals(SUS_VERSION, { message: 'La versión de la encuesta no es válida.' })
  version: number;

  @IsArray({ message: 'Las respuestas deben ser una lista.' })
  @ArrayMinSize(10, { message: 'Responde las diez preguntas.' })
  @ArrayMaxSize(10, {
    message: 'La encuesta contiene exactamente diez preguntas.',
  })
  @IsInt({
    each: true,
    message: 'Selecciona una respuesta válida en cada pregunta.',
  })
  @Min(1, {
    each: true,
    message: 'Selecciona una respuesta válida en cada pregunta.',
  })
  @Max(5, {
    each: true,
    message: 'Selecciona una respuesta válida en cada pregunta.',
  })
  answers: number[];
}
