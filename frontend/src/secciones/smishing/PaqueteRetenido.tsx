import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'

const PRIMER_SMS = {
  text: 'ENVIAEXPRESS: su paquete 4471-EC está RETENIDO en aduana por un valor pendiente de $1,20. Regularice hoy para evitar la devolución: http://envia-express.info/pago',
  time: '10:12',
  senal: 'mensaje',
}

const SMS: ScreenView = {
  kind: 'sms',
  sender: '+593 98 774 2210',
  sub: 'Número no guardado · SMS',
  msgs: [PRIMER_SMS],
}

const SMS_RESPONDIDO: ScreenView = {
  ...SMS,
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
}

const STORY: Story<ScreenNode> = {
  n1: {
    kind: 'scene',
    view: SMS,
    choices: [
      { label: 'Abrir el enlace: son solo $1,20 y espero un paquete.', goto: 'n2' },
      {
        label: 'Buscar el número de guía en la app oficial del courier.',
        goto: 'e_app',
      },
      { label: 'Responder el mensaje preguntando de qué paquete se trata.', goto: 'n1b' },
    ],
  },
  n1b: {
    kind: 'scene',
    view: SMS_RESPONDIDO,
    choices: [
      { label: 'Abrir el enlace para que no devuelvan el paquete.', goto: 'n2' },
      { label: 'Dejar el chat y revisar en la app oficial del courier.', goto: 'e_app' },
    ],
  },
  n2: {
    kind: 'scene',
    view: PAGINA,
    choices: [
      { label: 'Llenar los datos de mi tarjeta y pagar el $1,20.', goto: 'e_pago' },
      {
        label: 'Piden tarjeta completa y CVV por $1,20: cerrar la página.',
        goto: 'e_cierra',
      },
    ],
  },
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
      'Cerraste la página. Un cobro de un dólar no necesita tu tarjeta completa con CVV, y la dirección ni siquiera era del courier.',
  },
  e_app: {
    kind: 'good',
    view: SMS,
    verdict: 'No caíste · verificaste en el canal oficial',
    outcome:
      'Entraste a la app del courier con tu número de guía: el envío estaba en reparto normal, sin valores pendientes. El SMS era falso.',
  },
}

const SENALES: Senal[] = [
  { id: 's1', targetId: 'mensaje', pantalla: 'n1', texto: 'Llega de un <b>número de celular</b>, no del canal habitual del courier.' },
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
    />
  )
}

export default PaqueteRetenido
