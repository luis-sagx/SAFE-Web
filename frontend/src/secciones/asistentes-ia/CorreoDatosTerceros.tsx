import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { crearChatIA, conRespuestaIA, marcar } from './chatIA'

/**
 * Puerta de entrada de la sección: la IA no engaña a nadie, es una herramienta
 * legítima. El riesgo está en lo que el propio participante le escribe antes de
 * pedir ayuda — aquí, el nombre completo, la cédula y el correo de una
 * compañera, que no hacen falta para redactar un texto.
 */

const HORA = '10:14'

/// Imposible por construcción, como la del participante: tercer dígito 9, que
/// el Registro Civil no le da a ninguna persona natural (ver identidadFicticia).
const CEDULA = '1798765432'
const NOMBRE = 'Andrea Cedeño'
const CORREO = 'andrea.cedeno02@gmail.com'

const PROMPT_CON_DATOS =
  `Es para pedirle al ingeniero un cambio de horario a nombre de mi compañera ${NOMBRE}, cédula ${CEDULA}, correo ${CORREO}. Es de la materia de Redes.`
const PROMPT_SIN_DATOS =
  'Es para pedirle al ingeniero un cambio de horario a nombre de una compañera, en la materia de Redes. Deja en blanco los datos de ella, que yo los lleno después.'
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
        'Claro que sí. ¿Sobre qué asunto es el correo, a quién va dirigido y qué información debe incluir? Con esos datos puedo entregarte una versión formal y lista para enviar.',
    },
  ],
  HORA,
  [
    { texto: PROMPT_CON_DATOS, goto: 'e_datos_completos' },
    { texto: PROMPT_SIN_DATOS, goto: 'e_sin_datos' },
    { texto: PROMPT_SIN_IA, goto: 'e_no_usa_ia' },
  ],
)

const ENVIO_COMPLETO = conRespuestaIA(
  CHAT,
  HORA,
  marcar(PROMPT_CON_DATOS, { 'dato-nombre': NOMBRE, 'dato-cedula': CEDULA, 'dato-correo': CORREO }),
  `Con gusto. Aquí tiene una versión formal: «Estimado ingeniero: reciba un cordial saludo. Me dirijo a usted para solicitar, en representación de la estudiante ${NOMBRE} (cédula ${CEDULA}, correo ${CORREO}), el cambio de horario en la materia de Redes. Quedo atento a su respuesta. Atentamente,». Si lo prefiere, puedo entregarle también una versión más breve.`,
)
const ENVIO_SIN_DATOS = conRespuestaIA(
  CHAT,
  HORA,
  PROMPT_SIN_DATOS,
  'Con gusto. Aquí tiene una versión formal con los espacios listos para completar: «Estimado ingeniero: reciba un cordial saludo. Me dirijo a usted para solicitar, en representación de la estudiante [nombre completo] (cédula [cédula], correo [correo]), el cambio de horario en la materia de Redes. Quedo atento a su respuesta. Atentamente,». Reemplace los corchetes antes de enviarlo.',
)
const SIN_IA = conRespuestaIA(
  CHAT,
  HORA,
  PROMPT_SIN_IA,
  'Entendido. Si más adelante desea que revise la redacción o el tono del correo, quedo a su disposición.',
)

const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: CHAT },
  e_datos_completos: {
    kind: 'bad',
    view: ENVIO_COMPLETO,
    senales: [
      {
        id: 'dato-nombre',
        targetId: 'dato-nombre',
        pantalla: 'e_datos_completos',
        texto: `El <b>nombre completo</b> de tu compañera. Para redactar el correo bastaba con "una compañera": quién es no cambia ni una palabra del texto.`,
      },
      {
        id: 'dato-cedula',
        targetId: 'dato-cedula',
        pantalla: 'e_datos_completos',
        texto:
          'Su <b>cédula</b>. Es el dato que la identifica ante cualquier trámite del país, y salió hacia un servicio externo sin que nadie se lo pidiera.',
      },
      {
        id: 'dato-correo',
        targetId: 'dato-correo',
        pantalla: 'e_datos_completos',
        texto:
          'Su <b>correo personal</b>. La IA no lo necesitaba para escribir la solicitud: es a ella a quien le llegará el spam si esa conversación se filtra.',
      },
    ],
    verdict: 'Datos de una compañera compartidos con la IA',
    outcome:
      'Para redactar un texto, la IA no necesita el nombre completo, la cédula ni el correo de la persona involucrada. Esos tres datos ya quedaron en un servicio externo, fuera de tu control y sin que ella se enterara.',
  },
  e_sin_datos: {
    kind: 'good',
    view: ENVIO_SIN_DATOS,
    senales: [
      {
        id: 'borrador-enviado',
        targetId: 'borrador-enviado',
        pantalla: 'e_sin_datos',
        texto:
          'Le contaste a la IA lo que necesitaba saber —el asunto, el destinatario, la materia— y nada más. Ni un nombre, ni una cédula, ni un correo.',
      },
    ],
    verdict: 'Correo redactado sin compartir datos de nadie',
    outcome:
      'La IA armó el correo con espacios en blanco donde van los datos de tu compañera, y esos los completas tú al final. Conseguiste la misma ayuda sin entregar nada de ella.',
  },
  e_no_usa_ia: {
    kind: 'partial',
    view: SIN_IA,
    verdict: 'Evitaste el riesgo, pero no hacía falta',
    outcome:
      'No compartiste ningún dato, pero tampoco hacía falta renunciar a la ayuda: bastaba con no escribir el nombre, la cédula y el correo de tu compañera.',
  },
}

const SENALES: Senal[] = [
  {
    id: 'datos-en-juego',
    pantalla: 'n1',
    texto:
      'La IA te pregunta qué debe incluir el correo. Tienes a la mano el <b>nombre completo</b>, la <b>cédula</b> y el <b>correo</b> de tu compañera — y ninguno de los tres cambia cómo se redacta la solicitud.',
  },
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
    <StoryEscenario
      escenarioId="asistentes-ia/correo-datos-terceros"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule={RULE}
      accionesEnPantalla
      cuandoTermina="Cuando toques una de las respuestas del chat."
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Toca una de las respuestas para contestarle a la IA.
        </p>
      }
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
