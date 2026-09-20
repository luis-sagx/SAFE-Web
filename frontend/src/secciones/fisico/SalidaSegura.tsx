import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from 'react'
import { flushSync } from 'react-dom'
import { ArrowLeft, Lock, LockOpen, MousePointerClick } from 'lucide-react'
import officeImg from '../../assets/escenarios/fisico/oficina.webp'
import ScenarioLayout from '../../components/EscenarioLayout'
import DeviceScreen, { type ScreenView } from '../../components/ui/DeviceScreen'
import FlashOverlay from '../../components/ui/FlashOverlay'
import { Browser, type TabConfig } from '../../components/ui/Navegador'
import Instructions from '../../components/ui/Instrucciones'
import VerdictPanel, { type Signal } from '../../components/ui/PanelVeredicto'
import { useFlashTransition } from '../../hooks/useFlashTransition'
import type { Context } from '../../components/ui/ContextoEscenario'
import { useScenarioRun } from '../../hooks/useScenarioRun'
import type { StoryNode } from '../../hooks/useStoryEngine'
import styles from './fisico.module.css'

// En las pruebas con usuarios el escenario medía destreza con la interfaz, no
// criterio: la lista de tareas nombraba las tres respuestas y aun así la gente
// fallaba por cómo se interactuaba (issue de usabilidad). Ahora hay una sola
// regla —tocar lo que quieres asegurar— y la lista cambió por un contador que
// dice cuánto queda pero no qué. Bloquear está a la vista en dos lugares: el
// botón sobre el teclado y el de la barra de tareas; y como
// tocar la pantalla bloqueada la desbloquea, bloquear primero ya no es trampa.

interface Tab {
  id: string
  // Corto a propósito: con varias pestañas abiertas tiene que caber en la barra.
  // El título completo va en la página.
  titulo: string
  tituloPagina: string
  url: string
  // Página web como las del módulo de phishing: la misma vista `web`, con datos
  // en vez de formulario.
  pagina: Omit<Extract<ScreenView, { kind: 'web' }>, 'kind' | 'url' | 'title' | 'secure' | 'fields' | 'button'>
}

const TABS: Tab[] = [
  {
    id: 'nominas',
    titulo: 'Nóminas',
    tituloPagina: 'Nóminas 2026',
    url: 'intranet.andes.ec/rrhh/nominas',
    pagina: {
      brand: 'Andes · Recursos Humanos',
      menu: ['Inicio', 'Nómina', 'Vacaciones', 'Documentos'],
      subtitle: 'Sueldos del área, enero a marzo.',
      datos: [
        { etiqueta: 'Personas en nómina', valor: '42' },
        { etiqueta: 'Total pagado en marzo', valor: '$ 58.340,00' },
        { etiqueta: 'Cuenta de acreditación · María Pérez', valor: 'Banco Pichincha · 2203447100' },
      ],
      footer: 'Uso interno de Recursos Humanos.',
    },
  },
  {
    id: 'clientes',
    titulo: 'Clientes',
    tituloPagina: 'Clientes VIP',
    url: 'crm.andes.ec/clientes-vip',
    pagina: {
      brand: 'Andes CRM',
      menu: ['Clientes', 'Oportunidades', 'Reportes'],
      subtitle: 'Contactos y montos de 18 cuentas.',
      datos: [
        { etiqueta: 'Cliente principal', valor: 'Comercial Pacífico S.A.' },
        { etiqueta: 'Saldo en cartera', valor: '$ 412.000,00' },
        { etiqueta: 'Contacto directo', valor: 'gerencia@compacifico.ec · 099 812 3345' },
      ],
      aviso: 'Confidencial: no compartir fuera del área comercial.',
    },
  },
  {
    id: 'reportes',
    titulo: 'Reportes',
    tituloPagina: 'Reportes financieros',
    url: 'intranet.andes.ec/finanzas/cierre',
    pagina: {
      brand: 'Andes · Finanzas',
      menu: ['Cierres', 'Presupuesto', 'Auditoría'],
      subtitle: 'Cierre trimestral sin publicar, borrador para el directorio.',
      datos: [
        { etiqueta: 'Ingresos del trimestre', valor: '$ 3.240.000,00' },
        { etiqueta: 'Utilidad neta', valor: '$ 410.500,00' },
        { etiqueta: 'Estado', valor: 'Borrador · no publicar' },
      ],
    },
  },
]

