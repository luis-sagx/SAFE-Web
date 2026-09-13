import { Camera, Compass, Phone, Wallet } from 'lucide-react'
import ScenarioStory, { type PhoneApp, type ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Signal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { ACCOUNT_FAKE } from '../../lib/identidadFicticia'

// Puerta de entrada del módulo. Igual que loteria-premiada, pero aquí colgar
// cuesta más que cerrar una pestaña porque hay una voz esperando del otro lado.

const WHO = 'Almacenes La Ganga'
const NUMBER = '+593 98 342 1177'
const ACCOUNT_SCAM = '22-0074-1188 · Coop. de ahorro, cuenta personal'

const INCOMING: ScreenView = {
  kind: 'call',
  entrante: true,
  quien: WHO,
  numero: NUMBER,
  etiqueta: 'No está en tus contactos',
  senalQuien: 'quien',
  contestarGoto: 'n2',
  contestarLabel: 'Contestó la llamada',
  rechazarGoto: 'e_rechaza',
  rechazarLabel: 'Rechazó la llamada sin contestar',
}

const AD = [
  {
    texto:
      '¡Muy buenas tardes! Le llamo de Almacenes La Ganga. ¡Felicidades! Su número resultó ganador de una cocina de inducción en nuestro sorteo del mes.',
    senal: 'premio',
  },
  {
    texto:
      'El sistema eligió su número al azar, no se preocupe. Solo tiene que cubrir el impuesto de entrega: cuarenta dólares, y hoy mismo le llevamos la cocina a su casa.',
    senal: 'pago',
  },
]

const QUESTION = '¿Por qué tengo que pagar para recibir un premio?'
const ACCEPTS = 'Ya, está bien. ¿A qué cuenta deposito?'
const CASH_ON_DELIVERY = '¿Y no puedo pagar cuando me entreguen la cocina?'

const EXCUSE = {
  texto:
    'No, el premio es gratis. Lo que se cobra es el impuesto de entrega, que lo pone la transportadora, no nosotros.',
}

const ACCOUNT = {
  texto:
    'Es el impuesto de entrega, y todos los ganadores lo pagan. Deposite a la cuenta de mi compañera María: veintidós, cero cero setenta y cuatro, once ochenta y ocho.',
  senal: 'cuenta',
}

const RUSH = {
  texto:
    'Eso sí, la promoción vence en una hora. Si no deposita ahora mismo pierde la cocina y se la entregamos a la siguiente persona de la lista.',
  senal: 'prisa',
}

// El pago por adelantado es el negocio entero: ninguna rama del guion acepta
// cobrar al entregar.
const ADVANCED = {
  texto:
    'No, el sistema no libera el despacho sin el pago del impuesto. Es una norma de la promoción, yo no la puedo saltar.',
  senal: 'adelantado',
}

type Line = { texto: string; mio?: boolean; senal?: string }
type Phrase = { texto: string; goto: string; label?: string }

function onCall(dialogue: Line[], phrases: Phrase[], hangUpLabel: string): ScreenView {
  return {
    kind: 'call',
    quien: WHO,
    numero: NUMBER,
    etiqueta: 'No está en tus contactos',
    senalQuien: 'quien',
    dialogo: dialogue,
    decir: phrases,
    colgarGoto: 'e_cuelga',
    colgarLabel: hangUpLabel,
  }
}

const CALL = onCall(
  AD,
  [
    { texto: QUESTION, goto: 'n3', label: 'Preguntó por qué debe pagar para recibir el premio' },
    { texto: ACCEPTS, goto: 'n3b', label: 'Aceptó pagar y pidió los datos de la cuenta' },
  ],
  'Colgó al oír lo del premio',
)

const THREAD_QUESTION: Line[] = [
  ...AD,
  { texto: QUESTION, mio: true },
  EXCUSE,
  ACCOUNT,
  RUSH,
]

const THREAD_ACCEPTS: Line[] = [...AD, { texto: ACCEPTS, mio: true }, ACCOUNT, RUSH]

function askDeposit(thread: Line[], next: string): ScreenView {
  return onCall(
    thread,
    [
      { texto: CASH_ON_DELIVERY, goto: next, label: 'Propuso pagar contra entrega' },
      {
        texto: 'No voy a depositar nada a la cuenta de una persona.',
        goto: 'e_niega',
        label: 'Se negó a depositar a una cuenta personal',
      },
    ],
    'Colgó cuando le pidieron depositar',
  )
}

function refuse(thread: Line[]): ScreenView {
  return onCall(
    [...thread, { texto: CASH_ON_DELIVERY, mio: true }, ADVANCED],
    [
      {
        texto: 'Entonces no, gracias. Así no me interesa.',
        goto: 'e_niega',
        label: 'Rechazó el premio al saber que había que pagar por adelantado',
      },
      {
        texto: 'Bueno, deme un momento que entro al banco.',
        goto: 'n5',
        label: 'Aceptó pagar por adelantado y abrió el banco',
      },
    ],
    'Colgó al saber que había que pagar por adelantado',
  )
}

const BROWSER: ScreenView = {
  kind: 'web',
  app: 'Navegador',
  url: 'inicio',
  secure: true,
  brand: 'Sitios frecuentes',
  title: 'Nueva pestaña',
  opciones: [
    { texto: 'elcomercio.com', detalle: 'Noticias del Ecuador' },
    {
      texto: 'laganga.com.ec',
      detalle: 'Almacenes La Ganga · promociones y sucursales',
      goto: 'e_verifica',
      label: 'Entró al sitio del almacén para comprobar el sorteo',
    },
    { texto: 'bancolitoral.ec', detalle: 'Banca en línea' },
    { texto: 'sri.gob.ec', detalle: 'Servicio de Rentas Internas' },
  ],
  fields: [],
  button: '',
}

const SITE: ScreenView = {
  kind: 'web',
  url: 'https://www.laganga.com.ec/promociones',
  secure: true,
  brand: 'Almacenes La Ganga',
  title: 'Promociones vigentes',
  subtitle: 'Actualizado hoy.',
  datos: [
    { etiqueta: 'Sorteos en curso', valor: 'Ninguno', senal: 'sin-sorteo' },
    { etiqueta: 'Última promoción cerrada', valor: 'Mayo · entrega en tienda' },
    { etiqueta: 'Atención al cliente', valor: '1800 542 642' },
  ],
  aviso:
    'Nuestros sorteos se entregan en tienda y nunca tienen costo. No pedimos depósitos por teléfono ni a cuentas personales.',
  fields: [],
  button: '',
}

const BANK: ScreenView = {
  kind: 'web',
  app: 'Banco del Litoral',
  url: 'bancolitoral.ec',
  secure: true,
  brand: 'Banca móvil',
  title: 'Tus cuentas',
  subtitle: `${ACCOUNT_FAKE} · disponible $312,45`,
  opciones: [
    {
      texto: 'Transferir',
      detalle: 'A cuentas propias o de terceros',
      goto: 'n6',
      label: 'Abrió la transferencia en la app del banco',
    },
    { texto: 'Movimientos', detalle: 'Consumos y débitos de los últimos 30 días' },
    { texto: 'Pagar servicios', detalle: 'Luz, agua, teléfono e internet' },
    { texto: 'Mi perfil', detalle: 'Datos, límites y notificaciones' },
  ],
  fields: [],
  button: '',
}

const TRANSFER: ScreenView = {
  kind: 'web',
  app: 'Banco del Litoral',
  url: 'bancolitoral.ec',
  secure: true,
  brand: 'Transferir a terceros',
  title: 'Confirma la transferencia',
  subtitle: 'Revisa los datos antes de enviar el dinero.',
  datos: [
    { etiqueta: 'Cuenta de destino', valor: ACCOUNT_SCAM, senal: 'cuenta' },
    { etiqueta: 'Titular', valor: 'María F. (persona natural)' },
    { etiqueta: 'Valor', valor: '$40,00' },
  ],
  aviso: 'Las transferencias enviadas no se pueden reversar.',
  button: 'Transferir $40,00',
  botonGoto: 'e_paga',
  botonLabel: 'Transfirió los $40 a la cuenta que le dictaron',
  cerrarGoto: 'n5',
  cerrarLabel: 'Volvió atrás sin transferir',
  fields: [],
}

const APPS: PhoneApp[] = [
  { Icono: Phone, texto: 'Teléfono', color: '#2f9e44' },
  {
    Icono: Wallet,
    texto: 'Banco del Litoral',
    color: '#155e75',
    goto: 'n5',
    label: 'Abrió la app del banco durante la llamada',
  },
  {
    Icono: Compass,
    texto: 'Navegador',
    color: '#1971c2',
    goto: 'n4',
    label: 'Abrió el navegador para comprobar por su cuenta',
  },
  {
    Icono: Camera,
    texto: 'Cámara',
    color: '#495057',
    vacia: 'La cámara está lista. No hay nada que fotografiar en este momento.',
  },
]

export const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: INCOMING },
  n2: { kind: 'scene', view: CALL },
  n3: { kind: 'scene', view: askDeposit(THREAD_QUESTION, 'n3c') },
  n3b: { kind: 'scene', view: askDeposit(THREAD_ACCEPTS, 'n3d') },
  n3c: { kind: 'scene', view: refuse(THREAD_QUESTION) },
  n3d: { kind: 'scene', view: refuse(THREAD_ACCEPTS) },
  n4: { kind: 'scene', view: BROWSER },
  n5: { kind: 'scene', view: BANK },
  n6: { kind: 'scene', view: TRANSFER },
  e_rechaza: {
    kind: 'good',
    view: INCOMING,
    verdict: 'No caíste · no contestaste',
    outcome:
      'Rechazaste una llamada de un número que no conoces. Es una decisión válida y segura: nadie está obligado a contestarle a quien no tiene guardado, y quien de verdad necesite algo de ti vuelve a intentarlo o deja constancia por otro lado.',
  },
  e_cuelga: {
    kind: 'good',
    view: askDeposit(THREAD_QUESTION, 'n3c'),
    verdict: 'No caíste · colgaste',
    outcome:
      'Colgaste. Nunca tienes obligación de seguir escuchando, y colgar es la única defensa que funciona siempre: sin llamada no hay prisa, y sin prisa el engaño no se sostiene.',
  },
  e_niega: {
    kind: 'good',
    view: refuse(THREAD_QUESTION),
    verdict: 'No caíste · dijiste que no',
    outcome:
      'Dijiste que no y se acabó. No hace falta demostrar que es una estafa ni discutir con quien llama: basta con no pagar por adelantado a una cuenta que no es de ninguna empresa.',
  },
  e_paga: {
    kind: 'bad',
    view: TRANSFER,
    verdict: 'Caíste en la estafa',
    outcome:
      'Transferiste $40 a la cuenta personal de una desconocida. La cocina nunca llegó, ese número dejó de contestar y el banco no puede reversar una transferencia que autorizaste tú. En los días siguientes volvieron a llamarte: quien paga una vez entra en la lista de los que vuelven a pagar.',
  },
  e_verifica: {
    kind: 'good',
    view: SITE,
    verdict: 'No caíste · lo comprobaste por tu cuenta',
    outcome:
      'En el sitio del almacén no había ningún sorteo en curso, y ahí mismo estaba escrito que sus promociones no tienen costo. La llamada seguía abierta mientras comprobabas: quien llama de verdad no tiene problema en que lo verifiques.',
  },
}

