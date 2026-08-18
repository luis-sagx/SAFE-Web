import { Camera, MessageSquareText, Package, Wallet } from 'lucide-react'
import StoryEscenario, { type AppTelefono, type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'

const ENLACE =
  '<a href="http://envia-express.info/pago" data-hotspot-goto="n2" data-hotspot-label="Abrió el enlace del mensaje">http://envia-express.info/pago</a>'

const PRIMER_SMS = {
  text: `ENVIAEXPRESS: su paquete 4471-EC está RETENIDO en aduana por un valor pendiente de $1,20. Regularice hoy para evitar la devolución: ${ENLACE}`,
  time: '10:12',
  senal: 'mensaje',
}

const SMS: ScreenView = {
  kind: 'sms',
  sender: '+593 98 774 2210',
  sub: 'Número no guardado · SMS',
  senalRemitente: 'remitente',
  msgs: [PRIMER_SMS],
  composerGoto: 'n1b',
  composerLabel: 'Respondió el mensaje preguntando de qué paquete se trata',
}

const SMS_RESPONDIDO: ScreenView = {
  ...SMS,
  composerGoto: undefined,
  msgs: [
    PRIMER_SMS,
    { text: '¿De qué paquete se trata?', time: '10:14', mine: true },
    {
      text: 'Estimado cliente, su envío será devuelto en 2 horas. Complete el pago en el enlace enviado.',
      time: '10:15',
      senal: 'respuesta',
    },
  ],
}

const PAGINA: ScreenView = {
  kind: 'web',
  url: 'http://envia-express.info/pago',
  secure: false,
  senalUrl: 'url',
  brand: 'EnvíaExpress',
  title: 'Pago de valor aduanero',
  subtitle: 'Guía 4471-EC · Valor pendiente: $1,20',
  fields: [
    { label: 'Número de tarjeta', placeholder: '0000 0000 0000 0000', senal: 'tarjeta' },
    { label: 'Fecha de caducidad', placeholder: 'MM/AA' },
    { label: 'Código de seguridad (CVV)', placeholder: '123', senal: 'tarjeta' },
    { label: 'Cédula del titular', placeholder: '0000000000' },
  ],
  button: 'Pagar $1,20',
  botonGoto: 'e_pago',
  botonLabel: 'Pagó el valor con los datos de su tarjeta',
  cerrarGoto: 'e_cierra',
  cerrarLabel: 'Salió de la página sin enviar los datos',
}

/// El inicio de la app, que es donde te deja abrirla. La consulta la haces tú:
/// tocar el icono no es haber comprobado nada todavía.
const APP_INICIO: ScreenView = {
  kind: 'web',
  app: 'EnvíaExpress',
  url: 'envia-express.ec',
  secure: true,
  brand: 'Mis envíos',
  title: 'Hola de nuevo',
  subtitle: 'Tienes 1 envío en curso.',
  opciones: [
    {
      texto: 'Rastrear una guía',
      detalle: 'Consulta el estado con tu número de guía',
      goto: 'e_app',
      label: 'Rastreó la guía dentro de la app del courier',
    },
    { texto: 'Puntos de retiro', detalle: 'Encuentra la agencia más cercana' },
    { texto: 'Cotizar un envío', detalle: 'Calcula el costo por peso y destino' },
    { texto: 'Mi cuenta', detalle: 'Datos, direcciones y notificaciones' },
  ],
  fields: [],
  button: '',
}

/// La app del courier, con el seguimiento de la guía. Va sin barra de
/// direcciones (`app`) a propósito: en una app no hay dominio que comprobar
/// porque no se llegó por un enlace, y esa es media lección del escenario.
const APP_COURIER: ScreenView = {
  kind: 'web',
  app: 'EnvíaExpress',
  url: 'envia-express.ec',
  secure: true,
  brand: 'Seguimiento de envíos',
  title: 'Guía 4471-EC',
  subtitle: 'Tu compra del 26 de julio.',
  datos: [
    { etiqueta: 'Estado', valor: 'En reparto' },
    { etiqueta: 'Entrega estimada', valor: 'hoy, antes de las 18:00' },
    { etiqueta: 'Valores pendientes', valor: '$0,00' },
  ],
  aviso:
    'Los envíos con valores aduaneros se notifican dentro de la app y se pagan aquí mismo. Nunca por enlaces enviados por mensaje.',
  fields: [],
  button: '',
}

/// Las cuatro se abren; solo la del courier decide. Las otras muestran su
/// estado normal y se vuelve con la flecha, para que abrir apps sea explorar
/// el teléfono y no descartar opciones de una lista.
const APPS: AppTelefono[] = [
  { Icono: MessageSquareText, texto: 'Mensajes' },
  {
    Icono: Package,
    texto: 'EnvíaExpress',
    goto: 'n3',
    label: 'Abrió la app del courier',
  },
  {
    Icono: Wallet,
    texto: 'Banco',
    vacia: 'Banca móvil · Saldo disponible $312,45. Sin notificaciones nuevas.',
  },
  {
    Icono: Camera,
    texto: 'Cámara',
    vacia: 'La cámara está lista. No hay nada que fotografiar en este momento.',
  },
]

const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: SMS },
  n1b: { kind: 'scene', view: SMS_RESPONDIDO },
  n2: { kind: 'scene', view: PAGINA },
  n3: { kind: 'scene', view: APP_INICIO },
  e_pago: {
    kind: 'bad',
    view: PAGINA,
    verdict: 'Caíste en la trampa',
    outcome:
      'El cobro de $1,20 nunca existió. Copiaron los datos completos de tu tarjeta y esa misma noche aparecieron tres consumos por internet que no hiciste.',
  },
  e_cierra: {
    kind: 'good',
    view: PAGINA,
    verdict: 'No caíste · el monto no justificaba los datos',
    outcome:
      'Saliste de la página. Un cobro de un dólar no necesita tu tarjeta completa con CVV, y la dirección ni siquiera era del courier.',
  },
  e_app: {
    kind: 'good',
    view: APP_COURIER,
    verdict: 'No caíste · verificaste en el canal oficial',
    outcome:
      'Entraste a la app del courier con tu número de guía: el envío estaba en reparto normal, sin valores pendientes. El SMS era falso.',
  },
}

