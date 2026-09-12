import { Camera, MessageCircle, MessageSquareText, Phone } from 'lucide-react'
import ScenarioStory, { type PhoneApp, type ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Signal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'

// Lo que está en juego no es dinero sino la cuenta: ese código abre tu mensajería en otro
// teléfono. Quien lo pide ya robó la cuenta de tu prima y usa su chat para repetirlo contigo.

const COUSIN = 'Gaby'
const NUMBER_COUSIN = '+593 98 331 5507'
const CODE = '418-207'

const HISTORY = [
  { text: '¿Al final vienes el domingo donde mi mamá? 🥘', time: '5 ago' },
  { text: 'Ahí estaré, llevo el postre', time: '5 ago', mine: true },
]

const ORDER = {
  text: 'Primaaa, ayúdame con algo rápido 🙏 me estoy cambiando de celular y puse mal mi número: el código de verificación te llegó a ti. ¿Me lo pasas porfa? Son 6 números.',
  time: '20:14',
  senal: 'pide-codigo',
}

const CHAT: ScreenView = {
  kind: 'sms',
  sender: COUSIN,
  sub: `${NUMBER_COUSIN} · guardada en tus contactos`,
  senalRemitente: 'remitente',
  msgs: [...HISTORY, ORDER],
  respuestas: [
    { texto: 'Deja veo si me llegó algo.', goto: 'n2', label: 'Fue a buscar el mensaje del código' },
    {
      texto: '¿Y por qué me llegaría a mí un código tuyo?',
      goto: 'n2b',
      label: 'Preguntó por qué le llegaría a él un código de otra persona',
    },
  ],
  volverGoto: 'e_ignora',
  volverLabel: 'Salió del chat sin contestar ni comprobar',
}

const MESSAGES: ScreenView = {
  kind: 'web',
  app: 'SMS',
  url: 'sms',
  secure: true,
  brand: 'SMS · Recibidos',
  title: 'Hoy',
  datos: [
    {
      etiqueta: '20:13 · Verificación',
      valor: `Tu código es ${CODE}. No lo compartas con nadie. Si no lo pediste, alguien está intentando entrar a tu cuenta.`,
      senal: 'texto-codigo',
    },
    { etiqueta: '18:40 · Farmacia', valor: 'Tu receta está lista para retiro.' },
    { etiqueta: 'Ayer · Operadora', valor: 'Consumo del mes disponible en tu app.' },
  ],
  aviso:
    'Ese código llegó a tu número porque alguien está pidiendo entrar a TU cuenta desde otro teléfono. Nadie más lo necesita, y nadie más lo puede usar sin ti.',
  cerrarGoto: 'n3',
  cerrarLabel: 'Volvió al chat después de leer el código',
  fields: [],
  button: '',
}

const INSISTS: ScreenView = {
  ...CHAT,
  msgs: [
    ...HISTORY,
    ORDER,
    { text: '¿Y por qué me llegaría a mí un código tuyo?', time: '20:15', mine: true },
    {
      text: 'Porque me equivoqué en un dígito al escribir mi número, prima 🙈 el sistema lo mandó al tuyo. Pásamelo rapidito que se vence.',
      time: '20:15',
      senal: 'excusa',
    },
  ],
  respuestas: [
    { texto: 'Deja veo si me llegó algo.', goto: 'n2', label: 'Fue a buscar el mensaje del código' },
    {
      texto: 'Ese código es de mi cuenta, no te lo puedo pasar.',
      goto: 'e_niega',
      label: 'Se negó a pasar el código',
    },
  ],
}

const WITH_CODE: ScreenView = {
  ...CHAT,
  msgs: [
    ...HISTORY,
    ORDER,
    { text: 'Deja veo si me llegó algo.', time: '20:16', mine: true },
    {
      text: '¿Ya? Pásamelo porfa, que ese código se vence en un ratito y me quedo sin WhatsApp 😩',
      time: '20:17',
      senal: 'prisa',
    },
  ],
  respuestas: [
    { texto: `Te paso: ${CODE}`, goto: 'e_codigo', label: 'Le pasó el código por el chat' },
    {
      texto: 'El mensaje dice que no lo comparta con nadie.',
      goto: 'e_niega',
      label: 'Se negó a pasar el código tras leer la advertencia',
    },
  ],
}

const CONTACTS: ScreenView = {
  kind: 'web',
  app: 'Teléfono',
  url: 'contactos',
  secure: true,
  brand: 'Contactos',
  title: 'Tu agenda',
  opciones: [
    {
      texto: `${COUSIN} · Prima`,
      detalle: `${NUMBER_COUSIN} · su número de siempre`,
      goto: 'e_llama',
      label: 'Llamó a su prima en vez de pasarle el código',
    },
    { texto: 'Mamá', detalle: '+593 99 445 1120' },
    { texto: 'Casa', detalle: '02 244 1180' },
    { texto: 'Trabajo', detalle: '02 380 1100' },
  ],
  fields: [],
  button: '',
}

const CALL_COUSIN: ScreenView = {
  kind: 'call',
  quien: `${COUSIN} · Prima`,
  numero: NUMBER_COUSIN,
  etiqueta: 'Guardada en tus contactos',
  dialogo: [
    {
      texto:
        '¿Aló? Prima, no, yo no te he escrito nada. Me quedé sin WhatsApp desde anoche, creo que me robaron la cuenta. No le pases ningún código a nadie.',
      rol: 'mujer',
      senal: 'contesta',
    },
  ],
}

const APPS: PhoneApp[] = [
  { Icono: MessageCircle, texto: 'Mensajes', color: '#2f9e44', hilo: 'sms' },
  {
    Icono: MessageSquareText,
    texto: 'SMS',
    color: '#7048e8',
    goto: 'n2',
    label: 'Abrió SMS para ver el código',
  },
  {
    Icono: Phone,
    texto: 'Teléfono',
    color: '#1971c2',
    goto: 'n4',
    label: 'Abrió la agenda para llamar por su cuenta',
  },
  {
    Icono: Camera,
    texto: 'Cámara',
    color: '#495057',
    vacia: 'La cámara está lista. No hay nada que fotografiar en este momento.',
  },
]

export const STORY: Story<ScreenNode> = {
  n1: {
    kind: 'scene',
    view: CHAT,
    // El código llegó un minuto antes que el chat de la prima, como en la
    // vida real: alguien acaba de pedir entrar a tu cuenta con tu número.
    notificacion: {
      app: 'Verificación',
      remitente: 'Verificación',
      hora: '20:13',
      texto: `Tu código es ${CODE}. No lo compartas con nadie. Si no lo pediste, alguien está intentando entrar a tu cuenta.`,
      goto: 'n2',
      label: 'Abrió la notificación del código de verificación',
    },
  },
  n2: { kind: 'scene', view: MESSAGES },
  n2b: { kind: 'scene', view: INSISTS },
  n3: { kind: 'scene', view: WITH_CODE },
  n4: { kind: 'scene', view: CONTACTS },
  e_codigo: {
    kind: 'bad',
    view: WITH_CODE,
    verdict: 'Caíste en la suplantación',
    outcome:
      'Ese código no era de tu prima: era el de tu propia cuenta. Con él entraron a tu mensajería desde otro teléfono, te sacaron de la sesión y empezaron a escribirle a toda tu agenda pidiendo plata con tu nombre y tu foto. A Gaby le habían hecho exactamente lo mismo la noche anterior, y por eso el mensaje llegó desde su chat.',
  },
  e_niega: {
    kind: 'good',
    view: WITH_CODE,
    verdict: 'No caíste · el código no se pasa',
    outcome:
      'No lo mandaste, y con eso bastó: sin ese número nadie puede abrir tu cuenta en otro teléfono. El mensaje lo decía en su propio texto, y la regla no tiene excepciones ni siquiera para la familia.',
  },
  e_llama: {
    kind: 'good',
    view: CALL_COUSIN,
    verdict: 'No caíste · la llamaste',
    outcome:
      'Gaby contestó y te contó que le habían robado el WhatsApp la noche anterior: quien te escribía era el ladrón, desde su cuenta. Una llamada resolvió las dos cosas, no perder tu cuenta y avisarle a ella.',
  },
  e_ignora: {
    kind: 'partial',
    view: CHAT,
    verdict: 'No perdiste nada, pero quedó a medias',
    outcome:
      'Saliste del chat sin mandar el código, que es lo importante. Pero no avisaste a tu prima de que están usando su cuenta, y a los demás de la familia les está llegando el mismo mensaje ahora mismo.',
    score: 50,
  },
}

const SIGNALS: Signal[] = [
  {
    id: 's1',
    targetId: 'pide-codigo',
    pantalla: 'n1',
    texto:
      'Te pide un <b>código de verificación</b>. Si llegó a tu teléfono, es tuyo: nadie más lo necesita.',
  },
  {
    id: 's2',
    targetId: 'texto-codigo',
    pantalla: 'n2',
    texto:
      'El mensaje lo advierte: <b>no lo compartas</b>. Si no lo pediste, alguien quiere entrar a tu cuenta.',
  },
  {
    id: 's3',
    targetId: 'excusa',
    pantalla: 'n2b',
    texto:
      '"Me equivoqué en un dígito" <b>no es posible</b>: el código llega al número que se escribió.',
  },
  {
    id: 's4',
    targetId: 'prisa',
    pantalla: 'n3',
    texto:
      'Mete <b>prisa con el vencimiento</b> para que no te dé tiempo de leer el mensaje ni de llamar.',
  },
  {
    id: 's5',
    targetId: 'remitente',
    pantalla: 'n1',
    texto:
      'Escribe desde el <b>chat de siempre de tu prima</b>: le robaron la cuenta. El remitente auténtico no dice quién escribe.',
  },
  {
    id: 's6',
    targetId: 'contesta',
    pantalla: 'e_llama',
    texto:
      'Una <b>llamada</b> lo aclaró en diez segundos, y Gaby se enteró del robo de su cuenta.',
  },
]

const RULE =
  'Regla de oro: un código de verificación <b>no se comparte con nadie, nunca</b>, ni con tu familia. Si te llegó a ti, es tuyo, y quien lo pide está intentando entrar a tu cuenta desde otro teléfono.'

const SUMMARY = 'Tu prima pide que le pases un código de seis dígitos que te llegó por error.'

const CONTEXT: Context = {
  antes: (
    <>
      <strong>Gaby</strong> es tu prima y se escriben casi todas las semanas por el{' '}
      <strong>mismo chat</strong>, con su número guardado hace años.
    </>
  ),
  ahora: (
    <>
      <strong>Una noche</strong> te pide un favor pequeño: pasarle un código que, según ella, le
      llegó a tu teléfono por equivocación.
    </>
  ),
}

function SharedCode() {
  return (
    <ScenarioStory
      escenarioId="suplantacion/codigo-prestado"
      resumen={SUMMARY}
      contexto={CONTEXT}
      story={STORY}
      senales={SIGNALS}
      rule={RULE}
      restartLabel="↻ Repetir el escenario"
      accionesEnPantalla
      apps={APPS}
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Actúa sobre el teléfono como lo harías con el tuyo: contesta en el chat, mira tus mensajes
          de texto y usa <strong>cualquier app de abajo</strong>.
        </p>
      }
      pista={
        <p>
          Puedes seguirle la conversación, ir a leer el mensaje que te llegó, salir del chat o
          llamar a tu prima por tu cuenta. Fíjate en de quién es ese código.
        </p>
      }
    />
  )
}

export default SharedCode
