import { Images, MessageCircle, Phone, Wallet } from 'lucide-react'
import ScenarioStory, { type PhoneApp, type ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Signal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { ACCOUNT_FAKE } from '../../lib/identidadFicticia'

// El más difícil del módulo: la cuenta es de verdad, quien escribe no (le robaron el WhatsApp).
// La señal es que quien escribe evita las dos comprobaciones que no puede imitar: llamada y audio.

const FRIEND = 'Byron Mendoza'
const NUMBER_BYRON = '+593 98 447 1093'
const ACCOUNT_SCAM = '4410-2287-63 · Wilmer Chalá Ordóñez'

const HISTORY = [
  { text: 'Bro, ¿al final vas el sábado al partido? 😄', time: '12 ago' },
  { text: 'Sí men, paso por ti a las 3', time: '12 ago', mine: true },
  { text: 'Listo 🙌', time: '12 ago' },
]

const ORDER = {
  text: 'Bro, ayúdame porfa. Estoy con mi mamá en emergencia y necesito $180 para unos exámenes. No puedo hablar ni mandar audios; estoy adentro.',
  time: '17:41',
  separador: 'HOY',
  senal: 'escritura',
}

const CHAT: ScreenView = {
  kind: 'sms',
  sender: FRIEND,
  sub: 'Guardado en tus contactos · mismo chat de siempre',
  senalRemitente: 'remitente',
  perfilGoto: 'n1b',
  perfilLabel: 'Abrió el perfil del contacto',
  msgs: [...HISTORY, ORDER],
  respuestas: [
    {
      texto: 'Claro men, ¿a qué cuenta te mando?',
      goto: 'n2',
      label: 'Aceptó mandarle el dinero',
    },
    {
      texto: 'Uy, qué pasó. Te llamo ahorita.',
      goto: 'n2b',
      label: 'Dijo que le iba a llamar',
    },
  ],
  volverGoto: 'e_ignora',
  volverLabel: 'Salió del chat sin contestar ni comprobar',
}

/// La ficha no delata nada, y eso es lo importante: es la cuenta de siempre.
/// Quien mira aquí buscando la señal se va con las manos vacías.
const PROFILE: ScreenView = {
  kind: 'web',
  app: 'Mensajes',
  url: 'perfil',
  secure: true,
  brand: 'Información del contacto',
  title: FRIEND,
  subtitle: 'Guardado en tu agenda como "Byron 🏀".',
  datos: [
    { etiqueta: 'Número', valor: `${NUMBER_BYRON} · el de siempre`, senal: 'todo-cuadra' },
    { etiqueta: 'En esta app desde', valor: '2019', senal: 'todo-cuadra' },
    { etiqueta: 'Grupos en común', valor: '3 · "Los del barrio", "Partido sábados", "Promo 2011"' },
    { etiqueta: 'Foto de perfil', valor: 'La suya de siempre, sin cambios recientes' },
  ],
  cerrarGoto: 'n1',
  cerrarLabel: 'Volvió al chat desde el perfil',
  fields: [],
  button: '',
}

const ACCOUNT: ScreenView = {
  ...CHAT,
  msgs: [
    ...HISTORY,
    ORDER,
    { text: 'Claro men, ¿a qué cuenta te mando?', time: '17:43', mine: true },
    {
      text: `Gracias bro. Transfiéreme a esta cuenta, es de mi cuñado porque la mía no está funcionando: ${ACCOUNT_SCAM}. Te devuelvo apenas pueda.`,
      time: '17:44',
      senal: 'cuenta',
    },
  ],
  respuestas: [
    {
      texto: '¿Y por qué no a la tuya? Te llamo mejor.',
      goto: 'n2b',
      label: 'Preguntó por la cuenta de otra persona y quiso llamar',
    },
    {
      texto: 'Listo bro, ya te mando.',
      goto: 'n5',
      label: 'Fue a transferir el dinero a la cuenta que le pasaron',
    },
  ],
}

const CANNOT_TALK: ScreenView = {
  ...CHAT,
  msgs: [
    ...HISTORY,
    ORDER,
    { text: 'Uy, qué pasó. Te llamo ahorita.', time: '17:43', mine: true },
    {
      text: 'Te dije que no puedo hablar ni mandar audios; estoy adentro. Mejor coordinemos por aquí.',
      time: '17:44',
      senal: 'no-llama',
    },
  ],
  respuestas: [
    {
      texto: 'Mándame un audio entonces.',
      goto: 'n3',
      label: 'Le pidió una nota de voz',
    },
    {
      texto: 'Te llamo igual, contéstame.',
      goto: 'e_llama',
      label: 'Insistió en llamarle en vez de seguir escribiendo',
    },
  ],
}

const WITHOUT_AUDIO: ScreenView = {
  ...CHAT,
  msgs: [
    ...HISTORY,
    ORDER,
    { text: 'Mándame un audio entonces.', time: '17:45', mine: true },
    {
      text: 'Tampoco puedo grabar audios aquí adentro. Amigo, es urgente, mi madre está esperando por los exámenes. ¿Me ayudas o no?',
      time: '17:46',
      senal: 'sin-audio',
    },
  ],
  respuestas: [
    {
      texto: 'Voy a llamarte de todas formas.',
      goto: 'e_llama',
      label: 'Decidió llamarle en vez de seguir escribiendo',
    },
    {
      texto: 'Ya bro, tranquilo, te mando la plata.',
      goto: 'n2',
      label: 'Aceptó mandar el dinero sin haber podido oírle',
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
      texto: 'Byron 🏀',
      detalle: `${NUMBER_BYRON} · el mismo número desde hace años`,
      goto: 'e_llama',
      label: 'Llamó a su amigo en vez de seguir escribiendo',
    },
    { texto: 'Casa', detalle: '02 244 1180' },
    { texto: 'Trabajo', detalle: '02 380 1100' },
    { texto: 'Taller Vélez', detalle: '+593 99 100 4477' },
  ],
  fields: [],
  button: '',
}

const CALL_BYRON: ScreenView = {
  kind: 'call',
  quien: 'Byron 🏀',
  numero: NUMBER_BYRON,
  etiqueta: 'Guardado en tus contactos',
  dialogo: [
    {
      texto:
        '¡Bro! Qué bueno que llamas. Me robaron el WhatsApp anoche, están escribiéndole a todo el mundo pidiendo plata en mi nombre. Mi mamá está bien, yo estoy en la casa. No mandes nada.',
      senal: 'contesta',
    },
  ],
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
    { etiqueta: 'Titular', valor: 'Wilmer Chalá Ordóñez' },
    { etiqueta: 'Valor', valor: '$180,00' },
  ],
  aviso: 'Las transferencias enviadas no se pueden reversar.',
  button: 'Transferir $180,00',
  botonGoto: 'e_paga',
  botonLabel: 'Transfirió los $180 a la cuenta que le pasaron por el chat',
  cerrarGoto: 'n5',
  cerrarLabel: 'Volvió atrás sin transferir',
  fields: [],
}

