import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'

const SMS: ScreenView = {
  kind: 'sms',
  sender: 'TRANSITO-EC',
  sub: 'Remitente sin verificar · SMS',
  msgs: [
    {
      text: 'TRANSITO EC: tiene una citación pendiente. Cancele antes del viernes o el valor se duplica. Consulte y pague aquí: https://transito-ec-pagos.com/citacion',
      time: '08:27',
    },
  ],
}

const SMS_RESPONDIDO: ScreenView = {
  ...SMS,
  msgs: [
    ...SMS.msgs,
    { text: '¿Cuál es la placa?', time: '08:31', mine: true },
    {
      text: 'Para consultar debe ingresar placa y cédula en el enlace. Último plazo viernes 17h00.',
      time: '08:32',
    },
  ],
}

const PAGINA: ScreenView = {
  kind: 'web',
  url: 'https://transito-ec-pagos.com/citacion',
  secure: true,
  brand: 'Tránsito EC',
  title: 'Consulta y pago de citaciones',
  subtitle: 'Ingrese sus datos para verificar valores pendientes.',
  fields: [
    { label: 'Placa del vehículo', placeholder: 'ABC-1234' },
    { label: 'Cédula del propietario', placeholder: '0000000000' },
    { label: 'Número de tarjeta', placeholder: '0000 0000 0000 0000' },
    { label: 'Fecha de caducidad', placeholder: 'MM/AA' },
    { label: 'Código de seguridad (CVV)', placeholder: '123' },
  ],
  button: 'Pagar citación',
}

const STORY: Story<ScreenNode> = {
  n1: {
    kind: 'scene',
    view: SMS,
    choices: [
      { label: 'Abrir el enlace para pagar antes de que suba el valor.', goto: 'n2' },
      { label: 'Responder preguntando qué placa tiene la multa.', goto: 'n1b' },
      { label: 'Consultar mis multas en el portal oficial escrito por mí.', goto: 'e_portal' },
    ],
  },
  n1b: {
    kind: 'scene',
    view: SMS_RESPONDIDO,
    choices: [
      { label: 'Ingresar la placa en el enlace que enviaron.', goto: 'n2' },
      { label: 'Salir del mensaje y consultar por mi cuenta.', goto: 'e_portal' },
    ],
  },
  n2: {
    kind: 'scene',
    view: PAGINA,
    choices: [
      { label: 'Llenar placa, cédula y tarjeta para cancelar.', goto: 'e_pago' },
      {
        label: 'Detenerme: si la citación fuera real, ya sabrían mi placa.',
        goto: 'e_cierra',
      },
    ],
  },
  e_pago: {
    kind: 'bad',
    view: PAGINA,
    verdict: 'Caíste en la trampa',
    outcome:
      'La citación no existía. Al escribir la tarjeta completa, entregaste los datos necesarios para compras por internet.',
  },
  e_cierra: {
    kind: 'good',
    view: PAGINA,
    verdict: 'No caíste · el formulario pedía lo que debía saber',
    outcome:
      'Cerraste la página antes de enviar datos. Una institución que registra una multa no necesita pescar tu placa por un enlace.',
  },
  e_portal: {
    kind: 'good',
    view: SMS,
    verdict: 'No caíste · verificaste por tu canal',
    outcome:
      'Al consultar en el portal oficial no apareció ninguna citación pendiente. El SMS usaba el miedo al recargo para llevarte a una página falsa.',
  },
}

const SENALES: Senal[] = [
  { id: 's1', texto: 'El mensaje <b>no trae tu placa</b>; te pide escribirla porque no la sabe.' },
  { id: 's2', texto: 'El plazo "antes del viernes" crea presión, pero no explica artículo, fecha ni lugar de la supuesta infracción.' },
  { id: 's3', texto: 'El dominio <b>transito-ec-pagos.com</b> suena oficial, pero no es un portal público ecuatoriano.' },
  { id: 's4', texto: 'La página pide <b>tarjeta completa y CVV</b> antes de demostrar que la deuda existe.' },
  { id: 's5', texto: 'Al responder, no dan datos concretos: solo empujan de nuevo al mismo enlace.' },
]

const RULE =
  'Regla de oro: una multa se consulta entrando tú al portal oficial o en ventanilla. Si el mensaje te pide los datos que la entidad debería conocer, está pescando.'

const RESUMEN = 'Un SMS avisa una citación de tránsito y amenaza con duplicar el valor.'

const CONTEXTO: Contexto = {
  antes: (
    <>
      Tienes carro y ya te ha pasado pagar multas tarde, así que una citación nueva no te
      parece imposible.
    </>
  ),
  ahora: (
    <>
      <strong>Antes de salir al trabajo</strong> recibes un SMS de Tránsito EC con un plazo
      cercano para pagar.
    </>
  ),
  detalle: 'El mensaje llega con tono institucional, pero no incluye placa ni lugar de la infracción.',
}

function CitacionTransito() {
  return (
    <StoryEscenario
      escenarioId="smishing/citacion-transito"
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

export default CitacionTransito
