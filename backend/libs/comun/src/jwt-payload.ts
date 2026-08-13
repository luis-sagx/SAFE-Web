/**
 * Contrato del token entre los dos servicios. `identidad` lo firma,
 * `entrenamiento` lo verifica; ninguno llama al otro por red.
 *
 * `seq` viaja en el token a propósito: es el único campo del participante que
 * el análisis necesita —el seudónimo (P001)— y no lo identifica. Llevándolo
 * aquí, `entrenamiento` puede etiquetar cada corrida sin tener jamás forma de
 * leer un dato personal.
 *
 * `typ: 'access'` distingue este token del de refresco (`RefreshTokenPayload`):
 * los dos se firman con el mismo secreto, así que sin esta marca un refresh
 * token robado serviría también como token de acceso —con su expiración
 * larga— y no con la corta que se diseñó. `JwtAuthGuard` rechaza cualquier
 * token cuyo `typ` no sea `'access'`.
 */
export interface JwtPayload {
  sub: string;
  seq: number;
  role: string;
  typ: 'access';
}

/**
 * Token de vida larga que solo `identidad` firma y solo `identidad` verifica
 * (en `POST /auth/refresh`): `entrenamiento` nunca lo ve. Lleva únicamente el
 * `sub` porque el resto (`seq`, `role`, estado de la cuenta) se relee de la
 * base en cada refresco —así una cuenta desactivada o un cambio de rol se
 * refleja en, como máximo, la vida del access token, no en la del refresh.
 */
export interface RefreshTokenPayload {
  sub: string;
  typ: 'refresh';
}
