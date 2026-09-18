import type { ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import BlocNotas from '../../components/ui/BlocNotas'
import type { Story } from '../../hooks/useStoryEngine'
import AIChatScenario from './EscenarioChatIA'
import {
  createAIChat,
  withFreeTextComposer,
  splitKnownData,
  evaluateData,
  mentionsAny,
  signal,
  type SendResult,
  type SensitiveDatum,
} from './chatIA'

/** Único de la sección donde lo filtrado es institucional, no personal: cifras sin publicar y un plan que ni los
 *  empleados afectados conocen. La cifra aislada no identifica a nadie; el riesgo aparece al juntarla
 *  con el nombre o RUC de la empresa, porque así queda asociado a una organización concreta.
 *
 *  Issue #184: el informe con las cifras reales vive en un bloc de notas fijo junto al celular; el
 *  participante escribe su propio pedido a la IA, decidiendo qué copiar del informe y qué dejar afuera.
 *
 *  A diferencia de una cédula o un nombre, una cifra institucional no tiene una forma "a medias" que valga
 *  la pena distinguir con un tercer nivel, o se escribió la cifra real, o no. Por eso los dos datos de
 *  este escenario son binarios (fuga/seguro), sin nivel parcial. */

const TIME = '15:02'

const MISSED = '$340.000'
const CLIP_PERCENT = '15%'
const COMPANY_NAME = 'Comercial Super Andinas S.A.'
// RUC ficticio: el tercer dígito 9 no corresponde a una persona ni empresa real.
const COMPANY_RUC = '1799999999001'

const DATA_POINTS: SensitiveDatum[] = [
  // "$340.000", "340000", "340 mil", "340k": la misma cifra.
  {
    id: 'dato-perdidas',
    tipo: 'patron',
    etiqueta: `la cifra real de pérdidas (${MISSED})`,
    patron: /\b340(\s*[.,]?\s*000\b|\s*mil\b|\s*k\b)/,
  },
  // "15%", "15 %", "15 por ciento", "quince por ciento".
  {
    id: 'dato-recorte',
    tipo: 'patron',
    etiqueta: `el porcentaje real del recorte de personal (${CLIP_PERCENT})`,
    patron: /\b(15|quince)\s*(%|por\s*ciento)/,
  },
  { id: 'dato-empresa', tipo: 'texto', etiqueta: 'el nombre de la empresa', valor: COMPANY_NAME },
  { id: 'dato-ruc', tipo: 'numero', etiqueta: 'el RUC de la empresa', valor: COMPANY_RUC },
]

// De qué trata el informe. Sin nada de esto la IA no tiene qué resumir.
const TOPIC_ROOTS = ['perdid', 'resultado', 'trimestr', 'recort', 'despid', 'ajuste', 'personal', 'financ', 'ingreso', 'venta', 'balance', 'empleado', 'cifra', 'economic', 'deficit', 'gasto', 'presupuest', 'utilidad', 'reduc']

function onEnviar(texto: string): SendResult {
  const resultados = evaluateData(texto, DATA_POINTS)
  const identificaEmpresa = resultados.some(
    (dato) => (dato.id === 'dato-empresa' || dato.id === 'dato-ruc') && dato.nivel === 'fuga',
  )
  const revelaInformacionInterna = resultados.some(
    (dato) => (dato.id === 'dato-perdidas' || dato.id === 'dato-recorte') && dato.nivel === 'fuga',
  )
  const nivel = identificaEmpresa && revelaInformacionInterna ? 'fuga' : 'seguro'
  if (nivel === 'seguro' && !mentionsAny(texto, TOPIC_ROOTS)) {
    return { repregunta: 'Necesito saber de qué trata el informe para resumirlo. ¿Qué temas o resultados debe cubrir?' }
  }
  return {
    // Solo la combinación identifica una pérdida o ajuste interno: fuga o seguro.
    goto: nivel === 'seguro' ? 'e_seguro' : 'e_fuga',
    label: 'Escribió su propio mensaje para pedirle ayuda a la IA',
  }
}

const CHAT = withFreeTextComposer(
  createAIChat(
    'Redactor de resúmenes · servicio externo',
    [
      { texto: 'Hola, necesito resumir un informe del trabajo.', mio: true },
      {
        texto:
          'Con gusto. Cuéntame de qué trata el informe y qué extensión debe tener el resumen. Si me dices además para quién es,directivos, personal o clientes,, ajusto el tono.',
      },
    ],
    TIME,
    [],
    { titulo: 'Asistente IA', url: 'https://chat.asistente-ia.com/nuevo' },
  ),
  {
    placeholder: 'Escribe lo que le pedirías a la IA…',
    hora: TIME,
    respuestaIA:
      'Aquí tienes un resumen con lo que me diste. Si quieres, puedo ajustar la extensión o el tono.',
    onEnviar,
    segmentar: (texto) => splitKnownData(texto, DATA_POINTS),
  },
)

// El "documento fuente": el informe trimestral con las cifras reales, abierto al lado en un bloc de
// notas. Copiarlo entero en el chat es la trampa; el resumen no necesitaba las cifras exactas.
const SOURCE_DOCUMENT = `Informe trimestral, uso interno.\n\nEmpresa: ${COMPANY_NAME}\nRUC: ${COMPANY_RUC}\nResultado del período: pérdida de ${MISSED}.\nPlan de ajuste: recorte de personal del ${CLIP_PERCENT}, sin anunciar todavía.\n\nPara la reunión de gerencia del viernes.`

const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: CHAT },
  e_fuga: {
    kind: 'bad',
    view: CHAT,
    senales: DATA_POINTS.map((dato) =>
      signal(
        dato.id,
        'e_fuga',
        `Si tu mensaje incluyó <b>${dato.etiqueta}</b>: para armar el resumen, a la IA le bastaba con saber que hubo un resultado negativo y un ajuste de personal, no ese dato sensible.`,
      ),
    ),
    verdict: 'Información confidencial de la empresa compartida con la IA',
    outcome:
      'Tu mensaje identificó a la empresa mediante su nombre o RUC y además reveló información interna. Para resumir el informe, la IA solo necesitaba el tema general; esos detalles quedaron en manos de un servicio externo.',
  },
  e_seguro: {
    kind: 'good',
    view: CHAT,
    senales: [
      signal(
        'borrador-enviado',
        'e_seguro',
        'Le pediste a la IA la <b>forma</b> del resumen,para qué reunión es, qué debe mencionar, sin las cifras reales.',
      ),
    ],
    verdict: 'Resumen armado sin exponer datos de la empresa',
    outcome:
      'Tu mensaje le pidió a la IA la estructura del resumen, no el contenido confidencial ni los datos que identifican a la empresa. Las cifras y los datos reales los agregas tú mismo, fuera de la conversación.',
  },
}

