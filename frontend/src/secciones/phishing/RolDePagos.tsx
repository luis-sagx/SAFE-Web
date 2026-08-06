import { Archive, Building2, Forward, Landmark, Newspaper, Reply, ShieldAlert, Trash2 } from 'lucide-react'
import { useState } from 'react'
import EscenarioLayout from '../../components/EscenarioLayout'
import {
  CuerpoCorreo,
  type AccionCorreo,
  type CarpetaCorreo,
} from '../../components/ui/DesktopChrome'
import styles from '../../components/ui/DeviceScreen.module.css'
import { BotonHotspot, manejarClicHotspot } from '../../components/ui/interactivo'
import { Navegador, type MarcadorNavegador, type PestanaConfig } from '../../components/ui/Navegador'
import PanelVeredicto, { type Senal } from '../../components/ui/PanelVeredicto'
import { formatoHora } from '../../hooks/useRelojDelSistema'
import { useStoryEngine, type Story, type StoryNode } from '../../hooks/useStoryEngine'

const STORY: Story<StoryNode> = {
  n1: { kind: 'scene' },
  n2: { kind: 'scene' },

  e_bien: {
    kind: 'good',
    verdict: 'Acertaste · el correo era legítimo',
    outcome:
      'Era un aviso real de Talento Humano y entraste por el portal de la empresa. Revisaste tu rol y notaste que faltaban dos horas extra: las reclamaste a tiempo.',
  },

  // Responder es, en este correo, exactamente "responder con mi usuario y mi
  // contraseña": el original nunca tuvo una acción de "responder genérico"
  // separada, así que el botón de la barra apunta directo a este final.
  e_credenciales: {
    kind: 'bad',
    verdict: 'Correo legítimo, reacción peligrosa',
    outcome:
      'El remitente era real, pero tu contraseña quedó escrita en un correo. Cualquiera que lea ese buzón (o que lo intercepte) la tiene, y el propio mensaje avisaba que Talento Humano nunca la pide.',
    score: 0,
  },
  e_borra: {
    kind: 'partial',
    verdict: 'Prudente, pero de más',
    outcome:
      'El correo era auténtico y lo descartaste sin mirarlo. No pasó nada malo, pero te quedaste sin revisar tu rol y el plazo para reclamar diferencias venció.',
    score: 50,
  },
  e_reenviar: {
    kind: 'partial',
    verdict: 'Lo reenviaste sin verificar',
    outcome:
      'El aviso era real, así que no pasó nada grave. Pero lo mandaste a otra persona antes de comprobarlo tú mismo: si hubiera sido falso, el reenvío habría llevado el engaño con tu nombre encima.',
    score: 50,
  },
  e_archivar: {
    kind: 'partial',
    verdict: 'Era real, y lo archivaste sin más',
    outcome:
      'No perdiste nada grave: el rol de pagos sigue disponible en el portal. Pero lo guardaste sin revisar si tus horas extra estaban completas, que era justo lo que había que comprobar.',
    score: 50,
  },
  e_spam: {
    kind: 'bad',
    verdict: 'Descartaste un aviso real',
    outcome:
      'Talento Humano sí publicó tu rol de pagos. Marcarlo como spam no solo te lo saca de la vista: le enseña al filtro a esconder los próximos avisos del mismo remitente, y esos sí los vas a necesitar.',
    score: 0,
  },
}

const ACCIONES: AccionCorreo[] = [
  { Icono: Reply, etiqueta: 'Responder', titulo: 'Responder', goto: 'e_credenciales', label: 'Respondió el correo con su usuario y su contraseña' },
  { Icono: Forward, etiqueta: 'Reenviar', titulo: 'Reenviar', goto: 'e_reenviar', label: 'Reenvió el correo a otra persona' },
  { Icono: Archive, etiqueta: 'Archivar', titulo: 'Archivar', goto: 'e_archivar', label: 'Archivó el correo' },
  { Icono: Trash2, etiqueta: 'Eliminar', titulo: 'Eliminar', goto: 'e_borra', label: 'Eliminó el correo' },
  { Icono: ShieldAlert, etiqueta: 'Spam', titulo: 'Marcar como spam', goto: 'e_spam', label: 'Marcó el correo como spam' },
]

