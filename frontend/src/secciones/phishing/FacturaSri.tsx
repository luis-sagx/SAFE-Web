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
import EscenarioLayout from '../../components/EscenarioLayout'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import Instrucciones from '../../components/ui/Instrucciones'
import {
  CuerpoCorreo,
  type AccionCorreo,
  type CarpetaCorreo,
} from '../../components/ui/DesktopChrome'
import { carpetasCorreo } from '../../components/ui/carpetasCorreo'
import styles from '../../components/ui/DeviceScreen.module.css'
import {
  BotonHotspot,
  EnlaceHotspot,
  evitarNavegacion,
  manejarClicHotspot,
} from '../../components/ui/interactivo'
import {
  Navegador,
  type MarcadorNavegador,
  type PestanaConfig,
} from '../../components/ui/Navegador'
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
 * Por eso no usa StoryEscenario/DeviceScreen/StoryChoices:
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
  // El portal legítimo. Un solo nodo, aunque el final dependa de por dónde se
  // llegó: con dos nodos, el marcador abría una segunda pestaña del mismo sitio
  // en vez de ir a la que ya estaba abierta. Cuál de los dos finales acredita
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
    outcome:
      'Entregaste tu RUC y tu clave del portal en un sitio que no es del SRI. Con esos datos pueden emitir comprobantes a tu nombre y ver tu información tributaria.',
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

const ASUNTO = 'Factura electrónica pendiente de validación'
const REMITENTE_NOMBRE = 'SRI · Facturación Electrónica'
const DIRECCION = 'notificaciones@sri-facturacion-ec.com'

/// A dónde va el correo según qué botón de la barra terminó el escenario, y
/// si eso lo saca de Recibidos.
/// Cada señal apunta, cuando puede, al elemento real marcado con
/// data-signal en una de las dos pantallas. Si esa pantalla no es la que
/// llevó a este final, el recorrido igual muestra el texto, sin resaltar.
const SENALES: Senal[] = [
  {
    id: 'dominio',
    pantalla: 'n1',
    targetId: 'remitente',
    texto:
      'El remitente usa un <b>dominio parecido</b> pero ajeno: <b>sri-facturacion-ec.com</b>, no sri.gob.ec.',
  },
  {
    id: 'dominio-real',
    pantalla: 'n3',
    targetId: 'url-real',
    texto:
      'Así se ve el portal de verdad: <b>sri.gob.ec</b> y con conexión segura. Compáralo con la dirección a la que llevaba el correo.',
  },
  {
    id: 'externo',
    pantalla: 'n1',
    targetId: 'externo',
    texto:
      'El propio cliente de correo lo marcó como <b>externo</b>: no vino de dentro de la organización, aunque diga ser de una institución.',
  },
  {
    id: 'plazo',
    pantalla: 'n1',
    targetId: 'plazo',
    texto: 'Impone un <b>plazo de 24 horas</b> y amenaza con una multa.',
  },
  {
    id: 'conexion',
    pantalla: 'n2',
    targetId: 'url-insegura',
    texto: 'El enlace lleva a una página <b>sin conexión segura</b> (http).',
  },
  {
    id: 'adjunto',
    pantalla: 'n1',
    targetId: 'adjunto',
    texto:
      'El adjunto no es un documento sino un <b>programa</b>: un <b>.vbs</b> se ejecuta al abrirlo. La doble extensión <b>.pdf.vbs</b> lo disfraza, porque Windows oculta la última.',
  },
  {
    id: 'clave',
    pantalla: 'n2',
    targetId: 'campo-clave',
    texto: 'Pide tu <b>clave</b> del portal para "validar" algo.',
  },
]

const RULE =
  'Regla de oro: ninguna entidad pública te pide tu clave por correo. Si un mensaje dice que tienes algo pendiente, <b>entra al portal oficial escribiendo tú la dirección</b>, nunca por el enlace del correo.'

const RESUMEN = 'Un correo dice que tienes una factura electrónica pendiente de validar.'

const CONTEXTO: Contexto = {
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
  detalle: 'Nunca antes te habían escrito por este tema.',
}

