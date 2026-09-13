import { Forward, Landmark, Newspaper, Reply, ShieldAlert, Trash2 } from 'lucide-react'
import { useState } from 'react'
import ScenarioLayout from '../../components/EscenarioLayout'
import type { Context } from '../../components/ui/ContextoEscenario'
import { createEmailFolders } from '../../components/ui/carpetasCorreo'
import {
  EmailBody,
  type EmailAction,
  type EmailFolder,
} from '../../components/ui/DesktopChrome'
import { SiteNotice, SiteHeader, FOOTER_LINKS, SiteFooter } from '../../components/ui/armazonSitio'
import styles from '../../components/ui/DeviceScreen.module.css'
import { IDENTITY_FAKE } from '../../lib/identidadFicticia'
import { createSignal } from '../../lib/crearSenal'
import Instructions from '../../components/ui/Instrucciones'
import { HotspotButton, handleHotspotClick } from '../../components/ui/interactivo'
import {
  Browser,
  type BrowserBookmark,
  type TabConfig,
} from '../../components/ui/Navegador'
import VerdictPanel, { type Signal } from '../../components/ui/PanelVeredicto'
import { formatTime } from '../../hooks/useRelojDelSistema'
import { useStoryEngine, type Story, type StoryNode } from '../../hooks/useStoryEngine'

// QR decorativo y fijo: no es escaneable de verdad, solo tiene que leerse
// como un código QR dentro del cuerpo del correo. Tocarlo es "escanearlo".
const QR_SVG = `
  <svg width="120" height="120" viewBox="0 0 29 29" style="background:#fff;border:1px solid #ddd;padding:6px;">
    <rect width="29" height="29" fill="#fff"/>
    <g fill="#111">
      <rect x="0" y="0" width="7" height="7"/><rect x="1" y="1" width="5" height="5" fill="#fff"/><rect x="2" y="2" width="3" height="3"/>
      <rect x="22" y="0" width="7" height="7"/><rect x="23" y="1" width="5" height="5" fill="#fff"/><rect x="24" y="2" width="3" height="3"/>
      <rect x="0" y="22" width="7" height="7"/><rect x="1" y="23" width="5" height="5" fill="#fff"/><rect x="2" y="24" width="3" height="3"/>
      <rect x="9" y="1" width="2" height="2"/><rect x="13" y="1" width="2" height="2"/><rect x="17" y="3" width="2" height="2"/>
      <rect x="9" y="9" width="3" height="3"/><rect x="14" y="9" width="2" height="4"/><rect x="18" y="10" width="4" height="2"/>
      <rect x="9" y="14" width="4" height="2"/><rect x="16" y="14" width="2" height="6"/><rect x="20" y="15" width="3" height="3"/>
      <rect x="9" y="18" width="2" height="4"/><rect x="13" y="19" width="3" height="2"/><rect x="9" y="24" width="6" height="2"/>
      <rect x="18" y="20" width="4" height="4"/><rect x="24" y="9" width="2" height="6"/><rect x="24" y="18" width="4" height="2"/>
      <rect x="24" y="22" width="2" height="5"/>
    </g>
  </svg>
`

