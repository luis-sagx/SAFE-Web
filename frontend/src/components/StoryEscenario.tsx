import { useEffect, useState, type ReactNode } from 'react'
import EscenarioLayout from './EscenarioLayout'
import DeviceScreen, { type ScreenView } from './ui/DeviceScreen'
import { manejarClicHotspot } from './ui/interactivo'
import {
  VentanaNavegador,
  type AccionCorreo,
  type MarcadorNavegador,
  type PestanaNavegador,
  type Reloj,
} from './ui/DesktopChrome'
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
  /** Sitios de la barra de marcadores. Sin ellos la barra no se pinta. */
  marcadores?: MarcadorNavegador[]
}

/// Cómo se ve cada pantalla en la barra de direcciones. El correo va en el
/// dominio del participante, para que la dirección de la pestaña y la del
/// mensaje cuenten lo mismo.
function pestanaDeVista(id: string, view: ScreenView, dominio: string): PestanaNavegador | null {
  if (view.kind === 'mail') {
    return { id, titulo: 'Correo', url: `https://correo.${dominio}/recibidos`, segura: true }
  }
  if (view.kind === 'web') {
    return {
      id,
      titulo: view.title,
      url: view.url,
      segura: view.secure,
      senalUrl: view.senalUrl,
      cierra: view.cerrarGoto,
    }
  }
  return null
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
  marcadores,
}: StoryEscenarioProps) {
  const engine = useStoryEngine(story, 'n1', escenarioId)
  const { usuarioSimulado } = useAuth()
  const destinatario = dominioCorreo ? `${usuarioSimulado}@${dominioCorreo}` : undefined

  // Durante el repaso la pantalla vuelve a la que contiene cada señal: un
  // escenario que termina en la página falsa no puede resaltar lo que estaba
  // en el correo.
  const [pantallaRepaso, setPantallaRepaso] = useState<string | undefined>()
  /// Pestaña que el participante eligió mirar. Cambiar de pestaña no es una
  /// decisión del escenario —es mirar, como abrir otra carpeta del correo— así
  /// que no entra en la traza; la siguiente decisión la deshace.
  const [pestanaMirada, setPestanaMirada] = useState<string | undefined>()
  const nodoVisible = pantallaRepaso ?? pestanaMirada ?? engine.current
  const vista = story[nodoVisible]?.view ?? engine.node.view

  const dominio = dominioCorreo ?? 'safeweb.com'
  /// Las pestañas se acumulan según el recorrido: cada pantalla nueva abre una,
  /// como haría un enlace en un navegador de verdad. Se indexan por dirección
  /// para que dos nodos con la misma página compartan pestaña.
  const [pestanas, setPestanas] = useState<PestanaNavegador[]>(() => {
    const inicial = pestanaDeVista('n1', story.n1!.view, dominio)
    return inicial ? [inicial] : []
  })

  useEffect(() => {
    const nueva = pestanaDeVista(engine.current, engine.node.view, dominio)
    if (!nueva) return
    setPestanas((abiertas) =>
      abiertas.some((p) => p.url === nueva.url) ? abiertas : [...abiertas, nueva],
    )
    setPestanaMirada(undefined)
  }, [engine.current, engine.node.view, dominio])

  const urlVisible = pestanaDeVista(nodoVisible, vista, dominio)?.url
  const activa = pestanas.find((p) => p.url === urlVisible)?.id ?? pestanas[0]?.id ?? 'n1'

  // Un clic en la barra del cliente vale lo mismo que elegir de la lista: los
  // botones llevan su destino en `data-hotspot-goto` y este manejador único lo
  // traduce en una decisión del grafo.
  const onHotspot = (event: React.MouseEvent) => {
    // Cambiar de pestaña se resuelve aquí y no llega al grafo: en este motor la
    // decisión es la que se elige de la lista, no la pantalla que se mira.
    const cerrada = (event.target as HTMLElement).closest<HTMLElement>('[data-cierra]')?.dataset
      .cierra
    if (cerrada) {
      setPestanas((abiertas) => abiertas.filter((p) => p.id !== cerrada))
      setPestanaMirada(undefined)
      if (!engine.isEnding) manejarClicHotspot(event, engine.choose)
      return
    }

    const pestana = (event.target as HTMLElement).closest<HTMLElement>('[data-pestana]')?.dataset
      .pestana
    if (pestana) {
      setPestanaMirada(pestana)
      return
    }

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
        vista.kind === 'sms' ? (
          <DeviceScreen view={vista} acciones={accionesCorreo} destinatario={destinatario} />
        ) : (
          <VentanaNavegador
            pestanas={pestanas}
            activa={activa}
            marcadores={marcadores}
            reloj={reloj}
            onClick={onHotspot}
          >
            <DeviceScreen view={vista} acciones={accionesCorreo} destinatario={destinatario} />
          </VentanaNavegador>
        )
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
