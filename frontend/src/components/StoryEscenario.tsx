import { useState, type ReactNode } from 'react'
import EscenarioLayout from './EscenarioLayout'
import DeviceScreen, { type ScreenView } from './ui/DeviceScreen'
import { manejarClicHotspot } from './ui/interactivo'
import type { AccionCorreo, Reloj } from './ui/DesktopChrome'
import StoryChoices from './ui/StoryChoices'
import PanelVeredicto, { type Senal } from './ui/PanelVeredicto'
import { useAuth } from '../context/AuthContext'
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
  /** Dominio del participante en este escenario (ver EscenarioLayout). */
  dominioCorreo?: string
  /** Hora del sistema. Debe cuadrar con la que cuenta el guion y con la fecha
   *  del mensaje: tres relojes distintos en la misma escena rompen la ilusión. */
  reloj?: Reloj
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
  dominioCorreo,
  reloj,
}: StoryEscenarioProps) {
  const engine = useStoryEngine(story, 'n1', escenarioId)
  const { usuarioSimulado } = useAuth()
  const destinatario = dominioCorreo ? `${usuarioSimulado}@${dominioCorreo}` : undefined

  // Durante el repaso la pantalla vuelve a la que contiene cada señal: un
  // escenario que termina en la página falsa no puede resaltar lo que estaba
  // en el correo.
  const [pantallaRepaso, setPantallaRepaso] = useState<string | undefined>()
  const vista = (pantallaRepaso && story[pantallaRepaso]?.view) || engine.node.view

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
      onPantalla={setPantallaRepaso}
    />
  ) : (
    engine.node.choices && (
      <div className="grid gap-3">
        <p className="text-lg font-semibold text-ink">{pregunta}</p>
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
      dominioCorreo={dominioCorreo}
      pantalla={
        <DeviceScreen
          view={vista}
          acciones={accionesCorreo}
          destinatario={destinatario}
          reloj={reloj}
          onHotspot={onHotspot}
        />
      }
      decision={decision}
      onEmpezar={engine.restart}
      // El correo y la web se abren más en computador que en celular; el SMS
      // se queda en celular, que es donde de verdad llegan los mensajes.
      dispositivo={vista.kind === 'sms' ? 'telefono' : 'escritorio'}
    />
  )
}

export default StoryEscenario
