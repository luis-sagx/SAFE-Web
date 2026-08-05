import { Archive, Forward, Reply, ShieldAlert, Trash2 } from 'lucide-react'
import { useState } from 'react'
import EscenarioLayout from '../../components/EscenarioLayout'
import {
  VentanaCorreo,
  VentanaEscritorio,
  type AccionCorreo,
} from '../../components/ui/DesktopChrome'
import styles from '../../components/ui/DeviceScreen.module.css'
import { BotonHotspot, EnlaceHotspot, manejarClicHotspot } from '../../components/ui/interactivo'
import PanelVeredicto, { type Senal } from '../../components/ui/PanelVeredicto'
import { formatoHora } from '../../hooks/useRelojDelSistema'
import { useStoryEngine, type Story, type StoryNode } from '../../hooks/useStoryEngine'

/**
 * Primer escenario interactivo del proyecto: en vez de elegir de una lista de
 * acciones descritas, el participante actúa directamente sobre el correo y la
 * página falsa —el enlace, el adjunto, el formulario, un atajo al portal
 * real— igual que lo haría frente a su bandeja de verdad. Ver
 * docs/superpowers/specs/2026-08-04-escenario-interactivo-factura-sri-design.md.
 *
 * Por eso no usa StoryEscenario/DeviceScreen/StoryChoices/StoryResultPanel:
 * esos siguen sirviendo tal cual a los escenarios que todavía eligen de una
 * lista (ClaveCaducada, RolDePagos). Este es la plantilla para cuando se
 * repliquen.
 */

