import type { ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import AIChatScenario from './EscenarioChatIA'
import { createAIChat, withAIResponse, mark, signal } from './chatIA'

/** Único de la sección donde lo filtrado es institucional, no personal: cifras sin publicar y un plan que ni los
 *  empleados afectados conocen. Mide si "no compartas datos de otros" también aplica a datos de la empresa. */

const TIME = '15:02'

const MISSED = '$340.000'
const CLIPPING = 'va a recortar el 15% del personal de planta en enero'
const WITHOUT_NOTIFY = 'Todavía no se les avisa a los empleados'

const PROMPT_WITH_DIGITS = `Es el informe trimestral, para la reunión de gerencia. Dice que la empresa tuvo pérdidas de ${MISSED} y ${CLIPPING}. ${WITHOUT_NOTIFY}. Resúmelo en un párrafo.`
const PROMPT_WITHOUT_DIGITS =
  'Es el informe trimestral, para la reunión de gerencia. Dame un párrafo modelo que mencione el resultado financiero del período y una decisión de personal todavía sin anunciar, con espacios en blanco que yo lleno con las cifras.'
const PROMPT_WITHOUT_AI = 'Mejor lo resumo yo, gracias.'

// La burbuja dice qué se hace, no qué se comparte ("le paso el informe" no delata las cifras); el prompt completo
// con los datos marcados aparece recién en el nodo destino, donde el repaso lo señala.
const BUBBLE_WITH_DIGITS = 'Le paso el informe y le pido que lo resuma.'
const BUBBLE_WITHOUT_DIGITS = 'Le pido un párrafo modelo y yo pongo las cifras aparte.'

const CHAT = createAIChat(
  'Redactor de resúmenes · servicio externo',
  [
    { texto: 'Hola, necesito resumir un informe del trabajo.', mio: true },
    {
      texto:
        'Con gusto. Cuéntame de qué trata el informe y qué extensión debe tener el resumen. Si me dices además para quién es —directivos, personal o clientes—, ajusto el tono.',
    },
  ],
  TIME,
  [
    { texto: BUBBLE_WITH_DIGITS, goto: 'e_con_cifras' },
    { texto: BUBBLE_WITHOUT_DIGITS, goto: 'e_sin_cifras' },
    { texto: PROMPT_WITHOUT_AI, goto: 'e_no_usa_ia' },
  ],
)

const SUBMISSION_WITH_DIGITS = withAIResponse(
  CHAT,
  TIME,
  mark(PROMPT_WITH_DIGITS, {
    'dato-perdidas': MISSED,
    'dato-recorte': CLIPPING,
    'dato-sin-avisar': WITHOUT_NOTIFY,
  }),
  [
    'Aquí tienes el resumen para la reunión:',
    '',
    `Durante este trimestre la empresa registró una pérdida de ${MISSED}, por lo que se implementará una reducción del 15% del personal de planta en enero para optimizar la estructura de costos; esta decisión se mantiene bajo estricta confidencialidad hasta la notificación formal a los empleados.`,
    '',
    '¿Necesitas que prepare también los puntos clave para la presentación?',
  ].join('<br>'),
)
const SUBMISSION_WITHOUT_DIGITS = withAIResponse(
  CHAT,
  TIME,
  PROMPT_WITHOUT_DIGITS,
  [
    'Aquí tienes el párrafo modelo:',
    '',
    'Durante este trimestre la empresa registró [resultado financiero], por lo que se implementará [decisión de personal] para optimizar la estructura de costos; esta decisión se mantiene bajo estricta confidencialidad hasta la notificación formal a los empleados.',
    '',
    'Completa los corchetes con tus cifras antes de presentarlo.',
  ].join('<br>'),
)
const WITHOUT_AI = withAIResponse(
  CHAT,
  TIME,
  PROMPT_WITHOUT_AI,
  'Entendido. Si más adelante quieres que revise la estructura o el tono del resumen, aquí estaré.',
)

const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: CHAT },
  e_con_cifras: {
    kind: 'bad',
    view: SUBMISSION_WITH_DIGITS,
    senales: [
      signal(
        'dato-perdidas',
        'e_con_cifras',
        'La <b>cifra de pérdidas</b> del trimestre, que todavía no se publica. Para armar un párrafo, a la IA le bastaba con saber que hubo un resultado negativo.',
      ),
      signal(
        'dato-recorte',
        'e_con_cifras',
        'El <b>plan de despidos</b>, con su porcentaje y su fecha. Es la clase de dato con el que se opera en bolsa o se negocia un contrato antes de tiempo.',
      ),
      signal(
        'dato-sin-avisar',
        'e_con_cifras',
        'Y lo que lo agrava: <b>la empresa no ha avisado todavía</b>. La noticia salió antes hacia un servicio externo que hacia las personas que van a perder el trabajo.',
      ),
    ],
    verdict: 'Información confidencial de la empresa compartida con la IA',
    outcome:
      'El resultado financiero del trimestre y el plan de reducción de personal —que ni el propio personal conoce— quedaron en manos de un servicio externo, escritos por ti.',
  },
  e_sin_cifras: {
    kind: 'good',
    view: SUBMISSION_WITHOUT_DIGITS,
    senales: [
      signal(
        'borrador-enviado',
        'e_sin_cifras',
        'Le pediste a la IA la <b>forma</b> del resumen, no el contenido: para qué reunión es, qué debe mencionar y dónde van los huecos.',
      ),
    ],
    verdict: 'Resumen armado sin exponer datos de la empresa',
    outcome:
      'La IA te dio la estructura del párrafo y las cifras las pusiste tú, fuera de la conversación. Ni las pérdidas ni el plan de despidos salieron de la empresa.',
  },
  e_no_usa_ia: {
    kind: 'partial',
    view: WITHOUT_AI,
    verdict: 'Evitaste el riesgo, pero no hacía falta',
    outcome:
      'No compartiste nada, pero tampoco hacía falta renunciar a la ayuda: bastaba con pedir el párrafo modelo sin pegar las cifras ni el plan de despidos.',
  },
}

const SIGNALS = [
  signal(
    'informe-en-juego',
    'n1',
    'La IA te pregunta de qué trata el informe. El que tienes delante trae <b>cifras sin publicar</b> y un <b>plan de despidos que nadie ha anunciado</b> — y contar de qué trata no obliga a copiarlo entero.',
  ),
]

const RULE =
  'Regla de oro: la información <b>confidencial de tu empresa</b> —cifras sin publicar, planes sin anunciar— no se pega en una IA externa. Pide la forma del texto, y completa tú los datos sensibles aparte.'

const SUMMARY = 'Le pides a una IA que resuma un informe con cifras sin publicar y un plan de despidos sin anunciar.'

const CONTEXT: Context = {
  antes: 'Te pidieron preparar un resumen ejecutivo del informe financiero interno para la reunión de gerencia.',
  ahora: (
    <>
      <strong>Abres el chat de la IA</strong> para que te ayude a resumir el informe, que trae cifras sin
      publicar y un plan que la empresa todavía no ha comunicado.
    </>
  ),
}

function InternalDocumentSummary() {
  return (
    <AIChatScenario
      escenarioId="asistentes-ia/resumen-documento-interno"
      resumen={SUMMARY}
      contexto={CONTEXT}
      story={STORY}
      senales={SIGNALS}
      rule={RULE}
    />
  )
}

export default InternalDocumentSummary
