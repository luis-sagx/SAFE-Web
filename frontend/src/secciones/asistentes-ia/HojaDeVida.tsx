import type { ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import AIChatScenario from './EscenarioChatIA'
import { createAIChat, withAIResponse, mark, signal } from './chatIA'

/** Hoja de vida = documento de identidad disfrazado de currículum, pegado entero (copiar/pegar sin leer), no un
 *  dato suelto colado en un texto. escenarioId sigue siendo `correo-credenciales` porque ahí están guardadas
 *  las corridas anteriores. */

const TIME = '19:40'

const NAME = 'Paola Guamán'
// Imposible por construcción: tercer dígito 9, que el Registro Civil no asigna (ver identidadFicticia).
const ECUADORIAN_ID = '1799999980'
const BIRTH = '12/03/1999'
const ADDRESS = 'Av. Napo y Quimiag, casa 214'
const PHONE = '099 000 0011'
// Dominio de entrenamiento, no uno real: un gmail aquí podría existir y llegarle a alguien.
const EMAIL = 'paola.guaman@safeweb.com'

const PATH =
  'Experiencia: asistencia administrativa 2023–2026 en Comercial Andes. Estudios: Tecnología en Administración.'

const PROMPT_CV_COMPLETE = `Aquí va: ${NAME}, cédula ${ECUADORIAN_ID}, fecha de nacimiento ${BIRTH}, domicilio ${ADDRESS}, teléfono ${PHONE}, correo ${EMAIL}. ${PATH}`
const PROMPT_ONLY_CONTACT = `Aquí va: ${NAME}, teléfono ${PHONE}, correo ${EMAIL}. ${PATH}`
const PROMPT_WITHOUT_DATA = `Aquí va solo la parte que hay que mejorar. ${PATH} Los datos de contacto los pongo yo al final.`

// Va en el computador: una hoja de vida se arma con el archivo abierto al lado, de un copiar y pegar.
const CHAT = createAIChat(
  'Asistente de escritura · servicio externo',
  [
    { texto: 'Hola, ayúdame a mejorar la hoja de vida de mi prima.', mio: true },
    {
      texto:
        'Con gusto. Pégame el contenido que quieres mejorar y te lo devuelvo ordenado, con mejor redacción y un perfil profesional al inicio.',
    },
  ],
  TIME,
  [
    { texto: PROMPT_CV_COMPLETE, goto: 'e_cv_completo' },
    { texto: PROMPT_ONLY_CONTACT, goto: 'e_solo_contacto' },
    { texto: PROMPT_WITHOUT_DATA, goto: 'e_sin_datos' },
  ],
  { titulo: 'Asistente IA', url: 'https://chat.asistente-ia.com/nuevo' },
)

// Maquetada por secciones (no un párrafo): eso es lo que vale la pena pegar, y también lo que copia el documento entero en el chat.
const improvedResume = (contact: string[], completion: string) =>
  [
    'Aquí tienes la hoja de vida mejorada:',
    '',
    '<b>Perfil profesional</b>',
    'Profesional con tres años de experiencia en gestión documental y atención al cliente, con orientación al orden y al cumplimiento de plazos.',
    ...(contact.length > 0 ? ['', ...contact] : []),
    '',
    '<b>Experiencia</b>',
    'Comercial Andes — Asistencia administrativa (2023–2026)',
    '',
    '<b>Formación</b>',
    'Tecnología en Administración',
    '',
    completion,
  ].join('<br>')

const SUBMISSION_CV_COMPLETE = withAIResponse(
  CHAT,
  TIME,
  mark(PROMPT_CV_COMPLETE, {
    'dato-cedula': ECUADORIAN_ID,
    'dato-nacimiento': BIRTH,
    'dato-direccion': ADDRESS,
    'dato-telefono': PHONE,
  }),
  improvedResume(
    [
      '<b>Datos personales</b>',
      `${NAME} · C.I. ${ECUADORIAN_ID} · ${BIRTH}`,
      `${ADDRESS} · ${PHONE} · ${EMAIL}`,
    ],
    '¿Quieres que le dé un tono más formal o que la ajuste a una vacante en concreto?',
  ),
)
const SUBMISSION_ONLY_CONTACT = withAIResponse(
  CHAT,
  TIME,
  mark(PROMPT_ONLY_CONTACT, { 'dato-telefono': PHONE }),
  improvedResume(
    ['<b>Contacto</b>', `${NAME} · ${PHONE} · ${EMAIL}`],
    '¿Quieres que la ajuste a una vacante en concreto?',
  ),
)
const SUBMISSION_WITHOUT_DATA = withAIResponse(
  CHAT,
  TIME,
  PROMPT_WITHOUT_DATA,
  improvedResume([], 'Agrega los datos de contacto al inicio antes de enviarla.'),
)

const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: CHAT },
  e_cv_completo: {
    kind: 'bad',
    view: SUBMISSION_CV_COMPLETE,
    senales: [
      signal(
        'dato-cedula',
        'e_cv_completo',
        'La <b>cédula</b> de tu prima. Es el número con el que se abre una cuenta, se firma un contrato o se pide un crédito a su nombre — y no mejora en nada la redacción de su hoja de vida.',
      ),
      signal(
        'dato-nacimiento',
        'e_cv_completo',
        'Su <b>fecha de nacimiento</b>. Junto a la cédula es la pareja que piden casi todos los formularios para comprobar que alguien es quien dice ser.',
      ),
      signal(
        'dato-direccion',
        'e_cv_completo',
        'Su <b>domicilio</b>, con casa y número. Es el único dato de la lista que dice dónde duerme.',
      ),
      signal(
        'dato-telefono',
        'e_cv_completo',
        'Su <b>teléfono</b>. Cierra el paquete: quién es, cuándo nació, dónde vive y por dónde contactarla, todo en un solo mensaje.',
      ),
    ],
    verdict: 'La hoja de vida entera de tu prima quedó en un servicio externo',
    outcome:
      'Una hoja de vida es un documento de identidad disfrazado de currículum. Para mejorar la redacción, la IA no necesitaba la cédula, la fecha de nacimiento, el domicilio ni el teléfono de tu prima — y te los devolvió maquetados, así que ahora están dos veces en esa conversación. Ella nunca decidió compartirlos.',
  },
  e_solo_contacto: {
    kind: 'partial',
    view: SUBMISSION_ONLY_CONTACT,
    senales: [
      signal(
        'dato-telefono',
        'e_solo_contacto',
        'Quitaste la cédula, la fecha y el domicilio, pero dejaste el <b>teléfono</b> y el correo: no dicen quién es ante un trámite, pero sí por dónde llegar hasta ella.',
      ),
    ],
    verdict: 'Quitaste lo peor, pero dejaste cómo encontrarla',
    outcome:
      'Lo grave —cédula, fecha de nacimiento y domicilio— se quedó fuera. El teléfono y el correo tampoco hacían falta para mejorar la redacción, y son con los que empieza cualquier intento de estafa dirigida.',
  },
  e_sin_datos: {
    kind: 'good',
    view: SUBMISSION_WITHOUT_DATA,
    senales: [
      signal(
        'borrador-enviado',
        'e_sin_datos',
        'Le pegaste a la IA solo lo que había que mejorar: la experiencia y los estudios. Ninguna de las dos cosas identifica a nadie.',
      ),
    ],
    verdict: 'Hoja de vida mejorada sin entregar los datos de nadie',
    outcome:
      'La IA devolvió el perfil, la experiencia y la formación mejor redactados. La cabecera con el nombre y el contacto de tu prima la pegas tú en el documento que se envía — donde sí corresponde.',
  },
}

