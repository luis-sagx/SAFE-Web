import { Building2, Landmark, Lock, Newspaper } from 'lucide-react'
import { useState } from 'react'
import EscenarioLayout from '../../components/EscenarioLayout'
import Instrucciones from '../../components/ui/Instrucciones'
import PanelVeredicto, { type Senal } from '../../components/ui/PanelVeredicto'
import Tarea from '../../components/ui/Tarea'
import { AvisoSitio, CabeceraSitio, PieSitio } from '../../components/ui/armazonSitio'
import { MailNav } from '../../components/ui/DesktopChrome'
import { Navegador, type MarcadorNavegador, type PestanaConfig } from '../../components/ui/Navegador'
import { manejarClicHotspot } from '../../components/ui/interactivo'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import styles from '../../components/ui/DeviceScreen.module.css'
import { useAuth } from '../../context/AuthContext'
import { useScenarioRun } from '../../hooks/useScenarioRun'
import type { StoryNode } from '../../hooks/useStoryEngine'

const ORDEN = ['claves', 'correo', 'documentos'] as const
type PestanaId = (typeof ORDEN)[number]

/** La pestaña en blanco que queda cuando se cierran todas. Un navegador nunca
 *  se queda sin ninguna: al cerrar la última abre una nueva vacía. Sin ella la
 *  barra quedaba sin pestañas pero la ventana seguía enseñando la última
 *  página, con su URL y todo. */
const NUEVA = 'nueva'

/** La misma ventana de navegador que el resto de módulos, con tres pestañas
 *  que ningún compañero debería poder leer por encima del hombro. */
const PESTANAS: Record<PestanaId | typeof NUEVA, PestanaConfig> = {
  [NUEVA]: { titulo: 'Nueva pestaña', url: '', segura: true },
  claves: {
    titulo: 'Gestor de contraseñas',
    url: 'vault.andes.ec/mis-claves',
    segura: true,
    cierra: 'claves',
  },
  correo: {
    titulo: 'Correo — Recibidos',
    url: 'correo.andes.ec/recibidos',
    segura: true,
    cierra: 'correo',
  },
  documentos: {
    titulo: 'Mis documentos',
    url: 'drive.andes.ec/mis-documentos',
    segura: true,
    cierra: 'documentos',
  },
}

/** Decorativos, como en cualquier navegador: aquí no hay ningún sitio al que
 *  ir, solo cosas que cerrar. */
const MARCADORES: MarcadorNavegador[] = [
  { Icono: Building2, texto: 'Intranet Andes' },
  { Icono: Landmark, texto: 'Banco del Litoral' },
  { Icono: Newspaper, texto: 'El Comercio' },
]

const CORREOS = [
  {
    de: 'Dirección General',
    direccion: 'direccion@andes.ec',
    asunto: 'Aumento aprobado — confidencial',
    hora: '16:52',
  },
  {
    de: 'Talento Humano',
    direccion: 'talento.humano@andes.ec',
    asunto: 'Reestructuración del área: borrador',
    hora: '15:20',
  },
  {
    de: 'Finanzas',
    direccion: 'finanzas@andes.ec',
    asunto: 'Presupuesto 2026 con cifras sin publicar',
    hora: '11:04',
  },
  {
    de: 'Tu jefe directo',
    direccion: 'r.paredes@andes.ec',
    asunto: 'Tu evaluación de desempeño',
    hora: 'Ayer',
  },
]

const DOCUMENTOS = [
  { nombre: 'mi_salario_2026.pdf', detalle: '245 KB · modificado hoy' },
  { nombre: 'reestructuracion_borrador.docx', detalle: '1.2 MB · hace 2 días' },
  { nombre: 'contrato_negociacion.pdf', detalle: '567 KB · la semana pasada' },
  { nombre: 'estrategia_2026.xlsx', detalle: '3.4 MB · hace 3 días' },
]

/** Cada señal vuelve a abrir su pestaña antes de resaltarla: al terminar el
 *  escenario están cerradas —eso es lo que se pedía— y sin esto el repaso
 *  hablaría de algo que ya no se ve. */
