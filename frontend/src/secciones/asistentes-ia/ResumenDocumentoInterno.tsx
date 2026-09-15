import type { ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import AIChatScenario from './EscenarioChatIA'
import {
  createAIChat,
  withEditableDraft,
  buildDraftSegments,
  evaluateData,
  worstLevel,
  signal,
  type SensitiveDatum,
} from './chatIA'

/** Único de la sección donde lo filtrado es institucional, no personal: cifras sin publicar y un plan que ni los
 *  empleados afectados conocen. Mide si "no compartas datos de otros" también aplica a datos de la empresa.
 *
 *  Issue #185: a diferencia de una cédula o un nombre, una cifra institucional no tiene una forma "a medias"
 *  que valga la pena distinguir con un tercer nivel — o se escribió la cifra real, o no. Por eso los dos
 *  datos de este escenario son binarios (fuga/seguro), sin nivel parcial. */

const TIME = '15:02'

const MISSED = '$340.000'
const CLIP_PERCENT = '15%'

const DATA_POINTS: SensitiveDatum[] = [
  { id: 'dato-perdidas', tipo: 'texto', etiqueta: `la cifra real de pérdidas (${MISSED})`, valor: MISSED },
  { id: 'dato-recorte', tipo: 'texto', etiqueta: `el porcentaje real del recorte de personal (${CLIP_PERCENT})`, valor: CLIP_PERCENT },
]

function onEnviar(texto: string): { goto: string; label?: string } {
  const nivel = worstLevel(evaluateData(texto, DATA_POINTS))
  return {
    // Sin nivel parcial (ver nota arriba): 'fuga' o 'seguro' solamente.
    goto: nivel === 'seguro' ? 'e_seguro' : 'e_fuga',
    label: 'Tocó "Enviar" con lo que decidió dejar del borrador',
  }
}

// El borrador ya trae las dos cifras reales; buildDraftSegments las marca para tocar y reemplazar.
const DRAFT = `Es el informe trimestral, para la reunión de gerencia. El resultado del período fue una pérdida de ${MISSED}, y el plan contempla un recorte de personal del ${CLIP_PERCENT}. Resúmelo en un párrafo formal.`

const CHAT = withEditableDraft(
  createAIChat(
    'Redactor de resúmenes · servicio externo',
    [
      { texto: 'Hola, necesito resumir un informe del trabajo.', mio: true },
      {
        texto:
          'Con gusto. Cuéntame de qué trata el informe y qué extensión debe tener el resumen. Si me dices además para quién es —directivos, personal o clientes—, ajusto el tono.',
      },
    ],
    TIME,
    [],
    { titulo: 'Asistente IA', url: 'https://chat.asistente-ia.com/nuevo' },
  ),
  {
    segmentos: buildDraftSegments(DRAFT, DATA_POINTS),
    hora: TIME,
    respuestaIA:
      'Aquí tienes un resumen con lo que me diste. Si quieres, puedo ajustar la extensión o el tono.',
    onEnviar,
  },
)

const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: CHAT },
  e_fuga: {
    kind: 'bad',
    view: CHAT,
    senales: DATA_POINTS.map((dato) =>
      signal(
        dato.id,
        'e_fuga',
        `Si tu mensaje incluyó <b>${dato.etiqueta}</b>: para armar el resumen, a la IA le bastaba con saber que hubo un resultado negativo y un ajuste de personal, no las cifras exactas todavía sin publicar.`,
      ),
    ),
    verdict: 'Información confidencial de la empresa compartida con la IA',
    outcome:
      'Tu mensaje incluyó la cifra real de pérdidas, el porcentaje real del recorte de personal, o ambos — datos que ni el propio personal conoce todavía, y que quedaron en manos de un servicio externo.',
  },
  e_seguro: {
    kind: 'good',
    view: CHAT,
    senales: [
      signal(
        'borrador-enviado',
        'e_seguro',
        'Le pediste a la IA la <b>forma</b> del resumen —para qué reunión es, qué debe mencionar— sin las cifras reales.',
      ),
    ],
    verdict: 'Resumen armado sin exponer datos de la empresa',
    outcome:
      'Tu mensaje le pidió a la IA la estructura del resumen, no el contenido confidencial. Las cifras reales las agregas tú mismo, fuera de la conversación.',
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
  'Regla de oro: la información <b>confidencial de tu empresa</b> —cifras sin publicar, planes sin anunciar— no se escribe en una IA externa. Pide la forma del texto, y completa tú los datos sensibles aparte.'

const SUMMARY = 'Le pides a una IA que resuma un informe con cifras sin publicar y un plan de despidos sin anunciar.'

const CONTEXT: Context = {
  antes: 'Te pidieron preparar un resumen ejecutivo del informe financiero interno para la reunión de gerencia.',
  ahora: (
    <>
      <strong>Abres el asistente de IA</strong> en el computador para que te ayude a resumir el informe,
      que trae cifras sin publicar y un plan que la empresa todavía no ha comunicado.
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
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Toca las palabras marcadas para cambiarlas, y toca "Enviar" cuando el mensaje quede como
          quieres.
        </p>
      }
    />
  )
}

export default InternalDocumentSummary
