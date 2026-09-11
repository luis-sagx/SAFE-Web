// Contrato entre los dos servicios (identidad firma, entrenamiento verifica, sin red).
// `seq` viaja para el seudónimo (P001) sin identificar a la persona. `typ: 'access'` evita
// que un refresh token robado (mismo secreto) sirva como access token de vida larga.
export interface JwtPayload {
  sub: string;
  seq: number;
  role: string;
  typ: 'access';
}

// Token de vida larga, solo entre identidad y sí misma (POST /auth/refresh). Lleva solo
// `sub`: el resto se relee de la base en cada refresco, así una cuenta desactivada se
// refleja en, como máximo, la vida del access token.
export interface RefreshTokenPayload {
  sub: string;
  typ: 'refresh';
}

// Pase de un solo salto para el certificado: entrenamiento firma, identidad verifica.
// Reutilizable en sus 5 minutos de vida (se gasta dos veces: emitir y descargar).
// identidad exige que `sub` coincida con el access token, para que no sirva ajena.
export interface AtestacionPayload {
  sub: string;
  seq: number;
  // Módulos que entrenamiento verificó aprobados (de UMBRALES): lo que el certificado
  // imprime y lo que decide si un recorrido mayor debe actualizar uno ya emitido.
  modulos: string[];
  // CORRECTOS sobre los 48 del entrenamiento; lo calcula y firma entrenamiento porque
  // identidad no puede consultar las corridas por su cuenta.
  calificacion: number;
  typ: 'atestacion';
}
