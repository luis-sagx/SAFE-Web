import { Lock, TriangleAlert } from 'lucide-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import EscenarioLayout from './EscenarioLayout'
import Instrucciones from './ui/Instrucciones'
import { carpetasCorreo } from './ui/carpetasCorreo'
import type { Contexto } from './ui/ContextoEscenario'
import DeviceScreen, { type ScreenView } from './ui/DeviceScreen'
import { evitarNavegacion, manejarClicHotspot } from './ui/interactivo'
import type { AccionCorreo, Reloj } from './ui/DesktopChrome'
import { Navegador, type MarcadorNavegador, type PestanaConfig } from './ui/Navegador'
import NotificacionTelefono, { type Notificacion } from './ui/NotificacionTelefono'
import StoryChoices from './ui/StoryChoices'
import type { DatoIdentidad } from './ui/TarjetaIdentidad'
import PanelVeredicto, { type Senal } from './ui/PanelVeredicto'
import { useAuth } from '../context/AuthContext'
import { useStoryEngine, type Story, type StoryNode } from '../hooks/useStoryEngine'
import styles from './ui/DeviceScreen.module.css'

export interface ScreenNode extends StoryNode {
  view: ScreenView
  senales?: Senal[]
  // Va en el nodo y no en la vista: dos nodos con la misma pantalla pueden
  // diferir en si la notificación ya llegó.
  notificacion?: Notificacion
  // Pantallas que solo se observan: pasado este tiempo el grafo avanza solo.
  autoAvanza?: { ms: number; goto: string }
}

interface StoryEscenarioProps {
  escenarioId: string
  resumen: string
  contexto: Contexto
  nota?: ReactNode
  story: Story<ScreenNode>
  initialNode?: string
  senales: Senal[]
  rule: string
  /** @deprecated La repetición ahora se inicia a nivel de módulo. */
  restartLabel?: string
  pregunta?: string
  // El escenario que las pasa debe declarar también sus finales en el grafo.
  accionesCorreo?: AccionCorreo[]
  dominioCorreo?: string
  reloj?: Reloj
  marcadores?: MarcadorNavegador[]
  instruccion?: ReactNode
  cuandoTermina?: ReactNode
  pista?: ReactNode
  identidad?: DatoIdentidad[]
  accionesEnPantalla?: boolean
  apps?: AppTelefono[]
}

// Todas las apps del dock reaccionan al pulsarlas (deliberado: si solo
// reaccionara la que decide, el realce del cursor delataría la respuesta).
// goto = decisión en la traza; vacia = estado vacío, no entra en la traza;
// ninguno = vuelve al hilo de Mensajes.
export type AppTelefono = MarcadorNavegador & {
  vacia?: string
  // A qué pantalla vuelve si no lleva goto ni vacia; solo hace falta cuando
  // el escenario tiene mensajes y llamada a la vez.
  hilo?: 'sms' | 'call'
  color?: string
  // Destino cuando se abre con una llamada real en curso (no el marcador).
  gotoEnLlamada?: string
}

function pestanaDeVista(view: ScreenView, dominio: string): PestanaConfig | null {
  if (view.kind === 'mail') {
    return {
      titulo: 'Correo',
      url: `https://correo.${dominio}/recibidos`,
      segura: true,
    }
  }
  if (view.kind === 'web') {
    return {
      titulo: view.title,
      url: view.url,
      segura: view.secure,
      local: view.local,
      senalUrl: view.senalUrl,
      cierra: view.cerrarGoto,
    }
  }
  // Un chat que declara `sitio` es una página, no una app: se abre en navegador.
  if (view.kind === 'sms' && view.sitio) {
    return { titulo: view.sitio.titulo, url: view.sitio.url, segura: true }
  }
  return null
}