const STORY: Story<StoryNode> = {
  n1: { kind: 'scene' },
  n2: { kind: 'scene' },
  n3: { kind: 'scene' },

  e_datos: {
    kind: 'bad',
    verdict: 'Caíste en la trampa',
    outcome: `Entregaste tu cédula ${IDENTITY_FAKE.cedula} y tu clave ${IDENTITY_FAKE.clave} en litoral-actualiza.web.app, un sitio que no es del banco. Con esos datos entraron a tu cuenta esa misma noche.`,
  },
  // Absorbe el antiguo final "vista previa antes de escanear": un QR no tiene
  // href, así que no existe una vista previa real — escanear ya abre la
  // página falsa, y lo que distingue el buen final es cerrarla sin enviar el
  // formulario (ver spec §4.1).
  e_app: {
    kind: 'good',
    verdict: 'No caíste · entraste por tu cuenta',
    outcome:
      'Entraste a la app del banco por tu cuenta y comprobaste el centro de seguridad. No había ninguna actualización de datos pendiente: el correo era falso.',
  },
  e_eliminar: {
    kind: 'good',
    verdict: 'No caíste · lo eliminaste',
    outcome:
      'Lo borraste sin escanear el código, que es suficiente para no caer. Marcarlo como spam habría hecho algo más: avisar al filtro para que no le llegue a otros.',
  },
  e_spam: {
    kind: 'good',
    verdict: 'No caíste · lo reportaste',
    outcome:
      'Marcarlo como spam es la mejor reacción posible: no caíste y además tu proveedor de correo aprende a filtrar ese remitente.',
  },
  e_responder: {
    kind: 'partial',
    verdict: 'No entregaste nada, pero contestaste',
    outcome:
      'No escaneaste el código, pero confirmaste que tu dirección existe y que alguien la lee. Es justo lo que un atacante busca para insistir con algo mejor preparado.',
  },
  e_reenviar: {
    kind: 'partial',
    verdict: 'No caíste tú, pero lo pasaste',
    outcome:
      'Se lo reenviaste a otra persona para que opine. Tú no caíste, pero pusiste el código QR en la bandeja de alguien que quizá lo escanee sin la misma desconfianza.',
  },
}

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

const SUBJECT = 'Actualice sus datos antes de que se limite su cuenta'
const SENDER_NAME = 'Banco del Litoral · Actualización de datos'
const ADDRESS = 'notificaciones@bancodel1itoral.com'

/// El mensaje tal como lo muestran las carpetas cuando una acción de la barra
/// lo mueve de bandeja. Lo pinta `carpetasCorreo`, compartido por todos los
/// escenarios de correo.
const MESSAGE = { nombre: SENDER_NAME, direccion: ADDRESS, asunto: SUBJECT }

const SIGNALS: Signal[] = [
  createSignal(
    's1',
    'n1',
    'qr',
    'Un <b>código QR es un enlace escondido dentro de un dibujo</b>: no hay texto que leer, así que no puedes ver a dónde te lleva hasta que ya lo abriste.',
  ),
  createSignal(
    's2',
    'n1',
    'remitente',
    'El dominio del remitente escribe <b>bancodel1itoral.com</b> con el número <b>1</b> en lugar de la letra <b>l</b>. Es una imitación de la dirección del banco: un cambio mínimo que puede pasar desapercibido.',
  ),
  createSignal(
    's3',
    'n2',
    'campo-clave',
    'El formulario pide la <b>clave de acceso</b>. Actualizar unos datos no necesita tu clave: la clave es lo que se usa para entrar a la cuenta, y es justo lo que buscan.',
  ),
  createSignal(
    's4',
    'n1',
    'plazo',
    'Mete <b>prisa</b> con un plazo de 72 horas, para que actúes antes de comprobar nada con el banco.',
  ),
]

const RULE =
  'Regla de oro: al escanear un QR, primero <b>lee la vista previa de la URL</b> y recién ahí decide. Vale igual para los QR de correos, locales, surtidores y parquímetros.'

const SUMMARY = 'Un correo del banco pide escanear un QR para "actualizar tus datos".'

const CONTEXT: Context = {
  antes: (
    <>
      Eres cliente del <strong>Banco del Litoral</strong>. <strong>Este mes</strong> el banco sí
      pidió, dentro de su app, que los clientes actualicen algunos datos.
    </>
  ),
  ahora: (
    <>
      <strong>Días después</strong> te llega un correo aparte, con un <strong>código QR</strong>{' '}
      grande.
    </>
  ),
}

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

const MINUTES_OF_AGE = 40

function getArrivalTime(): string {
  const arrival = new Date(Date.now() - MINUTES_OF_AGE * 60_000)
  return `hoy ${formatTime(arrival)}`
}

const TABS: Record<string, TabConfig> = {
  n1: { titulo: 'Correo', url: 'https://correo.safeweb.com/u/0/#recibidos', segura: true },
  n2: {
    titulo: 'Actualización de datos',
    url: 'http://litoral-actualiza.web.app/actualizar', // NOSONAR: URL insegura intencional que el participante debe detectar.
    segura: false,
    cierra: 'n1',
  },
  n3: {
    titulo: 'Centro de seguridad',
    url: 'https://bancodellitoral.com.ec/app/seguridad',
    segura: true,
    cierra: 'n1',
  },
}

