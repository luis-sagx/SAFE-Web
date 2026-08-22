import { Camera, Images, Landmark, MessageSquareText } from 'lucide-react'
import StoryEscenario, { type AppTelefono, type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'

const HISTORIAL = [
  {
    text: 'Banco del Litoral: consumo aprobado $12,40 FARMACIA SANA 28/07 11:02, tarjeta *4417.',
    time: '28 jul',
  },
  {
    text: 'Banco del Litoral: transferencia recibida $820,00 el 30/07. Saldo disponible actualizado.',
    time: '30 jul',
  },
]

const NUEVO = {
  text: 'Banco del Litoral: consumo aprobado $42,90 SUPERMERCADO LA UNIÓN 02/08 19:14, tarjeta *4417. Si no lo reconoces, bloquéala desde la app o llama al número impreso en tu tarjeta.',
  time: '19:14',
  senal: 'aviso',
}

const CON_TARJETA = 'Bloquéenme la tarjeta: 4539 0011 8842 4417'
const QUE_LLAMEN = 'Llámenme por favor, no reconozco ese consumo.'

const SMS: Extract<ScreenView, { kind: 'sms' }> = {
  kind: 'sms',
  sender: 'BancoLitoral',
  sub: 'Remitente verificado · mismo hilo de siempre',
  msgs: [...HISTORIAL, NUEVO],
  // Las dos piden algo por un canal que no lee, y cada una falla distinto.
  // Nadie regala sus datos porque sí: los da para que le hagan algo, y ese
  // "para que" es lo que vuelve creíble el error de la primera. La segunda no
  // entrega nada y aun así deja al participante peor de lo que estaba, que es
  // lo que ningún otro escenario del módulo enseña.
  respuestas: [
    {
      texto: CON_TARJETA,
      goto: 'e_responde',
      label: 'Pidió el bloqueo por SMS con el número completo de su tarjeta',
    },
    {
      texto: QUE_LLAMEN,
      goto: 'e_pide',
      label: 'Pidió por SMS que el banco lo llamara',
    },
  ],
  // Salir del hilo es el gesto real de "lo dejo pasar": sin él, no verificar
  // no tendría forma de expresarse en la pantalla y el escenario obligaría a
  // actuar, que es justo lo contrario de lo que este caso mide.
  volverGoto: 'e_ignora',
  volverLabel: 'Salió del hilo sin verificar el consumo',
}

/// El hilo con la respuesta ya enviada. Todo final que nace de contestar se ve
/// sobre la burbuja propia: sin ella el participante no sabe qué salió de su
/// teléfono, solo que perdió.
function conRespuesta(texto: string): Extract<ScreenView, { kind: 'sms' }> {
  return {
    ...SMS,
    respuestas: undefined,
    volverGoto: undefined,
    msgs: [...HISTORIAL, NUEVO, { text: texto, time: '19:16', mine: true, senal: 'respuesta' }],
  }
}

const SMS_RESPONDIDO = conRespuesta(CON_TARJETA)
const SMS_PEDIDO = conRespuesta(QUE_LLAMEN)

/// El inicio de la banca móvil. Abrir la app no es todavía haber verificado:
/// desde aquí se puede mirar los movimientos o bloquear la tarjeta a ciegas,
/// que es el error que este escenario mide de verdad.
const APP_INICIO: ScreenView = {
  kind: 'web',
  app: 'Banco del Litoral',
  url: 'bancolitoral.ec',
  secure: true,
  brand: 'Banca móvil',
  title: 'Tarjeta *4417',
  subtitle: 'Cupo disponible $1.240,00',
  opciones: [
    { texto: 'Transferir', detalle: 'A cuentas propias o de terceros' },
    {
      texto: 'Movimientos',
      detalle: 'Consumos y débitos de los últimos 30 días',
      goto: 'e_app',
      label: 'Revisó los movimientos de la tarjeta en la app',
    },
    {
      texto: 'Bloquear tarjeta',
      detalle: 'Anula la tarjeta de forma inmediata',
      goto: 'e_bloquea',
      label: 'Bloqueó la tarjeta sin revisar antes el movimiento',
    },
    { texto: 'Pagar servicios', detalle: 'Luz, agua, teléfono e internet' },
  ],
  fields: [],
  button: '',
}

/// La app del banco con los mismos movimientos del hilo. El acierto de este
/// escenario es comprobar, y comprobar significa ver el consumo listado: el
/// veredicto lo cuenta, pero la pantalla es la que lo prueba.
const APP_BANCO: ScreenView = {
  kind: 'web',
  app: 'Banco del Litoral',
  url: 'bancolitoral.ec',
  secure: true,
  brand: 'Movimientos · Tarjeta *4417',
  title: 'Últimos consumos',
  subtitle: 'Actualizado hace un minuto.',
  datos: [
    { etiqueta: '02/08 19:14 · SUPERMERCADO LA UNIÓN', valor: '$42,90' },
    { etiqueta: '30/07 · Transferencia recibida', valor: '+$820,00' },
    { etiqueta: '28/07 11:02 · FARMACIA SANA', valor: '$12,40' },
  ],
  aviso:
    '¿No reconoces un consumo? Bloquea la tarjeta desde aquí o llama al número impreso en ella.',
  fields: [],
  button: '',
}

const APPS: AppTelefono[] = [
  { Icono: MessageSquareText, texto: 'Mensajes', color: '#2f9e44' },
  {
    Icono: Camera,
    texto: 'Cámara',
    color: '#495057',
    vacia: 'La cámara está lista. No hay nada que fotografiar en este momento.',
  },
  {
    Icono: Landmark,
    texto: 'Banco del Litoral',
    color: '#0f3d6e',
    goto: 'n2',
    label: 'Abrió la app del banco',
  },
  {
    Icono: Images,
    texto: 'Galería',
    color: '#c2410c',
    vacia: 'Tus fotos recientes · 248 elementos.',
  },
]

const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: SMS },
  n2: { kind: 'scene', view: APP_INICIO },
  e_bloquea: {
    kind: 'partial',
    view: APP_INICIO,
    verdict: 'Reaccionaste sin comprobar',
    outcome:
      'Bloqueaste la tarjeta por una compra que habías hecho tú. Te quedas sin ella hasta que el banco emita otra, y los movimientos estaban a un toque.',
    score: 50,
  },
  e_app: {
    kind: 'good',
    view: APP_BANCO,
    verdict: 'Acertaste · el aviso era legítimo',
    outcome:
      'En la app apareció el mismo consumo de $42,90: era tu compra del supermercado. El SMS venía del hilo de siempre del banco, no pedía nada y solo te avisaba.',
  },
  e_responde: {
    kind: 'bad',
    view: SMS_RESPONDIDO,
    verdict: 'Aviso legítimo, reacción peligrosa',
    outcome:
      'El aviso era real y el consumo también: fue tu compra del súper. Pero escribiste el número completo de tu tarjeta por SMS, y ese hilo no lo lee tu banco. La tarjeta no se bloqueó, y quien controle ese número o tu teléfono ya tiene tus datos.',
    score: 0,
  },
  e_pide: {
    kind: 'partial',
    view: SMS_PEDIDO,
    verdict: 'Pediste una llamada que el banco nunca hará',
    outcome:
      'No entregaste ningún dato. Pero nadie leyó ese mensaje —el número es automático— y ahora esperas una llamada del banco: si mañana te llama alguien diciendo que lo es, vas a creerle porque tú la pediste.',
    score: 50,
  },
  e_ignora: {
    kind: 'partial',
    view: SMS,
    verdict: 'Prudente, pero incompleto',
    outcome:
      'No entregaste nada, y eso está bien. Pero tampoco verificaste: si el consumo hubiera sido de otro, tenías horas para bloquear y las dejaste pasar.',
    score: 50,
  },
}

