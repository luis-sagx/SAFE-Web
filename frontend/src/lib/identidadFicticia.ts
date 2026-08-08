import { esCedulaEcuatoriana } from './cedula'

/**
 * La cédula y la cuenta bancaria que el participante "tiene" dentro de los
 * escenarios.
 *
 * Existe porque un formulario falso que pide la cédula y el número de cuenta no
 * enseña nada si esos campos se leen como casillas vacías: hay que saber que lo
 * que se entrega es *lo tuyo*. Los escenarios ya daban un correo ficticio por
 * el mismo motivo; esto completa la identidad prestada.
 *
 * Son las mismas para todo el mundo, a propósito. El estímulo no se aleatoriza
 * entre participantes: dos personas que vean números distintos habrían hecho
 * ejercicios distintos, y las corridas dejarían de ser comparables.
 *
 * Y son imposibles por construcción, no solo inventadas. El tercer dígito de la
 * cédula es 9, y el algoritmo del Registro Civil solo acepta menos de 6 para
 * una persona natural: este número no puede pertenecerle a nadie. Lo garantiza
 * el test de este módulo, no la buena intención de quien lo eligió — es la
 * regla que más importa del proyecto (ver issue #7: nunca se pide ni se muestra
 * el documento real de nadie).
 */
export const IDENTIDAD_FICTICIA = {
  cedula: '1799999999',
  /// El mismo número con el sufijo de persona natural, para las facturas.
  ruc: '1799999999001',
  banco: 'Banco del Litoral',
  cuenta: '2100-0000-99',
} as const

/** La cuenta como se lee de corrido: "Banco del Litoral · 2100-0000-99". */
export const CUENTA_FICTICIA = `${IDENTIDAD_FICTICIA.banco} · ${IDENTIDAD_FICTICIA.cuenta}`

/// Se comprueba al importar, no solo en el test: si alguien cambia el número
/// por uno válido —creyendo que "queda más realista"— el módulo entero deja de
/// arrancar en desarrollo en vez de publicar el documento de una persona real.
if (import.meta.env.DEV && esCedulaEcuatoriana(IDENTIDAD_FICTICIA.cedula)) {
  throw new Error(
    'IDENTIDAD_FICTICIA.cedula es una cédula ecuatoriana válida: podría ser la de alguien real.',
  )
}
