import { isEcuadorianId } from './cedula'

// Mismas para todo el mundo (el estímulo no se aleatoriza, corridas comparables)
// e imposibles por construcción: el tercer dígito de la cédula es 9, inválido
// para persona natural, garantizado por el test del módulo (issue #7).
export const IDENTITY_FAKE = {
  cedula: '1799999999',
  // Deliberadamente larga y con "practica" en su propio texto, para que no se
  // parezca a una clave real ni sugiera un patrón para inventarse la suya.
  clave: 'Clave-de-practica-2026',
  ruc: '1799999999001',
  banco: 'Banco del Litoral',
  // Solo los últimos 4: nunca hay un número de tarjeta completo en el módulo.
  tarjeta: '4417',
  cuenta: '2100-0000-99',
} as const

export const ACCOUNT_FAKE = `${IDENTITY_FAKE.banco} · ${IDENTITY_FAKE.cuenta}`

// Se comprueba al importar: si alguien la cambia por una válida, el módulo no
// arranca en desarrollo en vez de publicar el documento de una persona real.
if (import.meta.env.DEV && isEcuadorianId(IDENTITY_FAKE.cedula)) {
  throw new Error(
    'IDENTIDAD_FICTICIA.cedula es una cédula ecuatoriana válida: podría ser la de alguien real.',
  )
}
