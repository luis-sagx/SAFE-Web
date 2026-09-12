import type { ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import AIChatScenario from './EscenarioChatIA'
import { createAIChat, withAIResponse, mark, signal } from './chatIA'

/** La IA es legítima; el riesgo está en lo que el participante le escribe antes de pedir ayuda —aquí, el
 *  docente y los datos de una compañera que no hacían falta para redactar el texto. */

const TIME = '10:14'

// Imposible por construcción, como la del participante: tercer dígito 9, que el Registro Civil no asigna (ver identidadFicticia).
const ECUADORIAN_ID = '1799999990'
const NAME = 'Andrea Cedeño'
// Dominio de entrenamiento, no uno real: un gmail aquí podría existir y llegarle a alguien.
const EMAIL = 'andrea.cedeno02@safeweb.com'
const TEACHER = 'Ing. Marcelo Tapia'

const PROMPT_WITH_DATA = `Es para el ${TEACHER}, para pedirle un cambio de horario a nombre de mi compañera ${NAME}, cédula ${ECUADORIAN_ID}, correo ${EMAIL}. Es de la materia de Redes.`
const PROMPT_WITHOUT_DATA =
  'Es para un docente, para pedirle un cambio de horario a nombre de una compañera, en la materia de Redes. Deja en blanco los datos de ella y del profe, que yo los lleno después.'
const PROMPT_WITHOUT_AI = 'Mejor lo escribo yo, gracias.'

// El chat abre con saludo + pregunta de la IA; lo que se elige es la respuesta a esa pregunta, no un segundo mensaje encima.
const CHAT = createAIChat(
  'Redactor de mensajes · servicio externo',
  [
    { texto: 'Hola, ayúdame a redactar un correo.', mio: true },
    {
      texto:
        'Claro que sí. ¿Sobre qué asunto es el correo, a quién va dirigido y qué debe incluir? Con esos datos te lo entrego formal y listo para enviar.',
    },
  ],
  TIME,
  [
    { texto: PROMPT_WITH_DATA, goto: 'e_datos_completos' },
    { texto: PROMPT_WITHOUT_DATA, goto: 'e_sin_datos' },
    { texto: PROMPT_WITHOUT_AI, goto: 'e_no_usa_ia' },
  ],
)

// La IA responde con el correo armado (asunto, saludo, despedida), no una línea suelta: así se reconoce como una respuesta real.
const EMAIL_WITH_DATA = [
  'Aquí tienes el correo:',
  '',
  `<b>Asunto:</b> Solicitud de cambio de horario – Redes de Computadores / ${NAME}`,
  '',
  `Estimado ${TEACHER}:`,
  '',
  'Reciba un cordial saludo.',
  '',
  `Por medio del presente me dirijo a usted de manera respetuosa con el fin de solicitar formalmente un cambio de horario en la asignatura de Redes, a nombre de mi compañera ${NAME}, identificada con número de cédula ${ECUADORIAN_ID} y correo ${EMAIL}.`,
  '',
  'Quedo atento a su respuesta.',
  '',
  'Atentamente,',
  '',
  '¿Quieres que agregue el horario que solicita o el motivo del cambio?',
].join('<br>')

const EMAIL_WITHOUT_DATA = [
  'Aquí tienes el correo, con los espacios listos para completar:',
  '',
  '<b>Asunto:</b> Solicitud de cambio de horario – Redes de Computadores / [nombre de la estudiante]',
  '',
  'Estimado Ing. [apellido del docente]:',
  '',
  'Reciba un cordial saludo.',
  '',
  'Por medio del presente me dirijo a usted de manera respetuosa con el fin de solicitar formalmente un cambio de horario en la asignatura de Redes, a nombre de mi compañera [nombre completo], identificada con número de cédula [cédula] y correo [correo].',
  '',
  'Quedo atento a su respuesta.',
  '',
  'Atentamente,',
  '',
  'Reemplaza los corchetes antes de enviarlo.',
].join('<br>')

const SUBMISSION_COMPLETE = withAIResponse(
  CHAT,
  TIME,
  mark(PROMPT_WITH_DATA, {
    'dato-docente': TEACHER,
    'dato-nombre': NAME,
    'dato-cedula': ECUADORIAN_ID,
    'dato-correo': EMAIL,
  }),
  EMAIL_WITH_DATA,
)
const SUBMISSION_WITHOUT_DATA = withAIResponse(CHAT, TIME, PROMPT_WITHOUT_DATA, EMAIL_WITHOUT_DATA)
const WITHOUT_AI = withAIResponse(
  CHAT,
  TIME,
  PROMPT_WITHOUT_AI,
  'Entendido. Si más adelante quieres que revise la redacción o el tono del correo, aquí estaré.',
)

const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: CHAT },
  e_datos_completos: {
    kind: 'bad',
    view: SUBMISSION_COMPLETE,
    senales: [
      signal(
        'dato-docente',
        'e_datos_completos',
        'El <b>nombre del docente</b>. Por sí solo no es un secreto, pero es el que convierte el mensaje en un caso real: quién pide qué, y a quién.',
      ),
      signal(
        'dato-nombre',
        'e_datos_completos',
        'El <b>nombre completo</b> de tu compañera. Para redactar el correo bastaba con "una compañera": quién es no cambia ni una palabra del texto.',
      ),
      signal(
        'dato-cedula',
        'e_datos_completos',
        'Su <b>cédula</b>. Es el dato que la identifica ante cualquier trámite del país, y salió hacia un servicio externo sin que nadie se lo pidiera.',
      ),
      signal(
        'dato-correo',
        'e_datos_completos',
        'Su <b>correo</b>. La IA no lo necesitaba para escribir la solicitud: es a ella a quien le llegará el spam si esa conversación se filtra.',
      ),
    ],
    verdict: 'Datos de una compañera compartidos con la IA',
    outcome:
      'Para redactar un texto, la IA no necesita el nombre completo, la cédula ni el correo de la persona involucrada, ni saber a qué docente va dirigido. Todo eso quedó en un servicio externo, fuera de tu control y sin que ninguno de los dos se enterara.',
  },
  e_sin_datos: {
    kind: 'good',
    view: SUBMISSION_WITHOUT_DATA,
    senales: [
      signal(
        'borrador-enviado',
        'e_sin_datos',
        'Le contaste a la IA lo que necesitaba saber —el asunto, que va a un docente, la materia— y nada más. Ni un nombre, ni una cédula, ni un correo.',
      ),
    ],
    verdict: 'Correo redactado sin compartir datos de nadie',
    outcome:
      'La IA armó el correo con espacios en blanco donde van los nombres y los datos de tu compañera, y esos los completas tú al final. Conseguiste la misma ayuda sin entregar nada de ella.',
  },
  e_no_usa_ia: {
    kind: 'partial',
    view: WITHOUT_AI,
    verdict: 'Evitaste el riesgo, pero no hacía falta',
    outcome:
      'No compartiste ningún dato, pero tampoco hacía falta renunciar a la ayuda: bastaba con no escribir el nombre, la cédula y el correo de tu compañera.',
  },
}