const ASUNTO = 'Tu rol de pagos de julio ya está disponible'
const REMITENTE_NOMBRE = 'Talento Humano · Corporación Andes'
const DIRECCION = 'nomina@andes.com.ec'

const DESTINO_ACCION: Record<
  string,
  { carpeta?: 'Enviados' | 'Spam' | 'Papelera'; prefijo?: string; vaciaRecibidos: boolean }
> = {
  e_archivar: { vaciaRecibidos: true },
  e_borra: { carpeta: 'Papelera', vaciaRecibidos: true },
  e_spam: { carpeta: 'Spam', vaciaRecibidos: true },
  e_credenciales: { carpeta: 'Enviados', prefijo: 'Re:', vaciaRecibidos: false },
  e_reenviar: { carpeta: 'Enviados', prefijo: 'Fwd:', vaciaRecibidos: false },
}

function ResumenMensaje({ prefijo }: { prefijo?: string }) {
  return (
    <div className={styles.senderRow}>
      <div className={styles.avatar} aria-hidden>
        {REMITENTE_NOMBRE.slice(0, 1).toUpperCase()}
      </div>
      <div className={styles.senderId}>
        <p className={styles.senderName}>{REMITENTE_NOMBRE}</p>
        <p className={styles.senderAddr}>{DIRECCION}</p>
        <p className={styles.mailFolderAsunto}>{prefijo ? `${prefijo} ${ASUNTO}` : ASUNTO}</p>
      </div>
    </div>
  )
}

function carpetasCorreo(current: string, isEnding: boolean): CarpetaCorreo[] {
  const destino = isEnding ? DESTINO_ACCION[current] : undefined
  const carpetas: CarpetaCorreo[] = [
    {
      nombre: 'Enviados',
      vacia: 'No hay correos enviados.',
      contenido:
        destino?.carpeta === 'Enviados' ? <ResumenMensaje prefijo={destino.prefijo} /> : undefined,
    },
    {
      nombre: 'Spam',
      vacia: 'No hay correos marcados como spam.',
      contenido: destino?.carpeta === 'Spam' ? <ResumenMensaje /> : undefined,
    },
    {
      nombre: 'Papelera',
      vacia: 'La papelera está vacía.',
      contenido: destino?.carpeta === 'Papelera' ? <ResumenMensaje /> : undefined,
    },
  ]

  if (destino?.vaciaRecibidos) {
    carpetas.push({ nombre: 'Recibidos', vacia: 'No hay correos en la bandeja de entrada.' })
  }

  return carpetas
}

const SENALES: Senal[] = [
  { id: 's1', targetId: 'remitente', pantalla: 'n1', texto: 'El dominio del remitente es <b>exactamente</b> el de la empresa: andes.com.ec.' },
  { id: 's2', targetId: 'saludo', pantalla: 'n1', texto: 'Te llama <b>por tu nombre</b> y menciona un período y un plazo concretos.' },
  { id: 's3', texto: '<b>No pide credenciales</b> ni datos: solo avisa dónde está la información.' },
  { id: 's4', targetId: 'canal', pantalla: 'n1', texto: 'Ofrece un <b>canal alterno verificable</b> (la extensión 214).' },
  { id: 's5', targetId: 'portal', pantalla: 'n1', texto: 'El portal está en el <b>dominio corporativo</b> y con conexión segura.' },
]

const RULE =
  'Regla de oro: no todo correo es una trampa. Lo que distingue a uno legítimo es que <b>no te pide tu clave y su dominio es el real</b>. Aun así, entra al portal escribiendo tú la dirección: es la costumbre que te protege siempre.'

const RESUMEN = 'Talento Humano avisa que tu rol de pagos de julio ya está en el portal.'

const CONTEXTO = (
  <>
    <p>
      Trabajas en <strong>Corporación Andes</strong>. Todos los meses Talento Humano publica el rol
      de pagos en el portal del colaborador y avisa por correo.
    </p>
    <p>
      Este mes trabajaste horas extra y quieres confirmar que estén incluidas antes de que cierre
      el plazo de reclamos.
    </p>
  </>
)