const SIGNALS = [
  signal(
    'cv-en-juego',
    'n1',
    'La IA te pide el <b>contenido que quieres mejorar</b>. La hoja de vida trae además la cédula, la fecha de nacimiento, el domicilio y el teléfono de tu prima — y ninguno de esos cambia cómo se redacta su experiencia.',
  ),
]

const RULE =
  'Regla de oro: una hoja de vida es un documento de identidad disfrazado de currículum. Antes de pegar una en una IA —la tuya o la de alguien más— quítale la <b>cédula, la fecha de nacimiento, el domicilio y el teléfono</b>: en la que se envía, esos los pones tú.'

const SUMMARY = 'Le pides a una IA que mejore la hoja de vida de tu prima, con la cédula y la dirección dentro.'

const CONTEXT: Context = {
  antes: 'Tu prima está postulando a una vacante y te pidió que le arregles la hoja de vida antes de mandarla.',
  ahora: (
    <>
      <strong>Abres el asistente de IA</strong> en el computador, con el archivo que ella te pasó abierto
      al lado, listo para copiar y pegar.
    </>
  ),
}

function Resume() {
  return (
    <AIChatScenario
      escenarioId="asistentes-ia/correo-credenciales"
      resumen={SUMMARY}
      contexto={CONTEXT}
      story={STORY}
      senales={SIGNALS}
      rule={RULE}
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Toca una de las respuestas para elegir qué le pegas a la IA.
        </p>
      }
      pista={
        <p>
          La IA puede mejorar la experiencia y los estudios sin saber la cédula de tu prima ni dónde vive.
          Lo que decides es cuánto del documento le pegas.
        </p>
      }
    />
  )
}

export default Resume
