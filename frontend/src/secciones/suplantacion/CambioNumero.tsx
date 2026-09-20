import { Images, MessageCircle, Phone, Wallet } from 'lucide-react'
import ScenarioStory, { type PhoneApp, type ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Signal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { ACCOUNT_FAKE } from '../../lib/identidadFicticia'

// Puerta de entrada del módulo. Todo el ataque consiste en no llamar al número guardado
// de siempre; la nota de voz no es adorno, es lo que hace "es mi hijo" en vez de solo texto.

const UNKNOWN = '+593 96 118 4402'
const NUMBER_ANDRES = '+593 99 845 2210'
const ACCOUNT_SCAM = '2200-4471-08 · Kevin Loor Zambrano'

const FIRST_MESSAGE = {
  text: 'Papi buenas, disculpa la hora 🙏 se me dañó el celular y perdí el chip. Este es mi número nuevo, soy Andrés. Guárdalo porfa.',
  time: '21:48',
  senal: 'mensaje',
}

const AUDIO = {
  text: 'Papi, tuve un problema: choqué el carro que me prestó un amigo y necesito depositar trescientos cincuenta dólares ahorita mismo para no meterme en un lío legal. No puedo hablar, estoy usando el celular de alguien.',
  time: '21:52',
  voz: '0:11',
  senal: 'audio',
}

const CHAT: ScreenView = {
  kind: 'sms',
  sender: UNKNOWN,
  sub: 'No está en tus contactos · toca para ver el perfil',
  senalRemitente: 'remitente',
  perfilGoto: 'n1b',
  perfilLabel: 'Abrió el perfil del contacto que le escribía',
  msgs: [FIRST_MESSAGE],
  respuestas: [
    { texto: '¿Qué pasó, hijo? Cuéntame.', goto: 'n2', label: 'Contestó al número desconocido' },
  ],
  volverGoto: 'e_ignora',
  volverLabel: 'Salió del chat sin contestar ni comprobar',
}

// La ficha donde está todo lo que hace falta para dudar: foto bajada de redes, cuenta de hace 2 días.
const PROFILE: ScreenView = {
  kind: 'web',
  app: 'Mensajes',
  url: 'perfil',
  secure: true,
  brand: 'Información del contacto',
  title: UNKNOWN,
  subtitle: 'No guardado en tu agenda.',
  datos: [
    {
      etiqueta: 'Foto de perfil',
      valor: 'La de Andrés, la misma que tiene puesta en sus redes',
      senal: 'foto',
    },
    { etiqueta: 'En esta app desde', valor: 'Hace 2 días', senal: 'antiguedad' },
    { etiqueta: 'Estado', valor: '"Disponible"' },
    { etiqueta: 'Grupos en común', valor: 'Ninguno', senal: 'antiguedad' },
  ],
  cerrarGoto: 'n1',
  cerrarLabel: 'Volvió al chat desde el perfil',
  fields: [],
  button: '',
}

const CHAT_AUDIO: ScreenView = {
  ...CHAT,
  msgs: [FIRST_MESSAGE, { text: '¿Qué pasó, hijo? Cuéntame.', time: '21:51', mine: true }, AUDIO],
  respuestas: [
    { texto: 'Ya mismo te transfiero, hijo.', goto: 'n3', label: 'Aceptó transferir el dinero' },
    { texto: 'Llámame, quiero oírte.', goto: 'n3b', label: 'Pidió que le llamara' },
    {
      texto: '¿Cómo se llamaba la perra que teníamos cuando eras chico?',
      goto: 'n4',
      label: 'Preguntó algo que solo su hijo sabría',
    },
  ],
}

const ACCOUNT: ScreenView = {
  ...CHAT,
  msgs: [
    ...(CHAT_AUDIO.kind === 'sms' ? CHAT_AUDIO.msgs : []),
    { text: 'Ya mismo te transfiero, hijo.', time: '21:53', mine: true },
    {
      text: `Gracias pa 🙏 deposita a esta cuenta: ${ACCOUNT_SCAM}. Es de mi amigo, la mía está bloqueada por lo del chip.`,
      time: '21:53',
      senal: 'cuenta',
    },
  ],
  respuestas: [
    {
      texto: 'Esa cuenta no está a tu nombre.',
      goto: 'n3c',
      label: 'Hizo notar que la cuenta era de otra persona',
    },
    {
      texto: 'Ya voy a transferir, dame un minuto.',
      goto: 'n6',
      label: 'Fue a transferir el dinero a la cuenta que le pasaron',
    },
  ],
}

const EXCUSE_ACCOUNT: ScreenView = {
  ...CHAT,
  msgs: [
    ...(ACCOUNT.kind === 'sms' ? ACCOUNT.msgs : []),
    { text: 'Esa cuenta no está a tu nombre.', time: '21:54', mine: true },
    {
      text: 'Ya te dije que es de mi amigo Kevin, él me está ayudando. Papi por favor apúrate que me están esperando 😭',
      time: '21:54',
      senal: 'prisa',
    },
  ],
  respuestas: [
    {
      texto: 'No te voy a mandar nada hasta hablar contigo.',
      goto: 'e_corta',
      label: 'Se negó a transferir sin hablar antes',
    },
    {
      texto: 'Está bien, ya te mando los 350.',
      goto: 'n6',
      label: 'Cedió y fue a transferir el dinero',
    },
  ],
}

const EXCUSE_CALL: ScreenView = {
  ...CHAT,
  msgs: [
    ...(CHAT_AUDIO.kind === 'sms' ? CHAT_AUDIO.msgs : []),
    { text: 'Llámame, quiero oírte.', time: '21:53', mine: true },
    {
      text: 'No puedo hablar pa, este celular no es mío y no tiene saldo. Solo puedo escribirte y mandarte audios 😔',
      time: '21:53',
      senal: 'no-llama',
    },
  ],
  respuestas: [
    {
      texto: '¿Cómo se llamaba la perra que teníamos cuando eras chico?',
      goto: 'n4',
      label: 'Preguntó algo que solo su hijo sabría',
    },
    {
      texto: 'Bueno hijo, dame la cuenta y te mando.',
      goto: 'n3',
      label: 'Aceptó transferir sin haber podido hablar con él',
    },
  ],
}

// Prueba que ninguna suplantación pasa: quien escribe no tiene forma de saberlo, así que esquiva.
const TEST: ScreenView = {
  ...CHAT,
  msgs: [
    ...(CHAT_AUDIO.kind === 'sms' ? CHAT_AUDIO.msgs : []),
    {
      text: '¿Cómo se llamaba la perra que teníamos cuando eras chico?',
      time: '21:53',
      mine: true,
    },
    {
      text: 'Papi no es momento de juegos, estoy en un problema serio. ¿Me vas a ayudar o no? 😡',
      time: '21:54',
      senal: 'esquiva',
    },
  ],
  respuestas: [
    {
      texto: 'No te voy a mandar nada hasta hablar contigo.',
      goto: 'e_corta',
      label: 'Se negó a transferir sin hablar antes',
    },
    {
      texto: 'Ya, perdón hijo. Dame la cuenta.',
      goto: 'n3',
      label: 'Se disculpó y aceptó transferir',
    },
  ],
}

// Llamar al número de siempre es la comprobación entera, a un icono de distancia.
const CONTACTS: ScreenView = {
  kind: 'web',
  app: 'Teléfono',
  url: 'contactos',
  secure: true,
  brand: 'Contactos',
  title: 'Tu agenda',
  opciones: [
    {
      texto: 'Andrés · Hijo',
      detalle: `${NUMBER_ANDRES} · el número que siempre has tenido guardado`,
      goto: 'e_verifica',
      label: 'Llamó a su hijo al número de siempre',
    },
    { texto: 'Casa', detalle: '02 244 1180' },
    { texto: 'Farmacia La Espiga', detalle: '+593 98 220 3311' },
    { texto: 'Taller Vélez', detalle: '+593 99 100 4477' },
  ],
  fields: [],
  button: '',
}

const CALL_SON: ScreenView = {
  kind: 'call',
  quien: 'Andrés · Hijo',
  numero: NUMBER_ANDRES,
  etiqueta: 'Guardado en tus contactos',
  dialogo: [
    {
      texto:
        '¿Aló, papi? No, yo estoy en la casa, acabo de cenar. Mi celular está bien y no cambié de número. ¿Quién te escribió?',
      senal: 'contesta',
    },
  ],
  colgarGoto: undefined,
}

const BANK: ScreenView = {
  kind: 'web',
  app: 'Banco del Litoral',
  url: 'bancolitoral.ec',
  secure: true,
  brand: 'Banca móvil',
  title: 'Tus cuentas',
  subtitle: `${ACCOUNT_FAKE} · disponible $980,20`,
  opciones: [
    {
      texto: 'Transferir',
      detalle: 'A cuentas propias o de terceros',
      goto: 'n7',
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
    { etiqueta: 'Titular', valor: 'Kevin Loor Zambrano' },
    { etiqueta: 'Valor', valor: '$350,00' },
  ],
  aviso: 'Las transferencias enviadas no se pueden reversar.',
  button: 'Transferir $350,00',
  botonGoto: 'e_paga',
  botonLabel: 'Transfirió los $350 a la cuenta que le pasaron por el chat',
  cerrarGoto: 'n6',
  cerrarLabel: 'Volvió atrás sin transferir',
  fields: [],
}

const APPS: PhoneApp[] = [
  { Icono: MessageCircle, texto: 'Mensajes', color: '#2f9e44', hilo: 'sms' },
  {
    Icono: Phone,
    texto: 'Teléfono',
    color: '#1971c2',
    viewNode: 'n5',
    label: 'Abrió la agenda para llamar por su cuenta',
  },
  {
    Icono: Wallet,
    texto: 'Banco del Litoral',
    color: '#155e75',
    viewNode: 'n6',
    label: 'Abrió la app del banco',
  },
  { Icono: Images, texto: 'Galería', color: '#c2410c', relleno: 'galeria' },
]

export const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: CHAT },
  n1b: { kind: 'scene', view: PROFILE },
  n2: { kind: 'scene', view: CHAT_AUDIO },
  n3: { kind: 'scene', view: ACCOUNT },
  n3b: { kind: 'scene', view: EXCUSE_CALL },
  n3c: { kind: 'scene', view: EXCUSE_ACCOUNT },
  n4: { kind: 'scene', view: TEST },
  n5: { kind: 'scene', view: CONTACTS },
  n6: { kind: 'scene', view: BANK },
  n7: { kind: 'scene', view: TRANSFER },
  e_paga: {
    kind: 'bad',
    view: TRANSFER,
    verdict: 'Caíste en la suplantación',
    outcome:
      'Los $350 salieron a un desconocido y no se pueden reversar. Andrés estaba en casa: la foto y la voz eran suyas, pero clonadas con un programa.',
  },
  e_verifica: {
    kind: 'good',
    view: CALL_SON,
    verdict: 'No caíste · llamaste al número de siempre',
    outcome:
      'Andrés contestó de inmediato en su número de siempre: no había pasado nada. Un toque en la agenda desmonta el engaño, por eso el mensaje insistía tanto en que no llames.',
  },
  e_corta: {
    kind: 'good',
    view: TEST,
    verdict: 'No caíste · no mandaste nada',
    outcome:
      'Te plantaste: sin hablar con tu hijo, no hubo transferencia. No hizo falta demostrar nada, basta con no mandarle dinero a una voz sin rostro.',
  },
  e_ignora: {
    kind: 'partial',
    view: CHAT,
    verdict: 'No perdiste nada, pero te quedaste con la duda',
    outcome:
      'Saliste del chat sin contestar, así que no hubo daño. Pero tampoco comprobaste nada, y esa duda se resuelve llamando al número que ya tenías guardado.',
    score: 50,
  },
}