const MARKERS: BrowserBookmark[] = [
  {
    Icono: Landmark,
    texto: 'Banco del Litoral',
    goto: 'n3',
    label: 'Abrió la app del banco desde sus marcadores para comprobar la solicitud',
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
        nombre: 'Banco del Litoral',
        detalle: 'Actualización de información de clientes',
        icono: 'banco',
        variante: 'financiera',
      }}
      pie={<p className="fine">Banco del Litoral · Este es un mensaje automático.</p>}
    >
      <p>Estimado(a) cliente:</p>
      <p>
        Según nuestra política de actualización de datos, necesitamos que confirme su información
        antes de{' '}
        <mark className={styles.marca} data-signal="plazo">
          72 horas
        </mark>
        . Escanee el siguiente código con la cámara de su celular para continuar:
      </p>
      <div style={{ textAlign: 'center', margin: '14px 0' }}>
        {/* El nombre accesible de un botón sale de su texto visible, y el SVG
            no tiene ninguno: sin este span el botón quedaría sin nombre para
            un lector de pantalla (y sin forma de ubicarlo por rol+nombre en
            los tests). */}
        <HotspotButton goto="n2" label="Escaneó el código QR" signalId="qr">
          <span className="sr-only">Código QR, escanear para continuar</span>
          <span dangerouslySetInnerHTML={{ __html: QR_SVG }} />
        </HotspotButton>
      </div>
    </EmailBody>
  )
}

function FakePortalContent() {
  return (
    <div className={styles.page}>
      <SiteHeader
        marca="Banco del Litoral"
        menu={['Cuentas', 'Transferencias', 'Pagos', 'Ayuda']}
      />
      <h2 className={styles.pageTitle}>Actualización de datos</h2>
      <p className={styles.pageSub}>
        Confirme su información para evitar la limitación de su cuenta.
      </p>

      <div className={styles.form}>
        <fieldset className={styles.field}>
          <legend>Cédula</legend>
          <span className={styles.input}>
            <span className="sr-only">Tu cédula, ya completada: </span>
            {' '}{IDENTITY_FAKE.cedula}
          </span>
        </fieldset>
        <fieldset className={styles.field} data-signal="campo-clave">
          <legend>Clave de acceso</legend>
          <span className={styles.input}>
            <span className="sr-only">Tu clave, ya completada: </span>
            {' '}••••••••
          </span>
        </fieldset>
        <HotspotButton
          goto="e_datos"
          label="Ingresó su cédula y su clave de acceso"
          className={styles.submit}
        >
          Confirmar datos
        </HotspotButton>
      </div>

      <SiteNotice>
        La actualización es obligatoria para mantener activa su cuenta. Sus datos viajan cifrados y
        no se comparten con terceros.
      </SiteNotice>

      <SiteFooter texto="Banco del Litoral · Entidad supervisada" enlaces={FOOTER_LINKS} />
    </div>
  )
}

function SecurityCenterContent() {
  return (
    <div className={styles.page}>
      <SiteHeader
        marca="Banco del Litoral"
        menu={['Cuentas', 'Transferencias', 'Pagos', 'Ayuda']}
      />
      <h2 className={styles.pageTitle}>Centro de seguridad</h2>
      <p className={styles.pageSub}>
        Revisa las solicitudes recientes antes de confirmar cambios en tu cuenta.
      </p>

      <div className={styles.form}>
        <fieldset className={styles.field}>
          <legend>Actualización de datos</legend>
          <span className={styles.input}>No tienes solicitudes pendientes</span>
        </fieldset>
        <HotspotButton
          goto="e_app"
          label="Comprobó en el centro de seguridad que no había una actualización pendiente"
          className={styles.submit}
        >
          Revisar alertas recientes
        </HotspotButton>
      </div>

      <SiteNotice>
        El banco nunca te pedirá confirmar una actualización desde un enlace recibido por correo.
      </SiteNotice>

      <SiteFooter texto="Banco del Litoral · Entidad supervisada" enlaces={FOOTER_LINKS} />
    </div>
  )
}

