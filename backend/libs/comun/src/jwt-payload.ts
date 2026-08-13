/**
 * Contrato del token entre los dos servicios. `identidad` lo firma,
 * `entrenamiento` lo verifica; ninguno llama al otro por red.
 *
 * `seq` viaja en el token a propósito: es el único campo del participante que
 * el análisis necesita —el seudónimo (P001)— y no lo identifica. Llevándolo
 * aquí, `entrenamiento` puede etiquetar cada corrida sin tener jamás forma de
 * leer un dato personal.
 */
export interface JwtPayload {
  sub: string;
  seq: number;
  role: string;
}