// Vista y pestaña del navegador se arman una vez: DeviceScreen memoriza por
// identidad de la vista.
const VIEWS: ScreenView[] = TABS.map((tab) => ({
  kind: 'web',
  url: tab.url,
  title: tab.tituloPagina,
  secure: true,
  fields: [],
  button: '',
  ...tab.pagina,
}))

const BROWSER_TABS: Record<string, TabConfig> = Object.fromEntries(
  // `cierra` solo hace falta para que el navegador dibuje la ✕: aquí cerrar no
  // lleva a otro nodo, lo resuelve `onBrowserClick`.
  TABS.map((tab) => [tab.id, { titulo: tab.titulo, url: tab.url, segura: true, cierra: 'cerrar' }]),
)

interface Document {
  nombre: string
  // Porcentaje dentro de la zona libre del escritorio, a la izquierda del teclado.
  x: number
  rotation: number
}

const DOCUMENTS: Document[] = [
  { nombre: 'Contratos', x: 0, rotation: -5 },
  { nombre: 'Nóminas', x: 35, rotation: 3 },
  { nombre: 'Datos bancarios', x: 70, rotation: -2 },
]

const SIGNALS: Signal[] = [
  {
    id: 'pestanas',
    targetId: 'pestanas',
    pantalla: 'repaso',
    texto:
      '<b>Una pestaña abierta con nóminas o contraseñas</b> es información servida: se lee sin tocar tu teclado y sin dejar rastro.',
  },
  {
    id: 'papeles',
    targetId: 'papeles',
    pantalla: 'repaso',
    texto:
      '<b>Los papeles sobre el escritorio se fotografían en un segundo</b>. Lo confidencial va bajo llave, no boca arriba.',
  },
  {
    id: 'bloqueo',
    targetId: 'bloqueo',
    pantalla: 'repaso',
    texto:
      '<b>Bloquear la sesión</b> cuesta un segundo: <b>Win + L</b> o el botón de la barra de tareas. Sin eso, tu correo y tus permisos quedan expuestos.',
  },
]

const RULE =
  '<b>Escritorio limpio y pantalla bloqueada.</b> Cada vez que dejas tu puesto, aunque sea cinco minutos, no debe quedar nada a la vista ni ninguna sesión abierta.'

const NONE: ReadonlySet<number> = new Set()

// Distancia mínima para que un toque cuente como arrastre y no como clic.
const DRAG_THRESHOLD = 6

interface Ghost {
  index: number
  // Esquina superior izquierda y tamaño, en px dentro de la foto.
  x: number
  y: number
  width: number
  height: number
  flying: boolean
}

