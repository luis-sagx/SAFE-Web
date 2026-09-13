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
      cuandoTermina="Cuando toques una de las respuestas del chat."
      instruccion={
        instruction ?? (
          <p className="text-lg leading-relaxed text-body">
            Toca una de las respuestas para contestarle a la IA.
          </p>
        )
      }
      pista={clue}
    />
  )
}

export default AIChatScenario