/// El grafo no necesita `choices`: cada punto interactivo lleva su propio
/// `goto`/`label` en la pantalla, no en una lista aparte que haya que
/// mantener sincronizada.
const STORY: Story<StoryNode> = {
  n1: { kind: 'scene' },
  n2: { kind: 'scene' },
  e_adjunto: {
    kind: 'bad',
    verdict: 'Caíste en la trampa',
    outcome:
      'El adjunto no era una factura: era una página falsa que se abrió en tu navegador y copió tu clave del SRI en cuanto la escribiste.',
  },
  e_datos: {
    kind: 'bad',
    verdict: 'Caíste en la trampa',
    outcome:
      'Entregaste tu RUC y tu clave del portal en un sitio que no es del SRI. Con esos datos pueden emitir comprobantes a tu nombre y ver tu información tributaria.',
  },
  e_dominio: {
    kind: 'good',
    verdict: 'No caíste · revisaste la dirección',
    outcome:
      'La dirección era sri-facturacion-ec.com y ni siquiera usaba conexión segura. El portal real del SRI está en sri.gob.ec. Cerraste la página sin escribir nada.',
  },
  e_portal: {
    kind: 'good',
    verdict: 'No caíste · entraste por tu cuenta',
    outcome:
      'Entraste al portal del SRI escribiendo tú la dirección. No había ninguna factura pendiente ni multa: el correo era falso.',
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
  e_archivar: {
    kind: 'partial',
    verdict: 'No caíste, pero lo dejaste ahí',
    outcome:
      'Archivarlo te sacó el correo de la vista sin resolver nada. Sigue en tu buzón, nadie más se enteró, y si mañana le llega a un compañero va a llegar igual de intacto.',
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

/// Todas llevan a un final: en la barra de un cliente de correo no puede haber
/// botones de adorno. Ver MailToolbar.
const ACCIONES: AccionCorreo[] = [
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
    Icono: Archive,
    etiqueta: 'Archivar',
    titulo: 'Archivar',
    goto: 'e_archivar',
    label: 'Archivó el correo',
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

/// Cada señal apunta, cuando puede, al elemento real marcado con
/// data-signal en una de las dos pantallas. Si esa pantalla no es la que
/// llevó a este final, el recorrido igual muestra el texto, sin resaltar.
const SENALES: Senal[] = [
  {
    id: 'dominio',
    targetId: 'remitente',
    texto:
      'El remitente usa un <b>dominio parecido</b> pero ajeno: <b>sri-facturacion-ec.com</b>, no sri.gob.ec.',
  },
  {
    id: 'externo',
    targetId: 'externo',
    texto:
      'El propio cliente de correo lo marcó como <b>externo</b>: no vino de dentro de la organización, aunque diga ser de una institución.',
  },
  {
    id: 'plazo',
    targetId: 'plazo',
    texto: 'Impone un <b>plazo de 24 horas</b> y amenaza con una multa.',
  },
  {
    id: 'conexion',
    targetId: 'url-insegura',
    texto: 'El enlace lleva a una página <b>sin conexión segura</b> (http).',
  },
  {
    id: 'adjunto',
    targetId: 'adjunto',
    texto: 'Trae un <b>adjunto .html</b>: una factura real nunca llega así.',
  },
  {
    id: 'clave',
    targetId: 'campo-clave',
    texto: 'Pide tu <b>clave</b> del portal para "validar" algo.',
  },
]

const RULE =
  'Regla de oro: ninguna entidad pública te pide tu clave por correo. Si un mensaje dice que tienes algo pendiente, <b>entra al portal oficial escribiendo tú la dirección</b>, nunca por el enlace del correo.'

const RESUMEN = 'Un correo dice que tienes una factura electrónica pendiente de validar.'

const CONTEXTO = (
  <>
    <p>
      Abres tu correo y ves un mensaje del <strong>Servicio de Rentas Internas</strong> que llegó
      hace unos minutos, sobre una factura pendiente.
    </p>
    <p>
      Emites facturas de vez en cuando, así que un aviso del SRI no te sorprende. Nunca antes te
      habían escrito por este tema.
    </p>
  </>
)

/// Solo mecánica, y solo antes de entrar: dentro del escenario el bloque de
/// decisión ya la explica, y repetirla ahí robaría espacio a la historia.
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

const ATAJO_PORTAL = {
  texto: '🏦 Portal SRI',
  goto: 'e_portal',
  label: 'Cerró el correo y entró al portal del SRI escribiendo la dirección',
}

/// Cinco minutos antes de abrir el escenario. La hora del correo se calcula a
/// partir del ahora porque la barra de tareas muestra la hora real y avanza:
/// con una hora fija el mensaje quedaría fechado en un momento que el reloj de
/// la propia ventana desmiente. "Hace unos minutos" es además lo que dice el
/// contexto, y lo que hace verosímil que todavía no lo hubieras visto.
const MINUTOS_DE_ANTIGUEDAD = 5

function horaDeLlegada(): string {
  const llegada = new Date(Date.now() - MINUTOS_DE_ANTIGUEDAD * 60_000)
  return `hoy ${formatoHora(llegada)}`
}

interface PantallaProps {
  onHotspot: (event: React.MouseEvent) => void
}

function PantallaCorreo({ onHotspot, recibido }: PantallaProps & { recibido: string }) {
  return (
    <VentanaCorreo
      onClick={onHotspot}
      atajo={ATAJO_PORTAL}
      reloj="vivo"
      acciones={ACCIONES}
      asunto="Factura electrónica pendiente de validación"
      remitente={{
        nombre: 'SRI · Facturación Electrónica',
        direccion: 'notificaciones@sri-facturacion-ec.com',
        etiqueta: 'Externo',
        senalDireccion: 'remitente',
        senalEtiqueta: 'externo',
      }}
      recibido={recibido}
      adjunto={
        <BotonHotspot
          goto="e_adjunto"
          label="Descargó el archivo adjunto"
          signalId="adjunto"
          className={styles.attachment}
        >
          <span className={styles.attachmentTipo} aria-hidden>
            HTML
          </span>
          <span className={styles.attachmentNombre}>
            Factura_004521.html
            <span className={styles.attachmentPeso}>34 KB</span>
          </span>
        </BotonHotspot>
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
      <p>Estimado contribuyente:</p>
      <p>
        Nuestro sistema detectó una <b>factura electrónica no validada</b> asociada a su RUC. Si no
        completa la validación en las próximas{' '}
        <mark className={styles.marca} data-signal="plazo">
          24 horas
        </mark>
        , su comprobante será anulado y se aplicará una multa administrativa.
      </p>
      <p>
        <EnlaceHotspot
          goto="n2"
          label="Abrió el enlace para validar la factura"
          href="http://sri-facturacion-ec.com/validar-ruc"
          className="cta"
        >
          Validar mi factura ahora
        </EnlaceHotspot>
      </p>
      <p className="fine">Este mensaje es automático, por favor no responda.</p>
    </VentanaCorreo>
  )
}

function PantallaPortal({ onHotspot }: PantallaProps) {
  return (
    <VentanaEscritorio
      titulo="Validación de comprobante"
      ariaLabel="Página web simulada"
      onClick={onHotspot}
      reloj="vivo"
      atajo={{
        ...ATAJO_PORTAL,
        goto: 'e_dominio',
        label: 'Salió sin ingresar datos y entró al portal por su cuenta',
      }}
    >
      {/* Pestaña de navegador: en el celular no hay pestañas visibles. */}
      <div className={styles.tabstrip} aria-hidden>
        <span className={styles.tab}>Validación de comprobante</span>
      </div>

      <div className={styles.urlbar} data-signal="url-insegura">
        <span className={styles.warn}>⚠ No seguro</span>
        <span className={styles.url}>http://sri-facturacion-ec.com/validar-ruc</span>
      </div>

      <div className={styles.page}>
        <p className={styles.brand}>Servicio de Rentas</p>
        <h2 className={styles.pageTitle}>Validación de comprobante</h2>
        <p className={styles.pageSub}>
          Ingresa tus datos del portal para liberar la factura pendiente.
        </p>

        <div className={styles.form}>
          <label className={styles.field}>
            <span>RUC o cédula</span>
            {/* No editable a propósito: el participante juzga la pantalla,
                nunca escribe credenciales reales en ella. */}
            <span className={styles.input}>0000000000001</span>
          </label>
          <label className={styles.field} data-signal="campo-clave">
            <span>Clave del portal SRI</span>
            <span className={styles.input}>••••••••</span>
          </label>
          <BotonHotspot
            goto="e_datos"
            label="Ingresó su RUC y su clave para liberar la factura"
            className={styles.submit}
          >
            Validar factura
          </BotonHotspot>
        </div>

        <p className={styles.pageFooter}>Portal de validación · sri-facturacion-ec.com</p>
      </div>
    </VentanaEscritorio>
  )
}

/**
 * Instrucción del escenario. Tiene que responder tres preguntas que la versión
 * anterior dejaba abiertas, y por eso el participante se quedaba mirando la
 * pantalla sin saber qué hacer:
 *
 *   1. ¿Qué se espera de mí? — decidir y actuar, no "resolver un acertijo".
 *   2. ¿Con qué puedo interactuar? — con la ventana entera, correo y barra de
 *      tareas incluidas, no solo con el cuerpo del mensaje.
 *   3. ¿Qué pasa cuando toco algo? — la corrida termina ahí mismo, sin
 *      confirmación (spec §2.1). Avisarlo evita terminar sin querer.
 *
 * Lo que NO dice: cuáles son los puntos accionables. Señalarlos convertiría el
 * escenario en una lista de opciones y borraría lo que mide — si la persona
 * reconoce sola el anzuelo. Para quien de verdad se atasca está la pista
 * desplegable, que es opt-in.
 */
function DecisionEnCurso({ fallo }: { fallo: boolean }) {
  return (
    <div className="grid gap-3">
      <p className="text-base font-semibold text-ink">¿Qué haces?</p>
      <p className="text-base leading-relaxed text-body">
        Actúa sobre la ventana como lo harías frente a tu correo de verdad: puedes usar{' '}
        <strong>cualquier parte de ella</strong>, incluida la barra de abajo. Antes de tocar un
        enlace, mantén el cursor encima para ver a dónde lleva.
      </p>
      <p className="text-sm leading-relaxed text-body">
        Lo primero que hagas cierra el escenario y te muestra en qué terminaba. No hay confirmación,
        igual que en la vida real.
      </p>

      {/* Solo aparece si ya intentó tocar algo que no responde: es exactamente
          la persona que está atascada, y la pista le llega sin habérsela
          ofrecido antes a quien no la necesita. */}
      {fallo && (
        <p role="status" className="rounded-md bg-surface-strong px-3 py-2 text-sm text-body">
          Ahí no hay nada que hacer. Solo algunos elementos responden: recórrelos con el cursor (o
          con la tecla Tab) y se marcarán al pasar.
        </p>
      )}

      <details className="group rounded-md border border-hairline-strong bg-surface px-3 py-2">
        <summary className="cursor-pointer list-none text-sm font-medium text-link underline decoration-dotted underline-offset-4">
          No sé por dónde empezar
        </summary>
        <p className="mt-2 text-sm leading-relaxed text-body">
          Tienes tres caminos posibles: hacer lo que el correo te pide, abrir lo que trae adjunto, o
          dejar el correo de lado y entrar al portal por tu cuenta desde la barra de tareas. Cuál de
          los tres es el acertado es justamente lo que decides tú.
        </p>
      </details>
    </div>
  )
}

function FacturaSri() {
  const engine = useStoryEngine(STORY, 'n1', 'phishing/factura-sri')

  // El nodo final (p. ej. "e_adjunto") no es una pantalla: es la consecuencia
  // de una. Se recuerda cuál era la pantalla activa para que el recorrido de
  // señales tenga sobre qué resaltar.
  const [pantallaActual, setPantallaActual] = useState<'n1' | 'n2'>('n1')
  /// Se enciende con el primer clic que no cae en ningún punto interactivo y
  /// ya no se apaga: quien exploró a ciegas una vez agradece tener la pista a
  /// la vista el resto del escenario.
  const [tocoEnVacio, setTocoEnVacio] = useState(false)
  /// Se calcula una vez al montar y no en cada render: si no, el correo se
  /// "rejuvenecería" solo cada quince segundos, al ritmo del reloj de la barra.
  const [recibido, setRecibido] = useState(horaDeLlegada)

  function elegir(goto: string, label?: string) {
    if (engine.isEnding) {
      return
    }
    engine.choose(goto, label)
    if (goto === 'n2') {
      setPantallaActual('n2')
    }
  }

  function reiniciar() {
    engine.restart()
    setPantallaActual('n1')
    setTocoEnVacio(false)
    // Al repetir, el correo vuelve a acabar de llegar. Conservar la hora del
    // intento anterior dejaría un mensaje de hace media hora en una bandeja
    // cuyo reloj ya avanzó.
    setRecibido(horaDeLlegada())
  }

  const onHotspot = (event: React.MouseEvent) => {
    if (!manejarClicHotspot(event, elegir) && !engine.isEnding) {
      setTocoEnVacio(true)
    }
  }

  const pantalla =
    pantallaActual === 'n1' ? (
      <PantallaCorreo onHotspot={onHotspot} recibido={recibido} />
    ) : (
      <PantallaPortal onHotspot={onHotspot} />
    )

  const decision = engine.isEnding ? (
    <PanelVeredicto
      escenarioId="phishing/factura-sri"
      node={engine.node}
      senales={SENALES}
      regla={RULE}
      restartLabel="↻ Repetir el escenario"
      onRestart={reiniciar}
      contenedorId="pantalla-escenario"
    />
  ) : (
    <DecisionEnCurso fallo={tocoEnVacio} />
  )

  return (
    <EscenarioLayout
      escenarioId="phishing/factura-sri"
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

export default FacturaSri