const SIGNALS: Signal[] = [
  {
    id: 's1',
    targetId: 'quien',
    pantalla: 'n1',
    texto:
      'Llega de un <b>número que no tienes guardado</b>. El nombre del almacén lo dijo la persona que llamó, no el teléfono: eso no lo verifica nadie.',
  },
  {
    id: 's2',
    targetId: 'premio',
    pantalla: 'n2',
    texto:
      'Un <b>premio que nunca pediste</b>. No hay sorteo que se gane sin haber participado, y esa pregunta se responde sin saber nada de tecnología.',
  },
  {
    id: 's3',
    targetId: 'pago',
    pantalla: 'n2',
    texto:
      'Te piden <b>pagar para poder recibirlo</b>. Un premio que cuesta dinero no es un premio: es una compra, y encima de algo que no existe.',
  },
  {
    id: 's4',
    targetId: 'cuenta',
    pantalla: 'n3',
    texto:
      'El dinero va a una <b>cuenta personal</b>, no a la de la empresa. Ninguna tienda cobra en la cuenta de una empleada.',
  },
  {
    id: 's5',
    targetId: 'adelantado',
    pantalla: 'n3c',
    texto:
      'No aceptan <b>cobrar al entregar</b>, que es lo normal en cualquier venta. El pago por adelantado no es un detalle del trámite: es el negocio entero.',
  },
  {
    id: 's6',
    targetId: 'prisa',
    pantalla: 'n3',
    texto:
      '<b>Una hora de plazo.</b> La prisa está ahí para que no te dé tiempo de colgar y comprobar, que es exactamente lo que rompe el engaño.',
  },
  {
    id: 's7',
    targetId: 'sin-sorteo',
    pantalla: 'e_verifica',
    texto:
      'En el sitio del almacén <b>no había ningún sorteo</b>. El canal propio siempre está a un toque, y no depende de lo que diga quien te llamó.',
  },
]