const SENALES: Senal[] = [
  { id: 's1', targetId: 'remitente', pantalla: 'n1', texto: 'Llega de un <b>número de celular</b> que no tienes guardado, no del canal habitual del courier.' },
  { id: 's2', targetId: 'url', pantalla: 'n2', texto: 'El enlace lleva a <b>envia-express.info</b>, que lleva el nombre del courier adentro pero no es la dirección de su sitio. Además empieza por http y no por https, así que no muestra el candado y lo que escribas viaja sin proteger.' },
  { id: 's3', targetId: 'mensaje', pantalla: 'n1', texto: 'Un monto <b>diminuto</b> baja tu guardia: lo que buscan es la tarjeta, no el dólar.' },
  { id: 's4', targetId: 'tarjeta', pantalla: 'n2', texto: 'Pide <b>número completo, caducidad y CVV</b>: eso alcanza para comprar en tu nombre.' },
  { id: 's5', targetId: 'respuesta', pantalla: 'n1b', texto: 'Al responder, la <b>urgencia aumenta</b> en vez de darte información concreta.' },
]
const RULE =
  'Regla de oro: un aviso de paquete se comprueba <b>en la app o la web del courier con tu número de guía</b>, nunca por el enlace del mensaje. Nadie necesita tu CVV para cobrarte un dólar.'

const RESUMEN = 'Un SMS dice que tu paquete está retenido por $1,20 de aduana.'

const CONTEXTO: Contexto = {
  antes: (
    <>
      Compraste algo por internet la semana pasada y{' '}
      <strong>sí estás esperando un paquete</strong>: debería llegar en estos días.
    </>
  ),
  ahora: (
    <>
      <strong>A media mañana</strong> te llega un mensaje de texto sobre ese envío, de un número que
      no tienes guardado.
    </>
  ),
  detalle: 'Trae el logo del courier en el texto y un número de guía.',
}

function PaqueteRetenido() {
  return (
    <StoryEscenario
      escenarioId="smishing/paquete-retenido"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule={RULE}
      restartLabel="↻ Repetir el escenario"
      accionesEnPantalla
      apps={APPS}
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Actúa sobre el teléfono como lo harías con el tuyo: puedes usar{' '}
          <strong>cualquier parte de él</strong>, incluidas las apps de abajo. Antes de tocar un
          enlace, mantén el cursor encima para ver a dónde lleva.
        </p>
      }
      pista={
        <p>
          Tienes varios caminos posibles: hacer lo que el mensaje te pide, responderlo para
          preguntar, o dejarlo de lado y comprobar el envío por tu cuenta desde el teléfono. Cuál de
          ellos es el acertado es justamente lo que decides tú.
        </p>
      }
    />
  )
}

export default PaqueteRetenido