const APPS: PhoneApp[] = [
  { Icono: MessageCircle, texto: 'Mensajes', color: '#2f9e44', hilo: 'sms' },
  {
    Icono: Phone,
    texto: 'Teléfono',
    color: '#1971c2',
    viewNode: 'n4',
    label: 'Abrió la agenda para llamar por su cuenta',
  },
  {
    Icono: Wallet,
    texto: 'Banco del Litoral',
    color: '#155e75',
    viewNode: 'n5',
    label: 'Abrió la app del banco',
  },
  { Icono: Images, texto: 'Galería', color: '#c2410c', relleno: 'galeria' },
]

export const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: CHAT },
  n1b: { kind: 'scene', view: PROFILE },
  n2: { kind: 'scene', view: ACCOUNT },
  n2b: { kind: 'scene', view: CANNOT_TALK },
  n3: { kind: 'scene', view: WITHOUT_AUDIO },
  n4: { kind: 'scene', view: CONTACTS },
  n5: { kind: 'scene', view: BANK },
  n6: { kind: 'scene', view: TRANSFER },
  e_paga: {
    kind: 'bad',
    view: TRANSFER,
    verdict: 'Caíste en la suplantación',
    outcome:
      'Los $180 se fueron a un desconocido. A Byron le robaron el WhatsApp esa noche, y todo en el chat era auténtico salvo la voz, que nunca pudiste oír.',
  },
  e_llama: {
    kind: 'good',
    view: CALL_BYRON,
    verdict: 'No caíste · lo llamaste',
    outcome:
      'Byron contestó al primer timbre: le habían robado la cuenta esa madrugada. La llamada fue lo único que servía, porque el chat, el número y la foto eran de verdad.',
  },
  e_ignora: {
    kind: 'partial',
    view: CHAT,
    verdict: 'No perdiste nada, pero era tu amigo',
    outcome:
      'Saliste del chat sin mandar dinero, así que no perdiste nada. Pero tampoco te enteraste de que le robaron la cuenta a Byron ni pudiste avisarle.',
    score: 50,
  },
}