const SENALES: Senal[] = [
  {
    id: 'claves',
    targetId: 'claves',
    pantalla: 'claves',
    texto:
      'Un gestor de contraseñas abierto muestra <b>usuario y clave en texto plano</b>. Quien mire dos segundos se lleva el acceso a tu correo, tu banca y tus sistemas.',
  },
  {
    id: 'correo',
    targetId: 'correo',
    pantalla: 'correo',
    texto:
      'La bandeja de entrada delata sola: los <b>asuntos</b> se leen de un vistazo desde un metro de distancia, aunque no se abra ningún mensaje.',
  },
  {
    id: 'documentos',
    targetId: 'documentos',
    pantalla: 'documentos',
    texto:
      'Los <b>nombres de archivo</b> cuentan lo que hay dentro sin necesidad de abrirlos: un listado a la vista es un índice de todo lo que guardas.',
  },
]

const REGLA =
  '<b>Escritorio limpio y pantalla bloqueada.</b> Si alguien se acerca a tu puesto, lo primero es bloquear; y lo que no debería ver, cerrado antes de volver a desbloquear delante de él.'

function PaginaClaves() {
  const { usuarioSimulado, correoSimulado } = useAuth()

  const claves = [
    { servicio: 'Correo corporativo', usuario: correoSimulado, clave: 'Abc123!@#G2026' },
    { servicio: 'Banco Corporativo', usuario: usuarioSimulado, clave: 'SecurePass2026' },
    { servicio: 'Sistema interno', usuario: usuarioSimulado, clave: 'InternalSys#99' },
    { servicio: 'VPN de la empresa', usuario: `${usuarioSimulado}@vpn`, clave: 'VPNPass2026!' },
  ]

  return (
    <div className={styles.page}>
      <CabeceraSitio marca="Vault Andes" menu={['Bóveda', 'Generador', 'Compartidas', 'Ajustes']} />
      <h2 className={styles.pageTitle}>Mis contraseñas</h2>
      <p className={styles.pageSub}>Cuatro credenciales guardadas, visibles sin volver a pedir la clave maestra.</p>

      <div className={styles.datos} data-signal="claves">
        {claves.map((entrada) => (
          <div key={entrada.servicio} className={styles.dato}>
            <span className={styles.datoEtiqueta}>{entrada.servicio}</span>
            <span className={styles.datoValor}>
              {entrada.usuario} · {entrada.clave}
            </span>
          </div>
        ))}
      </div>

      <AvisoSitio>
        La bóveda se bloquea sola a los 30 minutos de inactividad.
      </AvisoSitio>
      <PieSitio texto="Vault Andes · Gestor de contraseñas corporativo" />
    </div>
  )
}

