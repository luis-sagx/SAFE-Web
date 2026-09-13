import {
  Building2,
  File,
  Forward,
  Landmark,
  Newspaper,
  Reply,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import ScenarioLayout from '../../components/EscenarioLayout'
import type { Context } from '../../components/ui/ContextoEscenario'
import Instructions from '../../components/ui/Instrucciones'
import {
  EmailBody,
  type EmailAction,
  type EmailFolder,
} from '../../components/ui/DesktopChrome'
import { createEmailFolders } from '../../components/ui/carpetasCorreo'
import { SiteNotice, SiteHeader, FOOTER_LINKS, SiteFooter } from '../../components/ui/armazonSitio'
import styles from '../../components/ui/DeviceScreen.module.css'
import { IDENTITY_FAKE } from '../../lib/identidadFicticia'
import {
  HotspotButton,
  HotspotLink,
  preventNavigation,
  handleHotspotClick,
} from '../../components/ui/interactivo'
import {
  Browser,
  type BrowserBookmark,
  type TabConfig,
} from '../../components/ui/Navegador'
import VerdictPanel, { type Signal } from '../../components/ui/PanelVeredicto'
import { formatTime } from '../../hooks/useRelojDelSistema'
import { useStoryEngine, type Story, type StoryNode } from '../../hooks/useStoryEngine'

// Primer escenario interactivo: el participante actúa directamente sobre el correo y la página
// falsa en vez de elegir de una lista. No usa StoryEscenario/DeviceScreen/StoryChoices por eso.

// El grafo no usa `choices`: cada punto interactivo lleva su propio `goto`/`label` en la pantalla.
const STORY: Story<StoryNode> = {
  n1: { kind: 'scene' },
  n2: { kind: 'scene' },
  // Portal legítimo: un solo nodo, para que el marcador vaya a la pestaña ya abierta en vez de duplicarla.
  n3: { kind: 'scene' },
  e_adjunto: {
    kind: 'bad',
    verdict: 'Caíste en la trampa',
    outcome:
      'No se abrió ninguna factura: el archivo era un programa y tu equipo lo ejecutó. En segundo plano descargó un ladrón de contraseñas que recogió las que tenías guardadas en el navegador, incluida la del portal del SRI. No apareció ninguna ventana ni ningún aviso.',
  },
  e_datos: {
    kind: 'bad',
    verdict: 'Caíste en la trampa',
    outcome: `Entregaste tu RUC ${IDENTITY_FAKE.ruc} y tu clave ${IDENTITY_FAKE.clave} en un sitio que no es del SRI. Con esos datos pueden emitir comprobantes a tu nombre y ver tu información tributaria.`,
  },

  // Los cinco finales de la barra de acciones del cliente. Ninguno entrega la
  // clave, pero no todos protegen igual: por eso hay 'partial' entre medio, y
  // no solo "caíste / no caíste".
  e_spam: {
    kind: 'good',
    verdict: 'No caíste · lo reportaste',
    outcome:
      'Marcarlo como spam es la mejor reacción posible: no caíste y además tu proveedor de correo aprende a filtrar ese remitente, así que el mismo mensaje le llega a menos gente.',
  },
  e_eliminar: {
    kind: 'good',
    verdict: 'No caíste · lo eliminaste',
    outcome:
      'Lo borraste sin tocar el enlace ni el adjunto, que es suficiente para no caer. Marcarlo como spam habría hecho algo más: avisar al filtro para que no le llegue a otros.',
  },
  e_responder: {
    kind: 'partial',
    verdict: 'No entregaste la clave, pero contestaste',
    outcome:
      'No diste tus datos, pero confirmaste que tu dirección existe y que alguien la lee. Es justo lo que un atacante busca para insistir con algo mejor preparado, y ahora tiene una conversación abierta contigo.',
  },
  e_reenviar: {
    kind: 'partial',
    verdict: 'No caíste tú, pero lo pasaste',
    outcome:
      'Se lo reenviaste a otra persona para que opine. Tú no caíste, pero pusiste el enlace y el adjunto en la bandeja de alguien que quizá no los mire con la misma desconfianza. Para consultar una duda es mejor una captura, o preguntar sin reenviar.',
  },
}

// Todas llevan a un final: en la barra de un cliente de correo no puede haber botones de adorno.
const ACTIONS: EmailAction[] = [
  {
    Icono: Reply,
    etiqueta: 'Responder',
    titulo: 'Responder',
    goto: 'e_responder',
    label: 'Respondió el correo',
  },
  {
    Icono: Forward,
    etiqueta: 'Reenviar',
    titulo: 'Reenviar',
    goto: 'e_reenviar',
    label: 'Reenvió el correo a otra persona',
  },
  {
    Icono: Trash2,
    etiqueta: 'Eliminar',
    titulo: 'Eliminar',
    goto: 'e_eliminar',
    label: 'Eliminó el correo',
  },
  {
    Icono: ShieldAlert,
    etiqueta: 'Spam',
    titulo: 'Marcar como spam',
    goto: 'e_spam',
    label: 'Marcó el correo como spam',
  },
]

const SUBJECT = 'Factura electrónica pendiente de validación'
const SENDER_NAME = 'SRI · Facturación Electrónica'
const ADDRESS = 'notificaciones@sri-facturacion-ec.com'

// Cada señal apunta a su data-signal en una de las dos pantallas; si esa
// pantalla no es la que llevó al final, el recorrido igual muestra el texto sin resaltar.
const SIGNALS: Signal[] = [
  {
    id: 'dominio',
    pantalla: 'n1',
    targetId: 'remitente',
    texto:
      'Lo que va después de la arroba es la parte que dice de quién es el correo de verdad. Aquí dice <b>sri-facturacion-ec.com</b>, y la del SRI es <b>sri.gob.ec</b>. Cualquiera puede comprar un nombre que lleve "sri" adentro, y eso no lo vuelve oficial.',
  },
  {
    id: 'dominio-real',
    pantalla: 'n3',
    targetId: 'url-real',
    texto:
      'Así se ve el portal de verdad: su dirección termina en <b>sri.gob.ec</b>, y ese <b>.gob.ec</b> del final solo lo pueden usar entidades del Estado ecuatoriano. La del correo no lo tenía, solo lo imitaba.',
  },
  {
    id: 'externo',
    pantalla: 'n1',
    targetId: 'externo',
    texto:
      'Tu propio correo lo marcó como <b>externo</b>, o sea que vino de fuera y no de dentro de tu organización. No lo vuelve falso por sí solo, pero un mensaje que dice ser de una institución y llega así merece que lo compruebes aparte.',
  },
  {
    id: 'plazo',
    pantalla: 'n1',
    targetId: 'plazo',
    texto:
      'Te da <b>24 horas</b> y amenaza con una multa. La prisa es parte del engaño: si no te da tiempo de comprobar nada, decides con miedo.',
  },
  {
    id: 'conexion',
    pantalla: 'n2',
    targetId: 'url-insegura',
    texto:
      'La dirección de esa página empieza por <b>http</b> y no por <b>https</b>, y por eso el navegador no muestra el candado. Lo que escribas ahí viaja sin proteger, y ningún portal que pida claves funciona así hoy.',
  },
  {
    id: 'adjunto',
    pantalla: 'n1',
    targetId: 'adjunto',
    texto:
      'El nombre del archivo termina en <b>.vbs</b>, y ese final es lo que dice qué es: no un documento, sino un <b>programa</b> que se ejecuta apenas lo abres. El <b>.pdf</b> de antes está puesto para disfrazarlo, y Windows suele esconder el final del nombre.',
  },
  {
    id: 'clave',
    pantalla: 'n2',
    targetId: 'campo-clave',
    texto:
      'Te pide la <b>clave</b> del portal para "validar" una factura. Una clave sirve para entrar a tu cuenta, no para revisar un trámite: quien la reciba entra como si fueras tú.',
  },
]

const RULE =
  'Regla de oro: ninguna entidad pública te pide tu clave por correo. Si un mensaje dice que tienes algo pendiente, <b>entra al portal oficial escribiendo tú la dirección</b>, nunca por el enlace del correo.'

const SUMMARY = 'Un correo dice que tienes una factura electrónica pendiente de validar.'

const CONTEXT: Context = {
  antes: (
    <>
      Emites facturas de vez en cuando, así que un aviso del <strong>SRI</strong> no te sorprende.
    </>
  ),
  ahora: (
    <>
      <strong>Hace unos minutos</strong> llegó a tu bandeja un correo del{' '}
      <strong>Servicio de Rentas Internas</strong> sobre una factura pendiente.
    </>
  ),
}

// Solo mecánica: el bloque de decisión ya explica la historia dentro del escenario.
const NOTE = (
  <>
    <p>
      Vas a ver tu computador con el correo abierto. Puedes actuar sobre la pantalla como lo harías
      de verdad.
    </p>
    <p className="mt-2">
      El escenario termina cuando decidas qué hacer con el mensaje, o si caes en lo que pide.
      Moverte por las pantallas y cerrarlas no decide nada.
    </p>
  </>
)

// Se calcula a partir del ahora porque la barra de tareas muestra la hora real y avanza:
// con una hora fija el mensaje quedaría fechado en un momento que el reloj desmiente.
const MINUTES_OF_AGE = 5

function getArrivalTime(): string {
  const arrival = new Date(Date.now() - MINUTES_OF_AGE * 60_000)
  return `hoy ${formatTime(arrival)}`
}

// La dirección es la señal principal del escenario, así que vive junto al nodo, no en cada componente.
const TABS: Record<string, TabConfig> = {
  n1: { titulo: 'Correo', url: 'https://correo.safeweb.com/u/0/#recibidos', segura: true },
  n2: {
    titulo: 'Validación de comprobante',
    url: 'http://sri-facturacion-ec.com/validar-ruc', // NOSONAR: URL insegura intencional que el participante debe detectar.
    segura: false,
    // Cerrarla devuelve al correo sin decidir nada: irse de una página que da
    // mala espina no es un veredicto todavía.
    cierra: 'n1',
    senalUrl: 'url-insegura',
  },
  n3: {
    titulo: 'SRI en Línea',
    url: 'https://srienlinea.sri.gob.ec/comprobantes',
    segura: true,
    // Como la falsa: cerrarla devuelve al correo. Haber comprobado en el portal
    // real es un buen paso, pero el escenario no termina hasta que se decida
    // qué hacer con el mensaje (issue #24).
    cierra: 'n1',
    senalUrl: 'url-real',
  },
}

const MARKERS: BrowserBookmark[] = [
  { Icono: Landmark, texto: 'Banco del Litoral' },
  {
    Icono: Building2,
    texto: 'SRI en Línea',
    goto: 'n3',
    label: 'Abrió el portal del SRI desde sus marcadores',
  },
  { Icono: Newspaper, texto: 'El Comercio' },
]

function EmailContent({ recibido: received, carpetas: folders }: { recibido: string; carpetas: EmailFolder[] }) {
  return (
    <EmailBody
      acciones={ACTIONS}
      carpetas={folders}
      asunto={SUBJECT}
      remitente={{
        nombre: SENDER_NAME,
        direccion: ADDRESS,
        etiqueta: 'Externo',
        senalDireccion: 'remitente',
        senalEtiqueta: 'externo',
      }}
      recibido={received}
      marca={{
        nombre: 'Servicio de Rentas Internas',
        detalle: 'Facturación electrónica',
        icono: 'empresa',
        variante: 'institucional',
      }}
      adjunto={
        <HotspotButton
          goto="e_adjunto"
          label="Descargó el archivo adjunto"
          signalId="adjunto"
          className={styles.attachment}
        >
          {/* Icono genérico y no de advertencia: eso delataría la trampa, y el escenario mide si se lee la extensión. */}
          <span className={styles.attachmentTipo} aria-hidden>
            <File className={styles.attachmentIcono} strokeWidth={1.75} />
          </span>
          <span className={styles.attachmentNombre}>
            Factura_004521.pdf.vbs
            {/* 12 KB: un script pesa unos pocos KB, no lo que pesa un PDF real — señal implícita. */}
            <span className={styles.attachmentPeso}>12 KB</span>
          </span>
        </HotspotButton>
      }
      pie={
        <>
          <p>Servicio de Rentas Internas · Dirección Nacional de Facturación Electrónica</p>
          <p>Av. Amazonas y Unión Nacional de Periodistas, Quito, Ecuador</p>
          <p>
            Este correo y sus anexos son de carácter confidencial. Si lo recibió por error,
            notifíquelo al remitente y elimínelo de su sistema.
          </p>
        </>
      }
    >
      <p>Estimado(a) contribuyente:</p>
      <p>
        Nuestro sistema detectó una <b>factura electrónica no validada</b> asociada a su RUC. Si no
        completa la validación en las próximas{' '}
        <mark className={styles.marca} data-signal="plazo">
          24 horas
        </mark>
        , su comprobante será anulado y se aplicará una multa administrativa.
      </p>
      <p>
        <HotspotLink
          goto="n2"
          label="Abrió el enlace para validar la factura"
          href="http://sri-facturacion-ec.com/validar-ruc" // NOSONAR: URL insegura intencional que el participante debe detectar.
          className="cta"
        >
          Validar mi factura ahora
        </HotspotLink>
      </p>
      <p className="fine">Este mensaje es automático, por favor no responda.</p>
    </EmailBody>
  )
}

function FakePortalContent() {
  return (
    <>
      <div className={styles.page}>
        <SiteHeader
          marca="Servicio de Rentas"
          menu={['Comprobantes', 'Declaraciones', 'Trámites', 'Ayuda']}
        />
        <h2 className={styles.pageTitle}>Validación de comprobante</h2>
        <p className={styles.pageSub}>
          Ingresa tus datos del portal para liberar la factura pendiente.
        </p>

        <div className={styles.form}>
          <fieldset className={styles.field}>
            <legend>RUC o cédula</legend>
            {/* No editable y con un RUC que no es el de nadie: el participante nunca escribe credenciales reales. */}
            <span className={styles.input}>
              <span className="sr-only">Tu RUC, ya completado: </span>
              {' '}{IDENTITY_FAKE.ruc}
            </span>
          </fieldset>
          <fieldset className={styles.field} data-signal="campo-clave">
            <legend>Clave del portal SRI</legend>
            <span className={styles.input}>
              <span className="sr-only">Tu clave, ya completada: </span>
              {' '}••••••••
            </span>
          </fieldset>
          <HotspotButton
            goto="e_datos"
            label="Ingresó su RUC y su clave para liberar la factura"
            className={styles.submit}
          >
            Validar factura
          </HotspotButton>
        </div>

        <SiteNotice>
          El comprobante quedará habilitado en un plazo máximo de 24 horas tras la validación. No
          comparta sus credenciales con terceros.
        </SiteNotice>

        <SiteFooter
          texto="Servicio de Rentas Internas · República del Ecuador"
          enlaces={FOOTER_LINKS}
        />
      </div>
    </>
  )
}

// No dice cuáles son los puntos accionables: señalarlos borraría lo que se mide
// (si la persona reconoce sola el anzuelo). Quien se atasca tiene la pista opt-in.
function PendingDecision({
  fallo: failure,
  enPortal: onPortal,
  enPortalReal: onRealPortal,
}: {
  fallo: boolean
  enPortal: boolean
  enPortalReal: boolean
}) {
  return (
    <div className="grid gap-3">
      <p className="text-lg font-semibold text-ink">¿Qué haces?</p>
      <Instructions
        fallo={failure}
        pista={
          <p>
            Tienes tres caminos posibles: hacer lo que el correo te pide, abrir lo que trae adjunto,
            o dejar el correo de lado y entrar al portal por tu cuenta desde los marcadores. Cuál de
            los tres es el acertado es justamente lo que decides tú.
          </p>
        }
      >
        <p className="text-lg leading-relaxed text-body">
          Actúa sobre la ventana como lo harías frente a tu correo de verdad: puedes usar{' '}
          <strong>cualquier parte de ella</strong>, incluida la barra de abajo. Antes de tocar un
          enlace, mantén el cursor encima para ver a dónde lleva.
        </p>
        {onRealPortal && (
          <p className="rounded-md border border-hairline-strong bg-canvas-soft px-3 py-2 text-base leading-relaxed text-body">
            Este es el portal del SRI de verdad, abierto por ti.{' '}
            <strong className="text-ink">No hay ninguna factura pendiente</strong>, así que el
            correo mentía. Cierra la pestaña cuando termines de comprobarlo.
          </p>
        )}

        {/* Va aquí y no en la página: una página de phishing real jamás avisaría de qué son sus campos. */}
        {onPortal && (
          <p className="rounded-md border border-hairline-strong bg-canvas-soft px-3 py-2 text-base leading-relaxed text-body">
            El formulario ya aparece con{' '}
            <strong className="text-ink">tu RUC y tu clave escritos</strong>. Es así para no pedirte
            datos verdaderos (ese RUC no es el de nadie), pero enviarlo cuenta como entregarlos.
          </p>
        )}

        {/* Detrás de un resumen: es mecánica, no la tarea, y para empezar solo hace falta lo de arriba. */}
        <details className="text-base leading-relaxed text-body">
          <summary className="cursor-pointer list-none font-medium text-link underline decoration-dotted underline-offset-4">
            ¿Cuándo termina el escenario?
          </summary>
          <p className="mt-2">
            Cuando decidas qué hacer con el mensaje, o si caes en lo que pide. No hay confirmación,
            igual que en la vida real. Moverte entre pantallas, volver atrás o cerrar una pestaña no
            decide nada.
          </p>
        </details>
      </Instructions>
    </div>
  )
}

// El portal verdadero: existe para que el camino acertado se vea y no solo se cuente,
// en contraste con la página falsa (dominio real, sesión iniciada, sin formulario de clave).
function RealPortalContent() {
  return (
    <>
      <div className={styles.page}>
        <SiteHeader
          marca="SRI · Servicio de Rentas Internas"
          menu={['Comprobantes', 'Declaraciones', 'Trámites', 'Ayuda']}
        />
        <h2 className={styles.pageTitle}>Comprobantes electrónicos</h2>
        <p className={styles.portalSesion}>
          Sesión iniciada · RUC {IDENTITY_FAKE.ruc} · último ingreso hoy
        </p>

        <table className={styles.portalTabla}>
          <thead>
            <tr>
              <th>Comprobante</th>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3} className={styles.portalVacio}>
                No hay comprobantes pendientes de validación.
              </td>
            </tr>
          </tbody>
        </table>

        <div className={styles.portalAviso}>
          <ShieldCheck aria-hidden className={styles.portalAvisoIcono} strokeWidth={1.75} />
          <span>
            Tu RUC no tiene comprobantes pendientes ni multas registradas. Tampoco hay ninguna
            notificación abierta a tu nombre.
          </span>
        </div>

        <SiteFooter
          texto="Servicio de Rentas Internas · República del Ecuador"
          enlaces={FOOTER_LINKS}
        />
      </div>
    </>
  )
}

