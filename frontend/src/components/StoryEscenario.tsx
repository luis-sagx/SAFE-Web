import { useEffect, useState, type ReactNode } from 'react'
import EscenarioLayout from './EscenarioLayout'
import Instrucciones from './ui/Instrucciones'
import { carpetasCorreo } from './ui/carpetasCorreo'
import DeviceScreen, { type ScreenView } from './ui/DeviceScreen'
import { evitarNavegacion, manejarClicHotspot } from './ui/interactivo'
import type { AccionCorreo, Reloj } from './ui/DesktopChrome'
import { Navegador, type MarcadorNavegador, type PestanaConfig } from './ui/Navegador'
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
  /** Qué se le dice al participante cuando el nodo no ofrece lista de opciones
   *  y hay que actuar sobre la propia pantalla. */
  instruccion?: ReactNode
  /** Los caminos posibles, para quien se atasca. No dice cuál es el bueno. */
  pista?: ReactNode
}

/// Cómo se ve cada pantalla en la barra de direcciones. El correo va en el
/// dominio del participante, para que la dirección de la pestaña y la del
/// mensaje cuenten lo mismo.
function pestanaDeVista(view: ScreenView, dominio: string): PestanaConfig | null {
  if (view.kind === 'mail') {
    return { titulo: 'Correo', url: `https://correo.${dominio}/recibidos`, segura: true }
  }
  if (view.kind === 'web') {
    return {
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
  instruccion,
  pista,
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
  /// Se enciende con el primer clic que no cae en ningún punto interactivo y ya
  /// no se apaga: quien exploró a ciegas una vez agradece tener la pista a la
  /// vista el resto del escenario.
  const [tocoEnVacio, setTocoEnVacio] = useState(false)
  const nodoVisible = pantallaRepaso ?? pestanaMirada ?? engine.current
  const vista = story[nodoVisible]?.view ?? engine.node.view

  const dominio = dominioCorreo ?? 'safeweb.com'
  /// Las pestañas se acumulan según el recorrido: cada pantalla nueva abre una,
  /// como haría un enlace en un navegador de verdad. Se indexan por dirección
  /// para que dos nodos con la misma página compartan pestaña.
  const [abiertas, setAbiertas] = useState<string[]>(['n1'])

  useEffect(() => {
    if (!pestanaDeVista(engine.node.view, dominio)) return
    setAbiertas((ids) => (ids.includes(engine.current) ? ids : [...ids, engine.current]))
    setPestanaMirada(undefined)
  }, [engine.current, engine.node.view, dominio])

  // Una pestaña por escena con pantalla. Se indexan por nodo, como pide su
  // Navegador, y las que comparten dirección se pliegan en una sola.
  const pestanas: Record<string, PestanaConfig> = {}
  const porUrl = new Map<string, string>()
  const visibles: string[] = []
  for (const id of abiertas) {
    const meta = story[id] && pestanaDeVista(story[id]!.view, dominio)
    if (!meta) continue
    // Dos pantallas del mismo sitio comparten pestaña, pero no significan lo
    // mismo: en aviso-filtracion, cerrar tras guardar la contraseña no es lo
    // mismo que cerrar sin guardarla. La pestaña conserva su sitio y su
    // identidad, y toma el título y el cierre de la última pantalla que se
    // abrió en ella, que es la que se está viendo.
    const yaAbierta = porUrl.get(meta.url)
    if (yaAbierta) {
      pestanas[yaAbierta] = meta
      continue
    }
    porUrl.set(meta.url, id)
    pestanas[id] = meta
    visibles.push(id)
  }

  // El mensaje que las carpetas muestran cuando una acción lo mueve. Sale de la
  // primera pantalla de correo del guion, que es la del mensaje del escenario.
  const correo = Object.values(story).find((nodo) => nodo.view.kind === 'mail')?.view
  const carpetas =
    correo?.kind === 'mail'
      ? carpetasCorreo(
          { nombre: correo.from, direccion: correo.address, asunto: correo.subject },
          // Durante el repaso la bandeja vuelve a tener el mensaje: si no, las
          // señales se explicarían sobre una pantalla donde ya no está.
          engine.isEnding && !pantallaRepaso ? engine.current : undefined,
        )
      : undefined

  // Y durante el repaso manda la pantalla que se está explicando: si no, la
  // señal que vive en la barra de direcciones no tendría dónde resaltarse.
  const metaVisible = pestanaDeVista(vista, dominio)
  const pestanaVisible = metaVisible && porUrl.get(metaVisible.url)
  if (pestanaVisible && pestanas[pestanaVisible]) {
    pestanas[pestanaVisible] = metaVisible
  }

  const urlVisible = pestanaDeVista(vista, dominio)?.url
  const activa = (urlVisible && porUrl.get(urlVisible)) ?? visibles[0] ?? 'n1'

  // Un clic en la barra del cliente vale lo mismo que elegir de la lista: los
  // botones llevan su destino en `data-hotspot-goto` y este manejador único lo
  // traduce en una decisión del grafo.
  const onHotspot = (event: React.MouseEvent) => {
    evitarNavegacion(event)

    // Cambiar de pestaña se resuelve aquí y no llega al grafo: en este motor la
    // decisión es la que se elige de la lista, no la pantalla que se mira.
    const cerrada = (event.target as HTMLElement).closest<HTMLElement>('[data-cierra]')?.dataset
      .cierra
    if (cerrada) {
      setAbiertas((ids) => ids.filter((id) => id !== cerrada))
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
    // Solo cuando la pantalla es el control: con lista de opciones, pulsar el
    // cuerpo del correo no tiene por qué responder a nada.
    if (!manejarClicHotspot(event, engine.choose) && !engine.node.choices) {
      setTocoEnVacio(true)
    }
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
    <div className="grid gap-3">
      <p className="text-lg font-semibold text-ink">{pregunta}</p>
      {engine.node.choices ? (
        <StoryChoices choices={engine.node.choices} onChoose={engine.choose} />
      ) : (
        <Instrucciones pista={pista} fallo={tocoEnVacio}>
          {instruccion}
        </Instrucciones>
      )}
    </div>
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
          <DeviceScreen
            view={vista}
            acciones={accionesCorreo}
            carpetas={carpetas}
            destinatario={destinatario}
          />
        ) : (
          <Navegador
            pestanas={pestanas}
            abiertas={visibles}
            activa={activa}
            marcadores={marcadores ?? []}
            reloj={reloj}
            onHotspot={onHotspot}
          >
            <DeviceScreen
              view={vista}
              acciones={accionesCorreo}
              carpetas={carpetas}
              destinatario={destinatario}
              carpetaForzada={pantallaRepaso ? 'Recibidos' : undefined}
            />
          </Navegador>
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
