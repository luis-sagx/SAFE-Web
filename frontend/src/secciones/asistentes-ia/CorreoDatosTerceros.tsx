import type { ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import EscenarioChatIA from './EscenarioChatIA'
import { crearChatIA, conRespuestaIA, marcar, senal } from './chatIA'

/**
 * Puerta de entrada de la sección: la IA no engaña a nadie, es una herramienta
 * legítima. El riesgo está en lo que el propio participante le escribe antes de
 * pedir ayuda — aquí, el docente al que va el correo y el nombre, la cédula y
 * el correo de una compañera, que no hacen falta para redactar un texto.
 */

const HORA = '10:14'

/// Imposible por construcción, como la del participante: tercer dígito 9, que
/// el Registro Civil no le da a ninguna persona natural (ver identidadFicticia).
const CEDULA = '1799999990'
const NOMBRE = 'Andrea Cedeño'
/// Dominio del entrenamiento, no uno de verdad: una dirección de gmail escrita
/// aquí podría existir y llegarle a alguien.
const CORREO = 'andrea.cedeno02@safeweb.com'
const DOCENTE = 'Ing. Marcelo Tapia'

const PROMPT_CON_DATOS = `Es para el ${DOCENTE}, para pedirle un cambio de horario a nombre de mi compañera ${NOMBRE}, cédula ${CEDULA}, correo ${CORREO}. Es de la materia de Redes.`
const PROMPT_SIN_DATOS =
  'Es para un docente, para pedirle un cambio de horario a nombre de una compañera, en la materia de Redes. Deja en blanco los datos de ella y del profe, que yo los lleno después.'
const PROMPT_SIN_IA = 'Mejor lo escribo yo, gracias.'

// El chat arranca con un saludo que ya dice a qué vienes y una respuesta de la
// IA que pregunta lo que le falta: uno y uno, como cualquier conversación. Lo
// que se elige después es la contestación a esa pregunta, no un segundo
// mensaje tuyo encima del primero.
const CHAT = crearChatIA(
  'Redactor de mensajes · servicio externo',
  [
    { texto: 'Hola, ayúdame a redactar un correo.', mio: true },
    {
      texto:
        'Claro que sí. ¿Sobre qué asunto es el correo, a quién va dirigido y qué debe incluir? Con esos datos te lo entrego formal y listo para enviar.',
    },
  ],
  HORA,
  [
    { texto: PROMPT_CON_DATOS, goto: 'e_datos_completos' },
    { texto: PROMPT_SIN_DATOS, goto: 'e_sin_datos' },
    { texto: PROMPT_SIN_IA, goto: 'e_no_usa_ia' },
  ],
)

// La IA no contesta con una línea entre comillas: devuelve el correo armado,
// con su asunto, su saludo y su despedida, y cierra ofreciendo más. Escrito de
// un tirón no se reconocía como lo que un asistente de verdad entrega.
const CORREO_CON_DATOS = [
  'Aquí tienes el correo:',
  '',
  `<b>Asunto:</b> Solicitud de cambio de horario – Redes de Computadores / ${NOMBRE}`,
  '',
  `Estimado ${DOCENTE}:`,
  '',
  'Reciba un cordial saludo.',
  '',
  `Por medio del presente me dirijo a usted de manera respetuosa con el fin de solicitar formalmente un cambio de horario en la asignatura de Redes, a nombre de mi compañera ${NOMBRE}, identificada con número de cédula ${CEDULA} y correo ${CORREO}.`,
  '',
  'Quedo atento a su respuesta.',
  '',
  'Atentamente,',
  '',
  '¿Quieres que agregue el horario que solicita o el motivo del cambio?',
].join('<br>')

const CORREO_SIN_DATOS = [
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

const ENVIO_COMPLETO = conRespuestaIA(
  CHAT,
  HORA,
  marcar(PROMPT_CON_DATOS, {
    'dato-docente': DOCENTE,
    'dato-nombre': NOMBRE,
    'dato-cedula': CEDULA,
    'dato-correo': CORREO,
  }),
  CORREO_CON_DATOS,
)
const ENVIO_SIN_DATOS = conRespuestaIA(CHAT, HORA, PROMPT_SIN_DATOS, CORREO_SIN_DATOS)
const SIN_IA = conRespuestaIA(
  CHAT,
  HORA,
  PROMPT_SIN_IA,
  'Entendido. Si más adelante quieres que revise la redacción o el tono del correo, aquí estaré.',
)

const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: CHAT },
  e_datos_completos: {
    kind: 'bad',
    view: ENVIO_COMPLETO,
    senales: [
      senal(
        'dato-docente',
        'e_datos_completos',
        'El <b>nombre del docente</b>. Por sí solo no es un secreto, pero es el que convierte el mensaje en un caso real: quién pide qué, y a quién.',
      ),
      senal(
        'dato-nombre',
        'e_datos_completos',
        'El <b>nombre completo</b> de tu compañera. Para redactar el correo bastaba con "una compañera": quién es no cambia ni una palabra del texto.',
      ),
      senal(
        'dato-cedula',
        'e_datos_completos',
        'Su <b>cédula</b>. Es el dato que la identifica ante cualquier trámite del país, y salió hacia un servicio externo sin que nadie se lo pidiera.',
      ),
      senal(
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
    view: ENVIO_SIN_DATOS,
    senales: [
      senal(
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
    view: SIN_IA,
    verdict: 'Evitaste el riesgo, pero no hacía falta',
    outcome:
      'No compartiste ningún dato, pero tampoco hacía falta renunciar a la ayuda: bastaba con no escribir el nombre, la cédula y el correo de tu compañera.',
  },
}

const SENALES = [
  senal(
    'datos-en-juego',
    'n1',
    'La IA te pregunta qué debe incluir el correo. Tienes a la mano el <b>nombre completo</b>, la <b>cédula</b> y el <b>correo</b> de tu compañera — y ninguno de los tres cambia cómo se redacta la solicitud.',
  ),
]

const RULE =
  'Regla de oro: antes de escribirle a una IA, revisa si tu mensaje trae <b>nombres, cédulas, correos o teléfonos de otras personas</b>. Si no hacen falta para lo que le pides, quítalos primero.'

const RESUMEN = 'Le pides a una IA que redacte un correo a nombre de una compañera, con los datos de ella a la mano.'

const CONTEXTO: Contexto = {
  antes: 'Coordinas trámites de tus compañeros de clase y sueles usar una IA para que tus correos suenen más formales.',
  ahora: (
    <>
      <strong>Abres el chat de la IA</strong> para que te ayude con el correo del cambio de horario que
      pidió tu compañera.
    </>
  ),
}

function CorreoDatosTerceros() {
  return (
    <EscenarioChatIA
      escenarioId="asistentes-ia/correo-datos-terceros"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
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

export default CorreoDatosTerceros
