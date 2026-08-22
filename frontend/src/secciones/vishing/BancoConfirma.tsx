import { Camera, MessageSquareText, Phone, Wallet } from 'lucide-react'
import StoryEscenario, { type AppTelefono, type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { IDENTIDAD_FICTICIA } from '../../lib/identidadFicticia'

/**
 * La llamada del banco que sí es del banco.
 *
 * Espeja a antifraude-banco casi frase por frase: mismo consumo, misma
 * pregunta, mismo código que llega por mensaje. Lo que cambia es lo que hacen
 * con él — aquí te dicen que no se lo des a nadie, ni siquiera a ellos.
 *
 * Sin este escenario el módulo enseñaría "cuelga siempre", que no es criterio
 * sino miedo: el fraude de verdad estaba ocurriendo y quedarse sin hacer nada
 * cuesta dinero. Por eso colgar sin comprobar nada es parcial y no acierto, y
 * el acierto pleno es colgar y llamar tú, o mirarlo en la app.
 */

const NUMERO = '+593 4 373 8000'
const CODIGO = '771204'

const ENTRANTE: ScreenView = {
  kind: 'call',
  entrante: true,
  quien: NUMERO,
  numero: 'Guayaquil, Ecuador',
  etiqueta: 'No está en tus contactos',
  senalQuien: 'quien',
  contestarGoto: 'n2',
  contestarLabel: 'Contestó la llamada',
  rechazarGoto: 'e_rechaza',
  rechazarLabel: 'Rechazó la llamada sin contestar',
}

const APERTURA = [
  {
    texto:
      'Buenas noches, le llamo del monitoreo antifraude del Banco del Litoral. No le voy a pedir claves, códigos ni datos suyos en toda la llamada.',
    senal: 'no-pide',
  },
  {
    texto: `Tenemos retenido un consumo de ochocientos noventa dólares en una tienda de Guayaquil con su tarjeta terminada en ${IDENTIDAD_FICTICIA.tarjeta}. Solo necesito que me diga si fue usted.`,
    senal: 'retenido',
  },
  {
    texto:
      'Y si prefiere no seguir por aquí, cuelgue y llámenos al número del reverso de su tarjeta: la gestión queda igual de abierta y le atiende cualquier compañero.',
    senal: 'invita',
  },
]

const LLAMADA: ScreenView = {
  kind: 'call',
  quien: NUMERO,
  numero: 'Guayaquil, Ecuador',
  etiqueta: 'No está en tus contactos',
  senalQuien: 'quien',
  dialogo: APERTURA,
  decir: [
    { texto: 'No, yo no hice esa compra.', goto: 'n3', label: 'Dijo que no reconocía el consumo' },
    {
      texto: 'Prefiero colgar y llamar yo al número de mi tarjeta.',
      goto: 'e_devuelve',
      label: 'Colgó para llamar al número impreso en su tarjeta',
    },
  ],
  colgarGoto: 'e_cuelga',
  colgarLabel: 'Colgó sin decir nada ni comprobar el consumo',
}

const BLOQUEAN: ScreenView = {
  ...LLAMADA,
  dialogo: [
    ...APERTURA,
    { texto: 'No, yo no hice esa compra.', mio: true },
    {
      texto:
        'Perfecto, entonces lo rechazamos y bloqueo la tarjeta ahora mismo. La nueva le llega a su agencia en tres días hábiles.',
    },
    {
      texto:
        'Le va a llegar un mensaje con un código de constancia. Ese código no me lo dé a mí ni a nadie que le llame, ni siquiera diciendo que es del banco: es solo su comprobante.',
      senal: 'no-lo-de',
    },
  ],
  decir: [
    {
      texto: 'Listo, muchas gracias.',
      goto: 'e_confirma',
      label: 'Confirmó que no era su consumo y dejó que bloquearan la tarjeta',
    },
    {
      texto: `Ya me llegó el mensaje, es ${CODIGO} por si lo necesita.`,
      goto: 'e_dicta',
      label: 'Dictó el código aunque le habían dicho que no lo hiciera',
    },
  ],
  colgarGoto: 'e_cuelga',
  colgarLabel: 'Colgó sin confirmar nada',
}

const MENSAJE: ScreenView = {
  kind: 'sms',
  sender: 'BancoLitoral',
  sub: 'Remitente verificado · mismo hilo de siempre',
  msgs: [
    {
      text: 'Banco del Litoral: consumo aprobado $12,40 FARMACIA SANA 28/07 11:02, tarjeta *4417.',
      time: '28 jul',
    },
    {
      text: `Banco del Litoral: retuvimos un consumo de $890,00 ELECTROSUR GYE con su tarjeta *${IDENTIDAD_FICTICIA.tarjeta}. Su código de constancia es <b>${CODIGO}</b>. Nunca se lo pediremos por teléfono.`,
      time: '21:06',
      senal: 'texto-codigo',
    },
  ],
}

const BANCO: ScreenView = {
  kind: 'web',
  app: 'Banco del Litoral',
  url: 'bancolitoral.ec',
  secure: true,
  brand: 'Banca móvil',
  title: `Tarjeta *${IDENTIDAD_FICTICIA.tarjeta}`,
  subtitle: 'Tienes 1 consumo retenido por revisar.',
  opciones: [
    {
      texto: 'Consumos retenidos',
      detalle: 'Movimientos que detuvimos a la espera de tu confirmación',
      goto: 'e_app',
      label: 'Revisó el consumo retenido en la app y lo rechazó',
    },
    { texto: 'Movimientos', detalle: 'Consumos y débitos de los últimos 30 días' },
    { texto: 'Transferir', detalle: 'A cuentas propias o de terceros' },
    { texto: 'Pagar servicios', detalle: 'Luz, agua, teléfono e internet' },
  ],
  fields: [],
  button: '',
}

const RETENIDO: ScreenView = {
  kind: 'web',
  app: 'Banco del Litoral',
  url: 'bancolitoral.ec',
  secure: true,
  brand: 'Consumos retenidos',
  title: 'ELECTROSUR GYE · $890,00',
  subtitle: 'Hoy, 21:04 · a la espera de tu confirmación.',
  datos: [
    { etiqueta: 'Estado', valor: 'Retenido, no cobrado', senal: 'consta' },
    { etiqueta: 'Tarjeta', valor: `Terminada en ${IDENTIDAD_FICTICIA.tarjeta}` },
    { etiqueta: 'Resultado', valor: 'Rechazado por ti · tarjeta bloqueada' },
  ],
  aviso:
    'Bloqueamos la tarjeta y la nueva llega a tu agencia en tres días. Recuerda: el código que te enviamos es tu constancia y no debes dictarlo a nadie.',
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
    label: 'Abrió los mensajes durante la llamada',
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
  n3: { kind: 'scene', view: BLOQUEAN },
  n4: { kind: 'scene', view: MENSAJE },
  n5: { kind: 'scene', view: BANCO },
  e_rechaza: {
    kind: 'partial',
    view: ENTRANTE,
    verdict: 'Prudente, pero el problema seguía ahí',
    outcome:
      'No contestaste, y no contestar nunca te va a costar dinero: hiciste bien en no fiarte de un número desconocido. Pero el consumo de $890 era real y estaba retenido esperando tu respuesta. En la app lo tenías a la vista, y ni lo miraste.',
    score: 50,
  },
  e_cuelga: {
    kind: 'partial',
    view: LLAMADA,
    verdict: 'Colgaste bien, pero te quedaste a medias',
    outcome:
      'Colgar ante una llamada que no esperabas es siempre correcto, y no perdiste nada. Lo que falta es la otra mitad: alguien intentó gastar $890 con tu tarjeta esta noche. Colgar y no comprobar deja el problema exactamente donde estaba.',
    score: 50,
  },
  e_devuelve: {
    kind: 'good',
    view: LLAMADA,
    verdict: 'Acertaste · colgaste y llamaste tú',
    outcome:
      'Colgaste y marcaste el número del reverso de tu tarjeta. Era el mismo banco y la misma gestión: rechazaron el consumo y bloquearon la tarjeta. Esta es la respuesta que funciona siempre, porque no depende de que adivines si quien llama es de verdad.',
  },
  e_confirma: {
    kind: 'good',
    view: BLOQUEAN,
    verdict: 'Acertaste · la llamada era legítima',
    outcome:
      'Era tu banco. No te pidieron claves ni códigos, te ofrecieron ellos mismos que colgaras y llamaras, y el consumo quedó rechazado. Dijiste lo único que hacía falta: que esa compra no era tuya.',
  },
  e_dicta: {
    kind: 'bad',
    view: BLOQUEAN,
    verdict: 'Llamada legítima, reacción peligrosa',
    outcome: `La llamada era de verdad, pero dictaste el código igual, y eso es lo que no puede pasar nunca. Te lo habían advertido en la llamada y venía escrito en el propio mensaje. Hoy no perdiste nada porque al otro lado estaba tu banco; la próxima vez que alguien te pida ese código no lo estará.`,
    score: 0,
  },
  e_app: {
    kind: 'good',
    view: RETENIDO,
    verdict: 'Acertaste · lo resolviste en tu canal',
    outcome:
      'En la app estaba el consumo retenido, igual que te contaban por teléfono: lo rechazaste desde ahí y la tarjeta quedó bloqueada. Comprobar en tu propio canal resuelve las dos cosas a la vez: confirma que la llamada era real y arregla el problema.',
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'no-pide',
    pantalla: 'n2',
    texto:
      '<b>No te piden nada.</b> Ni claves ni códigos: solo un sí o un no sobre algo que ya saben.',
  },
  {
    id: 's2',
    targetId: 'invita',
    pantalla: 'n2',
    texto:
      'Te <b>invitan a colgar y llamar tú</b>. Un estafador necesita que sigas en línea; a tu banco le da igual por dónde le llegues.',
  },
  {
    id: 's3',
    targetId: 'retenido',
    pantalla: 'n2',
    texto:
      'El consumo está <b>retenido, no cobrado</b>: te avisan antes de que pase nada. El fraude apura diciendo "ya se hizo"; tu banco detiene y pregunta.',
  },
  {
    id: 's4',
    targetId: 'no-lo-de',
    pantalla: 'n3',
    texto:
      'Te dicen que <b>no dictes el código a nadie</b>, ni al que diga ser del banco. Un estafador jamás lo diría.',
  },
  {
    id: 's5',
    targetId: 'texto-codigo',
    pantalla: 'n4',
    texto:
      'El mensaje lo repite: el código es tu <b>constancia</b>, nunca te lo pedirán por teléfono.',
  },
  {
    id: 's6',
    targetId: 'consta',
    pantalla: 'e_app',
    texto:
      'El consumo <b>consta en la app</b>. Si lo que te cuentan por teléfono aparece igual en tu canal, la llamada era real.',
  },
]

const RULE =
  'Regla de oro: un banco de verdad <b>informa y pregunta, pero no te pide nada</b>, y no le molesta que cuelgues y le llames tú. Aunque la llamada sea auténtica, el código que te llega por mensaje no se dicta nunca.'

const RESUMEN = 'El banco llama para preguntarte si un consumo de $890 es tuyo.'

const CONTEXTO: Contexto = {
  antes: (
    <>
      Cliente del <strong>Banco del Litoral</strong>. Hoy solo compraste en la farmacia y{' '}
      <strong>no has hecho ninguna compra grande</strong>.
    </>
  ),
  ahora: (
    <>
      <strong>Ya de noche</strong> te llama un número de Guayaquil que no tienes guardado, y casi a
      la vez vibra un <strong>mensaje del banco</strong>.
    </>
  ),
}

function BancoConfirma() {
  return (
    <StoryEscenario
      escenarioId="vishing/banco-confirma"
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
          que acaba de llegar o comprobar tu tarjeta por tu cuenta. Aquí no basta con no caer:
          fíjate también en si queda algo por resolver.
        </p>
      }
    />
  )
}

export default BancoConfirma