function urlMovil(url: string): string {
  return url.replace(/^https?:\/\//, '')
}

// La hora de la barra de estado sale del último mensaje del hilo (el "ahora"
// de la escena), no de una constante; descarta sellos relativos ("ayer").
const HORA_DEL_DIA = /^\d{1,2}:\d{2}$/

function horaDeVista(view: ScreenView): string | undefined {
  if (view.kind !== 'sms') return undefined
  const ultima = view.msgs.at(-1)?.time
  return ultima && HORA_DEL_DIA.test(ultima) ? ultima : undefined
}

function StoryEscenario({
  escenarioId,
  resumen,
  contexto,
  nota,
  story,
  initialNode = 'n1',
  senales,
  rule,
  restartLabel,
  pregunta = '¿Qué haces?',
  accionesCorreo,
  dominioCorreo,
  reloj,
  marcadores,
  instruccion,
  cuandoTermina,
  pista,
  identidad,
  accionesEnPantalla = false,
  apps,
}: StoryEscenarioProps) {
  const engine = useStoryEngine(story, initialNode, escenarioId)
  const { usuarioSimulado } = useAuth()
  const destinatario = dominioCorreo ? `${usuarioSimulado}@${dominioCorreo}` : undefined

  // Durante el repaso vuelve a la pantalla que contiene cada señal.
  const [pantallaRepaso, setPantallaRepaso] = useState<string | undefined>()
  // Cambiar de pestaña es mirar, no decidir: no entra en la traza.
  const [pestanaMirada, setPestanaMirada] = useState<string | undefined>()
  // Se enciende con el primer clic en el vacío y ya no se apaga.
  const [tocoEnVacio, setTocoEnVacio] = useState(false)
  // App del dock que no decide nada (cámara, galería); vive fuera del grafo
  // igual que `pestanaMirada`.
  const [appAbierta, setAppAbierta] = useState<{ nombre: string; vacia: string } | undefined>()
  // Última pantalla de cada app de comunicación (hilo SMS y llamada en curso);
  // su icono vuelve a ella sin tocar el grafo. Son dos porque un escenario
  // puede tener las dos cosas y "volver" depende del icono pulsado.
  const [hilos, setHilos] = useState<{ sms?: string; call?: string }>({})
  // Notificaciones ya vistas; `reiniciar` las limpia junto con engine.restart.
  const [descartadas, setDescartadas] = useState<string[]>([])
  const nodoVisible = pantallaRepaso ?? pestanaMirada ?? engine.current
  const vistaDelNodo = story[nodoVisible]?.view ?? engine.node.view
  // Releer el hilo desde otra pantalla no puede terminar la corrida: la flecha
  // de la cabecera solo cierra el hilo.
  const vista =
    vistaDelNodo.kind === 'sms' && !pantallaRepaso && nodoVisible !== engine.current
      ? { ...vistaDelNodo, volverGoto: undefined, volverLabel: undefined }
      : vistaDelNodo

  // El reloj se queda en la última hora que enseñó un hilo y no retrocede;
  // sin ningún hilo (una llamada) se queda en la hora neutra.
  const horaVista = horaDeVista(vista)
  const [horaTelefono, setHoraTelefono] = useState(
    () =>
      Object.values(story)
        .map((nodo) => horaDeVista(nodo.view))
        .find(Boolean) ?? '09:41',
  )

  useEffect(() => {
    if (horaVista) setHoraTelefono(horaVista)
  }, [horaVista])

  const dominio = dominioCorreo ?? 'safeweb.com'
  // Cada pantalla nueva abre una pestaña; se indexan por dirección para que
  // dos nodos con la misma página la compartan.
  const [abiertas, setAbiertas] = useState<string[]>(['n1'])

  useEffect(() => {
    // Un final no abre pantalla (issue #26).
    if (engine.isEnding) return
    if (!pestanaDeVista(engine.node.view, dominio)) return
    setAbiertas((ids) => (ids.includes(engine.current) ? ids : [...ids, engine.current]))
    setPestanaMirada(undefined)
  }, [engine.current, engine.isEnding, engine.node.view, dominio])

  useEffect(() => {
    // Cuál es "Mensajes" cambia durante la corrida (tras responder, es el hilo
    // con el borrador, no el original).
    const kind = engine.node.view.kind
    if (kind === 'sms' || kind === 'call') {
      setHilos((previos) => ({ ...previos, [kind]: engine.current }))
    }
  }, [engine.current, engine.node.view])

  // Se reinicia con cada nodo y se cancela si se sale antes de tiempo.
  useEffect(() => {
    const auto = engine.node.autoAvanza
    if (!auto || engine.isEnding) return
    const timer = setTimeout(() => engine.choose(auto.goto), auto.ms)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.current, engine.isEnding])

  // Pertenece a engine.current, no a la pantalla que se mira; no se pinta
  // sobre el veredicto ni durante el repaso.
  const notificacionNodo = story[engine.current]?.notificacion
  const mostrarNotificacion = Boolean(
    notificacionNodo && !engine.isEnding && !pantallaRepaso && !descartadas.includes(engine.current),
  )

  useEffect(() => {
    if (!mostrarNotificacion) return
    // Se marca al salir del nodo, no al entrar: el momento ya pasó y no vuelve.
    return () => setDescartadas((ids) => [...ids, engine.current])
  }, [mostrarNotificacion, engine.current])

  const reiniciar = useCallback(() => {
    setDescartadas([])
    engine.restart()
  }, [engine.restart])

  const pestanas: Record<string, PestanaConfig> = {}
  const porUrl = new Map<string, string>()
  const visibles: string[] = []
  // Durante el repaso entra también la pantalla que se explica aunque no se
  // haya abierto (issue #24).
  const paraPestanas =
    pantallaRepaso && !abiertas.includes(pantallaRepaso) ? [...abiertas, pantallaRepaso] : abiertas

  for (const id of paraPestanas) {
    const meta = story[id] && pestanaDeVista(story[id]!.view, dominio)
    if (!meta) continue
    // Dos pantallas del mismo sitio comparten pestaña, pero la pestaña toma
    // el título y el cierre de la última que se abrió en ella.
    const yaAbierta = porUrl.get(meta.url)
    if (yaAbierta) {
      pestanas[yaAbierta] = meta
      continue
    }
    porUrl.set(meta.url, id)
    pestanas[id] = meta
    visibles.push(id)
  }

  const correo = Object.values(story).find((nodo) => nodo.view.kind === 'mail')?.view
  const carpetas =
    correo?.kind === 'mail'
      ? carpetasCorreo(
          {
            nombre: correo.from,
            direccion: correo.address,
            asunto: correo.subject,
          },
          // Durante el repaso la bandeja vuelve a tener el mensaje.
          engine.isEnding && !pantallaRepaso ? engine.current : undefined,
        )
      : undefined

  const metaVisible = pestanaDeVista(vista, dominio)
  const pestanaVisible = metaVisible && porUrl.get(metaVisible.url)
  if (pestanaVisible && pestanas[pestanaVisible]) {
    pestanas[pestanaVisible] = metaVisible
  }

  const urlVisible = pestanaDeVista(vista, dominio)?.url
  const activa = (urlVisible && porUrl.get(urlVisible)) ?? visibles[0] ?? 'n1'

  const onHotspot = (event: React.MouseEvent) => {
    evitarNavegacion(event)

    // Cambiar de pestaña se resuelve aquí y no llega al grafo.
    const cerrada = (event.target as HTMLElement).closest<HTMLElement>('[data-cierra]')?.dataset
      .cierra
    if (cerrada) {
      // Una pestaña puede plegar varias pantallas del mismo sitio: se cierran
      // todas con ella.
      const url = pestanas[cerrada]?.url
      const quedan = abiertas.filter(
        (id) =>
          id !== cerrada && (!story[id] || pestanaDeVista(story[id]!.view, dominio)?.url !== url),
      )
      setAbiertas(quedan)
      // Pasa a la pestaña que sigue abierta, como al cerrar una de verdad.
      setPestanaMirada(quedan.at(-1))
      if (!engine.isEnding) manejarClicHotspot(event, engine.choose)
      return
    }

    const pestana = (event.target as HTMLElement).closest<HTMLElement>('[data-pestana]')?.dataset
      .pestana
    if (pestana) {
      setPestanaMirada(pestana)
      return
    }

    // App de Mensajes: cierra lo que hubiera encima y muestra el hilo sin
    // avanzar el grafo.
    const hilo = (event.target as HTMLElement).closest<HTMLElement>('[data-app-hilo]')?.dataset
      .appHilo
    if (hilo !== undefined) {
      if (!engine.isEnding) {
        const cerrarGoto = engine.node.view.kind === 'web' ? engine.node.view.cerrarGoto : undefined
        const cerrarLabel = engine.node.view.kind === 'web' ? engine.node.view.cerrarLabel : undefined
        const destinoAlCerrar =
          cerrarGoto && story[cerrarGoto]?.view.kind === hilo ? cerrarGoto : undefined

        // Desde una app intermedia, Mensajes cierra esa app para continuar el chat.
        if (destinoAlCerrar) {
          setAppAbierta(undefined)
          setPestanaMirada(undefined)
          engine.choose(destinoAlCerrar, cerrarLabel)
          return
        }

        const destino =
          (hilo === 'sms' || hilo === 'call' ? hilos[hilo] : undefined) ??
          hilos.call ??
          hilos.sms ??
          'n1'
        // Con una app encima el botón no alterna: solo la cierra y deja el hilo.
        setPestanaMirada((mirando) => (appAbierta ? destino : mirando ? undefined : destino))
        setAppAbierta(undefined)
      }
      return
    }

    // Abrir una app que no decide nada, o cerrarla con su flecha de atrás.
    const app = (event.target as HTMLElement).closest<HTMLElement>('[data-app]')?.dataset
    if (app) {
      if (!engine.isEnding) {
        setAppAbierta(app.appVacia ? { nombre: app.app ?? '', vacia: app.appVacia } : undefined)
      }
      return
    }

    if (engine.isEnding) return

    const objetivo = (event.target as HTMLElement).closest<HTMLElement>('[data-hotspot-goto]')
    if (!objetivo) {
      // Los controles del propio aparato (nota de voz, silenciar llamada) sí
      // responden sin decidir nada.
      const control = (event.target as HTMLElement).closest('[data-control]')
      if (!engine.node.choices && !control) setTocoEnVacio(true)
      return
    }

    // No puede dejarse al efecto que limpia pestanaMirada al cambiar de nodo:
    // si el destino es el nodo actual, el nodo no cambia y ese efecto no corre.
    setAppAbierta(undefined)
    setPestanaMirada(undefined)

    // Volver a la pantalla en la que ya estás no es una decisión (evita n3→n3).
    if (objetivo.dataset.hotspotGoto !== engine.current) {
      manejarClicHotspot(event, engine.choose)
    }
  }

  // Un chat de IA con `sitio` (ver DeviceScreen) manda el marco de escritorio.
  const chatEnNavegador = vista.kind === 'sms' && Boolean(vista.sitio)

  const decision = engine.isEnding ? (
    <PanelVeredicto
      estadoGuardado={engine.runStatus}
      escenarioId={escenarioId}
      node={engine.node}
      senales={engine.node.senales ?? senales}
      regla={rule}
      restartLabel={restartLabel}
      onRestart={reiniciar}
      contenedorId="pantalla-escenario"
      onPantalla={setPantallaRepaso}
    />
  ) : (
    (() => {
      // Antes de tocar el destello la escena ya avisa qué tocar (ver
      // EscenaFoto), así que "¿Qué haces?" y la pista aún no dicen nada.
      const antesDelDestello = vista.kind === 'escena' && vista.destello && !engine.node.choices

      return (
        <div className="grid gap-3">
          {!antesDelDestello && <p className="text-lg font-semibold text-ink">{pregunta}</p>}
          {engine.node.choices && <StoryChoices choices={engine.node.choices} onChoose={engine.choose} />}
          <Instrucciones
            pista={antesDelDestello ? undefined : pista}
            cuandoTermina={cuandoTermina}
            fallo={tocoEnVacio}
          >
            {engine.node.choices ? undefined : instruccion}
          </Instrucciones>
        </div>
      )
    })()
  )

  const pantallaTelefono = (
    <div className={styles.phoneStage} onClick={onHotspot}>
      <div className={styles.phoneStatusBar} aria-hidden>
        <span>{horaTelefono}</span>
        <span className={styles.phoneSensors}>
          <span className={styles.phoneSignal}>▮▮▮</span>
          <span>5G</span>
          <span className={styles.phoneBattery}></span>
        </span>
      </div>
      <div className={styles.phoneBody}>
        {mostrarNotificacion && notificacionNodo && (
          <NotificacionTelefono
            notificacion={notificacionNodo}
            onDescartar={() => setDescartadas((ids) => [...ids, engine.current])}
          />
        )}
        <div className={styles.phoneApp}>
          {appAbierta && !engine.isEnding ? (
            <>
              <div className={styles.phoneAppBar}>
                <button
                  type="button"
                  className={`${styles.hotspot} ${styles.phoneAppVolver}`}
                  aria-label={
                    vista.kind === 'call' ? 'Volver a la llamada' : 'Volver al hilo de mensajes'
                  }
                  data-app=""
                >
                  ‹
                </button>
                <span className={styles.phoneAppBarNombre}>{appAbierta.nombre}</span>
                <span className={styles.phoneAppVolver} aria-hidden />
              </div>
              <div className={styles.phoneViewport}>
                <p className={styles.appVacia}>{appAbierta.vacia}</p>
              </div>
            </>
          ) : (
            <>
              {vista.kind === 'web' &&
                (vista.app ? (
                  // Una app no tiene barra de direcciones: no hay dominio que
                  // comprobar porque no se llegó por un enlace.
                  <div className={styles.phoneAppBar}>
                    {/* Salir es a veces la decisión (colgar una llamada). */}
                    {vista.cerrarGoto ? (
                      <button
                        type="button"
                        className={`${styles.hotspot} ${styles.phoneBrowserControl}`}
                        aria-label="Salir de la aplicación"
                        data-hotspot-goto={vista.cerrarGoto}
                        data-hotspot-label={vista.cerrarLabel}
                      >
                        ‹
                      </button>
                    ) : (
                      <span className={styles.phoneBrowserControl} aria-hidden>
                        ‹
                      </span>
                    )}
                    <span className={styles.phoneAppBarNombre}>{vista.app}</span>
                  </div>
                ) : (
                  <div className={styles.phoneBrowserBar} data-signal={vista.senalUrl}>
                    {/* Sin pestaña que cerrar, salir es la flecha de atrás. */}
                    {vista.cerrarGoto ? (
                      <button
                        type="button"
                        className={`${styles.hotspot} ${styles.phoneBrowserControl}`}
                        aria-label="Volver atrás"
                        data-hotspot-goto={vista.cerrarGoto}
                        data-hotspot-label={vista.cerrarLabel}
                      >
                        ‹
                      </button>
                    ) : (
                      <span className={styles.phoneBrowserControl} aria-hidden>
                        ‹
                      </span>
                    )}
                    <span className={styles.phoneBrowserUrl}>
                      {/* El indicador de seguridad es justo lo que el módulo enseña a leer. */}
                      {vista.secure ? (
                        <Lock
                          aria-label="Conexión segura"
                          className={`${styles.phoneBrowserSecurity} ${styles.phoneBrowserSafe}`}
                          strokeWidth={2.25}
                        />
                      ) : (
                        <span className={styles.phoneBrowserUnsafe}>
                          <TriangleAlert
                            aria-hidden
                            className={styles.phoneBrowserSecurity}
                            strokeWidth={2.25}
                          />
                        </span>
                      )}
                      <span className={styles.phoneBrowserAddress}>{urlMovil(vista.url)}</span>
                    </span>
                    <span className={styles.phoneBrowserControl} aria-hidden>
                      ⋮
                    </span>
                  </div>
                ))}
              <div className={styles.phoneViewport}>
                <DeviceScreen
                  view={vista}
                  acciones={accionesCorreo}
                  carpetas={carpetas}
                  destinatario={destinatario}
                  carpetaForzada={pantallaRepaso ? 'Recibidos' : undefined}
                  terminada={engine.isEnding}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Siempre visible: en varios escenarios entrar por tu cuenta al dock es
          el único camino al acierto. */}
      {apps && apps.length > 0 && (
        <div className={styles.phoneDock} aria-label="Apps del teléfono">
          {apps.map(({ Icono, texto, goto, gotoEnLlamada, label, vacia, color, hilo }) => {
            // El marcador no cuenta como llamada: tocar un número no es haber llamado.
            const enLlamada = vista.kind === 'call' && !vista.marcando
            const destino = (enLlamada && gotoEnLlamada) || goto
            return (
            <button
              key={texto}
              type="button"
              className={styles.phoneDockApp}
              data-hotspot-goto={destino}
              data-hotspot-label={label}
              // Las que no deciden se abren igual (ver AppTelefono).
              data-app={destino || !vacia ? undefined : texto}
              data-app-vacia={destino ? undefined : vacia}
              data-app-hilo={destino || vacia ? undefined : (hilo ?? '')}
            >
              <span
                className={styles.phoneDockIcono}
                style={color ? { background: color } : undefined}
              >
                <Icono aria-hidden className={styles.phoneDockGlifo} strokeWidth={2} />
              </span>
              <span className={styles.phoneDockNombre}>{texto}</span>
            </button>
            )
          })}
        </div>
      )}

      <div className={styles.phoneSystemBar} aria-hidden>
        <span></span>
      </div>
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
        accionesEnPantalla && !chatEnNavegador ? (
          pantallaTelefono
        ) : !chatEnNavegador && (vista.kind === 'sms' || vista.kind === 'escena') ? (
          <div className="contents" onClick={onHotspot}> {/* NOSONAR: delega el clic a los <button>/<a> nativos que contiene, que ya manejan teclado por sí solos */}
            <DeviceScreen
              view={vista}
              acciones={accionesCorreo}
              carpetas={carpetas}
              destinatario={destinatario}
            />
          </div>
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
      identidad={identidad}
      decision={decision}
      resultado={engine.resultado}
      onEmpezar={reiniciar}
      // El correo y la web se abren más en computador que en celular; el SMS
      // se queda en celular, que es donde de verdad llegan los mensajes.
      dispositivo={
        vista.kind === 'escena'
          ? 'escena'
          : !chatEnNavegador && (accionesEnPantalla || vista.kind === 'sms')
            ? 'telefono'
            : 'escritorio'
      }
    />
  )
}

export default StoryEscenario
