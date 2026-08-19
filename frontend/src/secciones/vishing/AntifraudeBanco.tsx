import { Camera, MessageSquareText, Phone, Wallet } from 'lucide-react'
import StoryEscenario, { type AppTelefono, type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { IDENTIDAD_FICTICIA } from '../../lib/identidadFicticia'

/**
 * El falso departamento antifraude: la llamada que te pide el código que el
 * banco te acaba de enviar.
 *
 * Es la pareja de tarjeta-bloqueada, pero al revés: allí el SMS te empujaba a
 * llamar, aquí la llamada te empuja a leer un SMS. Y el mensaje que llega es
 * auténtico —lo manda el banco de verdad, porque alguien está intentando
 * operar con tu cuenta ahora mismo—, así que todo lo que el módulo de smishing
 * enseña a mirar sale bien en él. Lo falso es quien lo pide.
 */

const NUMERO = '+593 2 380 4412'
const QUIEN = 'Banco del Litoral'
const CODIGO = '480913'

const ENTRANTE: ScreenView = {
  kind: 'call',
  entrante: true,
  quien: NUMERO,
  numero: 'Quito, Ecuador',
  etiqueta: 'No está en tus contactos',
  senalQuien: 'quien',
  contestarGoto: 'n2',
  contestarLabel: 'Contestó la llamada',
  rechazarGoto: 'e_rechaza',
  rechazarLabel: 'Rechazó la llamada sin contestar',
}

const APERTURA = [
  {
    texto: `Buenas noches, le habla Andrés Villamar del departamento de seguridad del ${QUIEN}. ¿Hablo con el titular de la tarjeta terminada en ${IDENTIDAD_FICTICIA.tarjeta}?`,
    senal: 'llaman',
  },
  {
    texto:
      'Le llamo porque detectamos un consumo de ochocientos noventa dólares en una tienda de electrónica de Guayaquil, hecho hace ocho minutos. ¿Ese consumo lo reconoce usted?',
  },
]

const LLAMADA: ScreenView = {
  kind: 'call',
  quien: NUMERO,
  numero: 'Quito, Ecuador',
  etiqueta: 'No está en tus contactos',
  senalQuien: 'quien',
  dialogo: APERTURA,
  // Cada respuesta tiene la suya: quien llama sigue su guion y acaba pidiendo
  // lo mismo, pero contesta a lo que le dijiste. Preguntar quién es no es una
  // defensa —la respuesta también está preparada— y comprobarlo cuesta más si
  // la conversación suena real.
  decir: [
    {
      texto: 'No, yo no hice esa compra.',
      goto: 'n3',
      label: 'Dijo que no reconocía el consumo',
    },
    {
      texto: '¿Y cómo sé yo que usted es del banco?',
      goto: 'n3b',
      label: 'Preguntó cómo saber que quien llama es del banco',
    },
  ],
  colgarGoto: 'e_cuelga',
  colgarLabel: 'Colgó al principio de la llamada',
}

const NO_RECONOZCO = 'No, yo no hice esa compra.'
const QUIEN_ES = '¿Y cómo sé yo que usted es del banco?'

const PIDE_CODIGO = [
  {
    texto: `Para autorizar la anulación le acabo de enviar un código de seis dígitos por mensaje. Léamelo, por favor.`,
    senal: 'piden-codigo',
  },
  {
    texto:
      'Y no cuelgue, señora: si corta la llamada el cargo se ejecuta y ya no lo podemos detener.',
    senal: 'no-cuelgue',
  },
]

function pidiendoCodigo(respuesta: { texto: string; mio?: boolean }[]): ScreenView {
  return {
    kind: 'call',
    quien: NUMERO,
    numero: 'Quito, Ecuador',
    etiqueta: 'No está en tus contactos',
    senalQuien: 'quien',
    dialogo: [...APERTURA, ...respuesta, ...PIDE_CODIGO],
    decir: [
      {
        texto: `Ya me llegó: es ${CODIGO}.`,
        goto: 'e_dicta',
        label: 'Dictó por teléfono el código que le llegó',
      },
      {
        texto: 'Deme un momento, voy a mirar el mensaje.',
        goto: 'n4',
        label: 'Fue a leer el mensaje antes de contestar',
      },
    ],
    colgarGoto: 'e_cuelga',
    colgarLabel: 'Colgó cuando le pidieron el código',
  }
}

const NIEGA_CONSUMO = pidiendoCodigo([
  { texto: NO_RECONOZCO, mio: true },
  {
    texto:
      'Entendido, lo marco como consumo no reconocido. Lo anulamos ahora mismo desde aquí, antes de que se liquide.',
  },
])

const DUDA_QUIEN = pidiendoCodigo([
  { texto: QUIEN_ES, mio: true },
  {
    texto:
      'Es una pregunta muy sensata, señora. Puede comprobar que este número aparece en la página del banco. Vamos a anular el cargo ahora mismo desde aquí.',
  },
])

/// El SMS es auténtico: lo manda el banco porque alguien está intentando
/// operar de verdad. Y lo dice en su propio texto, que es la señal que este
/// escenario enseña a leer sin salir de la pantalla.
const MENSAJE: ScreenView = {
  kind: 'sms',
  sender: 'BancoLitoral',
  sub: 'Remitente verificado · mismo hilo de siempre',
  msgs: [
    {
      text: 'Banco del Litoral: consumo aprobado $18,75 PANADERÍA LA ESPIGA 02/08 08:41, tarjeta *4417.',
      time: '08:41',
    },
    {
      text: `Su código de autorización es <b>${CODIGO}</b>. Vence en 5 minutos. El Banco del Litoral nunca le pedirá este código por teléfono ni por mensaje: si alguien se lo pide, cuelgue.`,
      time: '21:07',
      senal: 'texto-codigo',
    },
  ],
}

/// La banca móvil: el cargo del que hablan no existe, y el número de atención
/// de verdad está escrito ahí mismo.
const BANCO: ScreenView = {
  kind: 'web',
  app: 'Banco del Litoral',
  url: 'bancolitoral.ec',
  secure: true,
  brand: 'Banca móvil',
  title: `Tarjeta *${IDENTIDAD_FICTICIA.tarjeta}`,
  subtitle: 'Cupo disponible $1.240,00',
  opciones: [
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
      label: 'Bloqueó la tarjeta sin revisar antes los movimientos',
    },
    { texto: 'Transferir', detalle: 'A cuentas propias o de terceros' },
    { texto: 'Pagar servicios', detalle: 'Luz, agua, teléfono e internet' },
  ],
  fields: [],
  button: '',
}

