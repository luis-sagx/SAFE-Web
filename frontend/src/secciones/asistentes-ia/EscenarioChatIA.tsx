import type { ReactNode } from 'react'
import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'

interface EscenarioChatIAProps {
  escenarioId: string
  resumen: string
  contexto: Contexto
  story: Story<ScreenNode>
  senales: Senal[]
  rule: string
  /** Reemplaza el texto por defecto ("...para contestarle a la IA"). Los guiones
   *  donde la elección es qué se pega, y no qué se responde, lo cambian. */
  instruccion?: ReactNode
  /** Los caminos posibles, para quien se atasca. Opcional: los escenarios más
   *  difíciles de la sección la omiten a propósito. */
  pista?: ReactNode
}

// Marco común de los 4 escenarios de asistentes-ia: el mismo <StoryEscenario> se repetía en los cuatro archivos (SonarCloud lo marcaba como duplicación).
function EscenarioChatIA({
  escenarioId,
  resumen,
  contexto,
  story,
  senales,
  rule,
  instruccion,
  pista,
}: EscenarioChatIAProps) {
  return (
    <StoryEscenario
      escenarioId={escenarioId}
      resumen={resumen}
      contexto={contexto}
      story={story}
      senales={senales}
      rule={rule}
      accionesEnPantalla
      cuandoTermina="Cuando toques una de las respuestas del chat."
      instruccion={
        instruccion ?? (
          <p className="text-lg leading-relaxed text-body">
            Toca una de las respuestas para contestarle a la IA.
          </p>
        )
      }
      pista={pista}
    />
  )
}

export default EscenarioChatIA
