/**
 * Contrato del token entre los dos servicios. `identidad` lo firma,
 * `entrenamiento` lo verifica; ninguno llama al otro por red.
 *
 * `seq` y `cohort` viajan en el token a propósito: son los dos únicos campos
 * del participante que el análisis necesita —el seudónimo (P001) y el grupo de
 * la muestra— y ninguno lo identifica. Llevándolos aquí, `entrenamiento` puede
 * etiquetar cada corrida y exportar el CSV sin tener jamás forma de leer un
 * dato personal.
 */
export interface JwtPayload {
  sub: string;
  seq: number;
  cohort: string | null;
  role: string;
}
