import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const RUN_OUTCOMES = ['CORRECTO', 'PARCIAL', 'INCORRECTO'] as const;
export type RunOutcomeValue = (typeof RUN_OUTCOMES)[number];

/// Validación estricta a propósito: un registro mal formado corrompe el
/// análisis estadístico del estudio.
export class CreateRunDto {
  /// "<seccionId>/<escenarioId>", igual al id del catálogo del frontend.
  @IsString()
  @MaxLength(80)
  @Matches(/^[a-z0-9-]+\/[a-z0-9-]+$/, {
    message: 'scenarioId debe tener el formato "seccion/escenario".',
  })
  scenarioId: string;

  @IsInt()
  @Min(1)
  version: number;

  @IsIn(RUN_OUTCOMES)
  outcome: RunOutcomeValue;

  @IsInt()
  @Min(0)
  @Max(100)
  score: number;

  @IsString()
  @MaxLength(60)
  endingId: string;

  @IsInt()
  @Min(0)
  durationMs: number;

  @IsDateString()
  startedAt: string;

  /// Traza de la corrida (lista de nodos/decisiones); se guarda en JSONB. Se
  /// valida que sea un arreglo acotado: sin esto el cliente podía escribir
  /// cualquier JSON de forma y tamaño arbitrarios en la tabla del estudio.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  decisions?: unknown[];
}
