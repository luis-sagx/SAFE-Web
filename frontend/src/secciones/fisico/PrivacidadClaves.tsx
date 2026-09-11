import {
  ArrowLeft,
  ArrowRight,
  Globe,
  HardDrive,
  KeyRound,
  Lock,
  Minus,
  RotateCw,
  Square,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import EscenarioLayout from '../../components/EscenarioLayout'
import Instrucciones from '../../components/ui/Instrucciones'
import PanelVeredicto, { type Senal } from '../../components/ui/PanelVeredicto'
import Tarea from '../../components/ui/Tarea'
import { MailNav, Taskbar } from '../../components/ui/DesktopChrome'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import styles from '../../components/ui/DeviceScreen.module.css'
import { useAuth } from '../../context/AuthContext'
import { useScenarioRun } from '../../hooks/useScenarioRun'
import type { StoryNode } from '../../hooks/useStoryEngine'

type AppId = 'credenciales' | 'archivos' | 'correo'

interface App {
  id: AppId
  titulo: string
  Icono: LucideIcon
  nombre: string
  corto: string
  // Las tres arrancan sin taparse la barra de título: si no se ve el ✕, no hay forma de cerrarla.
  sitio: { left: string; top: string; width: string; height: string }
}

const APPS: App[] = [
  {
    id: 'credenciales',
    titulo: 'Bóveda Andes — Mis credenciales',
    Icono: KeyRound,
    nombre: 'Credenciales',
    corto: 'la bóveda de credenciales',
    sitio: { left: '3%', top: '5%', width: '38%', height: '43%' },
  },
  {
    id: 'archivos',
    titulo: 'Explorador de archivos',
    Icono: HardDrive,
    nombre: 'Archivos',
    corto: 'el explorador de archivos',
    sitio: { left: '6%', top: '51%', width: '38%', height: '43%' },
  },
  {
    id: 'correo',
    titulo: 'Navegador — Correo Andes',
    Icono: Globe,
    nombre: 'Navegador',
    corto: 'el correo en el navegador',
    sitio: { left: '46%', top: '13%', width: '51%', height: '74%' },
  },
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

// Cada señal reabre su app antes de resaltarla: al terminar están cerradas
// (eso es lo que se pedía) y sin esto el repaso hablaría de algo que ya no se ve.
const SENALES: Senal[] = [
  {
    id: 'credenciales',
    targetId: 'credenciales',
    pantalla: 'credenciales',
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
    id: 'archivos',
    targetId: 'archivos',
    pantalla: 'archivos',
    texto:
      'Los <b>nombres de archivo</b> cuentan lo que hay dentro sin necesidad de abrirlos: una carpeta a la vista es un índice de todo lo que guardas.',
  },
]

const REGLA =
  '<b>Escritorio limpio y pantalla bloqueada.</b> Si alguien se acerca a tu puesto, lo primero es bloquear; y lo que no debería ver, cerrado antes de volver a desbloquear delante de él.'

// Minimizar/maximizar se ven pero no responden, como en el resto de pantallas:
// solo el ✕ está vivo, y se pinta rojo al pasar por encima (señal conocida).
function Ventana({
  app,
  alFrente,
  z,
  onFocus,
  onCerrar,
  children,
}: {
  app: App
  alFrente: boolean
  z: number
  onFocus: () => void
  onCerrar: () => void
  children: React.ReactNode
}) {
  return (
    <section
      className={styles.ventana}
      style={{ ...app.sitio, zIndex: z }}
      aria-label={app.titulo}
      onMouseDown={onFocus}
      data-signal={app.id}
    >
      <div className={styles.ventanaBarra}>
        <app.Icono aria-hidden className={styles.ventanaIcono} strokeWidth={1.75} />
        <p className={styles.ventanaTitulo}>{app.titulo}</p>
        <span className={styles.ventanaBotones}>
          <span aria-hidden className={styles.ventanaBoton}>
            <Minus className={styles.ventanaBotonIcono} strokeWidth={2} />
          </span>
          <span aria-hidden className={styles.ventanaBoton}>
            <Square className={styles.ventanaBotonIcono} strokeWidth={2} />
          </span>
          <button
            type="button"
            className={`${styles.ventanaBoton} ${styles.ventanaCerrar}`}
            title={`Cerrar ${app.titulo}`}
            aria-label={`Cerrar ${app.titulo}`}
            onClick={onCerrar}
          >
            <X className={styles.ventanaBotonIcono} strokeWidth={2.5} />
          </button>
        </span>
      </div>

      <div className={styles.ventanaCuerpo} aria-current={alFrente ? 'true' : undefined}>
        {children}
      </div>
    </section>
  )
}

function AppCredenciales() {
  const { usuarioSimulado, correoSimulado } = useAuth()

  const claves = [
    { servicio: 'Correo corporativo', usuario: correoSimulado, clave: 'Abc123!@#G2026' },
    { servicio: 'Banco Corporativo', usuario: usuarioSimulado, clave: 'SecurePass2026' },
    { servicio: 'Sistema interno', usuario: usuarioSimulado, clave: 'InternalSys#99' },
    { servicio: 'VPN de la empresa', usuario: `${usuarioSimulado}@vpn`, clave: 'VPNPass2026!' },
  ]

  return (
    <div className={styles.ventanaPagina}>
      <div className={styles.datos}>
        {claves.map((entrada) => (
          <div key={entrada.servicio} className={styles.dato}>
            <span className={styles.datoEtiqueta}>{entrada.servicio}</span>
            <span className={styles.datoValor}>
              {entrada.usuario} · {entrada.clave}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AppArchivos() {
  return (
    <>
      <div className={styles.ventanaRuta}>Este equipo › Documentos</div>
      <div className={styles.ventanaPagina}>
        <div className="flex flex-col items-start gap-3">
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
      </div>
    </>
  )
}

function AppCorreo() {
  return (
    <>
      {/* Sin ✕ en la pestaña: lo que pide el escenario es cerrar la ventana entera. */}
      <div className={styles.tabstrip}>
        <span className={styles.tab}>
          <Globe aria-hidden className={styles.tabIcono} strokeWidth={1.75} />
          <span className={styles.tabTexto}>Correo Andes</span>
        </span>
      </div>
      <div className={styles.urlbar}>
        <span className={styles.navBotones} aria-hidden>
          <ArrowLeft className={styles.navIcono} strokeWidth={2} />
          <ArrowRight className={styles.navIcono} strokeWidth={2} />
          <RotateCw className={styles.navIcono} strokeWidth={2} />
        </span>
        <Lock aria-hidden className={`${styles.urlIcono} ${styles.lock}`} strokeWidth={2} />
        <span className={styles.url}>correo.andes.ec/recibidos</span>
      </div>

      <div className={styles.desktopBody}>
        <MailNav activa="Recibidos" />
        <div className={styles.mailPane}>
          <div className={styles.mailbody}>
            <h1 className={styles.subject}>Recibidos</h1>
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
    </>
  )
}

const CONTENIDO: Record<AppId, () => React.JSX.Element> = {
  credenciales: AppCredenciales,
  archivos: AppArchivos,
  correo: AppCorreo,
}

function PrivacidadClaves() {
  const run = useScenarioRun('fisico/privacidad-claves')
  const { displayName } = useAuth()

  // Orden de atrás hacia adelante: la última es la que está al frente.
  const [abiertas, setAbiertas] = useState<AppId[]>(APPS.map((app) => app.id))
  const [bloqueada, setBloqueada] = useState(false)
  const [final, setFinal] = useState<StoryNode | null>(null)
  const [repaso, setRepaso] = useState<AppId | null>(null)

  const enRepaso = repaso !== null
  const vistaAbiertas = enRepaso
    ? [...APPS.map((app) => app.id).filter((id) => id !== repaso), repaso]
    : abiertas
  const vistaBloqueada = enRepaso ? false : bloqueada

  function alFrente(id: AppId) {
    if (final) return
    setAbiertas((previas) => [...previas.filter((otra) => otra !== id), id])
  }

  function cerrar(id: AppId) {
    if (final) return
    setAbiertas((previas) => previas.filter((otra) => otra !== id))
  }

  function bloquear() {
    if (final) return
    run.recordDecision({ accion: 'bloqueó la sesión desde el menú de encendido' })
    setBloqueada(true)
  }

  function atender() {
    if (final) return

    const expuestas = abiertas.length
    run.recordDecision({ ventanasAbiertas: expuestas, bloqueada })

    // Tres desenlaces y no dos: bloquear con las ventanas puestas no es lo
    // mismo que dejarlo todo a la vista, pero tampoco está resuelto — en
    // cuanto desbloquees delante de él vuelve a estar todo ahí.
    const nodo: StoryNode =
      expuestas === 0 && bloqueada
        ? {
            kind: 'good',
            verdict: 'Nada que mirar',
            outcome:
              'Cerraste las tres aplicaciones y bloqueaste antes de girarte. Tu compañero se encontró una pantalla de bloqueo y tú atendiste su pregunta sin dejar nada expuesto.',
          }
        : expuestas === 0 || bloqueada
          ? {
              kind: 'partial',
              verdict: 'A medio resolver',
              outcome: bloqueada
                ? 'Bloqueaste la pantalla, pero las aplicaciones siguen abiertas detrás. En cuanto desbloquees para enseñarle algo, vuelve a estar todo a la vista.'
                : 'Cerraste las aplicaciones, pero dejaste la sesión abierta. Si te levantas un momento a buscar algo, cualquiera se sienta en tu sitio.',
            }
          : {
              kind: 'bad',
              verdict: 'Lo vio todo',
              outcome: `Te giraste con ${expuestas === 1 ? 'una aplicación abierta' : `${expuestas} aplicaciones abiertas`} y la sesión sin bloquear. Tus contraseñas, tus correos y tus archivos estuvieron delante de él todo el rato que duró la conversación.`,
            }

    setFinal(nodo)
    void run.finish({
      endingId: nodo.kind,
      outcome:
        nodo.kind === 'good' ? 'CORRECTO' : nodo.kind === 'partial' ? 'PARCIAL' : 'INCORRECTO',
    })
  }

  function reiniciar() {
    run.restart()
    setAbiertas(APPS.map((app) => app.id))
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
        tu pantalla están abiertas tres aplicaciones: tu gestor de credenciales, el explorador con
        tus documentos y el correo. La sesión está desbloqueada.
      </>
    ),
  }

  const pantalla = vistaBloqueada ? (
    // La pantalla de bloqueo tapa el escritorio entero, como el sistema real:
    // con la sesión bloqueada no se puede cerrar nada sin desbloquear antes.
    <section className={`${styles.screen} ${styles.desktop}`} aria-label="Pantalla bloqueada">
      <button
        type="button"
        onClick={() => !final && setBloqueada(false)}
        // bg-[#171717] y no bg-ink: esto es la pantalla de bloqueo del SO
        // simulado, no cromo — tiene que verse igual en los dos temas, y
        // bg-ink se invierte en oscuro (casi blanco), lo que dejaba esta
        // pantalla en blanco sobre blanco.
        className="flex size-full flex-col items-center justify-center gap-3 bg-[#171717] text-center"
      >
        <span
          className="flex size-16 items-center justify-center rounded-full bg-white/10"
          aria-hidden
        >
          <Lock className="size-8 text-white" strokeWidth={2} />
        </span>
        <span className="text-xl font-semibold text-white">{displayName}</span>
        <span className="text-base text-white/70">
          Sesión bloqueada · haz clic para volver a entrar
        </span>
      </button>
    </section>
  ) : (
    <section className={`${styles.screen} ${styles.desktop}`} aria-label="Tu escritorio">
      <div className={styles.escritorio}>
        {vistaAbiertas.length === 0 && (
          <p className={styles.escritorioVacio}>
            <span className={styles.escritorioVacioTitulo}>Escritorio despejado</span>
            <span>No queda ninguna aplicación abierta. Falta la sesión.</span>
          </p>
        )}

        {APPS.map((app) => {
          const z = vistaAbiertas.indexOf(app.id)
          if (z === -1) return null
          const Contenido = CONTENIDO[app.id]

          return (
            <Ventana
              key={app.id}
              app={app}
              z={z + 1}
              alFrente={z === vistaAbiertas.length - 1}
              onFocus={() => alFrente(app.id)}
              onCerrar={() => cerrar(app.id)}
            >
              <Contenido />
            </Ventana>
          )
        })}
      </div>

      <Taskbar
        apps={APPS.filter((app) => vistaAbiertas.includes(app.id)).map((app) => ({
          Icono: app.Icono,
          texto: app.nombre,
          activa: vistaAbiertas.at(-1) === app.id,
          onClick: () => alFrente(app.id),
        }))}
        onBloquear={bloquear}
        reloj="vivo"
      />
    </section>
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
      onPantalla={(id) => setRepaso((id ?? null) as AppId | null)}
    />
  ) : (
    <div className="grid gap-4">
      <Instrucciones
        queHaces={
          <>
            <p className="text-lg leading-relaxed text-body">
              Actúa sobre tu escritorio como lo harías si alguien viniera hacia tu sitio ahora
              mismo. Cuando estés listo, te giras a atenderlo.
            </p>

            <ul className="grid gap-2.5">
              {APPS.map((app) => (
                <Tarea key={app.id} hecho={!abiertas.includes(app.id)}>
                  Cerrar {app.corto}
                </Tarea>
              ))}
              <Tarea hecho={bloqueada}>Bloquear la sesión</Tarea>
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
            Cada aplicación se cierra con la <strong>✕</strong> de su barra de título, arriba a la
            derecha de su ventana. La sesión se bloquea desde el botón de encendido de la barra de
            tareas, abajo a la izquierda. Puedes girarte cuando quieras: lo que dejes abierto, lo
            lee.
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
        Vas a ver tu propio escritorio, con las aplicaciones tal como las dejaste. Puedes tocar lo
        que quieras; el escenario termina cuando te giras a atender a tu compañero.
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
