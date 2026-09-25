// Datos del proyecto que aparecen en la política de datos y en los términos
// de uso. Es el ÚNICO lugar donde se editan: ambas páginas los leen de aquí.

export const PROJECT_TITLE =
  'Diseño y desarrollo de ambientes interactivos de simulación para educación de usuarios no técnicos frente a ciberamenazas seleccionadas en el Ecuador'

export const INSTITUTION = 'Universidad de las Fuerzas Armadas ESPE'

export const DEGREE = 'Ingeniería de Software'

/// Autores y responsables del tratamiento de datos.
// TODO: poner aquí los correos reales de contacto.
export const CONTACTS = [
  { name: 'Luis Sagnay', email: 'luis@gmail.com' },
  { name: 'Sebastián Parra', email: 'sebas@gmail.com' },
]

/// "Luis Sagnay y Sebastián Parra", para usar dentro de una frase.
export const AUTHOR_NAMES = CONTACTS.map((c) => c.name).join(' y ')