const RULE =
  'Regla de oro: <b>nunca pagues para recibir un premio</b>. Si dudas, cuelga y llama tú al número oficial del negocio o mira su sitio: quien llama de verdad no tiene prisa por impedírtelo.'

const SUMMARY = 'Un número desconocido llama para avisarte de que ganaste un sorteo.'

const CONTEXT: Context = {
  antes: (
    <>
      Estás en tu casa, sin ningún trámite pendiente, y{' '}
      <strong>no participaste en ningún sorteo</strong> ni dejaste tu número en un concurso.
    </>
  ),
  ahora: (
    <>
      <strong>A media tarde</strong> suena el teléfono: un número que no tienes guardado y que nunca
      viste antes.
    </>
  ),
}

function RafflePrize() {
  return (
    <ScenarioStory
      escenarioId="vishing/premio-sorteo"
      resumen={SUMMARY}
      contexto={CONTEXT}
      story={STORY}
      senales={SIGNALS}
      rule={RULE}
      restartLabel="↻ Recibir la llamada otra vez"
      accionesEnPantalla
      apps={APPS}
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Actúa sobre el teléfono como lo harías con el tuyo: contesta o rechaza, cuelga cuando
          quieras y usa <strong>cualquier app de abajo</strong>, incluso con la llamada abierta.
        </p>
      }
      pista={
        <p>
          Puedes no contestar, escuchar y responder, colgar en cualquier momento, hacer lo que te
          piden desde la app del banco o dejar la llamada esperando y comprobar por tu cuenta.
          Colgar nunca es de mala educación cuando quien llama no es quien dice ser.
        </p>
      }
    />
  )
}

export default RafflePrize