const NOTA = (
  <>
    <p>
      Vas a ver tu computador con el correo abierto. Puedes actuar sobre la pantalla como lo harías
      de verdad.
    </p>
    <p className="mt-2">
      Lo primero que hagas cierra el escenario y te muestra en qué habría terminado.
    </p>
  </>
)

function horaDeLlegada(): string {
  const ahora = new Date()
  const ayer = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 1, 17, 20)
  return `ayer ${formatoHora(ayer)}`
}

const PESTANAS: Record<string, PestanaConfig> = {
  n1: { titulo: 'Correo', url: 'https://correo.safeweb.com/u/0/#recibidos', segura: true },
  n2: {
    titulo: 'Portal del colaborador',
    url: 'https://portal.andes.com.ec/rrhh/rol',
    segura: true,
    cierra: 'e_borra',
  },
}

const MARCADORES: MarcadorNavegador[] = [
  { Icono: Landmark, texto: 'Banco del Litoral' },
  { Icono: Building2, texto: 'Portal Andes', goto: 'n2', label: 'Abrió el portal del colaborador desde sus marcadores' },
  { Icono: Newspaper, texto: 'El Comercio' },
]

function ContenidoCorreo({ recibido, carpetas }: { recibido: string; carpetas: CarpetaCorreo[] }) {
  return (
    <CuerpoCorreo
      acciones={ACCIONES}
      carpetas={carpetas}
      asunto={ASUNTO}
      remitente={{ nombre: REMITENTE_NOMBRE, direccion: DIRECCION, senalDireccion: 'remitente' }}
      recibido={recibido}
      pie={
        <>
          <p>Talento Humano · Corporación Andes</p>
          <p>Nunca te pediremos tu contraseña por correo ni por teléfono.</p>
        </>
      }
    >
      <p data-signal="saludo">Hola,</p>
      <p>
        Tu rol de pagos del período <b>julio 2026</b> ya está publicado en el portal del
        colaborador, junto con el detalle de horas extra y descuentos.
      </p>
      <p>
        Puedes consultarlo en <b data-signal="portal">portal.andes.com.ec</b>, con el mismo usuario
        de tu correo institucional. Si algo no cuadra, responde a este correo o escribe a{' '}
        <span data-signal="canal">la extensión 214</span> antes del 8 de agosto.
      </p>
    </CuerpoCorreo>
  )
}

function ContenidoPortal() {
  return (
    <div className={styles.page}>
      <p className={styles.brand}>Corporación Andes</p>
      <h2 className={styles.pageTitle}>Portal del colaborador</h2>
      <p className={styles.pageSub}>Ingresa con tu usuario institucional para ver tu rol de pagos.</p>

      <div className={styles.form}>
        <label className={styles.field}>
          <span>Usuario</span>
          <span className={styles.input}>
            <span className="sr-only">Tu usuario, ya completado: </span>
            daniela.mora
          </span>
        </label>
        <label className={styles.field}>
          <span>Contraseña</span>
          <span className={styles.input}>
            <span className="sr-only">Tu contraseña, ya completada: </span>
            ••••••••
          </span>
        </label>
        <BotonHotspot goto="e_bien" label="Ingresó a su portal del colaborador" className={styles.submit}>
          Ingresar
        </BotonHotspot>
      </div>

      <p className={styles.pageFooter}>portal.andes.com.ec · Talento Humano</p>
    </div>
  )
}