const MOVIMIENTOS: ScreenView = {
  kind: 'web',
  app: 'Banco del Litoral',
  url: 'bancolitoral.ec',
  secure: true,
  brand: `Movimientos · Tarjeta *${IDENTIDAD_FICTICIA.tarjeta}`,
  title: 'Últimos consumos',
  subtitle: 'Actualizado hace unos segundos.',
  datos: [
    { etiqueta: '02/08 08:41 · PANADERÍA LA ESPIGA', valor: '$18,75' },
    { etiqueta: '01/08 · Débito automático, internet', valor: '$28,00' },
    { etiqueta: 'Consumos en revisión', valor: 'Ninguno', senal: 'sin-cargo' },
  ],
  aviso:
    'Si no reconoces un consumo, bloquea la tarjeta desde aquí o llama al 1700 123 456, el número impreso en el reverso. Nunca te pediremos por teléfono el código que te enviamos.',
  fields: [],
  button: '',
}

const APPS: AppTelefono[] = [
  { Icono: Phone, texto: 'Teléfono', color: '#2f9e44', hilo: 'call' },
  {
    Icono: MessageSquareText,
    texto: 'Mensajes',
    color: '#1971c2',
    goto: 'n4',
    label: 'Abrió los mensajes para leer el código',
  },
  {
    Icono: Wallet,
    texto: 'Banco del Litoral',
    color: '#0f3d6e',
    goto: 'n5',
    label: 'Abrió la app del banco durante la llamada',
  },
  {
    Icono: Camera,
    texto: 'Cámara',
    color: '#495057',
    vacia: 'La cámara está lista. No hay nada que fotografiar en este momento.',
  },
]