const SIGNALS: Signal[] = [
  {
    id: 's1',
    targetId: 'remitente',
    pantalla: 'n1',
    texto:
      '<b>Escribe un número que no tienes guardado.</b> Decir ser tu hijo es justo lo que falta comprobar.',
  },
  {
    id: 's2',
    targetId: 'foto',
    pantalla: 'n1b',
    texto:
      '<b>La foto de perfil es de Andrés, bajada de sus redes.</b> Cualquiera puede descargarla.',
  },
  {
    id: 's3',
    targetId: 'antiguedad',
    pantalla: 'n1b',
    texto:
      '<b>La cuenta se creó hace dos días.</b> No comparte ningún grupo contigo.',
  },
  {
    id: 's4',
    targetId: 'audio',
    pantalla: 'n2',
    texto:
      '<b>La voz se clona con unos segundos de audio.</b> Sonar igual ya no prueba nada.',
  },
  {
    id: 's5',
    targetId: 'no-llama',
    pantalla: 'n3b',
    texto:
      '<b>Siempre hay una excusa para no poder hablar.</b> Una llamada en vivo los delata.',
  },
  {
    id: 's6',
    targetId: 'cuenta',
    pantalla: 'n3',
    texto:
      '<b>La cuenta es de otra persona</b>, nunca de quien dice necesitar el dinero.',
  },
  {
    id: 's7',
    targetId: 'esquiva',
    pantalla: 'n4',
    texto:
      '<b>No puede responder algo que solo tu hijo sabría.</b> Se enoja y evade la pregunta.',
  },
]

