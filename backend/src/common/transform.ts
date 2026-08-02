import { Transform, type TransformFnParams } from 'class-transformer';

/// Normaliza solo si el valor llega como texto; cualquier otro tipo pasa
/// intacto para que lo rechace class-validator.
export function TransformarTexto(
  normalizar: (valor: string) => string,
): PropertyDecorator {
  return Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? normalizar(value) : (value as unknown),
  );
}

/// El correo es la llave única del participante: "Ana@X.com " no puede crear
/// una segunda cuenta de la misma persona.
export const NormalizarEmail = () =>
  TransformarTexto((valor) => valor.trim().toLowerCase());
