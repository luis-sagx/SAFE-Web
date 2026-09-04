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

/**
 * Pase de un solo salto entre los dos servicios, para el certificado: lo
 * firma `entrenamiento` (que conoce el progreso) y lo verifica `identidad`
 * (que conoce el nombre). Es la única forma en que `2026-09-03…` permite que
 * el progreso cruce hacia el otro servicio, sin que se llamen entre sí.
 *
 * Reutilizable dentro de sus 5 minutos de vida, no de un solo uso: el flujo la
 * gasta dos veces seguidas (emitir el certificado, descargar el PDF).
 * `identidad` exige además que `sub` coincida con el del access token de quien
 * la presenta — sin eso, la atestación de otra persona serviría para
 * emitirse un certificado con su progreso.
 */
export interface AtestacionPayload {
  sub: string;
  seq: number;
  /** Los módulos que `entrenamiento` verificó aprobados al firmar, tomados de
   *  `UMBRALES`. Es lo que el certificado imprime, y lo que decide si un
   *  recorrido mayor debe actualizar uno ya emitido (ver §5.4.1 del diseño). */
  modulos: string[];
  typ: 'atestacion';
}
