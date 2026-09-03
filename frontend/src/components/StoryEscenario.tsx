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

/** Cada nodo declara qué muestra la pantalla simulada, incluidos los finales:
 *  el resultado se lee al lado de la pantalla que lo provocó. */
export interface ScreenNode extends StoryNode {
  view: ScreenView
  /** Lo que el teléfono anuncia al llegar a esta escena. Va en el nodo y no en
   *  la vista porque una notificación no es contenido de una pantalla: es algo
   *  que pasa en un momento del guion. Dos nodos que enseñan la misma pantalla
   *  pueden diferir en si el mensaje ya llegó. */
  notificacion?: Notificacion
}

interface StoryEscenarioProps {
  escenarioId: string
  resumen: string
  contexto: Contexto
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
  /** Datos prestados que el escenario pone en juego (ver TarjetaIdentidad). */
  identidad?: DatoIdentidad[]
  /** Mueve las decisiones al interior del celular y evita el cambio a escritorio. */
  accionesEnPantalla?: boolean
  /** Apps del teléfono, en la barra inferior. Es el equivalente móvil de los
   *  marcadores del navegador: el camino para comprobar algo por tu cuenta sin
   *  pasar por el mensaje. Sin ellas la barra no se pinta. */
  apps?: AppTelefono[]
}

/**
 * Un icono del dock.
 *
 * Las tres formas hacen algo visible al pulsarlas, y eso es deliberado. Con
 * una sola app viva y el resto de adorno, el realce al pasar el cursor —que
 * solo aparece sobre lo accionable— señalaba cuál era la respuesta antes de
 * leer nada, y el escenario se resolvía barriendo el dock. Un teléfono de
 * verdad abre todas sus apps; lo que distingue a la buena es lo que encuentras
 * dentro, no que sea la única que reacciona.
 *
 * - `goto`: abrirla es una decisión del grafo y queda en la traza.
 * - `vacia`: se abre y muestra ese estado vacío. Mirar, no decidir: no entra
 *   en la traza y se vuelve con la flecha, igual que cambiar de pestaña.
 * - ninguno de los dos: vuelve al hilo de mensajes (la app de Mensajes).
 */
export type AppTelefono = MarcadorNavegador & {
  vacia?: string
  /** A qué pantalla vuelve, cuando no lleva `goto` ni `vacia`. Solo hace falta
   *  declararlo en los escenarios que tienen mensajes y llamada a la vez: sin
   *  esto, "Teléfono" y "Mensajes" volverían los dos a lo último que se vio. */
  hilo?: 'sms' | 'call'
  /** Color del icono. Sin él queda el gris neutro del sistema. Va por app y no
   *  por posición: el dock tiene que leerse como el teléfono del participante,
   *  no como cuatro botones de esta aplicación. */
  color?: string
  /** Destino cuando se abre con una llamada de verdad en curso (no el
   *  marcador: ahí todavía no llamaste). Sin esto, comprobar algo mientras
   *  hablas y comprobarlo antes de llamar llevarían al mismo sitio, y un
   *  escenario donde llamar cuenta en contra no podría distinguir los dos
   *  caminos. */
  gotoEnLlamada?: string
}

/// Cómo se ve cada pantalla en la barra de direcciones. El correo va en el
/// dominio del participante, para que la dirección de la pestaña y la del
/// mensaje cuenten lo mismo.
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
  return null
}

