// Contrato entre los dos servicios (identidad firma, entrenamiento verifica, sin red).
// `seq` viaja para el seudónimo (P001) sin identificar a la persona. `typ: 'access'` evita
// que un refresh token robado (mismo secreto) sirva como access token de vida larga.
export interface JwtPayload {
  sub: string;
  seq: number;
  role: string;
  typ: 'access';
}

// Token de vida larga, solo entre identidad y sí misma (POST /auth/refresh). Lleva
// `sub` y `tokenVersion`: el resto se relee de la base en cada refresco, así una cuenta
// desactivada se refleja en, como máximo, la vida del access token. `tokenVersion` viaja
// aparte porque, a diferencia de `disabledAt`, no basta con releerla: hay que compararla
// contra la del token para saber si YA cambió desde que se emitió (issue #256, restablecer
// la contraseña la incrementa e invalida los refresh tokens ya emitidos).
export interface RefreshTokenPayload {
  sub: string;
  tokenVersion: number;
  typ: 'refresh';
}

// Pase de un solo salto para el certificado: entrenamiento firma, identidad verifica.
// Reutilizable en sus 5 minutos de vida (se gasta dos veces: emitir y descargar).
// identidad exige que `sub` coincida con el access token, para que no sirva ajena.
export interface AttestationPayload {
  sub: string;
  seq: number;
  // Módulos que entrenamiento verificó aprobados (de THRESHOLDS): lo que el certificado
  // imprime y lo que decide si un recorrido mayor debe actualizar uno ya emitido.
  modulos: string[];
  // CORRECTOS sobre el total de escenarios de `modulos` (TOTALES_MODULOS); lo calcula y
  // firma entrenamiento porque identidad no puede consultar las corridas por su cuenta.
  calificacion: number;
  typ: 'atestacion';
}