function PaginaCorreo() {
  return (
    /* El mismo cliente que el resto de módulos: columna de carpetas y lista de
       mensajes con avatar, remitente y asunto. Como tabla de dos columnas no se
       leía como un correo, y lo que este escenario enseña es justamente que un
       correo se lee de un vistazo desde atrás. */
    <div className={styles.desktopBody}>
      <MailNav activa="Recibidos" />

      <div className={styles.mailPane}>
        <div className={styles.mailbody}>
          <h1 className={styles.subject}>Recibidos</h1>

          <div data-signal="correo">
            {CORREOS.map((correo) => (
              <div key={correo.asunto} className={styles.senderRow}>
                <div className={styles.avatar} aria-hidden>
                  {correo.de.slice(0, 1)}
                </div>
                <div className={styles.senderId}>
                  <p className={styles.senderName}>{correo.de}</p>
                  <p className={styles.senderAddr}>{correo.direccion}</p>
                  <p className={styles.mailFolderAsunto}>{correo.asunto}</p>
                </div>
                <span className={styles.date}>{correo.hora}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PaginaDocumentos() {
  return (
    <div className={styles.page}>
      <CabeceraSitio marca="Drive Andes" menu={['Mi unidad', 'Compartidos', 'Recientes', 'Papelera']} />
      <h2 className={styles.pageTitle}>Mi unidad</h2>
      <p className={styles.pageSub}>Archivos de este equipo.</p>

      {/* Fichas de archivo y no la rejilla de etiqueta/valor: un nombre de
          archivo no tiene espacios donde partir y desbordaba su columna encima
          del texto de al lado. */}
      <div className="mt-6 flex flex-col items-start gap-3" data-signal="documentos">
        {DOCUMENTOS.map((documento) => (
          <span key={documento.nombre} className={styles.attachment}>
            <span className={styles.attachmentTipo} aria-hidden>
              {documento.nombre.split('.').pop()?.toUpperCase()}
            </span>
            <span className={styles.attachmentNombre}>
              {documento.nombre}
              <span className={styles.attachmentPeso}>{documento.detalle}</span>
            </span>
          </span>
        ))}
      </div>

      <PieSitio texto="Drive Andes · Corporación Andes" />
    </div>
  )
}

function PrivacidadClaves() {
  const run = useScenarioRun('fisico/privacidad-claves')
  const { displayName } = useAuth()

  const [abiertas, setAbiertas] = useState<PestanaId[]>([...ORDEN])
  const [activa, setActiva] = useState<PestanaId>('claves')
  const [bloqueada, setBloqueada] = useState(false)
  const [final, setFinal] = useState<StoryNode | null>(null)
  /** Pestaña que el repaso de señales quiere enseñar, o nada fuera del repaso.
   *  Mientras dura, la ventana vuelve a como estaba al empezar. */
  const [repaso, setRepaso] = useState<PestanaId | null>(null)

  const enRepaso = repaso !== null
  const abiertasAhora = enRepaso ? [...ORDEN] : abiertas
  const vistaBloqueada = enRepaso ? false : bloqueada
  // Con todo cerrado la ventana enseña una pestaña en blanco, no la última
  // página que hubo: la pestaña ya no existe, su contenido tampoco.
  const sinPestanas = abiertasAhora.length === 0
  const vistaAbiertas = sinPestanas ? [NUEVA] : abiertasAhora
  const vistaActiva = sinPestanas ? NUEVA : (repaso ?? activa)

  function onHotspot(event: React.MouseEvent) {
    if (final) return

    // Cerrar una pestaña se resuelve aquí y no por el `goto`: el botón lleva
    // los dos atributos, y sin este corte cerrarla la dejaría además activa.
    const cerrada = (event.target as HTMLElement).closest<HTMLElement>('[data-cierra]')?.dataset
      .cierra as PestanaId | undefined

    if (cerrada) {
      const quedan = abiertas.filter((id) => id !== cerrada)
      setAbiertas(quedan)
      if (activa === cerrada && quedan[0]) setActiva(quedan[0])
      return
    }

    manejarClicHotspot(event, (goto) => {
      if (ORDEN.includes(goto as PestanaId)) setActiva(goto as PestanaId)
    })
  }

  function atender() {
    if (final) return

    const expuestas = abiertas.length
    run.recordDecision({ pestanasAbiertas: expuestas, bloqueada })

    // Tres desenlaces y no dos: bloquear con las pestañas puestas no es lo
    // mismo que dejarlo todo a la vista, pero tampoco está resuelto — en
    // cuanto desbloquees delante de él vuelve a estar todo ahí.
    const nodo: StoryNode =
      expuestas === 0 && bloqueada
        ? {
            kind: 'good',
            verdict: 'Nada que mirar',
            outcome: `Cerraste las tres pestañas y bloqueaste antes de girarte. Tu compañero se encontró una pantalla de bloqueo y tú atendiste su pregunta sin dejar nada expuesto.`,
          }
        : expuestas === 0 || bloqueada
          ? {
              kind: 'partial',
              verdict: 'A medio resolver',
              outcome: bloqueada
                ? `Bloqueaste la pantalla, pero las tres pestañas siguen abiertas detrás. En cuanto desbloquees para enseñarle algo, vuelve a estar todo a la vista.`
                : `Cerraste las pestañas, pero dejaste la sesión abierta. Si te levantas un momento a buscar algo, cualquiera se sienta en tu sitio.`,
            }
          : {
              kind: 'bad',
              verdict: 'Lo vio todo',
              outcome: `Te giraste con ${expuestas === 1 ? 'una pestaña abierta' : `${expuestas} pestañas abiertas`} y la sesión sin bloquear. Tus contraseñas, tus correos y tus archivos estuvieron delante de él todo el rato que duró la conversación.`,
            }

    setFinal(nodo)
    void run.finish({
      endingId: nodo.kind,
      outcome: nodo.kind === 'good' ? 'CORRECTO' : nodo.kind === 'partial' ? 'PARCIAL' : 'INCORRECTO',
    })
  }

  function reiniciar() {
    run.restart()
    setAbiertas([...ORDEN])
    setActiva('claves')
    setBloqueada(false)
    setFinal(null)
    setRepaso(null)
  }

  const contexto: Contexto = {
    antes: (
      <p>
        En una oficina compartida no hace falta que nadie toque tu equipo: lo que tengas en
        pantalla lo lee cualquiera que se acerque a hablar contigo, y se lee entero en los segundos
        que tarda en llegar a tu silla.
      </p>
    ),
    ahora: (
      <>
        <strong>Un compañero se levanta y viene hacia tu escritorio</strong> a preguntarte algo. En
        tu navegador están abiertos tu gestor de contraseñas, tu correo y tus documentos, y la
        sesión está desbloqueada.
      </>
    ),
  }

  const pantalla = vistaBloqueada ? (
    // La pantalla de bloqueo tapa la ventana entera, como el sistema real: con
    // la sesión bloqueada no se puede cerrar una pestaña sin desbloquear antes.
    <section
      className={`${styles.screen} ${styles.desktop}`}
      aria-label="Pantalla bloqueada"
    >
      <button
        type="button"
        onClick={() => !final && setBloqueada(false)}
        className="flex size-full flex-col items-center justify-center gap-3 bg-ink text-center"
      >
        <span className="flex size-16 items-center justify-center rounded-full bg-white/10" aria-hidden>
          <Lock className="size-8 text-white" strokeWidth={2} />
        </span>
        <span className="text-xl font-semibold text-white">{displayName}</span>
        <span className="text-base text-white/70">
          Sesión bloqueada · haz clic para volver a entrar
        </span>
      </button>
    </section>
  ) : (
    <Navegador
      pestanas={PESTANAS}
      abiertas={vistaAbiertas}
      activa={vistaActiva}
      marcadores={MARCADORES}
      onBloquear={() => {
        run.recordDecision({ accion: 'bloqueó la sesión desde el menú de encendido' })
        setBloqueada(true)
      }}
      onHotspot={onHotspot}
    >
      {vistaActiva === 'claves' && <PaginaClaves />}
      {vistaActiva === 'correo' && <PaginaCorreo />}
      {vistaActiva === 'documentos' && <PaginaDocumentos />}
      {vistaActiva === NUEVA && (
        <div className={styles.page}>
          <h2 className={styles.pageTitle}>Nueva pestaña</h2>
          <p className={styles.pageSub}>
            Ya no queda nada abierto en tu navegador.
          </p>
        </div>
      )}
    </Navegador>
  )

  const decision = final ? (
    <PanelVeredicto
      estadoGuardado={run.status}
      escenarioId="fisico/privacidad-claves"
      node={final}
      senales={SENALES}
      regla={REGLA}
      restartLabel="↻ Repetir el escenario"
      onRestart={reiniciar}
      contenedorId="pantalla-escenario"
      onPantalla={(id) => setRepaso((id ?? null) as PestanaId | null)}
    />
  ) : (
    <div className="grid gap-4">
      <Instrucciones
        queHaces={
          <>
            <p className="text-lg leading-relaxed text-body">
              Actúa sobre la ventana como lo harías si alguien viniera hacia tu sitio ahora mismo.
              Cuando estés listo, te giras a atenderlo.
            </p>

            <ul className="grid gap-2.5">
              <Tarea hecho={abiertas.length === 0}>
                Cerrar las pestañas que no debería ver{' '}
                <span className="tabular-nums text-muted">
                  ({ORDEN.length - abiertas.length} de {ORDEN.length})
                </span>
              </Tarea>
              <Tarea hecho={bloqueada}>Bloquear la pantalla</Tarea>
            </ul>
          </>
        }
        cuandoTermina={
          <>
            Cuando te gires a atender a tu compañero. Lo que en ese momento siga en pantalla es lo
            que él ve; no hay confirmación ni vuelta atrás, igual que en la vida real.
          </>
        }
        pista={
          <p>
            Cada pestaña se cierra con su ✕, como en tu navegador. La sesión se bloquea desde el
            botón de encendido de la barra de tareas, abajo a la derecha. Puedes girarte cuando
            quieras: lo que dejes abierto, lo lee.
          </p>
        }
      />

      <button
        type="button"
        onClick={atender}
        className="min-h-12 w-full rounded-md bg-primary px-4 py-3 text-lg font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
      >
        Girarme a atenderlo
      </button>
    </div>
  )

  const nota = (
    <div className="text-base leading-relaxed text-body">
      <p>
        Vas a ver tu propia pantalla, con las pestañas tal como las dejaste. Puedes tocar lo que
        quieras de la ventana; el escenario termina cuando te giras a atender a tu compañero.
      </p>
    </div>
  )

  return (
    <EscenarioLayout
      escenarioId="fisico/privacidad-claves"
      resumen="Privacidad — Alguien se acerca a tu escritorio"
      contexto={contexto}
      nota={nota}
      identidad={[]}
      pantalla={pantalla}
      decision={decision}
      resultado={final?.kind === 'scene' ? undefined : final?.kind}
      onEmpezar={reiniciar}
      dispositivo="escritorio"
    />
  )
}

export default PrivacidadClaves