const SIGNALS: Signal[] = [
  {
    id: 's1',
    targetId: 'escritura',
    pantalla: 'n1',
    texto:
      '<b>Te corta las dos formas de comprobarlo.</b> No puede hablar ni mandar audios desde el primer mensaje.',
  },
  {
    id: 's2',
    targetId: 'todo-cuadra',
    pantalla: 'n1b',
    texto:
      '<b>En la ficha todo cuadra: mismo número, misma foto, mismos grupos.</b> Aquí no hay nada que mirar.',
  },
  {
    id: 's3',
    targetId: 'cuenta',
    pantalla: 'n2',
    texto:
      '<b>La cuenta de destino es de otra persona.</b> Es lo único del mensaje que no es de tu amigo.',
  },
  {
    id: 's4',
    targetId: 'no-llama',
    pantalla: 'n2b',
    texto:
      '<b>No puede atender una llamada.</b> Quien robó la cuenta tiene el chat, pero no tu amigo la voz.',
  },
  {
    id: 's5',
    targetId: 'sin-audio',
    pantalla: 'n3',
    texto:
      '<b>Tampoco puede mandar una nota de voz.</b> Dos excusas seguidas para no dejarse oír es la señal completa.',
  },
  {
    id: 's6',
    targetId: 'contesta',
    pantalla: 'e_llama',
    texto:
      '<b>La llamada lo resolvió en diez segundos.</b> Byron se enteró así de que le habían robado la cuenta.',
  },
]

const RULE =
  'Regla de oro: <b>el número y la foto de siempre no prueban nada, las cuentas se roban.</b> Llama antes de mandar dinero por chat.'

const SUMMARY = 'Un amigo te escribe desde su chat de siempre pidiendo dinero por una urgencia.'

export const CONTEXT: Context = {
  antes: (
    <>
      <strong>Byron</strong> es amigo tuyo desde el colegio. Tienes su número guardado hace años y
      se escriben casi cada semana por el <strong>mismo chat</strong>.
    </>
  ),
  ahora: (
    <>
      <strong>Un miércoles por la tarde</strong> te escribe pidiendo dinero prestado por una
      urgencia médica.
    </>
  ),
}

function HackedAccount() {
  return (
    <ScenarioStory
      escenarioId="suplantacion/cuenta-hackeada"
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
          Actúa sobre el teléfono como lo harías con el tuyo: contesta, mira el perfil del contacto
          y usa <strong>cualquier app de abajo</strong>.
        </p>
      }
      pista={
        <p>
          Puedes seguir la conversación, revisar quién te escribe, salir del chat, prestarle el
          dinero desde la app del banco o llamarle por tu cuenta. Fíjate en cómo está escrito el
          mensaje.
        </p>
      }
    />
  )
}

export default HackedAccount
