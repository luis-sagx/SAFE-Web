import type { ReactNode } from 'react'
import EscenarioLayout from './EscenarioLayout'
import DeviceScreen, { type ScreenView } from './ui/DeviceScreen'
import StoryChoices from './ui/StoryChoices'
import StoryResultPanel from './ui/StoryResultPanel'
import { useStoryEngine, type Story, type StoryNode } from '../hooks/useStoryEngine'

/** Cada nodo declara qué muestra la pantalla simulada, incluidos los finales:
 *  el resultado se lee al lado de la pantalla que lo provocó. */
export interface ScreenNode extends StoryNode {
  view: ScreenView
}

interface StoryEscenarioProps {
  escenarioId: string
  resumen: string
  contexto: ReactNode
  /** Cómo se juega. Solo se muestra en el briefing. */
  nota?: ReactNode
  story: Story<ScreenNode>
  signalsTitle: string
  /** Llevan negritas <b>; contenido fijo del código. */
  signals: string[]
  rule: string
  restartLabel: string
  pregunta?: string
}

/**
 * Escenario de correo o SMS: grafo de decisiones sobre una pantalla simulada.
 * El escenario solo aporta datos; el recorrido, el registro de la corrida y el
 * marco de página ya están resueltos aquí.
 */
function StoryEscenario({
  escenarioId,
  resumen,
  contexto,
  nota,
  story,
  signalsTitle,
  signals,
  rule,
  restartLabel,
  pregunta = '¿Qué haces?',
}: StoryEscenarioProps) {
  const engine = useStoryEngine(story, 'n1', escenarioId)

  const decision = engine.isEnding ? (
    <StoryResultPanel
      escenarioId={escenarioId}
      node={engine.node}
      signalsTitle={signalsTitle}
      signals={signals}
      rule={rule}
      restartLabel={restartLabel}
      onRestart={engine.restart}
    />
  ) : (
    engine.node.choices && (
      <div className="grid gap-3">
        <p className="text-base font-semibold text-ink">{pregunta}</p>
        <StoryChoices choices={engine.node.choices} onChoose={engine.choose} />
      </div>
    )
  )

  return (
    <EscenarioLayout
      escenarioId={escenarioId}
      resumen={resumen}
      contexto={contexto}
      nota={nota}
      pantalla={<DeviceScreen view={engine.node.view} />}
      decision={decision}
      onEmpezar={engine.restart}
      // El correo y la web se abren más en computador que en celular; el SMS
      // se queda en celular, que es donde de verdad llegan los mensajes.
      dispositivo={engine.node.view.kind === 'sms' ? 'telefono' : 'escritorio'}
    />
  )
}

export default StoryEscenario