const SIGNALS = [
  signal(
    'datos-en-juego',
    'n1',
    'La IA te pregunta qué debe incluir el correo. Tienes a la mano el <b>nombre completo</b>, la <b>cédula</b> y el <b>correo</b> de tu compañera — y ninguno de los tres cambia cómo se redacta la solicitud.',
  ),
]

const RULE =
  'Regla de oro: antes de escribirle a una IA, revisa si tu mensaje trae <b>nombres, cédulas, correos o teléfonos de otras personas</b>. Si no hacen falta para lo que le pides, quítalos primero.'

const SUMMARY = 'Le pides a una IA que redacte un correo a nombre de una compañera, con los datos de ella a la mano.'

const CONTEXT: Context = {
  antes: 'Coordinas trámites de tus compañeros de clase y sueles usar una IA para que tus correos suenen más formales.',
  ahora: (
    <>
      <strong>Abres el chat de la IA</strong> para que te ayude con el correo del cambio de horario que
      pidió tu compañera.
    </>
  ),
}

function ThirdPartyDataEmail() {
  return (
    <AIChatScenario
      escenarioId="asistentes-ia/correo-datos-terceros"
      resumen={SUMMARY}
      contexto={CONTEXT}
      story={STORY}
      senales={SIGNALS}
      rule={RULE}
      pista={
        <p>
          La IA puede redactar el correo sin saber de quién habla. Lo que decides es si se lo dices de
          todos modos.
        </p>
      }
    />
  )
}

export default ThirdPartyDataEmail
