import { Lock, TriangleAlert } from 'lucide-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import ScenarioLayout from './EscenarioLayout'
import Instructions from './ui/Instrucciones'
import { createEmailFolders } from './ui/carpetasCorreo'
import type { Context } from './ui/ContextoEscenario'
import DeviceScreen, { type ScreenView } from './ui/DeviceScreen'
import { preventNavigation, handleHotspotClick } from './ui/interactivo'
import type { EmailAction, Clock } from './ui/DesktopChrome'
import { Browser, type BrowserBookmark, type TabConfig } from './ui/Navegador'
import PhoneNotification, { type Notification } from './ui/NotificacionTelefono'
import StoryChoices from './ui/StoryChoices'
import type { IdentityData } from './ui/TarjetaIdentidad'
import VerdictPanel, { type Signal } from './ui/PanelVeredicto'
import { useAuth } from '../context/AuthContext'
import { useStoryEngine, type Story, type StoryNode } from '../hooks/useStoryEngine'
import styles from './ui/DeviceScreen.module.css'

export interface ScreenNode extends StoryNode {
  view: ScreenView
  senales?: Signal[]
  // Va en el nodo y no en la vista: dos nodos con la misma pantalla pueden
  // diferir en si la notificación ya llegó.
  notificacion?: Notification
  // Pantallas que solo se observan: pasado este tiempo el grafo avanza solo.
  autoAvanza?: { ms: number; goto: string }
}

interface ScenarioStoryProps {
  escenarioId: string
  resumen: string
  contexto: Context
  nota?: ReactNode
  story: Story<ScreenNode>
  initialNode?: string
  senales: Signal[]
  rule: string
  /** @deprecated La repetición ahora se inicia a nivel de módulo. */
  restartLabel?: string
  pregunta?: string
  // El escenario que las pasa debe declarar también sus finales en el grafo.
  accionesCorreo?: EmailAction[]
  dominioCorreo?: string
  reloj?: Clock
  marcadores?: BrowserBookmark[]
  instruccion?: ReactNode
  cuandoTermina?: ReactNode
  pista?: ReactNode
  identidad?: IdentityData[]
  accionesEnPantalla?: boolean
  apps?: PhoneApp[]
}

// Todas las apps del dock reaccionan al pulsarlas (deliberado: si solo
// reaccionara la que decide, el realce del cursor delataría la respuesta).
// goto = decisión en la traza; vacia = estado vacío, no entra en la traza;
// ninguno = vuelve al hilo de Mensajes.
export type PhoneApp = BrowserBookmark & {
  vacia?: string
  // A qué pantalla vuelve si no lleva goto ni vacia; solo hace falta cuando
  // el escenario tiene mensajes y llamada a la vez.
  hilo?: 'sms' | 'call'
  color?: string
  // Destino cuando se abre con una llamada real en curso (no el marcador).
  gotoEnLlamada?: string
}