/// Solo mecánica, y solo antes de entrar: dentro del escenario el bloque de
/// decisión ya la explica, y repetirla ahí robaría espacio a la historia.
const NOTA = (
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

/// Lo que muestra la barra de direcciones y la pestaña de cada pantalla. La
/// dirección es la señal principal del escenario, así que vive junto al nodo y
/// no dentro de cada componente.
const PESTANAS: Record<string, PestanaConfig> = {
  n1: { titulo: 'Correo', url: 'https://correo.safeweb.com/u/0/#recibidos', segura: true },
  n2: {
    titulo: 'Validación de comprobante',
    url: 'http://sri-facturacion-ec.com/validar-ruc',
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

const MARCADORES: MarcadorNavegador[] = [
  { Icono: Landmark, texto: 'Banco del Litoral' },
  {
    Icono: Building2,
    texto: 'SRI en Línea',
    goto: 'n3',
    label: 'Abrió el portal del SRI desde sus marcadores',
  },
  { Icono: Newspaper, texto: 'El Comercio' },
]

function ContenidoCorreo({ recibido, carpetas }: { recibido: string; carpetas: CarpetaCorreo[] }) {
  return (
    <CuerpoCorreo
      acciones={ACCIONES}
      carpetas={carpetas}
      asunto={ASUNTO}
      remitente={{
        nombre: REMITENTE_NOMBRE,
        direccion: DIRECCION,
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
          {/* Icono genérico y no uno de código o de advertencia: los de
              advertencia delatarían la trampa, y este escenario mide si la
              persona lee la extensión. Un cliente real tampoco distingue: a un
              tipo que no sabe previsualizar le pone el icono de siempre. */}
          <span className={styles.attachmentTipo} aria-hidden>
            <File className={styles.attachmentIcono} strokeWidth={1.75} />
          </span>
          <span className={styles.attachmentNombre}>
            Factura_004521.pdf.vbs
            {/* 12 KB y no los 34 de antes: un script de estas campañas pesa
                unos pocos kilobytes, mientras que una factura en PDF pesa
                bastante más. El tamaño es una señal más, aunque no se explique. */}
            <span className={styles.attachmentPeso}>12 KB</span>
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
    </CuerpoCorreo>
  )
}

function ContenidoPortalFalso() {
  return (
    <>
      <div className={styles.page}>
        <p className={styles.brand}>Servicio de Rentas</p>
        <h2 className={styles.pageTitle}>Validación de comprobante</h2>
        <p className={styles.pageSub}>
          Ingresa tus datos del portal para liberar la factura pendiente.
        </p>

        <div className={styles.form}>
          <label className={styles.field}>
            <span>RUC o cédula</span>
            {/* No editable a propósito, y con un valor que no es el de nadie:
                el participante juzga la pantalla, nunca escribe credenciales
                reales en ella. */}
            <span className={styles.input}>
              <span className="sr-only">Tu RUC, ya completado: </span>
              0000000000001
            </span>
          </label>
          <label className={styles.field} data-signal="campo-clave">
            <span>Clave del portal SRI</span>
            <span className={styles.input}>
              <span className="sr-only">Tu clave, ya completada: </span>
              ••••••••
            </span>
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
    </>
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
function DecisionEnCurso({
  fallo,
  enPortal,
  enPortalReal,
}: {
  fallo: boolean
  enPortal: boolean
  enPortalReal: boolean
}) {
  return (
    <div className="grid gap-3">
      <p className="text-lg font-semibold text-ink">¿Qué haces?</p>
      <Instrucciones
        fallo={fallo}
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
        {enPortalReal && (
          <p className="rounded-md border border-hairline-strong bg-canvas-soft px-3 py-2 text-base leading-relaxed text-body">
            Este es el portal del SRI de verdad, abierto por ti.{' '}
            <strong className="text-ink">No hay ninguna factura pendiente</strong>, así que el
            correo mentía. Cierra la pestaña cuando termines de comprobarlo.
          </p>
        )}

        {/* Va aquí y no dentro de la página: el marco de los escenarios separa lo
          que la app real mostraría de lo que explica el ejercicio, y una página
          de phishing jamás avisaría de qué son sus campos. */}
        {enPortal && (
          <p className="rounded-md border border-hairline-strong bg-canvas-soft px-3 py-2 text-base leading-relaxed text-body">
            El formulario ya aparece con{' '}
            <strong className="text-ink">tu RUC y tu clave escritos</strong>. Es así para no pedirte
            datos verdaderos (ese RUC no es el de nadie), pero enviarlo cuenta como entregarlos.
          </p>
        )}

        <p className="text-base leading-relaxed text-body">
          El escenario termina cuando decidas qué hacer con el mensaje, o si caes en lo que pide. No
          hay confirmación, igual que en la vida real. Moverte entre pantallas, volver atrás o
          cerrar una pestaña no decide nada.
        </p>
      </Instrucciones>
    </div>
  )
}

/**
 * El portal verdadero del SRI.
 *
 * Existe para que el camino acertado se *vea* y no solo se cuente. Aquí está el
 * hecho que desmiente al correo —no hay ningún comprobante pendiente ni ninguna
 * multa— y el contraste con la página falsa: dominio sri.gob.ec, conexión
 * segura y una sesión ya iniciada, sin ningún formulario pidiendo la clave.
 *
 * Cerrar su pestaña es lo que acredita, y el final depende de si la página
 * falsa llegó a abrirse: entrar por cuenta propia sin tocarla, o haberla
 * dejado sin escribir nada (ver `cierrePortal`).
 */
function ContenidoPortalReal() {
  return (
    <>
      <div className={styles.page}>
        <p className={styles.brand}>SRI · Servicio de Rentas Internas</p>
        <h2 className={styles.pageTitle}>Comprobantes electrónicos</h2>
        <p className={styles.portalSesion}>
          Sesión iniciada · RUC 0000000000001 · último ingreso hoy
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

        <p className={styles.pageFooter}>srienlinea.sri.gob.ec · Servicio de Rentas Internas</p>
      </div>
    </>
  )
}

function FacturaSri() {
  const engine = useStoryEngine(STORY, 'n1', 'phishing/factura-sri')

  // El nodo final (p. ej. "e_adjunto") no es una pantalla: es la consecuencia
  // de una. Se recuerda cuál era la pantalla activa para que el recorrido de
  // señales tenga sobre qué resaltar.
  // Guarda el id del nodo, no una lista cerrada de dos valores: con el portal
  // real ya son cuatro pantallas y la lista habría que ampliarla cada vez.
  const [pantallaActual, setPantallaActual] = useState('n1')
  /// Se enciende con el primer clic que no cae en ningún punto interactivo y
  /// ya no se apaga: quien exploró a ciegas una vez agradece tener la pista a
  /// la vista el resto del escenario.
  const [tocoEnVacio, setTocoEnVacio] = useState(false)
  /// Se calcula una vez al montar y no en cada render: si no, el correo se
  /// "rejuvenecería" solo cada quince segundos, al ritmo del reloj de la barra.
  const [recibido, setRecibido] = useState(horaDeLlegada)
  /// Las pestañas abiertas, en su orden. Se abren al navegar, como en un
  /// navegador de verdad: al principio solo está el correo.
  const [pestanas, setPestanas] = useState(['n1'])
  /// Cierto mientras el repaso va señal por señal. Durante el repaso el mensaje
  /// vuelve a Recibidos: las acciones que lo mueven a Spam o a la Papelera
  /// dejaban la bandeja vacía, y el recorrido acababa explicando señales sobre
  /// una pantalla donde ya no había nada que señalar.
  const [repasando, setRepasando] = useState(false)

  function elegir(goto: string, label?: string) {
    if (engine.isEnding) {
      return
    }
    engine.choose(goto, label)
    // Toda escena es una pantalla; los finales no lo son, y por eso se conserva
    // la última para que el repaso de señales tenga sobre qué resaltar.
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
    // Al repetir, el correo vuelve a acabar de llegar. Conservar la hora del
    // intento anterior dejaría un mensaje de hace media hora en una bandeja
    // cuyo reloj ya avanzó.
    setRecibido(horaDeLlegada())
  }

  const onHotspot = (event: React.MouseEvent) => {
    evitarNavegacion(event)

    // Cerrar una pestaña la quita de la barra además de llevar a donde diga su
    // `goto`: para el correo, de vuelta a él; para el portal real, al final.
    const cerrada = (event.target as HTMLElement).closest<HTMLElement>('[data-cierra]')?.dataset
      .cierra
    if (cerrada) {
      const quedan = pestanas.filter((id) => id !== cerrada)
      setPestanas(quedan)
      // Cerrar la pestaña que se está viendo devuelve el navegador a la que
      // quede abierta (el correo). Con el escenario ya terminado `elegir` sale
      // sin tocar la pantalla, así que sin esto la página cerrada seguía a la
      // vista aunque su pestaña ya no estuviera en la barra (issue #26).
      if (cerrada === pantallaActual) setPantallaActual(quedan.at(-1) ?? 'n1')
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
          carpetas={carpetasCorreo(
            { nombre: REMITENTE_NOMBRE, direccion: DIRECCION, asunto: ASUNTO },
            engine.isEnding && !repasando ? engine.current : undefined,
          )}
        />
      ) : pantallaActual === 'n2' ? (
        <ContenidoPortalFalso />
      ) : (
        <ContenidoPortalReal />
      )}
    </Navegador>
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
      onPantalla={(id) => {
        setRepasando(Boolean(id))
        if (id) setPantallaActual(id)
      }}
    />
  ) : (
    <DecisionEnCurso
      fallo={tocoEnVacio}
      enPortal={pantallaActual === 'n2'}
      enPortalReal={pantallaActual.startsWith('n3')}
    />
  )

  return (
    <EscenarioLayout
      escenarioId="phishing/factura-sri"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      nota={NOTA}
      pantalla={pantalla}
      decision={decision}
      resultado={engine.resultado}
      onEmpezar={engine.restart}
      dispositivo="escritorio"
    />
  )
}

export default FacturaSri