const RULE =
  'Regla de oro: <b>llama tú al número de siempre antes de mandar nada</b>. Una foto y hasta una voz se copian; una llamada a tu propia agenda, no.'

const SUMMARY = 'Un número desconocido dice ser tu hijo, que perdió el celular, y pide dinero.'

const CONTEXT: Context = {
  antes: (
    <>
      Tu hijo <strong>Andrés</strong> vive fuera de casa y hablan casi a diario. Tienes su número
      guardado desde siempre.
    </>
  ),
  ahora: (
    <>
      <strong>Casi a las diez de la noche</strong> te escribe un número que no conoces, diciendo que
      es él.
    </>
  ),
}

function NumberChange() {
  return (
    <ScenarioStory
      escenarioId="suplantacion/cambio-numero"
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
          Actúa sobre el teléfono como lo harías con el tuyo: contesta, toca el nombre del contacto
          para ver su perfil, escucha la nota de voz y usa{' '}
          <strong>cualquier app de abajo</strong>.
        </p>
      }
      pista={
        <p>
          Puedes seguirle la conversación, mirar quién te escribe, salir del chat, hacer lo que te
          pide desde la app del banco o llamar por tu cuenta a quien dice ser. Cuál de ellos es el
          acertado es justamente lo que decides tú.
        </p>
      }
    />
  )
}

export default NumberChange