function DecisionEnCurso({ fallo, enFormulario }: { fallo: boolean; enFormulario: boolean }) {
  return (
    <div className="grid gap-3">
      <p className="text-lg font-semibold text-ink">¿Qué haces?</p>
      <p className="text-lg leading-relaxed text-body">
        Actúa sobre la ventana como lo harías frente a tu correo de verdad: puedes usar{' '}
        <strong>cualquier parte de ella</strong>, incluida la barra de abajo.
      </p>

      {enFormulario && (
        <p className="rounded-md border border-hairline-strong bg-canvas-soft px-3 py-2 text-base leading-relaxed text-body">
          El formulario ya aparece con <strong className="text-ink">tu usuario y tu clave escritos</strong>.
          Es así para no pedirte datos reales, pero enviarlo cuenta como iniciar sesión.
        </p>
      )}

      <p className="text-base leading-relaxed text-body">
        Lo primero que hagas cierra el escenario y te muestra en qué terminaba. No hay confirmación,
        igual que en la vida real. Puedes volver atrás con la flecha del navegador sin decidir nada.
      </p>

      {fallo && (
        <p role="status" className="rounded-md bg-surface-strong px-3 py-2 text-base text-body">
          Ahí no hay nada que hacer. Solo algunos elementos responden: recórrelos con el cursor (o
          con la tecla Tab) y se marcarán al pasar.
        </p>
      )}

      <details className="group rounded-md border border-hairline-strong bg-surface px-3 py-2">
        <summary className="cursor-pointer list-none text-base font-medium text-link underline decoration-dotted underline-offset-4">
          No sé por dónde empezar
        </summary>
        <p className="mt-2 text-base leading-relaxed text-body">
          Tienes varios caminos posibles: entrar al portal por tu cuenta desde los marcadores del
          navegador, responder el correo, o usar alguno de los botones de la barra de arriba. Cuál
          de ellos es el acertado es justamente lo que decides tú.
        </p>
      </details>
    </div>
  )
}

function RolDePagos() {
  const engine = useStoryEngine(STORY, 'n1', 'phishing/rol-de-pagos')

  const [pantallaActual, setPantallaActual] = useState('n1')
  const [tocoEnVacio, setTocoEnVacio] = useState(false)
  const [recibido, setRecibido] = useState(horaDeLlegada)
  const [pestanas, setPestanas] = useState(['n1'])
  const [repasando, setRepasando] = useState(false)

  function elegir(goto: string, label?: string) {
    if (engine.isEnding) return
    engine.choose(goto, label)
    if (STORY[goto]?.kind === 'scene') {
      setPantallaActual(goto)
      setPestanas((abiertas) => (abiertas.includes(goto) ? abiertas : [...abiertas, goto]))
    }
  }

  function reiniciar() {
    engine.restart()
    setPantallaActual('n1')
    setPestanas(['n1'])
    setRepasando(false)
    setTocoEnVacio(false)
    setRecibido(horaDeLlegada())
  }

  const onHotspot = (event: React.MouseEvent) => {
    const cerrada = (event.target as HTMLElement).closest<HTMLElement>('[data-cierra]')?.dataset
      .cierra
    if (cerrada) {
      setPestanas((abiertas) => abiertas.filter((id) => id !== cerrada))
    }

    if (!manejarClicHotspot(event, elegir) && !engine.isEnding) {
      setTocoEnVacio(true)
    }
  }

  const pantalla = (
    <Navegador
      pestanas={PESTANAS}
      abiertas={pestanas}
      activa={pantallaActual}
      marcadores={MARCADORES}
      onHotspot={onHotspot}
    >
      {pantallaActual === 'n1' ? (
        <ContenidoCorreo
          recibido={recibido}
          carpetas={carpetasCorreo(engine.current, engine.isEnding && !repasando)}
        />
      ) : (
        <ContenidoPortal />
      )}
    </Navegador>
  )

  const decision = engine.isEnding ? (
    <PanelVeredicto
      escenarioId="phishing/rol-de-pagos"
      node={engine.node}
      senales={SENALES}
      regla={RULE}
      restartLabel="↻ Repetir el escenario"
      onRestart={reiniciar}
      contenedorId="pantalla-escenario"
      onPantalla={(id) => {
        setRepasando(Boolean(id))
        if (id) setPantallaActual(id)
      }}
    />
  ) : (
    <DecisionEnCurso fallo={tocoEnVacio} enFormulario={pantallaActual === 'n2'} />
  )

  return (
    <EscenarioLayout
      escenarioId="phishing/rol-de-pagos"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      nota={NOTA}
      pantalla={pantalla}
      decision={decision}
      onEmpezar={engine.restart}
      dispositivo="escritorio"
    />
  )
}

export default RolDePagos
