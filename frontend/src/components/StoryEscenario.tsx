import type { ReactNode } from 'react'
import EscenarioLayout from './EscenarioLayout'
import DeviceScreen, { type ScreenView } from './ui/DeviceScreen'
import { manejarClicHotspot } from './ui/interactivo'
import type { AccionCorreo } from './ui/DesktopChrome'
import StoryChoices from './ui/StoryChoices'
import PanelVeredicto, { type Senal } from './ui/PanelVeredicto'
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
  /** Las pistas que había en la pantalla. El repaso las recorre una a una y
   *  resalta el elemento real de la simulación al que apunta cada una. */
  senales: Senal[]
  rule: string
  restartLabel: string
  pregunta?: string
  /** Acciones del cliente de correo. El escenario que las pasa tiene que
   *  declarar también sus finales en el grafo (ver finalesDeBarra). */
  accionesCorreo?: AccionCorreo[]
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
  senales,
  rule,
  restartLabel,
  pregunta = '¿Qué haces?',
  accionesCorreo,
}: StoryEscenarioProps) {
  const engine = useStoryEngine(story, 'n1', escenarioId)

  // Un clic en la barra del cliente vale lo mismo que elegir de la lista: los
  // botones llevan su destino en `data-hotspot-goto` y este manejador único lo
  // traduce en una decisión del grafo.
  const onHotspot = (event: React.MouseEvent) => {
    if (engine.isEnding) return
    manejarClicHotspot(event, engine.choose)
  }

  const decision = engine.isEnding ? (
    <PanelVeredicto
      escenarioId={escenarioId}
      node={engine.node}
      senales={senales}
      regla={rule}
      restartLabel={restartLabel}
      onRestart={engine.restart}
      contenedorId="pantalla-escenario"
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
      pantalla={
        <DeviceScreen view={engine.node.view} acciones={accionesCorreo} onHotspot={onHotspot} />
      }
      decision={decision}
      onEmpezar={engine.restart}
      // El correo y la web se abren más en computador que en celular; el SMS
      // se queda en celular, que es donde de verdad llegan los mensajes.
      dispositivo={engine.node.view.kind === 'sms' ? 'telefono' : 'escritorio'}
    />
  )
}

export default StoryEscenario
