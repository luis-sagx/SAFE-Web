import { useRef, useState, type CSSProperties } from 'react'
import { flushSync } from 'react-dom'
import { ArrowLeft, Lock, LockOpen, X, ZoomIn } from 'lucide-react'
import officeImg from '../../assets/escenarios/fisico/oficina.webp'
import ScenarioLayout from '../../components/EscenarioLayout'
import FlashOverlay from '../../components/ui/FlashOverlay'
import Instructions from '../../components/ui/Instrucciones'
import Task from '../../components/ui/Tarea'
import VerdictPanel, { type Signal } from '../../components/ui/PanelVeredicto'
import { useFlashTransition } from '../../hooks/useFlashTransition'
import type { Context } from '../../components/ui/ContextoEscenario'
import { useScenarioRun } from '../../hooks/useScenarioRun'
import type { StoryNode } from '../../hooks/useStoryEngine'
import styles from './fisico.module.css'

interface Tab {
  // Corto a propósito: tiene que caber sin recortarse en la barra.
  corto: string
  titulo: string
  url: string
  contenido: string[]
  color: string
}

const TABS: Tab[] = [
  {
    corto: 'Nóminas',
    titulo: 'Nóminas 2026',
    url: 'intranet.andes.ec/rrhh/nominas',
    contenido: ['Sueldos del área, enero a marzo', 'Cuentas bancarias de 42 personas'],
    color: '#4ade80',
  },
  {
    corto: 'Contraseñas',
    titulo: 'Gestor de contraseñas',
    url: 'vault.andes.ec/mis-claves',
    contenido: ['Usuario del portal: mariaperez', 'Clave guardada: visible en pantalla'],
    color: '#fbbf24',
  },
  {
    corto: 'Clientes',
    titulo: 'Clientes VIP',
    url: 'crm.andes.ec/clientes-vip',
    contenido: ['Contactos y montos de 18 cuentas', 'Marcado como confidencial'],
    color: '#60a5fa',
  },
  {
    corto: 'Reportes',
    titulo: 'Reportes financieros',
    url: 'intranet.andes.ec/finanzas/cierre',
    contenido: ['Cierre trimestral sin publicar', 'Borrador para el directorio'],
    color: '#f87171',
  },
]

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
      'Bloquear la sesión con <b>Win + L</b> cuesta un segundo. Sin eso, tu sesión abierta es tu correo, tus sistemas y tus permisos en manos de cualquiera.',
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

  function saveDocument(index: number) {
    if (final) return
    setSaved(new Set(saved).add(index))
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

  const activePage = activeView !== null ? TABS[activeView] : undefined

  const close = zoomed && !final

  const browser = (
    <div className={styles.navegador}>
      <div className={styles.pestanas}>
        {TABS.map((tab, i) => {
          if (closedView.has(i)) return null
          return (
            <div key={tab.corto} className={activeView === i ? styles.pestanaActiva : styles.pestana}>
              <button type="button" className={styles.pestanaNombre} onClick={() => setTabActive(i)}>
                <span className={styles.pestanaPunto} style={{ background: tab.color }} aria-hidden />
                <span className={styles.pestanaTexto}>{tab.corto}</span>
              </button>
              <button
                type="button"
                className={styles.pestanaCerrar}
                onClick={() => closeTab(i)}
                aria-label={`Cerrar la pestaña ${tab.titulo}`}
              >
                <X aria-hidden strokeWidth={2.5} />
              </button>
            </div>
          )
        })}
      </div>

      <div className={styles.direccion}>
        <p className={styles.direccionTexto}>{activePage ? `https://${activePage.url}` : '\u00a0'}</p>
      </div>

      {activePage ? (
        <div className={styles.pagina}>
          <p className={styles.paginaTitulo}>{activePage.titulo}</p>
          {activePage.contenido.map((line) => (
            <p key={line} className={styles.paginaLinea}>
              {line}
            </p>
          ))}
        </div>
      ) : (
        <p className={styles.paginaVacia}>No queda ninguna pestaña abierta</p>
      )}
    </div>
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
                  aria-label={`Guardar ${document.nombre} en el cajón`}
                >
                  <span className={styles.papelHoja} aria-hidden />
                  <span className={`${styles.rotulo} ${styles.papelRotulo}`}>{document.nombre}</span>
                </button>
              ),
            )}
          </div>

          <p className={`${styles.rotulo} ${styles.cajon}`}>
            Cajón con llave
            <span className={`${styles.cajonDetalle} tabular-nums`}>
              {savedView.size} de {DOCUMENTS.length} guardados
            </span>
          </p>

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
                  <span className={styles.soloAncho}> la sesión · Win + L</span>
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
              </span>
            </button>
          )}
        </div>

        {close && <div className={styles.fondoCerca} onClick={closeZoom} aria-hidden />}

        {/* Un solo navegador: miniatura inerte sobre el monitor, o acercado y
            usable. Bloqueada, no hay navegador que tocar a través del bloqueo. */}
        <div
          data-signal="pestanas"
          className={close ? styles.pantallaCerca : styles.pantalla}
          inert={!close}
          aria-hidden={!close}
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
            Toca el monitor para acercarte: cada pestaña se cierra con su <strong>✕</strong>, como
            en tu navegador. Los documentos se guardan con un clic y se van al cajón. La sesión se
            bloquea desde el teclado. Puedes irte cuando quieras: lo que dejes a la vista, ahí
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
