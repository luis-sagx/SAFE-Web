import { useCallback, useRef, useState, type CSSProperties, type DragEvent, type MouseEvent } from 'react'
import { flushSync } from 'react-dom'
import { ArrowLeft, Check, Circle, Lock, LockOpen, ZoomIn } from 'lucide-react'
import officeImg from '../../assets/escenarios/fisico/oficina.webp'
import ScenarioLayout from '../../components/EscenarioLayout'
import DeviceScreen, { type ScreenView } from '../../components/ui/DeviceScreen'
import FlashOverlay from '../../components/ui/FlashOverlay'
import { Browser, type TabConfig } from '../../components/ui/Navegador'
import Instructions from '../../components/ui/Instrucciones'
import Task from '../../components/ui/Tarea'
import VerdictPanel, { type Signal } from '../../components/ui/PanelVeredicto'
import { useFlashTransition } from '../../hooks/useFlashTransition'
import type { Context } from '../../components/ui/ContextoEscenario'
import { useScenarioRun } from '../../hooks/useScenarioRun'
import type { StoryNode } from '../../hooks/useStoryEngine'
import styles from './fisico.module.css'

interface Tab {
  id: string
  // Corto a propósito: con cuatro pestañas abiertas tiene que caber en la barra.
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
    id: 'claves',
    titulo: 'Contraseñas',
    tituloPagina: 'Gestor de contraseñas',
    url: 'vault.andes.ec/mis-claves',
    pagina: {
      brand: 'Andes Vault',
      menu: ['Mis claves', 'Compartidas', 'Ajustes'],
      subtitle: 'La clave quedó a la vista tras pulsar "Mostrar".',
      datos: [
        { etiqueta: 'Sitio', valor: 'portal.andes.ec' },
        { etiqueta: 'Usuario', valor: 'mariaperez' },
        { etiqueta: 'Contraseña', valor: 'Andes#2026*' },
      ],
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

const DOCUMENT_DRAG_TYPE = 'application/x-safe-web-documento'

interface Document {
  nombre: string
  // Porcentaje dentro de la zona libre del escritorio, a la izquierda del teclado.
  x: number
  rotacion: number
}

const DOCUMENTS: Document[] = [
  { nombre: 'Contratos', x: 0, rotacion: -5 },
  { nombre: 'Nóminas', x: 35, rotacion: 3 },
  { nombre: 'Datos bancarios', x: 70, rotacion: -2 },
]

const SIGNALS: Signal[] = [
  {
    id: 'pestanas',
    targetId: 'pestanas',
    pantalla: 'repaso',
    texto:
      'Una pestaña abierta con <b>nóminas o contraseñas</b> es información servida: quien pase por tu puesto la lee sin tocar tu teclado y sin dejar rastro.',
  },
  {
    id: 'papeles',
    targetId: 'papeles',
    pantalla: 'repaso',
    texto:
      'Los papeles sobre el escritorio se fotografían en un segundo. Lo confidencial se guarda <b>bajo llave</b>, no boca arriba.',
  },
  {
    id: 'bloqueo',
    targetId: 'bloqueo',
    pantalla: 'repaso',
    texto:
      '<b>Bloquear la sesión</b> cuesta un segundo. Sin eso, tu sesión abierta es tu correo, tus sistemas y tus permisos en manos de cualquiera.',
  },
]

const RULE =
  '<b>Escritorio limpio y pantalla bloqueada.</b> Cada vez que dejas tu puesto, aunque sea cinco minutos, no debe quedar nada a la vista ni ninguna sesión abierta.'

const WITHOUT_CLOSE: ReadonlySet<number> = new Set()

function SafeExit() {
  const run = useScenarioRun('fisico/salida-segura')

  const [closed, setClosed] = useState<ReadonlySet<number>>(WITHOUT_CLOSE)
  const [saved, setSaved] = useState<ReadonlySet<number>>(WITHOUT_CLOSE)
  const [blocked, setBlocked] = useState(false)
  // Mientras se arrastra una hoja, el cajón se ilumina como destino.
  const [dragging, setDragging] = useState(false)
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
  const monitorRef = useRef<HTMLButtonElement>(null)
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
  const exposedPapers = DOCUMENTS.length - saved.size
  const allReady = openTabs === 0 && exposedPapers === 0 && blocked

  const closedView = review ? WITHOUT_CLOSE : closed
  const savedView = review ? WITHOUT_CLOSE : saved
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

  function saveDocument(index: number) {
    if (final) return
    setSaved(new Set(saved).add(index))
  }

  // En las pruebas con usuarios la gente arrastraba las hojas al cajón o
  // pulsaba el cajón para cerrarlo: las tres formas guardan.
  function saveAllDocuments() {
    if (final) return
    setSaved(new Set(DOCUMENTS.map((_, i) => i)))
  }

  function dropOnDrawer(event: DragEvent) {
    event.preventDefault()
    setDragging(false)
    const index = Number(event.dataTransfer.getData(DOCUMENT_DRAG_TYPE))
    if (DOCUMENTS[index]) saveDocument(index)
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

  function toggleBlocking() {
    if (final) return
    setBlocked((was) => !was)
  }

  function leave() {
    if (final) return

    run.recordDecision({
      pestanasAbiertas: openTabs,
      papelesExpuestos: exposedPapers,
      bloqueada: blocked,
    })

    setZoomed(false)
    stampFlash.trigger(() => {
      // Lo que quedó a la vista se enumera tal cual: un "no completaste todo"
      // no dice qué se llevó puesto quien entre mañana.
      const exposed = [
        openTabs > 0 &&
          `${openTabs} ${openTabs === 1 ? 'pestaña abierta' : 'pestañas abiertas'} con datos internos`,
        exposedPapers > 0 &&
          `${exposedPapers} ${exposedPapers === 1 ? 'documento' : 'documentos'} sobre el escritorio`,
        !blocked && 'la sesión sin bloquear',
      ].filter(Boolean) as string[]

      const node: StoryNode = allReady
        ? {
            kind: 'good',
            verdict: 'Puesto asegurado',
            outcome:
              'Cerraste las cuatro pestañas, guardaste los tres documentos en el cajón y bloqueaste la sesión. Quien entre esta noche no encuentra nada tuyo a la vista.',
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
    setClosed(WITHOUT_CLOSE)
    setSaved(WITHOUT_CLOSE)
    setBlocked(false)
    setDragging(false)
    setTabActive(0)
    setFinal(null)
    setReview(false)
    setZoomed(false)
  }

  const context: Context = {
    antes: (
      <p>
        La seguridad física pesa tanto como la digital. Lo que dejas a la vista al irte, una
        pantalla encendida, una carpeta abierta, no necesita que nadie te robe una contraseña:
        basta con mirar.
      </p>
    ),
    ahora: (
      <>
        <strong>Son las 5:50 PM y eres el último en salir</strong>. En tu pantalla quedaron
        pestañas abiertas con nóminas y contraseñas, sobre el escritorio hay carpetas con datos de
        clientes y tu sesión sigue abierta. Esta noche entra personal de limpieza, y mañana la
        oficina se llena antes que tú.
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
      onHotspot={onBrowserClick}
    >
      {activeScreen ? (
        <DeviceScreen view={activeScreen} />
      ) : (
        <p className={styles.paginaVacia}>No queda ninguna pestaña abierta</p>
      )}
    </Browser>
  )

  const screen = (
    <div className={styles.oficinaMarco}>
      <div
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
            {DOCUMENTS.map((document, i) =>
              savedView.has(i) ? null : (
                <button
                  key={document.nombre}
                  type="button"
                  className={`${styles.papel} ${styles.control}`}
                  style={{ left: `${document.x}%`, '--giro': `${document.rotacion}deg` } as CSSProperties}
                  onClick={() => saveDocument(i)}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData(DOCUMENT_DRAG_TYPE, String(i))
                    setDragging(true)
                  }}
                  onDragEnd={() => setDragging(false)}
                  aria-label={`Guardar ${document.nombre} en el cajón`}
                >
                  <span className={styles.papelHoja} aria-hidden />
                  <span className={`${styles.rotulo} ${styles.papelRotulo}`}>{document.nombre}</span>
                </button>
              ),
            )}
          </div>

          <button
            type="button"
            className={`${styles.rotulo} ${styles.cajon} ${styles.control} ${dragging ? styles.cajonDestino : ''}`}
            onClick={saveAllDocuments}
            onDragOver={(event) => event.preventDefault()}
            onDragEnter={() => setDragging(true)}
            onDrop={dropOnDrawer}
            aria-label="Cajón con llave: guardar ahí todos los documentos"
          >
            <span className="inline-flex items-center gap-1.5">
              <Lock className={styles.rotuloIcono} aria-hidden /> Cajón con llave
            </span>
            {/* La key reinicia la animación: cada hoja guardada se nota. */}
            <span key={savedView.size} className={`${styles.cajonDetalle} ${savedView.size ? styles.cajonPulso : ''} tabular-nums`}>
              {savedView.size === DOCUMENTS.length
                ? 'Todo guardado y cerrado'
                : `${savedView.size} de ${DOCUMENTS.length} guardados`}
            </span>
          </button>

          {/* Bloquear la sesión es lo que se hace desde el teclado, así que el
              control vive sobre el teclado de la foto. */}
          <button
            type="button"
            data-signal="bloqueo"
            className={`${styles.teclado} ${styles.control}`}
            onClick={toggleBlocking}
            aria-label={blockedView ? 'Desbloquear la sesión' : 'Bloquear la sesión'}
          >
            <span className={styles.rotulo} aria-hidden>
              {blockedView ? (
                <>
                  <LockOpen className={styles.rotuloIcono} /> Desbloquear
                </>
              ) : (
                <>
                  <Lock className={styles.rotuloIcono} /> Bloquear
                  <span className={styles.soloAncho}> la sesión</span>
                </>
              )}
            </span>
          </button>

          {!blockedView && !final && (
            <button
              ref={monitorRef}
              type="button"
              className={`${styles.pantallaBoton} ${styles.control}`}
              onClick={() => setZoomed(true)}
              aria-label="Acercarte a la pantalla"
            >
              <span className={styles.rotulo} aria-hidden>
                <ZoomIn className={styles.rotuloIcono} /> Ver la pantalla
                {openTabs > 0 && (
                  <span className={`${styles.soloAncho} font-normal tabular-nums`}>
                    · {openTabs} {openTabs === 1 ? 'pestaña abierta' : 'pestañas abiertas'}
                  </span>
                )}
              </span>
            </button>
          )}
        </div>

        {/* La lista de tareas también va sobre la foto: en las pruebas nadie
            miraba el panel lateral mientras actuaba sobre la escena. */}
        {!final && (
          <ul className={styles.progresoPuesto} aria-hidden>
            {[
              { done: openTabs === 0, text: `Pestañas cerradas ${closed.size}/${TABS.length}` },
              { done: exposedPapers === 0, text: `Documentos en el cajón ${saved.size}/${DOCUMENTS.length}` },
              { done: blocked, text: blocked ? 'Sesión bloqueada' : 'Sesión sin bloquear' },
            ].map((item) => (
              <li key={item.text} className={item.done ? styles.progresoHecho : undefined}>
                {item.done ? <Check aria-hidden /> : <Circle aria-hidden />} {item.text}
              </li>
            ))}
          </ul>
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
          <div className="grid gap-4">
            <p className="text-lg leading-relaxed text-body">
              Actúa sobre tu pantalla como lo harías con tu propio escritorio: cierra lo que deja
              información sensible visible antes de irte.
            </p>

            <ul className="grid gap-2.5">
              <Task hecho={openTabs === 0}>
                Cerrar las pestañas del navegador{' '}
                <span className="tabular-nums text-muted">
                  ({closed.size} de {TABS.length})
                </span>
              </Task>
              <Task hecho={exposedPapers === 0}>
                Guardar los documentos en el cajón{' '}
                <span className="tabular-nums text-muted">
                  ({saved.size} de {DOCUMENTS.length})
                </span>
              </Task>
              <Task hecho={blocked}>Bloquear la sesión</Task>
            </ul>
          </div>
        }
        cuandoTermina={
          <>
            Cuando presiones <strong>"Irme de la oficina"</strong>. Puedes hacerlo en cualquier
            momento: el escenario registra si dejaste pestañas, documentos o la sesión expuestos.
          </>
        }
        pista={
          <p>
            Toca el monitor para acercarte: cierra cada pestaña con su <strong>✕</strong> o el
            navegador entero con la <strong>✕</strong> de la ventana. Los documentos se guardan
            con un clic sobre cada hoja, arrastrándolos al cajón o tocando el cajón. Deja{' '}
            <strong>bloquear la sesión para el final</strong>: bloqueada ya no puedes tocar la
            pantalla. La lista sobre la foto muestra lo que falta. Puedes irte cuando quieras: lo
            que dejes a la vista, ahí queda.
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
        {allReady ? 'Irme: el puesto está listo' : 'Irme de la oficina'}
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
