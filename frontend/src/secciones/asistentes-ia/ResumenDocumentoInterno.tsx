import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { crearChatIA, conRespuestaIA, marcar } from './chatIA'

/**
 * El único de la sección donde lo que se filtra no es de una persona sino de
 * la propia empresa: cifras sin publicar y un plan que ni siquiera los
 * empleados afectados conocen todavía. Mide si el criterio de "no compartas
 * datos de otros" también se aplica cuando el dato es institucional.
 */

const HORA = '15:02'

const PERDIDAS = '$340.000'
const RECORTE = 'va a recortar el 15% del personal de planta en enero'
const SIN_AVISAR = 'Todavía no se les avisa a los empleados'

const PROMPT_CON_CIFRAS = `Es el informe trimestral, para la reunión de gerencia. Dice que la empresa tuvo pérdidas de ${PERDIDAS} y ${RECORTE}. ${SIN_AVISAR}. Resúmelo en un párrafo.`
const PROMPT_SIN_CIFRAS =
  'Es el informe trimestral, para la reunión de gerencia. Dame un párrafo modelo que mencione el resultado financiero del período y una decisión de personal todavía sin anunciar, con espacios en blanco que yo lleno con las cifras.'
const PROMPT_SIN_IA = 'Mejor lo resumo yo, gracias.'

// La burbuja que se toca dice qué se hace, no qué se comparte: "le paso el
// informe" no delata que el informe trae las cifras sin publicar. Lo que sale
// de verdad —el prompt completo, con los datos marcados— aparece como mensaje
// enviado recién en el nodo destino, que es donde el repaso lo señala.
const BURBUJA_CON_CIFRAS = 'Le paso el informe y le pido que lo resuma.'
const BURBUJA_SIN_CIFRAS = 'Le pido un párrafo modelo y yo pongo las cifras aparte.'

const CHAT = crearChatIA(
  'Redactor de resúmenes · servicio externo',
  [
    { texto: 'Hola, necesito resumir un informe del trabajo.', mio: true },
    {
      texto:
        'Con gusto. Cuéntame de qué trata el informe y qué extensión debe tener el resumen. Si me dices además para quién es —directivos, personal o clientes—, ajusto el tono.',
    },
  ],
  HORA,
  [
    { texto: BURBUJA_CON_CIFRAS, goto: 'e_con_cifras' },
    { texto: BURBUJA_SIN_CIFRAS, goto: 'e_sin_cifras' },
    { texto: PROMPT_SIN_IA, goto: 'e_no_usa_ia' },
  ],
)

const ENVIO_CON_CIFRAS = conRespuestaIA(
  CHAT,
  HORA,
  marcar(PROMPT_CON_CIFRAS, {
    'dato-perdidas': PERDIDAS,
    'dato-recorte': RECORTE,
    'dato-sin-avisar': SIN_AVISAR,
  }),
  [
    'Aquí tienes el resumen para la reunión:',
    '',
    `Durante este trimestre la empresa registró una pérdida de ${PERDIDAS}, por lo que se implementará una reducción del 15% del personal de planta en enero para optimizar la estructura de costos; esta decisión se mantiene bajo estricta confidencialidad hasta la notificación formal a los empleados.`,
    '',
    '¿Necesitas que prepare también los puntos clave para la presentación?',
  ].join('<br>'),
)
const ENVIO_SIN_CIFRAS = conRespuestaIA(
  CHAT,
  HORA,
  PROMPT_SIN_CIFRAS,
  [
    'Aquí tienes el párrafo modelo:',
    '',
    'Durante este trimestre la empresa registró [resultado financiero], por lo que se implementará [decisión de personal] para optimizar la estructura de costos; esta decisión se mantiene bajo estricta confidencialidad hasta la notificación formal a los empleados.',
    '',
    'Completa los corchetes con tus cifras antes de presentarlo.',
  ].join('<br>'),
)
const SIN_IA = conRespuestaIA(
  CHAT,
  HORA,
  PROMPT_SIN_IA,
  'Entendido. Si más adelante quieres que revise la estructura o el tono del resumen, aquí estaré.',
)