function SriInvoice() {
  const engine = useStoryEngine(STORY, 'n1', 'phishing/factura-sri')

  // El nodo final no es una pantalla, sino la consecuencia de una; se guarda su
  // id (no una lista cerrada de valores) para que el repaso tenga sobre qué resaltar.
  const [currentScreen, setCurrentScreen] = useState('n1')
  // Se enciende con el primer clic en el vacío y ya no se apaga.
  const [clickedEmptySpace, setClickedEmptySpace] = useState(false)
  // Se calcula una vez al montar, no en cada render, o el correo "rejuvenecería" con el reloj.
  const [received, setReceived] = useState(getArrivalTime)
  const [tabs, setTabs] = useState(['n1'])
  // Durante el repaso el mensaje vuelve a Recibidos: Spam/Papelera dejaban la
  // bandeja vacía y sin nada que señalar.
  const [reviewing, setReviewing] = useState(false)

  function choose(goto: string, label?: string) {
    if (engine.isEnding) {
      return
    }
    engine.choose(goto, label)
    if (STORY[goto]?.kind === 'scene') {
      setCurrentScreen(goto)
      setTabs((open) => (open.includes(goto) ? open : [...open, goto]))
    }
  }

  function restart() {
    engine.restart()
    setCurrentScreen('n1')
    setTabs(['n1'])
    setReviewing(false)
    setClickedEmptySpace(false)
    // Al repetir, el correo vuelve a acabar de llegar. Conservar la hora del
    // intento anterior dejaría un mensaje de hace media hora en una bandeja
    // cuyo reloj ya avanzó.
    setReceived(getArrivalTime())
  }

  const onHotspot = (event: React.MouseEvent) => {
    preventNavigation(event)

    const closed = (event.target as HTMLElement).closest<HTMLElement>('[data-cierra]')?.dataset
      .cierra
    if (closed) {
      const remaining = tabs.filter((id) => id !== closed)
      setTabs(remaining)
      // issue #26: con el escenario terminado `elegir` no toca la pantalla, así que sin
      // esto la pestaña cerrada seguía a la vista aunque ya no estuviera en la barra.
      if (closed === currentScreen) setCurrentScreen(remaining.at(-1) ?? 'n1')
    }

    if (!handleHotspotClick(event, choose) && !engine.isEnding) {
      setClickedEmptySpace(true)
    }
  }

  // Importa en el repaso: las señales llevan a pantallas cerradas o nunca abiertas,
  // y sin esto se explicaba el portal con la pestaña del correo marcada como activa.
  const open = tabs.includes(currentScreen) ? tabs : [...tabs, currentScreen]

  const screen = (
    <Browser
      pestanas={TABS}
      abiertas={open}
      activa={currentScreen}
      marcadores={MARKERS}
      onHotspot={onHotspot}
    >
      {currentScreen === 'n1' ? (
        <EmailContent
          recibido={received}
          carpetas={createEmailFolders(
            { nombre: SENDER_NAME, direccion: ADDRESS, asunto: SUBJECT },
            engine.isEnding && !reviewing ? engine.current : undefined,
          )}
        />
      ) : currentScreen === 'n2' ? (
        <FakePortalContent />
      ) : (
        <RealPortalContent />
      )}
    </Browser>
  )

  const decision = engine.isEnding ? (
    <VerdictPanel
      estadoGuardado={engine.runStatus}
      escenarioId="phishing/factura-sri"
      node={engine.node}
      senales={SIGNALS}
      regla={RULE}
      restartLabel="↻ Repetir el escenario"
      onRestart={restart}
      contenedorId="pantalla-escenario"
      onPantalla={(id) => {
        setReviewing(Boolean(id))
        if (id) setCurrentScreen(id)
      }}
    />
  ) : (
    <PendingDecision
      fallo={clickedEmptySpace}
      enPortal={currentScreen === 'n2'}
      enPortalReal={currentScreen.startsWith('n3')}
    />
  )

  return (
    <ScenarioLayout
      escenarioId="phishing/factura-sri"
      resumen={SUMMARY}
      contexto={CONTEXT}
      nota={NOTE}
      pantalla={screen}
      identidad={['ruc', 'clave']}
      decision={decision}
      resultado={engine.resultado}
      onEmpezar={engine.restart}
      dispositivo="escritorio"
    />
  )
}

export default SriInvoice
