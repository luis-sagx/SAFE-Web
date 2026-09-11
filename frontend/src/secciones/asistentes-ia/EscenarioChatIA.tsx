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

/**
 * Marco común de los cuatro escenarios de `asistentes-ia`. Todos abren el mismo
 * chat con un asistente externo, deciden dentro de la pantalla y cierran cuando
 * se toca una burbuja de respuesta: ese envoltorio de `<StoryEscenario>` era
 * idéntico en los cuatro archivos (y SonarCloud lo contaba como duplicación).
 */
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