function PendingDecision({ fallo: failure, enPagina: onPage }: { fallo: boolean; enPagina: boolean }) {
  return (
    <div className="grid gap-3">
      <p className="text-lg font-semibold text-ink">¿Qué haces?</p>
      <Instructions
        fallo={failure}
        pista={
          <p>
            Tienes tres caminos posibles: escanear el código y ver a dónde lleva, dejarlo de lado y
            entrar a la app del banco por tu cuenta desde los marcadores, o usar alguno de los
            botones de la barra de arriba. Cuál de ellos es el acertado es justamente lo que decides
            tú.
          </p>
        }
      >
        <p className="text-lg leading-relaxed text-body">
          Actúa sobre la ventana como lo harías frente a tu correo de verdad: puedes usar{' '}
          <strong>cualquier parte de ella</strong>, incluida la barra de abajo.
        </p>

        {onPage && (
          <p className="rounded-md border border-hairline-strong bg-canvas-soft px-3 py-2 text-base leading-relaxed text-body">
            El formulario ya aparece con{' '}
            <strong className="text-ink">tu cédula y tu clave de acceso escritas</strong>. Es así
            para no pedirte datos reales, pero enviarlo cuenta como entregarlos.
          </p>
        )}

        {/* Detrás de un resumen: esto es mecánica, no la tarea. De corrido,
            los dos párrafos sumaban unas sesenta palabras antes de poder tocar
            nada, y para empezar solo hace falta el primero. */}
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

function QuishingUpdate() {
  const engine = useStoryEngine(STORY, 'n1', 'phishing/quishing-actualice')

  const [currentScreen, setCurrentScreen] = useState('n1')
  const [clickedEmptySpace, setClickedEmptySpace] = useState(false)
  const [received, setReceived] = useState(getArrivalTime)
  const [tabs, setTabs] = useState(['n1'])
  const [reviewing, setReviewing] = useState(false)

  function choose(goto: string, label?: string) {
    if (engine.isEnding) return
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
    setReceived(getArrivalTime())
  }

  const onHotspot = (event: React.MouseEvent) => {
    const closed = (event.target as HTMLElement).closest<HTMLElement>('[data-cierra]')?.dataset
      .cierra
    if (closed) {
      const remaining = tabs.filter((id) => id !== closed)
      setTabs(remaining)
      // Cerrar la pestaña que se está viendo devuelve el navegador a la que
      // quede abierta (el correo). Con el escenario ya terminado `elegir` sale
      // sin tocar la pantalla, así que sin esto la página cerrada seguía a la
      // vista aunque su pestaña ya no estuviera en la barra (issue #26).
      if (closed === currentScreen) setCurrentScreen(remaining.at(-1) ?? 'n1')
    }

    if (!handleHotspotClick(event, choose) && !engine.isEnding) {
      setClickedEmptySpace(true)
    }
  }

  // La pantalla que se está viendo siempre tiene su pestaña en la barra. Importa
  // en el repaso: las señales llevan a pantallas que se cerraron, o que nunca se
  // llegaron a abrir, y sin esto se explicaba la página con la pestaña del
  // correo marcada como activa.
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
            MESSAGE,
            engine.isEnding && !reviewing ? engine.current : undefined,
          )}
        />
      ) : currentScreen === 'n2' ? (
        <FakePortalContent />
      ) : (
        <SecurityCenterContent />
      )}
    </Browser>
  )

  const decision = engine.isEnding ? (
    <VerdictPanel
      estadoGuardado={engine.runStatus}
      escenarioId="phishing/quishing-actualice"
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
    <PendingDecision fallo={clickedEmptySpace} enPagina={currentScreen === 'n2'} />
  )

  return (
    <ScenarioLayout
      escenarioId="phishing/quishing-actualice"
      resumen={SUMMARY}
      contexto={CONTEXT}
      nota={NOTE}
      pantalla={screen}
      identidad={['cedula', 'clave']}
      decision={decision}
      resultado={engine.resultado}
      onEmpezar={engine.restart}
      dispositivo="escritorio"
    />
  )
}

export default QuishingUpdate