function urlMovil(url: string): string {
  return url.replace(/^https?:\/\//, '')
}

/// La hora de la barra de estado sale del propio hilo, no de una constante.
///
/// Un teléfono que marca las 09:41 encima de un mensaje de las 20:36 se delata
/// solo, y en un escenario que arranca diciendo "ya de noche" contradice además
/// al enunciado. La saca del último mensaje del hilo, que es el "ahora" de la
/// escena, y descarta los sellos relativos del historial ("ayer", "28 jul"):
/// esos no son una hora que un reloj pueda mostrar.
const HORA_DEL_DIA = /^\d{1,2}:\d{2}$/

function horaDeVista(view: ScreenView): string | undefined {
  if (view.kind !== 'sms') return undefined
  const ultima = view.msgs.at(-1)?.time
  return ultima && HORA_DEL_DIA.test(ultima) ? ultima : undefined
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
  identidad,
  accionesEnPantalla = false,
  apps,
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
  /// App del dock que se está mirando y que no decide nada (la cámara, la
  /// galería). Vive fuera del grafo por lo mismo que `pestanaMirada`: abrirla
  /// es mirar, y la corrida no debería registrarlo ni terminar por ello.
  const [appAbierta, setAppAbierta] = useState<{ nombre: string; vacia: string } | undefined>()
  /// Última pantalla de cada app de comunicación: el hilo de mensajes y la
  /// llamada en curso. Su icono del dock vuelve a ella sin tocar el grafo:
  /// estando en la página falsa hay que poder releer el SMS que la abrió, y
  /// estando en la app del banco hay que poder volver a la llamada que sigue
  /// abierta, igual que en el teléfono de uno.
  ///
  /// Son dos y no una porque hay escenarios con las dos cosas —una llamada que
  /// te manda un código por mensaje— y ahí "volver" significa una pantalla
  /// distinta según el icono que se pulse.
  const [hilos, setHilos] = useState<{ sms?: string; call?: string }>({})
  /// Notificaciones ya vistas (tocadas, descartadas o dejadas atrás al decidir
  /// otra cosa). Una notificación llega una vez; "↻ Repetir el escenario" tiene
  /// que devolverla, por eso `reiniciar` la limpia junto con `engine.restart`.
  const [descartadas, setDescartadas] = useState<string[]>([])
  const nodoVisible = pantallaRepaso ?? pestanaMirada ?? engine.current
  const vistaDelNodo = story[nodoVisible]?.view ?? engine.node.view
  /// Releer el hilo desde otra pantalla no puede terminar la corrida: la
  /// flecha de la cabecera significa "salgo del hilo y sigo con mi día", y
  /// quien está dentro de la app del banco solo vino a comprobar el mensaje.
  /// Para volver están el propio botón de Mensajes y el resto del dock.
  const vista =
    vistaDelNodo.kind === 'sms' && !pantallaRepaso && nodoVisible !== engine.current
      ? { ...vistaDelNodo, volverGoto: undefined, volverLabel: undefined }
      : vistaDelNodo

  /// El reloj se queda en la última hora que enseñó un hilo: abrir la app del
  /// banco no puede hacerlo retroceder ni devolverlo a una hora inventada. El
  /// valor inicial sale del primer hilo del grafo, que puede no ser la pantalla
  /// de entrada —hay escenarios que empiezan en la lista de conversaciones—; si
  /// el escenario no tiene ningún hilo (una llamada) se queda en la hora neutra.
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
  /// Las pestañas se acumulan según el recorrido: cada pantalla nueva abre una,
  /// como haría un enlace en un navegador de verdad. Se indexan por dirección
  /// para que dos nodos con la misma página compartan pestaña.
  const [abiertas, setAbiertas] = useState<string[]>(['n1'])

  useEffect(() => {
    // Un final no abre pantalla: llega sobre la que ya estaba. Y cuando lo
    // dispara *cerrar* esa pestaña, abrirla otra vez dejaba el veredicto sobre
    // una página que ya no está en la barra (issue #26).
    if (engine.isEnding) return
    if (!pestanaDeVista(engine.node.view, dominio)) return
    setAbiertas((ids) => (ids.includes(engine.current) ? ids : [...ids, engine.current]))
    setPestanaMirada(undefined)
  }, [engine.current, engine.isEnding, engine.node.view, dominio])

  useEffect(() => {
    // Cuál es "Mensajes" cambia durante la corrida: tras responder, el hilo al
    // que hay que volver es el que lleva el borrador, no el original. En una
    // llamada pasa lo mismo con lo que se lleve dicho hasta ese punto.
    const kind = engine.node.view.kind
    if (kind === 'sms' || kind === 'call') {
      setHilos((previos) => ({ ...previos, [kind]: engine.current }))
    }
  }, [engine.current, engine.node.view])

  // La notificación pertenece a la posición del grafo (engine.current), no a
  // la pantalla que se está mirando: que siga ahí mientras se abre la cámara
  // desde el dock es lo que hace un teléfono de verdad. No se pinta sobre el
  // veredicto (ya hay un overlay ahí) ni durante el repaso (taparía la señal
  // que se está explicando).
  const notificacionNodo = story[engine.current]?.notificacion
  const mostrarNotificacion = Boolean(
    notificacionNodo && !engine.isEnding && !pantallaRepaso && !descartadas.includes(engine.current),
  )

  useEffect(() => {
    if (!mostrarNotificacion) return
    // Se marca al salir del nodo y no al entrar: mientras se siga ahí sigue en
    // pantalla, y en cuanto pasa cualquier cosa —tocarla, descartarla, decidir
    // otra cosa— el momento ya pasó y no vuelve.
    return () => setDescartadas((ids) => [...ids, engine.current])
  }, [mostrarNotificacion, engine.current])

  const reiniciar = useCallback(() => {
    setDescartadas([])
    engine.restart()
  }, [engine.restart])

  // Una pestaña por escena con pantalla. Se indexan por nodo, como pide su
  // Navegador, y las que comparten dirección se pliegan en una sola.
  const pestanas: Record<string, PestanaConfig> = {}
  const porUrl = new Map<string, string>()
  const visibles: string[] = []
  // Durante el repaso también entra la pantalla que se está explicando, aunque
  // el participante no llegara a abrirla. Desde que cerrar una pestaña dejó de
  // terminar la corrida (issue #24), se puede acabar por la barra del cliente
  // sin haber visitado la página falsa — y entonces la señal que vive en su
  // barra de direcciones no tenía dónde resaltarse.
  const paraPestanas =
    pantallaRepaso && !abiertas.includes(pantallaRepaso) ? [...abiertas, pantallaRepaso] : abiertas

  for (const id of paraPestanas) {
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
          {
            nombre: correo.from,
            direccion: correo.address,
            asunto: correo.subject,
          },
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
      // Una pestaña puede plegar varias pantallas del mismo sitio: se cierran
      // todas con ella, o quedarían abiertas sin pestaña que las muestre.
      const url = pestanas[cerrada]?.url
      const quedan = abiertas.filter(
        (id) =>
          id !== cerrada && (!story[id] || pestanaDeVista(story[id]!.view, dominio)?.url !== url),
      )
      setAbiertas(quedan)
      // El navegador pasa a la pestaña que sigue abierta —normalmente el
      // correo—, como al cerrar una pestaña de verdad. Sin esto, la barra de
      // direcciones y el contenido se quedaban en la pestaña que acaba de
      // desaparecer de la barra.
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

    // La app de Mensajes: cierra lo que hubiera encima y muestra el hilo, sin
    // que el grafo avance. Es el botón para releer el SMS mientras se está en
    // la página que abrió, y pulsarlo otra vez devuelve a esa página.
    const hilo = (event.target as HTMLElement).closest<HTMLElement>('[data-app-hilo]')?.dataset
      .appHilo
    if (hilo !== undefined) {
      if (!engine.isEnding) {
        // Cada icono vuelve a lo suyo; si esa app todavía no se ha visto en la
        // corrida, a lo último que hubo.
        const destino =
          (hilo === 'sms' || hilo === 'call' ? hilos[hilo] : undefined) ??
          hilos.call ??
          hilos.sms ??
          'n1'
        // Con una app encima el botón no alterna: lo que hace es cerrarla y
        // dejar el hilo a la vista. Alternar ahí devolvía a la pantalla del
        // grafo a quien solo había abierto la cámara sobre el hilo que estaba
        // leyendo.
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
    // Solo cuando la pantalla es el control: con lista de opciones, pulsar el
    // cuerpo del correo no tiene por qué responder a nada.
    if (!objetivo) {
      // Los controles del propio aparato —reproducir una nota de voz, silenciar
      // la llamada— sí responden, aunque no decidan nada: avisar ahí de que "no
      // hay nada que hacer" desmentía a la pantalla.
      const control = (event.target as HTMLElement).closest('[data-control]')
      if (!engine.node.choices && !control) setTocoEnVacio(true)
      return
    }

    // Cualquier punto que decida deshace lo que se estuviera mirando encima:
    // la app abierta taparía el resultado, y el hilo que se estaba releyendo
    // seguiría delante de la pantalla a la que lleva la decisión.
    //
    // Estas dos líneas no pueden dejarse al efecto que limpia `pestanaMirada`
    // al cambiar de nodo: cuando el destino es el nodo actual —volver al
    // navegador desde el hilo, estando ya en él— el nodo no cambia, el efecto
    // no vuelve a correr y la pantalla se quedaba en Mensajes.
    setAppAbierta(undefined)
    setPestanaMirada(undefined)

    // Y volver a la pantalla en la que ya estás no es una decisión: registrarla
    // metía un paso `n3 → n3` en la traza de la corrida.
    if (objetivo.dataset.hotspotGoto !== engine.current) {
      manejarClicHotspot(event, engine.choose)
    }
  }

  const decision = engine.isEnding ? (
    <PanelVeredicto
      estadoGuardado={engine.runStatus}
      escenarioId={escenarioId}
      node={engine.node}
      senales={senales}
      regla={rule}
      restartLabel={restartLabel}
      onRestart={reiniciar}
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
                  /* Una app no tiene barra de direcciones: su cabecera lleva el
                 nombre y nada más. Es también la diferencia que el módulo
                 enseña — en la app no hay dominio que comprobar porque no se
                 llegó por un enlace. */
                  <div className={styles.phoneAppBar}>
                    {/* Una app abierta desde el dock también se abandona, y a
                    veces salir es la decisión: colgar una llamada es lo
                    contrario de seguir en ella. Sin esta flecha, una pantalla
                    de app con `cerrarGoto` declaraba una salida que no tenía
                    control en pantalla. */}
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
                    {/* En el teléfono no hay pestaña que cerrar: salir de una
                    página es la flecha de atrás. Toma el mismo `cerrarGoto`
                    que en escritorio dibuja la ✕ de la pestaña. */}
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
                      {/* Iconos de trazo y no signos de texto, por lo mismo que en
                      la barra del navegador de escritorio: el indicador de
                      seguridad es justo lo que este módulo enseña a leer, y un
                      "!" suelto no se lee como advertencia. */}
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

      {/* El dock va siempre visible y con el nombre bajo cada icono, por lo
          mismo que la barra de marcadores lleva la palabra "Marcadores": en
          varios escenarios entrar por tu cuenta a la app del banco o del
          courier es el único camino al acierto, y esconderlo tras el gesto de
          ir al inicio mediría si el participante conoce ese gesto, no si
          reconoce el engaño. */}
      {apps && apps.length > 0 && (
        <div className={styles.phoneDock} aria-label="Apps del teléfono">
          {apps.map(({ Icono, texto, goto, gotoEnLlamada, label, vacia, color, hilo }) => {
            // El marcador no cuenta como llamada: tocar un número todavía no
            // es haber llamado, y salir de él vuelve al hilo sin coste.
            const enLlamada = vista.kind === 'call' && !vista.marcando
            const destino = (enLlamada && gotoEnLlamada) || goto
            return (
            <button
              key={texto}
              type="button"
              className={styles.phoneDockApp}
              data-hotspot-goto={destino}
              data-hotspot-label={label}
              // Las que no deciden se abren igual. Ver AppTelefono: si solo
              // reaccionara la que decide, el realce del cursor delataría cuál
              // es sin haber leído el mensaje.
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
        accionesEnPantalla ? (
          pantallaTelefono
        ) : vista.kind === 'sms' ? (
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
      identidad={identidad}
      decision={decision}
      resultado={engine.resultado}
      onEmpezar={reiniciar}
      // El correo y la web se abren más en computador que en celular; el SMS
      // se queda en celular, que es donde de verdad llegan los mensajes.
      dispositivo={accionesEnPantalla || vista.kind === 'sms' ? 'telefono' : 'escritorio'}
    />
  )
}

export default StoryEscenario