const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: CHAT },
  e_con_cifras: {
    kind: 'bad',
    view: ENVIO_CON_CIFRAS,
    senales: [
      {
        id: 'dato-perdidas',
        targetId: 'dato-perdidas',
        pantalla: 'e_con_cifras',
        texto:
          'La <b>cifra de pérdidas</b> del trimestre, que todavía no se publica. Para armar un párrafo, a la IA le bastaba con saber que hubo un resultado negativo.',
      },
      {
        id: 'dato-recorte',
        targetId: 'dato-recorte',
        pantalla: 'e_con_cifras',
        texto:
          'El <b>plan de despidos</b>, con su porcentaje y su fecha. Es la clase de dato con el que se opera en bolsa o se negocia un contrato antes de tiempo.',
      },
      {
        id: 'dato-sin-avisar',
        targetId: 'dato-sin-avisar',
        pantalla: 'e_con_cifras',
        texto:
          'Y lo que lo agrava: <b>la empresa no ha avisado todavía</b>. La noticia salió antes hacia un servicio externo que hacia las personas que van a perder el trabajo.',
      },
    ],
    verdict: 'Información confidencial de la empresa compartida con la IA',
    outcome:
      'El resultado financiero del trimestre y el plan de reducción de personal —que ni el propio personal conoce— quedaron en manos de un servicio externo, escritos por ti.',
  },
  e_sin_cifras: {
    kind: 'good',
    view: ENVIO_SIN_CIFRAS,
    senales: [
      {
        id: 'borrador-enviado',
        targetId: 'borrador-enviado',
        pantalla: 'e_sin_cifras',
        texto:
          'Le pediste a la IA la <b>forma</b> del resumen, no el contenido: para qué reunión es, qué debe mencionar y dónde van los huecos.',
      },
    ],
    verdict: 'Resumen armado sin exponer datos de la empresa',
    outcome:
      'La IA te dio la estructura del párrafo y las cifras las pusiste tú, fuera de la conversación. Ni las pérdidas ni el plan de despidos salieron de la empresa.',
  },
  e_no_usa_ia: {
    kind: 'partial',
    view: SIN_IA,
    verdict: 'Evitaste el riesgo, pero no hacía falta',
    outcome:
      'No compartiste nada, pero tampoco hacía falta renunciar a la ayuda: bastaba con pedir el párrafo modelo sin pegar las cifras ni el plan de despidos.',
  },
}

const SENALES: Senal[] = [
  {
    id: 'informe-en-juego',
    pantalla: 'n1',
    texto:
      'La IA te pregunta de qué trata el informe. El que tienes delante trae <b>cifras sin publicar</b> y un <b>plan de despidos que nadie ha anunciado</b> — y contar de qué trata no obliga a copiarlo entero.',
  },
]

const RULE =
  'Regla de oro: la información <b>confidencial de tu empresa</b> —cifras sin publicar, planes sin anunciar— no se pega en una IA externa. Pide la forma del texto, y completa tú los datos sensibles aparte.'

const RESUMEN = 'Le pides a una IA que resuma un informe con cifras sin publicar y un plan de despidos sin anunciar.'

const CONTEXTO: Contexto = {
  antes: 'Te pidieron preparar un resumen ejecutivo del informe financiero interno para la reunión de gerencia.',
  ahora: (
    <>
      <strong>Abres el chat de la IA</strong> para que te ayude a resumir el informe, que trae cifras sin
      publicar y un plan que la empresa todavía no ha comunicado.
    </>
  ),
}

function ResumenDocumentoInterno() {
  return (
    <StoryEscenario
      escenarioId="asistentes-ia/resumen-documento-interno"
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
    />
  )
}

export default ResumenDocumentoInterno