export const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: ENTRANTE },
  n2: { kind: 'scene', view: LLAMADA },
  n3: { kind: 'scene', view: NIEGA_CONSUMO },
  n3b: { kind: 'scene', view: DUDA_QUIEN },
  n4: { kind: 'scene', view: MENSAJE },
  n5: { kind: 'scene', view: BANCO },
  e_rechaza: {
    kind: 'partial',
    view: ENTRANTE,
    verdict: 'No entregaste nada, pero te quedaste con la duda',
    outcome:
      'No contestaste, y eso evita el daño. Pero el mensaje del banco sí llegó, y no lo miraste: si alguien está intentando operar con tu tarjeta ahora mismo, lo verás cuando ya no sirva de nada. La llamada se ignora; la tarjeta se comprueba.',
    score: 50,
  },
  e_cuelga: {
    kind: 'good',
    view: NIEGA_CONSUMO,
    verdict: 'No caíste · colgaste',
    outcome:
      'Colgaste sin dictar nada. Ningún banco pide por teléfono el código que te envía, y la insistencia en que no cortaras era la señal más clara de todas. Lo que sigue es llamar tú al número del reverso de la tarjeta, que es el único que sabes que es del banco.',
  },
  e_dicta: {
    kind: 'bad',
    view: NIEGA_CONSUMO,
    verdict: 'Caíste en la trampa',
    outcome: `El consumo de Guayaquil no existía. El código ${CODIGO} era el que tu banco acababa de enviarte para autorizar una transferencia que estaban haciendo ellos mientras hablabas: ochocientos noventa dólares salieron de tu cuenta con tu propia autorización. Ese código no identifica a nadie, firma operaciones.`,
  },
  e_app: {
    kind: 'good',
    view: MOVIMIENTOS,
    verdict: 'No caíste · lo comprobaste donde consta',
    outcome:
      'En la app no había ningún consumo de ochocientos noventa dólares ni nada en revisión: el cargo del que hablaban nunca existió. Dejaste la llamada esperando mientras mirabas, que es exactamente lo que quien llama intenta impedir.',
  },
  e_bloquea: {
    kind: 'partial',
    view: BANCO,
    verdict: 'Reaccionaste sin comprobar',
    outcome:
      'Bloqueaste la tarjeta por un consumo que nunca existió. No perdiste dinero —y ante la duda es preferible eso a dictar un código—, pero te quedaste sin tarjeta hasta que emitan otra, y los movimientos estaban a un toque en esa misma pantalla.',
    score: 50,
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'quien',
    pantalla: 'n1',
    texto:
      'El número <b>no es el de tu banco</b> ni está en tus contactos. Que en la pantalla salga un número de Quito no dice nada: se puede hacer aparecer cualquiera.',
  },
  {
    id: 's2',
    targetId: 'llaman',
    pantalla: 'n2',
    texto:
      '<b>Te llaman ellos.</b> Cuando tú marcas el número del reverso de tu tarjeta sabes con quién hablas; cuando te llaman, no, y eso no lo arregla ninguna pregunta que hagas por teléfono.',
  },
  {
    id: 's3',
    targetId: 'piden-codigo',
    pantalla: 'n3',
    texto:
      'Te piden el <b>código que te acaba de llegar</b>. Ese código autoriza operaciones: dictarlo es firmar lo que estén haciendo al otro lado mientras hablas.',
  },
  {
    id: 's4',
    targetId: 'texto-codigo',
    pantalla: 'n4',
    texto:
      'El mensaje del banco <b>es auténtico y lo dice él mismo</b>: nunca te pedirán ese código por teléfono. La advertencia venía escrita en la misma pantalla donde estaba el número.',
  },
  {
    id: 's5',
    targetId: 'no-cuelgue',
    pantalla: 'n3',
    texto:
      '<b>Insisten en que no cuelgues.</b> Colgar y marcar tú es lo único que rompe el engaño, y por eso es lo primero que intentan impedir.',
  },
  {
    id: 's6',
    targetId: 'sin-cargo',
    pantalla: 'e_app',
    texto:
      'En la app <b>no había ningún cargo en revisión</b>. El estado real de tu tarjeta no depende de lo que te cuente quien llamó.',
  },
]

const RULE =
  'Regla de oro: el código que te llega por mensaje <b>no se dicta nunca</b>, ni siquiera a alguien que dice ser tu banco. Cuelga y llama tú al número impreso en el reverso de tu tarjeta: es el único que sabes a quién pertenece.'

const RESUMEN = 'Una llamada dice ser del banco y avisa de un consumo que no reconoces.'

const CONTEXTO: Contexto = {
  antes: (
    <>
      Cliente del <strong>Banco del Litoral</strong>. Usas esa tarjeta casi a diario y hoy solo
      compraste pan por la mañana.
    </>
  ),
  ahora: (
    <>
      <strong>Ya de noche</strong> suena el teléfono, y casi al mismo tiempo vibra un{' '}
      <strong>mensaje nuevo</strong> del banco.
    </>
  ),
  detalle: 'Quien llama sabe los cuatro últimos dígitos de tu tarjeta, y son los tuyos.',
}

function AntifraudeBanco() {
  return (
    <StoryEscenario
      escenarioId="vishing/antifraude-banco"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule={RULE}
      restartLabel="↻ Recibir la llamada otra vez"
      accionesEnPantalla
      apps={APPS}
      identidad={['tarjeta']}
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Actúa sobre el teléfono como lo harías con el tuyo: contesta o rechaza, cuelga cuando
          quieras y usa <strong>cualquier app de abajo</strong>, incluso con la llamada abierta.
        </p>
      }
      pista={
        <p>
          Puedes no contestar, escuchar y responder, colgar en cualquier momento, leer el mensaje
          que acaba de llegar o comprobar tu tarjeta por tu cuenta. La llamada te espera mientras
          miras: quien llama de verdad no tiene problema con eso.
        </p>
      }
    />
  )
}

export default AntifraudeBanco