function viewTab(view: ScreenView, domain: string): TabConfig | null {
  if (view.kind === 'mail') {
    return {
      titulo: 'Correo',
      url: `https://correo.${domain}/recibidos`,
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

function mobileUrl(url: string): string {
  return url.replace(/^https?:\/\//, '')
}

// La hora de la barra de estado sale del último mensaje del hilo (el "ahora"
// de la escena), no de una constante; descarta sellos relativos ("ayer").
const TIME_OF_DAY = /^\d{1,2}:\d{2}$/

function getViewTime(view: ScreenView): string | undefined {
  if (view.kind !== 'sms') return undefined
  const latest = view.msgs.at(-1)?.time
  return latest && TIME_OF_DAY.test(latest) ? latest : undefined
}

function ScenarioStory({
  escenarioId: scenarioId,
  resumen: summary,
  contexto: context,
  nota: note,
  story,
  initialNode = 'n1',
  senales: signals,
  rule,
  restartLabel,
  pregunta: question = '¿Qué haces?',
  accionesCorreo: emailActions,
  dominioCorreo: emailDomain,
  reloj: clock,
  marcadores: markers,
  instruccion: instruction,
  cuandoTermina: onFinished,
  pista: clue,
  identidad: identity,
  accionesEnPantalla: screenActions = false,
  apps,
}: ScenarioStoryProps) {
  const engine = useStoryEngine(story, initialNode, scenarioId)
  const { usuarioSimulado: simulatedUser } = useAuth()
  const recipient = emailDomain ? `${simulatedUser}@${emailDomain}` : undefined

  // Durante el repaso vuelve a la pantalla que contiene cada señal.
  const [reviewScreen, setReviewScreen] = useState<string | undefined>()
  // Cambiar de pestaña es mirar, no decidir: no entra en la traza.
  const [viewedTab, setViewedTab] = useState<string | undefined>()
  // Se enciende con el primer clic en el vacío y ya no se apaga.
  const [clickedEmptySpace, setClickedEmptySpace] = useState(false)
  // App del dock que no decide nada (cámara, galería); vive fuera del grafo
  // igual que `pestanaMirada`.
  const [appOpen, setAppOpen] = useState<{ nombre: string; vacia: string } | undefined>()
  // Última pantalla de cada app de comunicación (hilo SMS y llamada en curso);
  // su icono vuelve a ella sin tocar el grafo. Son dos porque un escenario
  // puede tener las dos cosas y "volver" depende del icono pulsado.
  const [threads, setThreads] = useState<{ sms?: string; call?: string }>({})
  // Notificaciones ya vistas; `reiniciar` las limpia junto con engine.restart.
  const [discarded, setDiscarded] = useState<string[]>([])
  const visibleNode = reviewScreen ?? viewedTab ?? engine.current
  const getNodeView = story[visibleNode]?.view ?? engine.node.view
  // Releer el hilo desde otra pantalla no puede terminar la corrida: la flecha
  // de la cabecera solo cierra el hilo.
  const toView =
    getNodeView.kind === 'sms' && !reviewScreen && visibleNode !== engine.current
      ? { ...getNodeView, volverGoto: undefined, volverLabel: undefined }
      : getNodeView

  // El reloj se queda en la última hora que enseñó un hilo y no retrocede;
  // sin ningún hilo (una llamada) se queda en la hora neutra.
  const currentViewTime = getViewTime(toView)
  const [phoneTime, setPhoneTime] = useState(
    () =>
      Object.values(story)
        .map((node) => getViewTime(node.view))
        .find(Boolean) ?? '09:41',
  )

  useEffect(() => {
    if (currentViewTime) setPhoneTime(currentViewTime)
  }, [currentViewTime])

  const domain = emailDomain ?? 'safeweb.com'
  // Cada pantalla nueva abre una pestaña; se indexan por dirección para que
  // dos nodos con la misma página la compartan.
  const [open, setOpen] = useState<string[]>(['n1'])

  useEffect(() => {
    // Un final no abre pantalla (issue #26).
    if (engine.isEnding) return
    if (!viewTab(engine.node.view, domain)) return
    setOpen((ids) => (ids.includes(engine.current) ? ids : [...ids, engine.current]))
    setViewedTab(undefined)
  }, [engine.current, engine.isEnding, engine.node.view, domain])

  useEffect(() => {
    // Cuál es "Mensajes" cambia durante la corrida (tras responder, es el hilo
    // con el borrador, no el original).
    const kind = engine.node.view.kind
    if (kind === 'sms' || kind === 'call') {
      setThreads((previous) => ({ ...previous, [kind]: engine.current }))
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
  const nodeNotification = story[engine.current]?.notificacion
  const showNotification = Boolean(
    nodeNotification && !engine.isEnding && !reviewScreen && !discarded.includes(engine.current),
  )

  useEffect(() => {
    if (!showNotification) return
    // Se marca al salir del nodo, no al entrar: el momento ya pasó y no vuelve.
    return () => setDiscarded((ids) => [...ids, engine.current])
  }, [showNotification, engine.current])

  const restart = useCallback(() => {
    setDiscarded([])
    engine.restart()
  }, [engine.restart])

  const tabs: Record<string, TabConfig> = {}
  const byUrl = new Map<string, string>()
  const visible: string[] = []
  // Durante el repaso entra también la pantalla que se explica aunque no se
  // haya abierto (issue #24).
  const tabNodeIds =
    reviewScreen && !open.includes(reviewScreen) ? [...open, reviewScreen] : open

  for (const id of tabNodeIds) {
    const meta = story[id] && viewTab(story[id]!.view, domain)
    if (!meta) continue
    // Dos pantallas del mismo sitio comparten pestaña, pero la pestaña toma
    // el título y el cierre de la última que se abrió en ella.
    const alreadyOpen = byUrl.get(meta.url)
    if (alreadyOpen) {
      tabs[alreadyOpen] = meta
      continue
    }
    byUrl.set(meta.url, id)
    tabs[id] = meta
    visible.push(id)
  }

  const email = Object.values(story).find((node) => node.view.kind === 'mail')?.view
  const folders =
    email?.kind === 'mail'
      ? createEmailFolders(
          {
            nombre: email.from,
            direccion: email.address,
            asunto: email.subject,
          },
          // Durante el repaso la bandeja vuelve a tener el mensaje.
          engine.isEnding && !reviewScreen ? engine.current : undefined,
        )
      : undefined

  const metaVisible = viewTab(toView, domain)
  const tabVisible = metaVisible && byUrl.get(metaVisible.url)
  if (tabVisible && tabs[tabVisible]) {
    tabs[tabVisible] = metaVisible
  }

  const urlVisible = viewTab(toView, domain)?.url
  const active = (urlVisible && byUrl.get(urlVisible)) ?? visible[0] ?? 'n1'

  const onHotspot = (event: React.MouseEvent) => {
    preventNavigation(event)

    // Cambiar de pestaña se resuelve aquí y no llega al grafo.
    const closed = (event.target as HTMLElement).closest<HTMLElement>('[data-cierra]')?.dataset
      .cierra
    if (closed) {
      // Una pestaña puede plegar varias pantallas del mismo sitio: se cierran
      // todas con ella.
      const url = tabs[closed]?.url
      const remaining = open.filter(
        (id) =>
          id !== closed && (!story[id] || viewTab(story[id]!.view, domain)?.url !== url),
      )
      setOpen(remaining)
      // Pasa a la pestaña que sigue abierta, como al cerrar una de verdad.
      setViewedTab(remaining.at(-1))
      if (!engine.isEnding) handleHotspotClick(event, engine.choose)
      return
    }

    const tab = (event.target as HTMLElement).closest<HTMLElement>('[data-pestana]')?.dataset
      .pestana
    if (tab) {
      setViewedTab(tab)
      return
    }

    // App de Mensajes: cierra lo que hubiera encima y muestra el hilo sin
    // avanzar el grafo.
    const thread = (event.target as HTMLElement).closest<HTMLElement>('[data-app-hilo]')?.dataset
      .appHilo
    if (thread !== undefined) {
      if (!engine.isEnding) {
        const closeGoto = engine.node.view.kind === 'web' ? engine.node.view.cerrarGoto : undefined
        const closeLabel = engine.node.view.kind === 'web' ? engine.node.view.cerrarLabel : undefined
        const closeDestination =
          closeGoto && story[closeGoto]?.view.kind === thread ? closeGoto : undefined

        // Desde una app intermedia, Mensajes cierra esa app para continuar el chat.
        if (closeDestination) {
          setAppOpen(undefined)
          setViewedTab(undefined)
          engine.choose(closeDestination, closeLabel)
          return
        }

        const destination =
          (thread === 'sms' || thread === 'call' ? threads[thread] : undefined) ??
          threads.call ??
          threads.sms ??
          'n1'
        // Con una app encima el botón no alterna: solo la cierra y deja el hilo.
        setViewedTab((viewing) => (appOpen ? destination : viewing ? undefined : destination))
        setAppOpen(undefined)
      }
      return
    }

    // Abrir una app que no decide nada, o cerrarla con su flecha de atrás.
    const app = (event.target as HTMLElement).closest<HTMLElement>('[data-app]')?.dataset
    if (app) {
      if (!engine.isEnding) {
        setAppOpen(app.appVacia ? { nombre: app.app ?? '', vacia: app.appVacia } : undefined)
      }
      return
    }

    if (engine.isEnding) return

    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-hotspot-goto]')
    if (!target) {
      // Los controles del propio aparato (nota de voz, silenciar llamada) sí
      // responden sin decidir nada.
      const control = (event.target as HTMLElement).closest('[data-control]')
      if (!engine.node.choices && !control) setClickedEmptySpace(true)
      return
    }

    // No puede dejarse al efecto que limpia pestanaMirada al cambiar de nodo:
    // si el destino es el nodo actual, el nodo no cambia y ese efecto no corre.
    setAppOpen(undefined)
    setViewedTab(undefined)

    // Volver a la pantalla en la que ya estás no es una decisión (evita n3→n3).
    if (target.dataset.hotspotGoto !== engine.current) {
      handleHotspotClick(event, engine.choose)
    }
  }

  // Un chat de IA con `sitio` (ver DeviceScreen) manda el marco de escritorio.
  const chatInBrowser = toView.kind === 'sms' && Boolean(toView.sitio)

  const decision = engine.isEnding ? (
    <VerdictPanel
      estadoGuardado={engine.runStatus}
      escenarioId={scenarioId}
      node={engine.node}
      senales={engine.node.senales ?? signals}
      regla={rule}
      restartLabel={restartLabel}
      onRestart={restart}
      contenedorId="pantalla-escenario"
      onPantalla={setReviewScreen}
    />
  ) : (
    (() => {
      // Antes de tocar el destello la escena ya avisa qué tocar (ver
      // EscenaFoto), así que "¿Qué haces?" y la pista aún no dicen nada.
      const beforeFlash = toView.kind === 'escena' && toView.destello && !engine.node.choices

      return (
        <div className="grid gap-3">
          {!beforeFlash && <p className="text-lg font-semibold text-ink">{question}</p>}
          {engine.node.choices && <StoryChoices choices={engine.node.choices} onChoose={engine.choose} />}
          <Instructions
            pista={beforeFlash ? undefined : clue}
            cuandoTermina={onFinished}
            fallo={clickedEmptySpace}
          >
            {engine.node.choices ? undefined : instruction}
          </Instructions>
        </div>
      )
    })()
  )

  const phoneScreen = (
    <div className={styles.phoneStage} onClick={onHotspot}>
      <div className={styles.phoneStatusBar} aria-hidden>
        <span>{phoneTime}</span>
        <span className={styles.phoneSensors}>
          <span className={styles.phoneSignal}>▮▮▮</span>
          <span>5G</span>
          <span className={styles.phoneBattery}></span>
        </span>
      </div>
      <div className={styles.phoneBody}>
        {showNotification && nodeNotification && (
          <PhoneNotification
            notificacion={nodeNotification}
            onDescartar={() => setDiscarded((ids) => [...ids, engine.current])}
          />
        )}
        <div className={styles.phoneApp}>
          {appOpen && !engine.isEnding ? (
            <>
              <div className={styles.phoneAppBar}>
                <button
                  type="button"
                  className={`${styles.hotspot} ${styles.phoneAppVolver}`}
                  aria-label={
                    toView.kind === 'call' ? 'Volver a la llamada' : 'Volver al hilo de mensajes'
                  }
                  data-app=""
                >
                  ‹
                </button>
                <span className={styles.phoneAppBarNombre}>{appOpen.nombre}</span>
                <span className={styles.phoneAppVolver} aria-hidden />
              </div>
              <div className={styles.phoneViewport}>
                <p className={styles.appVacia}>{appOpen.vacia}</p>
              </div>
            </>
          ) : (
            <>
              {toView.kind === 'web' &&
                (toView.app ? (
                  // Una app no tiene barra de direcciones: no hay dominio que
                  // comprobar porque no se llegó por un enlace.
                  <div className={styles.phoneAppBar}>
                    {/* Salir es a veces la decisión (colgar una llamada). */}
                    {toView.cerrarGoto ? (
                      <button
                        type="button"
                        className={`${styles.hotspot} ${styles.phoneBrowserControl}`}
                        aria-label="Salir de la aplicación"
                        data-hotspot-goto={toView.cerrarGoto}
                        data-hotspot-label={toView.cerrarLabel}
                      >
                        ‹
                      </button>
                    ) : (
                      <span className={styles.phoneBrowserControl} aria-hidden>
                        ‹
                      </span>
                    )}
                    <span className={styles.phoneAppBarNombre}>{toView.app}</span>
                  </div>
                ) : (
                  <div className={styles.phoneBrowserBar} data-signal={toView.senalUrl}>
                    {/* Sin pestaña que cerrar, salir es la flecha de atrás. */}
                    {toView.cerrarGoto ? (
                      <button
                        type="button"
                        className={`${styles.hotspot} ${styles.phoneBrowserControl}`}
                        aria-label="Volver atrás"
                        data-hotspot-goto={toView.cerrarGoto}
                        data-hotspot-label={toView.cerrarLabel}
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
                      {toView.secure ? (
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
                      <span className={styles.phoneBrowserAddress}>{mobileUrl(toView.url)}</span>
                    </span>
                    <span className={styles.phoneBrowserControl} aria-hidden>
                      ⋮
                    </span>
                  </div>
                ))}
              <div className={styles.phoneViewport}>
                <DeviceScreen
                  view={toView}
                  acciones={emailActions}
                  carpetas={folders}
                  destinatario={recipient}
                  carpetaForzada={reviewScreen ? 'Recibidos' : undefined}
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
          {apps.map(({ Icono: Icon, texto: text, goto, gotoEnLlamada: callTarget, label, vacia: empty, color, hilo: thread }) => {
            // El marcador no cuenta como llamada: tocar un número no es haber llamado.
            const onCall = toView.kind === 'call' && !toView.marcando
            const destination = (onCall && callTarget) || goto
            return (
            <button
              key={text}
              type="button"
              className={styles.phoneDockApp}
              data-hotspot-goto={destination}
              data-hotspot-label={label}
              // Las que no deciden se abren igual (ver AppTelefono).
              data-app={destination || !empty ? undefined : text}
              data-app-vacia={destination ? undefined : empty}
              data-app-hilo={destination || empty ? undefined : (thread ?? '')}
            >
              <span
                className={styles.phoneDockIcono}
                style={color ? { background: color } : undefined}
              >
                <Icon aria-hidden className={styles.phoneDockGlifo} strokeWidth={2} />
              </span>
              <span className={styles.phoneDockNombre}>{text}</span>
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
    <ScenarioLayout
      escenarioId={scenarioId}
      resumen={summary}
      contexto={context}
      nota={note}
      dominioCorreo={emailDomain}
      pantalla={
        screenActions && !chatInBrowser ? (
          phoneScreen
        ) : !chatInBrowser && (toView.kind === 'sms' || toView.kind === 'escena') ? (
          <div className="contents" onClick={onHotspot}> {/* NOSONAR: delega el clic a los <button>/<a> nativos que contiene, que ya manejan teclado por sí solos */}
            <DeviceScreen
              view={toView}
              acciones={emailActions}
              carpetas={folders}
              destinatario={recipient}
            />
          </div>
        ) : (
          <Browser
            pestanas={tabs}
            abiertas={visible}
            activa={active}
            marcadores={markers ?? []}
            reloj={clock}
            onHotspot={onHotspot}
          >
            <DeviceScreen
              view={toView}
              acciones={emailActions}
              carpetas={folders}
              destinatario={recipient}
              carpetaForzada={reviewScreen ? 'Recibidos' : undefined}
            />
          </Browser>
        )
      }
      identidad={identity}
      decision={decision}
      resultado={engine.resultado}
      onEmpezar={restart}
      // El correo y la web se abren más en computador que en celular; el SMS
      // se queda en celular, que es donde de verdad llegan los mensajes.
      dispositivo={
        toView.kind === 'escena'
          ? 'escena'
          : !chatInBrowser && (screenActions || toView.kind === 'sms')
            ? 'telefono'
            : 'escritorio'
      }
    />
  )
}

export default ScenarioStory
