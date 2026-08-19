import { Camera, MessageCircle, Phone, Wallet } from 'lucide-react'
import StoryEscenario, { type AppTelefono, type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { CUENTA_FICTICIA } from '../../lib/identidadFicticia'

/**
 * El más difícil del módulo: la cuenta es de verdad, quien escribe no.
 *
 * Todo lo que enseñan los otros escenarios sale bien aquí. El número está
 * guardado desde hace años, la foto es la suya, el historial de la
 * conversación es real y no hay ninguna cuenta nueva que mirar. Le robaron el
 * WhatsApp a Byron, y quien escribe es quien se lo robó.
 *
 * Lo único que queda para dudar es lo que no se puede robar: cómo escribe una
 * persona, y su voz. Por eso el escenario premia llamar y castiga confiar en
 * que "el número es el suyo".
 */

const AMIGO = 'Byron Mendoza'
const NUMERO_BYRON = '+593 98 447 1093'
const CUENTA_ESTAFA = '4410-2287-63 · Wilmer Chalá Ordóñez'

const HISTORIAL = [
  { text: 'Bro, ¿al final vas el sábado al partido? 😄', time: '12 ago' },
  { text: 'Sí men, paso por ti a las 3', time: '12 ago', mine: true },
  { text: 'Listo 🙌', time: '12 ago' },
]

const PEDIDO = {
  text: 'Estimado amigo, buenas tardes. Necesito solicitarte un favor urgente: estoy en el hospital con mi madre y requiero 180 dólares para poder cancelar unos exámenes. ¿Me podrías ayudar?',
  time: '17:41',
  senal: 'escritura',
}

const CHAT: ScreenView = {
  kind: 'sms',
  sender: AMIGO,
  sub: 'Guardado en tus contactos · mismo chat de siempre',
  senalRemitente: 'remitente',
  perfilGoto: 'n1b',
  perfilLabel: 'Abrió el perfil del contacto',
  msgs: [...HISTORIAL, PEDIDO],
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
const PERFIL: ScreenView = {
  kind: 'web',
  app: 'Mensajes',
  url: 'perfil',
  secure: true,
  brand: 'Información del contacto',
  title: AMIGO,
  subtitle: 'Guardado en tu agenda como "Byron 🏀".',
  datos: [
    { etiqueta: 'Número', valor: `${NUMERO_BYRON} · el de siempre`, senal: 'todo-cuadra' },
    { etiqueta: 'En esta app desde', valor: '2019', senal: 'todo-cuadra' },
    { etiqueta: 'Grupos en común', valor: '3 · "Los del barrio", "Partido sábados", "Promo 2011"' },
    { etiqueta: 'Foto de perfil', valor: 'La suya de siempre, sin cambios recientes' },
  ],
  cerrarGoto: 'n1',
  cerrarLabel: 'Volvió al chat desde el perfil',
  fields: [],
  button: '',
}

const CUENTA: ScreenView = {
  ...CHAT,
  msgs: [
    ...HISTORIAL,
    PEDIDO,
    { text: 'Claro men, ¿a qué cuenta te mando?', time: '17:43', mine: true },
    {
      text: `Te agradezco muchísimo. La transferencia va a esta cuenta: ${CUENTA_ESTAFA}. Es de mi cuñado, la mía tiene un inconveniente con el banco en este momento.`,
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

const NO_PUEDE_HABLAR: ScreenView = {
  ...CHAT,
  msgs: [
    ...HISTORIAL,
    PEDIDO,
    { text: 'Uy, qué pasó. Te llamo ahorita.', time: '17:43', mine: true },
    {
      text: 'No es posible en este momento, estoy dentro del área de emergencia y no permiten llamadas. Prefiero que coordinemos por este medio.',
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

const SIN_AUDIO: ScreenView = {
  ...CHAT,
  msgs: [
    ...HISTORIAL,
    PEDIDO,
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

const AGENDA: ScreenView = {
  kind: 'web',
  app: 'Teléfono',
  url: 'contactos',
  secure: true,
  brand: 'Contactos',
  title: 'Tu agenda',
  opciones: [
    {
      texto: 'Byron 🏀',
      detalle: `${NUMERO_BYRON} · el mismo número desde hace años`,
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

const LLAMADA_BYRON: ScreenView = {
  kind: 'call',
  quien: 'Byron 🏀',
  numero: NUMERO_BYRON,
  etiqueta: 'Guardado en tus contactos',
  dialogo: [
    {
      texto:
        '¡Bro! Qué bueno que llamas. Me robaron el WhatsApp anoche, están escribiéndole a todo el mundo pidiendo plata en mi nombre. Mi mamá está bien, yo estoy en la casa. No mandes nada.',
      senal: 'contesta',
    },
  ],
}

const BANCO: ScreenView = {
  kind: 'web',
  app: 'Banco del Litoral',
  url: 'bancolitoral.ec',
  secure: true,
  brand: 'Banca móvil',
  title: 'Tus cuentas',
  subtitle: `${CUENTA_FICTICIA} · disponible $980,20`,
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

const TRANSFERENCIA: ScreenView = {
  kind: 'web',
  app: 'Banco del Litoral',
  url: 'bancolitoral.ec',
  secure: true,
  brand: 'Transferir a terceros',
  title: 'Confirma la transferencia',
  subtitle: 'Revisa los datos antes de enviar el dinero.',
  datos: [
    { etiqueta: 'Cuenta de destino', valor: CUENTA_ESTAFA, senal: 'cuenta' },
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

const APPS: AppTelefono[] = [
  { Icono: MessageCircle, texto: 'Mensajes', color: '#2f9e44', hilo: 'sms' },
  {
    Icono: Phone,
    texto: 'Teléfono',
    color: '#1971c2',
    goto: 'n4',
    label: 'Abrió la agenda para llamar por su cuenta',
  },
  {
    Icono: Wallet,
    texto: 'Banco del Litoral',
    color: '#155e75',
    goto: 'n5',
    label: 'Abrió la app del banco',
  },
  {
    Icono: Camera,
    texto: 'Cámara',
    color: '#495057',
    vacia: 'La cámara está lista. No hay nada que fotografiar en este momento.',
  },
]

export const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: CHAT },
  n1b: { kind: 'scene', view: PERFIL },
  n2: { kind: 'scene', view: CUENTA },
  n2b: { kind: 'scene', view: NO_PUEDE_HABLAR },
  n3: { kind: 'scene', view: SIN_AUDIO },
  n4: { kind: 'scene', view: AGENDA },
  n5: { kind: 'scene', view: BANCO },
  n6: { kind: 'scene', view: TRANSFERENCIA },
  e_paga: {
    kind: 'bad',
    view: TRANSFERENCIA,
    verdict: 'Caíste en la suplantación',
    outcome:
      'Los $180 se fueron a la cuenta de un desconocido. A Byron le robaron el WhatsApp la noche anterior y quien escribía era el ladrón: por eso el número, la foto y el historial eran auténticos. Nada de lo que mirabas iba a delatarlo, porque la cuenta sí era suya. Lo que no podía imitar era su voz.',
  },
  e_llama: {
    kind: 'good',
    view: LLAMADA_BYRON,
    verdict: 'No caíste · lo llamaste',
    outcome:
      'Byron contestó al primer timbre desde su casa: le habían robado la cuenta esa madrugada y estaban escribiéndole a toda su agenda. La llamada fue lo único que sirvió, porque el chat, el número y la foto eran de verdad.',
  },
  e_ignora: {
    kind: 'partial',
    view: CHAT,
    verdict: 'No perdiste nada, pero era tu amigo',
    outcome:
      'Saliste del chat y no mandaste dinero, así que no perdiste nada. Pero si hubiera sido Byron de verdad, lo dejaste tirado; y como no lo era, tampoco te enteraste de que le robaron la cuenta ni pudiste avisarle. Una llamada resolvía las dos cosas.',
    score: 50,
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'escritura',
    pantalla: 'n1',
    texto:
      '<b>No escribe como él.</b> Byron te dice "bro" y manda emojis; ese mensaje dice "estimado amigo" y "requiero". La cuenta es suya, la forma de hablar no.',
  },
  {
    id: 's2',
    targetId: 'todo-cuadra',
    pantalla: 'n1b',
    texto:
      'En la ficha <b>todo cuadra</b>: mismo número, misma foto, mismos grupos, años de historial. Aquí no hay nada que mirar, y eso es justo lo que hace difícil este caso.',
  },
  {
    id: 's3',
    targetId: 'cuenta',
    pantalla: 'n2',
    texto:
      'La cuenta de destino está <b>a nombre de otra persona</b>. Es la primera cosa del mensaje que no le pertenece a tu amigo.',
  },
  {
    id: 's4',
    targetId: 'no-llama',
    pantalla: 'n2b',
    texto:
      'No puede <b>atender una llamada</b>. Quien robó la cuenta tiene el chat, pero no la voz: cerrar ese canal es lo único que puede hacer.',
  },
  {
    id: 's5',
    targetId: 'sin-audio',
    pantalla: 'n3',
    texto:
      'Tampoco puede mandar <b>una nota de voz</b>, ni siquiera de tres segundos. Dos excusas seguidas para no dejarse oír son la señal entera de este escenario.',
  },
  {
    id: 's6',
    targetId: 'contesta',
    pantalla: 'e_llama',
    texto:
      'La <b>llamada</b> lo resolvió en diez segundos, y de paso Byron se enteró de que le habían robado la cuenta.',
  },
]

const RULE =
  'Regla de oro: que el <b>número y la foto sean los de siempre no prueba nada</b>: las cuentas de mensajería se roban. Si un contacto tuyo pide dinero por chat, llámalo antes de mandar nada, y desconfía de cualquier excusa para no hablar.'

const RESUMEN = 'Un amigo te escribe desde su chat de siempre pidiendo dinero por una urgencia.'

const CONTEXTO: Contexto = {
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
  detalle: 'El mensaje llega en la conversación de siempre, con su número y su foto.',
}

function CuentaHackeada() {
  return (
    <StoryEscenario
      escenarioId="suplantacion/cuenta-hackeada"
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

export default CuentaHackeada
