import type { ReactNode } from 'react'
import ScenarioStory, { type ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { Signal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'

interface AIChatScenarioProps {
  escenarioId: string
  resumen: string
  contexto: Context
  story: Story<ScreenNode>
  senales: Signal[]
  rule: string
  /** Reemplaza el texto por defecto ("...para contestarle a la IA"). Los guiones
   *  donde la elección es qué se pega, y no qué se responde, lo cambian. */
  instruccion?: ReactNode
  /** Los caminos posibles, para quien se atasca. Opcional: los escenarios más
   *  difíciles de la sección la omiten a propósito. */
  pista?: ReactNode
  /** El bloc de notas con el texto fuente (datos sensibles incluidos), fijo
   *  junto al celular, issue #184. El participante decide qué copiar y qué
   *  dejar afuera al escribir su propio mensaje. */
  documentoFuente?: ReactNode
}

// Marco común de los 4 escenarios de asistentes-ia: el mismo <StoryEscenario> se repetía en los cuatro archivos (SonarCloud lo marcaba como duplicación).
function AIChatScenario({
  escenarioId: scenarioId,
  resumen: summary,
  contexto: context,
  story,
  senales: signals,
  rule,
  instruccion: instruction,
  pista: clue,
  documentoFuente: sourceDocument,
}: AIChatScenarioProps) {
  return (
    <ScenarioStory
      escenarioId={scenarioId}
      resumen={summary}
      contexto={context}
      story={story}
      senales={signals}
      rule={rule}
      accionesEnPantalla
      cuandoTermina="Cuando escribas tu mensaje y lo envíes, o toques una de las respuestas del chat."
      instruccion={
        <div className="grid gap-3">
          {/* Encuadre fijo del módulo entero (issue #241): a diferencia de
              phishing/vishing/smishing, acá no hay un atacante que engañe —
              el riesgo es la propia decisión de qué se pega. Sin esto, cada
              escenario explicaba el mecanismo (qué botón tocar) pero nunca el
              porqué, y la gente entraba sin saber qué se le estaba poniendo
              a prueba. */}
          <p className="text-lg leading-relaxed text-body">
            Aquí no hay nadie tratando de engañarte: el asistente de IA hace exactamente lo que le
            pides. Lo que se pone a prueba es qué le compartes — cada escenario te da un documento o
            una conversación con datos de otra persona, y tú decides qué copiar y qué dejar fuera
            antes de pedirle ayuda.
          </p>
          {instruction ?? (
            <p className="text-lg leading-relaxed text-body">
              Escribe tu mensaje y toca "Enviar", o toca una de las respuestas del chat.
            </p>
          )}
        </div>
      }
      pista={clue}
      panelReferencia={sourceDocument}
      sinAvisoClicVacio
    />
  )
}

export default AIChatScenario
