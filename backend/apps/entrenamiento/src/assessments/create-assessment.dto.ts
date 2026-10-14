import {
  ArrayMaxSize,
  ArrayMinSize,
  Equals,
  IsArray,
  IsIn,
  IsInt,
  Max,
  Min,
} from 'class-validator';
import {
  AGE_RANGES,
  ASSESSMENT_VERSION,
  CONSENT_VERSION,
  GENDERS,
} from './questionnaire';
export class CreateAssessmentDto {
  @IsIn(['PRE', 'POST'], {
    message: 'Selecciona una fase de evaluación válida.',
  })
  phase: 'PRE' | 'POST';
  @Equals(ASSESSMENT_VERSION, {
    message: 'La versión de la encuesta no es válida.',
  })
  version: number;
  @IsIn(AGE_RANGES, { message: 'Selecciona tu rango de edad.' })
  ageRange: string;
  @IsIn(GENDERS, { message: 'Selecciona una opción de género.' })
  gender: string;
  @IsArray({ message: 'Las respuestas deben ser una lista.' })
  @ArrayMinSize(21, { message: 'Responde las 21 preguntas.' })
  @ArrayMaxSize(21, {
    message: 'La encuesta contiene exactamente 21 preguntas.',
  })
  @IsInt({
    each: true,
    message: 'Selecciona una respuesta válida en cada pregunta.',
  })
  @Min(0, {
    each: true,
    message: 'Selecciona una respuesta válida en cada pregunta.',
  })
  @Max(3, {
    each: true,
    message: 'Selecciona una respuesta válida en cada pregunta.',
  })
  answers: number[];
  @Equals(true, {
    message: 'Debes aceptar el consentimiento de la encuesta para enviarla.',
  })
  consentAccepted: boolean;
  @Equals(CONSENT_VERSION, {
    message: 'Actualiza la página para leer el consentimiento vigente.',
  })
  consentVersion: string;
}