const SIGNALS = [
  signal(
    'informe-en-juego',
    'n1',
    'La IA te pregunta de qué trata el informe. El que tienes delante identifica a la <b>empresa</b> y su <b>RUC</b>, además de traer cifras sin publicar y un plan de despidos; contar de qué trata no obliga a copiarlo entero.',
  ),
]

const RULE =
  'Regla de oro: la información <b>confidencial de tu empresa</b>,su nombre, RUC, cifras sin publicar y planes sin anunciar, no se escribe en una IA externa. Pide la forma del texto, y completa tú los datos sensibles aparte.'

const SUMMARY = 'Le pides a una IA que resuma un informe que identifica a una empresa y contiene cifras sin publicar.'

const CONTEXT: Context = {
  antes: 'Te pidieron preparar un resumen ejecutivo del informe financiero interno para la reunión de gerencia.',
  ahora: (
    <>
      <strong>Abres el asistente de IA</strong> en el computador. Al lado tienes el informe abierto, con
      las cifras que todavía no se han publicado.
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
      documentoFuente={<BlocNotas titulo="Bloc de notas" texto={SOURCE_DOCUMENT} />}
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Escribe el mensaje que le mandarías a la IA para pedirle ayuda,puedes copiar del informe, y
          toca "Enviar" cuando quede como quieres.
        </p>
      }
    />
  )
}

export default InternalDocumentSummary