const SENALES: Senal[] = [
  { id: 's1', targetId: 'aviso', pantalla: 'n1', texto: 'Llega en el <b>mismo hilo</b> de los mensajes anteriores del banco, no de un número nuevo.' },
  { id: 's2', targetId: 'aviso', pantalla: 'n1', texto: '<b>No trae enlaces</b> ni te pide responder nada.' },
  { id: 's3', targetId: 'aviso', pantalla: 'n1', texto: 'Muestra <b>solo los últimos dígitos</b> de la tarjeta, nunca el número completo.' },
  { id: 's4', targetId: 'aviso', pantalla: 'n1', texto: 'Te manda a <b>tus canales</b>: la app o el número impreso en la tarjeta.' },
  { id: 's5', targetId: 'aviso', pantalla: 'n1', texto: 'Informa un hecho concreto y verificable, sin urgencia ni amenaza.' },
]
const RULE =
  'Regla de oro: un aviso real del banco <b>informa, no pide</b>. Verifica siempre en la app o llamando al número impreso en tu tarjeta, y nunca escribas datos de tarjeta en un SMS, aunque el mensaje sea auténtico.'

const RESUMEN = 'Llega un SMS del banco avisando un consumo de $42,90 con tu tarjeta.'

const CONTEXTO: Contexto = {
  antes: (
    <>
      Cliente del <strong>Banco del Litoral</strong>, con las <strong>alertas de consumo</strong>{' '}
      activadas: cada compra con tu tarjeta te llega por mensaje de texto.
    </>
  ),
  ahora: (
    <>
      <strong>Esta tarde</strong>, al rato de salir del supermercado, tu teléfono vibra con un
      mensaje nuevo en el hilo de siempre del banco.
    </>
  ),
}

function AlertaConsumo() {
  return (
    <StoryEscenario
      escenarioId="smishing/alerta-consumo"
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
          <strong>cualquier parte de él</strong>, incluidas las apps de abajo.
        </p>
      }
      pista={
        <p>
          Tienes varios caminos posibles: responder el mensaje, salir del hilo y seguir con tu día,
          o comprobar el consumo por tu cuenta desde el teléfono. Cuál de ellos es el acertado es
          justamente lo que decides tú.
        </p>
      }
    />
  )
}

export default AlertaConsumo
