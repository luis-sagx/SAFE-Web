import { MessageSquareText, Phone, Wallet } from 'lucide-react'
import ScenarioStory, { type PhoneApp, type ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import { APP_ACCENTS } from '../../components/ui/appAccents'
import type { Signal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { IDENTITY_FAKE } from '../../lib/identidadFicticia'

// Espeja a antifraude-banco: misma llamada, pero legítima y pide no dar el
// código ni a ellos. Existe para no enseñar "cuelga siempre", colgar sin
// comprobar nada queda como parcial, no como acierto pleno.

const NUMBER = '+593 4 373 8000'
const CODE = '771204'

const INCOMING: ScreenView = {
  kind: 'call',
  entrante: true,
  quien: NUMBER,
  numero: 'Guayaquil, Ecuador',
  etiqueta: 'No está en tus contactos',
  senalQuien: 'quien',
  contestarGoto: 'n2',
  contestarLabel: 'Contestó la llamada',
  rechazarGoto: 'e_rechaza',
  rechazarLabel: 'Rechazó la llamada sin contestar',
}

const OPENING = [
  {
    texto:
      'Buenas noches, le llamo del área de monitoreo del Banco del Litoral. Recuerde que el banco no pide claves por teléfono.',
    senal: 'no-pide',
  },
  {
    texto: `Tenemos pendiente de confirmación un consumo de ochocientos noventa dólares en una tienda de Guayaquil, con su tarjeta terminada en ${IDENTITY_FAKE.tarjeta}. ¿Reconoce esa compra?`,
    senal: 'retenido',
  },
]

const CALL: ScreenView = {
  kind: 'call',
  quien: NUMBER,
  numero: 'Guayaquil, Ecuador',
  etiqueta: 'No está en tus contactos',
  senalQuien: 'quien',
  dialogo: OPENING,
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

const BLOCK: ScreenView = {
  ...CALL,
  dialogo: [
    ...OPENING,
    { texto: 'No, yo no hice esa compra.', mio: true },
    {
      texto:
        'Perfecto, entonces lo rechazamos y bloqueo la tarjeta ahora mismo. La nueva le llega a su agencia en tres días hábiles.',
    },
    {
      texto:
        'Le llegará un mensaje con un código de constancia. Consérvelo, no debe compartirlo.',
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
      texto: `Ya me llegó el mensaje, es ${CODE} por si lo necesita.`,
      goto: 'e_dicta',
      label: 'Dictó el código aunque le habían dicho que no lo hiciera',
    },
  ],
  colgarGoto: 'e_cuelga',
  colgarLabel: 'Colgó sin confirmar nada',
}

// Sin `volverGoto`: no hay lista a la que volver, el icono `Teléfono` ya
// restaura la llamada en curso (issue #251, mismo criterio que TarjetaBloqueada).
const MESSAGE: ScreenView = {
  kind: 'sms',
  sender: 'BancoLitoral',
  sub: 'Remitente verificado · mismo hilo de siempre',
  msgs: [
    {
      text: 'Banco del Litoral: consumo aprobado $12,40 FARMACIA SANA 28/07 11:02, tarjeta *4417.',
      time: '28 jul',
    },
    {
      text: `Banco del Litoral: retuvimos un consumo de $890,00 ELECTROSUR GYE con su tarjeta *${IDENTITY_FAKE.tarjeta}. Su código de constancia es <b>${CODE}</b>. Nunca se lo pediremos por teléfono.`,
      time: '21:06',
      senal: 'texto-codigo',
    },
  ],
}

const BANK: ScreenView = {
  kind: 'web',
  app: 'Banco del Litoral',
  appAccent: APP_ACCENTS.bank,
  url: 'bancolitoral.ec',
  secure: true,
  brand: 'Banca móvil',
  title: `Tarjeta *${IDENTITY_FAKE.tarjeta}`,
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

const HELD: ScreenView = {
  kind: 'web',
  app: 'Banco del Litoral',
  appAccent: APP_ACCENTS.bank,
  url: 'bancolitoral.ec',
  secure: true,
  brand: 'Consumos retenidos',
  title: 'ELECTROSUR GYE · $890,00',
  subtitle: 'Hoy, 21:04 · a la espera de tu confirmación.',
  datos: [
    { etiqueta: 'Estado', valor: 'Retenido, no cobrado', senal: 'consta' },
    { etiqueta: 'Tarjeta', valor: `Terminada en ${IDENTITY_FAKE.tarjeta}` },
    { etiqueta: 'Resultado', valor: 'Rechazado por ti · tarjeta bloqueada' },
  ],
  aviso:
    'Bloqueamos la tarjeta y la nueva llega a tu agencia en tres días. Recuerda: el código que te enviamos es tu constancia y no debes dictarlo a nadie.',
  fields: [],
  button: '',
}

const APPS: PhoneApp[] = [
  { Icono: Phone, texto: 'Teléfono', color: '#2f9e44', hilo: 'call' },
  {
    Icono: MessageSquareText,
    texto: 'Mensajes',
    color: '#1971c2',
    viewNode: 'n4',
    label: 'Abrió los mensajes durante la llamada',
  },
  {
    Icono: Wallet,
    texto: 'Banco del Litoral',
    color: APP_ACCENTS.bank,
    viewNode: 'n5',
    label: 'Abrió la app del banco durante la llamada',
  },
]

export const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: INCOMING },
  n2: { kind: 'scene', view: CALL },
  n3: {
    kind: 'scene',
    view: BLOCK,
    notificacion: {
      app: 'Mensajes',
      remitente: 'BancoLitoral',
      hora: '21:06',
      texto: `Banco del Litoral: retuvimos un consumo de $890,00 ELECTROSUR GYE con su tarjeta *${IDENTITY_FAKE.tarjeta}. Su código de constancia es ${CODE}. Nunca se lo pediremos por teléfono.`,
      goto: 'n4',
      label: 'Abrió la notificación del código de constancia',
    },
  },
  n4: { kind: 'scene', view: MESSAGE },
  n5: { kind: 'scene', view: BANK },
  e_rechaza: {
    kind: 'partial',
    view: INCOMING,
    verdict: 'Prudente, pero el problema seguía ahí',
    outcome:
      'No contestaste, y eso nunca cuesta dinero. Pero el consumo de $890 estaba retenido en la app esperando tu respuesta, y no lo miraste.',
    score: 50,
  },
  e_cuelga: {
    kind: 'partial',
    view: CALL,
    verdict: 'Colgaste bien, pero te quedaste a medias',
    outcome:
      'Colgar ante una llamada inesperada es correcto, y no perdiste nada. Pero alguien intentó gastar $890 con tu tarjeta, y colgar sin comprobar deja eso sin resolver.',
    score: 50,
  },
  e_devuelve: {
    kind: 'good',
    view: CALL,
    verdict: 'Acertaste · colgaste y llamaste tú',
    outcome:
      'Colgaste y marcaste tú el número del reverso: el banco rechazó el consumo. Lo gestionaste por un canal que elegiste tú, sin depender de adivinar quién llamaba.',
  },
  e_confirma: {
    kind: 'good',
    view: BLOCK,
    verdict: 'Acertaste · la llamada era legítima',
    outcome:
      'En este caso la llamada era del banco y el consumo quedó rechazado. Respondiste sobre la compra sin entregar claves ni códigos.',
  },
  e_dicta: {
    kind: 'bad',
    view: BLOCK,
    verdict: 'Llamada legítima, reacción peligrosa',
    outcome: 'La llamada era real, pero compartiste un código que debías conservar. Aquí no perdiste dinero; en otra llamada, compartir un código podría autorizar una operación sin que lo adviertas.',
    score: 0,
  },
  e_app: {
    kind: 'good',
    view: HELD,
    verdict: 'Acertaste · lo resolviste en tu canal',
    outcome:
      'En la app estaba el mismo consumo retenido: lo rechazaste ahí y la tarjeta quedó bloqueada. Lo resolviste en tu propio canal, sin depender de quién estaba al otro lado de la llamada.',
  },
}

const SIGNALS: Signal[] = [
  {
    id: 's1',
    targetId: 'no-pide',
    pantalla: 'n2',
    texto:
      '<b>No te piden claves.</b> Te preguntan si reconoces la compra. Esa advertencia, por sí sola, no identifica a quien llama.',
  },
  {
    id: 's3',
    targetId: 'retenido',
    pantalla: 'n2',
    texto:
      '<b>Dicen que el consumo está pendiente de confirmación.</b> Puedes comprobar su estado en la app del banco.',
  },
  {
    id: 's4',
    targetId: 'no-lo-de',
    pantalla: 'n3',
    texto:
      '<b>El código no se comparte.</b> Conservarlo evita entregarlo a otra persona; que quien llama lo recuerde no prueba su identidad.',
  },
  {
    id: 's5',
    targetId: 'texto-codigo',
    pantalla: 'n4',
    texto:
      '<b>El código es tu constancia</b>, no una clave. El mensaje repite que nunca te lo pedirán por teléfono.',
  },
  {
    id: 's6',
    targetId: 'consta',
    pantalla: 'e_app',
    texto:
      'El consumo <b>consta en la app</b>. Consultarlo en tu propio canal permite comprobar la operación y resolverla sin confiar en quien llama.',
  },
]

const RULE =
  'Regla de oro: <b>no compartas claves ni códigos por teléfono</b>. Comprueba cualquier consumo dudoso desde la app o el número de tu tarjeta.'

const SUMMARY = 'El banco llama para preguntarte si un consumo de $890 es tuyo.'

export const CONTEXT: Context = {
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

function BankConfirmation() {
  return (
    <ScenarioStory
      escenarioId="vishing/banco-confirma"
      resumen={SUMMARY}
      contexto={CONTEXT}
      story={STORY}
      senales={SIGNALS}
      rule={RULE}
      restartLabel="↻ Recibir la llamada otra vez"
      accionesEnPantalla
      apps={APPS}
      identidad={['tarjeta']}
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Es una llamada en vivo: hay alguien hablando al otro lado y espera tu respuesta cuando
          termine. Actúa sobre el teléfono como lo harías con el tuyo: contesta o rechaza, cuelga
          cuando quieras y usa <strong>cualquier app de abajo</strong>, incluso con la llamada
          abierta.
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

export default BankConfirmation