function canAnimate() {
  if (typeof Element === 'undefined' || typeof Element.prototype.animate !== 'function') return false
  return !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

function SafeExit() {
  const run = useScenarioRun('fisico/salida-segura')

  const [closed, setClosed] = useState<ReadonlySet<number>>(NONE)
  const [saved, setSaved] = useState<ReadonlySet<number>>(NONE)
  const [blocked, setBlocked] = useState(false)
  // Arranca en la primera pestaña, como cualquier navegador que se deja
  // abierto: una ventana sin ninguna pestaña activa no existe.
  const [activeTab, setTabActive] = useState<number | null>(0)
  const [final, setFinal] = useState<StoryNode | null>(null)
  // El repaso de señales apunta a cosas que el participante ya cerró o guardó.
  // Mientras dura, la escena vuelve a como estaba al empezar para que haya algo
  // que señalar.
  const [review, setReview] = useState(false)
  // Sobre la foto el monitor es una miniatura; para leer y cerrar pestañas hay
  // que acercarse, como quien se sienta frente a la pantalla.
  const [zoomed, setZoomed] = useState(false)
  // Hasta que se abre la computadora una vez, el monitor late para invitar.
  const [screenSeen, setScreenSeen] = useState(false)
  const [ghost, setGhost] = useState<Ghost | null>(null)
  const monitorRef = useRef<HTMLButtonElement>(null)
  const officeRef = useRef<HTMLDivElement>(null)
  const drawerRef = useRef<HTMLButtonElement>(null)
  const ghostRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ index: number; startX: number; startY: number; offsetX: number; offsetY: number; moved: boolean } | null>(null)
  // El clic que el navegador dispara al soltar un arrastre no debe guardar dos veces.
  const swallowClick = useRef(false)
  const [miniScale, setMiniScale] = useState(0.4)

  // Ref de callback y no useRef + useEffect: el lienzo recién existe en el DOM
  // al pasar del briefing al escenario, momento en el que SafeExit ya está
  // montado hace rato. Con useEffect([]) —lo que había antes— la medición
  // corría una sola vez, con el lienzo todavía sin montar, y no se repetía
  // nunca: la miniatura se quedaba fija en el 0.4 inicial sin importar el
  // ancho real de pantalla (issue #225). La ref de callback sí se vuelve a
  // llamar cada vez que el nodo aparece.
  // El navegador se dibuja a tamaño de escritorio y, sobre la foto, se reduce
  // entero hasta el ancho del monitor: mismo aspecto, sin rediseñarlo en miniatura.
  const canvasRef = useCallback((canvas: HTMLDivElement | null) => {
    const monitor = canvas?.parentElement
    if (!canvas || !monitor || typeof ResizeObserver === 'undefined') return
    // Piso de 0.32: en celular el monitor mide una fracción de una foto ya
    // angosta, y sin piso el texto y los botones de la miniatura se
    // encimaban entre sí. El recorte lo sigue dando el propio marco del
    // monitor (overflow: hidden en .pantalla).
    const observer = new ResizeObserver(() =>
      setMiniScale(Math.max(monitor.clientWidth / canvas.offsetWidth, 0.32)),
    )
    observer.observe(monitor)
    return () => observer.disconnect()
  }, [])

  const stampFlash = useFlashTransition()

  const openTabs = TABS.length - closed.size
  const exposedSheets = DOCUMENTS.length - saved.size
  const leftInView = openTabs + exposedSheets + (blocked ? 0 : 1)
  const allReady = leftInView === 0

  const closedView = review ? NONE : closed
  const savedView = review ? NONE : saved
  const blockedView = review ? false : blocked
  const activeView = review ? 0 : activeTab

  function closeTab(index: number) {
    if (final) return

    const remaining = TABS.map((_, i) => i).filter((i) => i !== index && !closed.has(i))
    setClosed(new Set(closed).add(index))
    // Como en un navegador: al cerrar la que estás viendo pasas a la de al
    // lado, no a una ventana en blanco.
    if (activeTab === index) {
      const next = remaining.find((i) => i > index) ?? remaining.at(-1) ?? null
      setTabActive(next)
    }
  }

  function closeAllTabs() {
    if (final) return
    setClosed(new Set(TABS.map((_, i) => i)))
    setTabActive(null)
  }

  function saveItem(index: number) {
    if (final) return
    setSaved((was) => new Set(was).add(index))
  }

  // Tocar el cajón guarda lo que queda sobre la mesa.
  function saveDeskSheets() {
    if (final) return
    setSaved(new Set(DOCUMENTS.map((_, i) => i)))
  }

  function officeBox() {
    return officeRef.current?.getBoundingClientRect() ?? new DOMRect()
  }

  function overDrawer(clientX: number, clientY: number) {
    const box = drawerRef.current?.getBoundingClientRect()
    if (!box) return false
    return clientX >= box.left && clientX <= box.right && clientY >= box.top && clientY <= box.bottom
  }

  // Tocar una hoja la manda volando al cajón: sin ver a dónde va, "desaparecer"
  // se leía como un error.
  function flyToDrawer(index: number, element: HTMLElement) {
    if (final || ghost) return
    if (!canAnimate()) {
      saveItem(index)
      return
    }
    const office = officeBox()
    const box = element.getBoundingClientRect()
    setGhost({
      index,
      x: box.left - office.left,
      y: box.top - office.top,
      width: box.width,
      height: box.height,
      flying: true,
    })
  }

  useLayoutEffect(() => {
    if (!ghost?.flying) return
    const element = ghostRef.current
    const drawer = drawerRef.current?.getBoundingClientRect()
    if (!element || !drawer) return
    const office = officeBox()
    const dx = drawer.left + drawer.width / 2 - office.left - (ghost.x + ghost.width / 2)
    const dy = drawer.top + drawer.height * 0.75 - office.top - (ghost.y + ghost.height / 2)
    const animation = element.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.35)`, opacity: 0.4 },
      ],
      { duration: 450, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    )
    const index = ghost.index
    animation.onfinish = () => {
      saveItem(index)
      setGhost(null)
    }
    return () => animation.cancel()
    // saveItem lee `final`, que no cambia mientras dura la animación.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ghost?.flying, ghost?.index])

  // Arrastre propio, con eventos de puntero: el arrastre nativo del navegador
  // dibujaba como imagen un recorte de la foto con la hoja encima, y además no
  // existe en pantallas táctiles.
  function onItemPointerDown(event: PointerEvent<HTMLButtonElement>, index: number) {
    // Un arrastre anterior puede no haber disparado su clic (la hoja se
    // guardó y desapareció): sin esto, el próximo toque real se perdía.
    swallowClick.current = false
    if (final || ghost || event.button !== 0) return
    const box = event.currentTarget.getBoundingClientRect()
    drag.current = {
      index,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - box.left,
      offsetY: event.clientY - box.top,
      moved: false,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function onItemPointerMove(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current
    if (!current) return
    if (!current.moved && Math.hypot(event.clientX - current.startX, event.clientY - current.startY) < DRAG_THRESHOLD) {
      return
    }
    current.moved = true
    const office = officeBox()
    const box = event.currentTarget.getBoundingClientRect()
    setGhost({
      index: current.index,
      x: event.clientX - office.left - current.offsetX,
      y: event.clientY - office.top - current.offsetY,
      width: box.width,
      height: box.height,
      flying: false,
    })
  }

  function onItemPointerUp(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current
    drag.current = null
    if (!current?.moved) return
    swallowClick.current = true
    if (overDrawer(event.clientX, event.clientY)) saveItem(current.index)
    setGhost(null)
  }

  function onItemClick(event: MouseEvent<HTMLButtonElement>, index: number) {
    if (swallowClick.current) {
      swallowClick.current = false
      return
    }
    flyToDrawer(index, event.currentTarget)
  }

  // Los clics del navegador compartido llegan todos aquí, como en los escenarios
  // de phishing, marcados con data-cierra (la ✕) o data-pestana (la pestaña).
  function onBrowserClick(event: MouseEvent) {
    const target = event.target as HTMLElement
    const closing = target.closest<HTMLElement>('[data-cierra]')?.dataset.cierra
    const tab = target.closest<HTMLElement>('[data-pestana]')?.dataset.pestana
    // La ✕ de la ventana: cerrar el navegador entero también vale.
    if (target.closest('[data-close-window]')) closeAllTabs()
    else if (closing) closeTab(TABS.findIndex((t) => t.id === closing))
    else if (tab) setTabActive(TABS.findIndex((t) => t.id === tab))
  }

  function closeZoom() {
    // El botón del monitor sigue inerte hasta que se aplica el cambio.
    flushSync(() => setZoomed(false))
    monitorRef.current?.focus()
  }

  // Se bloquea desde el teclado del escritorio o desde la barra de tareas; al
  // bloquear, la vista vuelve sola al escritorio.
  function lockSession() {
    if (final) return
    setBlocked(true)
    closeZoom()
  }

  // Tocar la pantalla bloqueada la desbloquea y la abre, como quien toca el
  // monitor y pone su PIN: bloquear antes de tiempo se corrige sin buscar nada.
  function openComputer() {
    if (final) return
    setBlocked(false)
    setScreenSeen(true)
    setZoomed(true)
  }

  function leave() {
    if (final) return

    run.recordDecision({
      pestanasAbiertas: openTabs,
      papelesExpuestos: exposedSheets,
      bloqueada: blocked,
    })

    setZoomed(false)
    stampFlash.trigger(() => {
      // Lo que quedó a la vista se enumera tal cual: un "no completaste todo"
      // no dice qué se llevó puesto quien entre mañana.
      const exposed = [
        openTabs > 0 &&
          `${openTabs} ${openTabs === 1 ? 'pestaña abierta' : 'pestañas abiertas'} con datos internos`,
        exposedSheets > 0 &&
          `${exposedSheets} ${exposedSheets === 1 ? 'documento confidencial' : 'documentos confidenciales'} sobre el escritorio`,
        !blocked && 'la sesión sin bloquear',
      ].filter(Boolean) as string[]

      const node: StoryNode = allReady
        ? {
            kind: 'good',
            verdict: 'Puesto asegurado',
            outcome:
              'Cerraste las pestañas con datos internos, guardaste bajo llave los tres documentos confidenciales y bloqueaste la sesión. Quien entre esta noche no encuentra nada tuyo que le sirva.',
          }
        : {
            kind: 'bad',
            verdict: 'Dejaste tu puesto expuesto',
            outcome: `Te fuiste dejando ${exposed.join(', ')}. Personal de limpieza, visitas y cualquiera que pase por el pasillo tiene toda la noche para mirar.`,
          }

      setFinal(node)
      void run.finish({
        endingId: allReady ? 'good' : 'bad',
        outcome: allReady ? 'CORRECTO' : 'INCORRECTO',
      })
    }, 750)
  }

  function restart() {
    run.restart()
    setClosed(NONE)
    setSaved(NONE)
    setBlocked(false)
    setTabActive(0)
    setFinal(null)
    setReview(false)
    setZoomed(false)
    setScreenSeen(false)
    setGhost(null)
    drag.current = null
  }

  const context: Context = {
    antes: (
      <p>
        La seguridad física pesa tanto como la digital. Lo que dejas a la vista al irte no necesita
        que nadie te robe una contraseña: basta con mirar.
      </p>
    ),
    ahora: (
      <>
        <strong>Son las 5:50 PM y eres el último en salir</strong>. Esta noche entra personal de
        limpieza, y mañana la oficina se llena antes que tú. Antes de irte, revisa tu puesto.
      </>
    ),
  }

  const activeId = activeView !== null ? TABS[activeView]?.id : undefined
  const activeScreen = activeView !== null ? VIEWS[activeView] : undefined

  const close = zoomed && !final

  const browser = (
    <Browser
      pestanas={BROWSER_TABS}
      abiertas={TABS.filter((_, i) => !closedView.has(i)).map((tab) => tab.id)}
      activa={activeId ?? ''}
      marcadores={[]}
      reloj={{ hora: '17:50' }}
      closableWindow
      onLock={lockSession}
      onHotspot={onBrowserClick}
    >
      {activeScreen ? (
        <DeviceScreen view={activeScreen} />
      ) : (
        <p className={styles.paginaVacia}>No queda ninguna pestaña abierta</p>
      )}
    </Browser>
  )

  function renderDocument(document: Document, index: number) {
    if (savedView.has(index)) return null
    const style = {
      left: `${document.x}%`,
      '--giro': `${document.rotation}deg`,
      // Mientras se arrastra, la hoja original deja su lugar a la que sigue al dedo.
      visibility: ghost?.index === index ? 'hidden' : undefined,
    } as Record<string, string | undefined> as CSSProperties
    return (
      <button
        key={document.nombre}
        type="button"
        className={`${styles.papel} ${styles.control}`}
        style={style}
        onClick={(event) => onItemClick(event, index)}
        onPointerDown={(event) => onItemPointerDown(event, index)}
        onPointerMove={onItemPointerMove}
        onPointerUp={onItemPointerUp}
        onPointerCancel={() => {
          drag.current = null
          setGhost(null)
        }}
        aria-label={`Guardar ${document.nombre} en el cajón`}
      >
        <span className={styles.papelHoja} aria-hidden />
        <span className={`${styles.rotulo} ${styles.papelRotulo}`}>{document.nombre}</span>
      </button>
    )
  }

  const ghostDocument = ghost ? DOCUMENTS[ghost.index] : undefined

  let drawerDetail = `${savedView.size} ${savedView.size === 1 ? 'cosa guardada' : 'cosas guardadas'}`
  if (ghost && !ghost.flying) drawerDetail = 'Suelta aquí'
  else if (savedView.size === 0) drawerDetail = 'Vacío'

  const screen = (
    <div className={styles.oficinaMarco}>
      <div
        ref={officeRef}
        className={styles.oficina}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && close) closeZoom()
        }}
      >
        <img
          src={officeImg}
          alt="Tu puesto de trabajo al atardecer: monitor, teclado y un archivador con llave junto a la ventana"
          className={styles.oficinaFoto}
        />

        {/* Con la pantalla acercada, lo demás queda detrás del fondo oscuro y
            fuera del alcance del teclado, como en cualquier diálogo. */}
        <div className="contents" inert={close}>
          <div data-signal="papeles" className={styles.papeles}>
            {DOCUMENTS.map((document, i) => renderDocument(document, i))}
          </div>

          {/* El cajón es el archivador entero: un blanco grande para soltar,
              y tocarlo guarda lo que hay sobre la mesa. */}
          <button
            ref={drawerRef}
            type="button"
            className={`${styles.cajonZona} ${styles.control} ${ghost && !ghost.flying ? styles.cajonDestino : ''}`}
            onClick={saveDeskSheets}
            aria-label="Cajón con llave: guardar los papeles del escritorio"
          >
            <span className={`${styles.rotulo} ${styles.cajon}`}>
              <span className="inline-flex items-center gap-1.5">
                <Lock className={styles.rotuloIcono} aria-hidden /> Cajón<span className={styles.soloAncho}> con llave</span>
              </span>
              {/* La key reinicia la animación: cada cosa guardada se nota. */}
              <span
                key={savedView.size}
                className={`${styles.cajonDetalle} ${savedView.size ? styles.cajonPulso : ''} tabular-nums`}
              >
                {drawerDetail}
              </span>
            </span>
          </button>

          {/* El atajo de siempre, sobre el teclado de la foto: se bloquea sin
              entrar a la computadora. Sigue ahí en el repaso para señalarlo. */}
          {(!blockedView || final) && (
            <button
              type="button"
              data-signal="bloqueo"
              className={`${styles.teclado} ${styles.control}`}
              onClick={lockSession}
              aria-label="Bloquear la sesión"
            >
              <span className={styles.rotulo} aria-hidden>
                Bloquear
              </span>
            </button>
          )}

          {!final && (
            <button
              ref={monitorRef}
              type="button"
              className={`${styles.pantallaBoton} ${styles.control} ${screenSeen ? '' : styles.pantallaInvita}`}
              onClick={openComputer}
              aria-label={blockedView ? 'Desbloquear la sesión' : 'Acercarte a la pantalla'}
            >
              <span className={styles.rotulo} aria-hidden>
                {blockedView ? (
                  <>
                    <LockOpen className={styles.rotuloIcono} /> Toca para desbloquear
                  </>
                ) : (
                  <>
                    <MousePointerClick className={styles.rotuloIcono} /> Usar la computadora
                  </>
                )}
              </span>
            </button>
          )}
        </div>

        {/* Cuánto queda, no qué: nombrar las tareas convertía el escenario en
            una lista que se tacha, y ya no medía si uno reconoce lo sensible. */}
        {!final && (
          <output className={styles.contador}>
            {allReady ? (
              'Nada a la vista'
            ) : (
              <>
                Quedan <span className="tabular-nums">{leftInView}</span>{' '}
                {leftInView === 1 ? 'cosa' : 'cosas'} a la vista
              </>
            )}
          </output>
        )}

        {close && <div className={styles.fondoCerca} onClick={closeZoom} aria-hidden />}

        {/* Un solo navegador: miniatura inerte sobre el monitor, o acercado y
            usable. Bloqueada, no hay navegador que tocar a través del bloqueo. */}
        <div
          data-signal="pestanas"
          className={close ? styles.pantallaCerca : styles.pantalla}
          inert={!close}
          aria-hidden={!close}
        >
          <div
            ref={canvasRef}
            className={styles.lienzo}
            style={close ? undefined : { transform: `scale(${miniScale})` }}
          >
            {blockedView ? (
              <div className={styles.bloqueo}>
                <Lock aria-hidden />
                <p>SESIÓN BLOQUEADA</p>
              </div>
            ) : (
              browser
            )}
          </div>
        </div>

        {close && (
          <button
            type="button"
            autoFocus
            className={`${styles.rotulo} ${styles.volver} ${styles.control}`}
            onClick={closeZoom}
          >
            <ArrowLeft className={styles.rotuloIcono} aria-hidden /> Volver al escritorio
          </button>
        )}

        {/* La hoja que se arrastra o vuela: solo la hoja, sin el recorte de
            la foto que dibujaba el arrastre nativo. */}
        {ghost && ghostDocument && (
          <div
            ref={ghostRef}
            className={styles.fantasma}
            style={
              {
                left: ghost.x,
                top: ghost.y,
                width: ghost.width,
                height: ghost.height,
                '--giro': `${ghostDocument.rotation}deg`,
              } as CSSProperties
            }
            aria-hidden
          >
            <span className={styles.papelHoja} />
          </div>
        )}
      </div>
      <FlashOverlay active={stampFlash.active} />
    </div>
  )

  const decision = final ? (
    <VerdictPanel
      estadoGuardado={run.status}
      escenarioId="fisico/salida-segura"
      node={final}
      senales={SIGNALS}
      regla={RULE}
      restartLabel="↻ Repetir el escenario"
      onRestart={restart}
      contenedorId="pantalla-escenario"
      onPantalla={(id) => setReview(Boolean(id))}
    />
  ) : (
    <div className="grid gap-4">
      <p className="text-lg font-semibold text-ink">Antes de irte, deja el puesto listo</p>

      <Instructions
        queHaces={
          <p className="text-lg leading-relaxed text-body">
            Revisa tu puesto como lo harías antes de irte: todo lo que alguien pudiera leer o usar
            esta noche tiene que quedar asegurado. Toca lo que quieras asegurar.
          </p>
        }
        cuandoTermina={
          <>
            Cuando presiones <strong>"Irme de la oficina"</strong>. Puedes hacerlo en cualquier
            momento: el escenario registra lo que dejaste expuesto.
          </>
        }
        pista={
          <p>
            Las hojas se guardan en el cajón con llave: tócalas, arrástralas o toca el cajón. En la
            computadora cierras cada pestaña con su <strong>✕</strong> o la ventana entera. Para
            bloquear la sesión usa el botón <strong>Bloquear</strong> sobre el teclado o el de la
            barra de tareas; si bloqueas antes de tiempo, toca la
            pantalla para desbloquearla. Puedes irte cuando quieras: lo que dejes a la vista, ahí
            queda.
          </p>
        }
      />

      {/* Siempre habilitado: irse dejando cosas a la vista es justamente la
          decisión que este escenario mide. Deshabilitarlo hasta tenerlo todo
          hecho convertía el ejercicio en un trámite que no se puede fallar. */}
      <button
        type="button"
        onClick={leave}
        className="min-h-12 w-full rounded-md bg-primary px-4 py-3 text-lg font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
      >
        Irme de la oficina
      </button>
    </div>
  )

  const note = (
    <div className="text-base leading-relaxed text-body">
      <p>
        Vas a ver tu puesto de trabajo. Puedes tocar lo que quieras de la escena; el escenario
        termina cuando decides irte.
      </p>
    </div>
  )

  return (
    <ScenarioLayout
      escenarioId="fisico/salida-segura"
      resumen="Fin de jornada, Deja tu puesto asegurado"
      contexto={context}
      nota={note}
      identidad={[]}
      pantalla={screen}
      decision={decision}
      resultado={final?.kind === 'good' ? 'good' : final ? 'bad' : undefined}
      onEmpezar={restart}
      dispositivo="escritorio"
    />
  )
}

export default SafeExit
