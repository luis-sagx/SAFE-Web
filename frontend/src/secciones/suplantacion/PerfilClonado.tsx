import { Camera, MessageCircle, Users, Wallet } from 'lucide-react'
import ScenarioStory, { type PhoneApp, type ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Signal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { ACCOUNT_FAKE } from '../../lib/identidadFicticia'

// No hay número que comprobar: la verificación es buscar a la persona en la
// propia red y encontrarla dos veces (la cuenta real sigue activa).

const FRIEND = 'Marcela Ríos'
const ACCOUNT_SCAM = '3300-9182-44 · Jonathan Pico Arteaga'

const OPENING = {
  text: 'Holaaa 😊 qué gusto, ¿cómo has estado? Perdí el acceso a mi cuenta anterior y tuve que abrir esta, ya estoy avisando a todos.',
  time: '16:20',
  senal: 'cuenta-nueva',
}

const CHAT: ScreenView = {
  kind: 'sms',
  sender: FRIEND,
  sub: 'Mensaje de alguien que no está en tu lista de amigos',
  senalRemitente: 'remitente',
  perfilGoto: 'n1b',
  perfilLabel: 'Abrió el perfil desde el que le escribían',
  msgs: [OPENING],
  respuestas: [
    { texto: '¡Marce! Todo bien, ¿y tú?', goto: 'n2', label: 'Siguió la conversación' },
    {
      texto: '¿Y por qué me escribes desde otra cuenta?',
      goto: 'n2b',
      label: 'Preguntó por qué le escribían desde otra cuenta',
    },
  ],
  volverGoto: 'e_ignora',
  volverLabel: 'Salió de la conversación sin contestar ni comprobar',
}

const FAKE_PROFILE: ScreenView = {
  kind: 'web',
  app: 'Red social',
  url: 'perfil',
  secure: true,
  brand: 'Perfil',
  title: FRIEND,
  subtitle: 'No sois amigos.',
  datos: [
    { etiqueta: 'Cuenta creada', valor: 'Hace 6 días', senal: 'antiguedad' },
    { etiqueta: 'Amigos', valor: '31 · ninguno en común contigo', senal: 'antiguedad' },
    { etiqueta: 'Publicaciones', valor: '4 fotos, todas subidas el mismo día', senal: 'fotos' },
    { etiqueta: 'Foto de perfil', valor: 'La misma que usa Marcela desde hace años', senal: 'fotos' },
  ],
  cerrarGoto: 'n1',
  cerrarLabel: 'Volvió a la conversación desde el perfil',
  fields: [],
  button: '',
}

const ASKS: ScreenView = {
  ...CHAT,
  msgs: [
    OPENING,
    { text: '¡Marce! Todo bien, ¿y tú?', time: '16:22', mine: true },
    {
      text: 'Ahí vamos 🙈 oye, justo te iba a escribir: estoy en un apuro con un pago y me faltan 220 dólares hasta el viernes. ¿Me los puedes prestar? Te los devuelvo apenas cobre.',
      time: '16:23',
      senal: 'plata',
    },
  ],
  respuestas: [
    { texto: 'Claro, pásame la cuenta.', goto: 'n3', label: 'Aceptó prestarle el dinero' },
    {
      texto: 'Mejor te llamo y hablamos.',
      goto: 'n3b',
      label: 'Propuso llamarla para hablar',
    },
  ],
}

const EXCUSE_ACCOUNT: ScreenView = {
  ...CHAT,
  msgs: [
    OPENING,
    { text: '¿Y por qué me escribes desde otra cuenta?', time: '16:22', mine: true },
    {
      text: 'Me hackearon la otra y no la pude recuperar 😩 esta es la buena, agrégame porfa. Oye, y aprovecho: ¿me puedes prestar 220 dólares hasta el viernes? Estoy en un apuro con un pago.',
      time: '16:23',
      senal: 'plata',
    },
  ],
  respuestas: [
    { texto: 'Claro, pásame la cuenta.', goto: 'n3', label: 'Aceptó prestarle el dinero' },
    {
      texto: 'Mejor te llamo y hablamos.',
      goto: 'n3b',
      label: 'Propuso llamarla para hablar',
    },
  ],
}

const ACCOUNT: ScreenView = {
  ...CHAT,
  msgs: [
    OPENING,
    { text: 'Claro, pásame la cuenta.', time: '16:24', mine: true },
    {
      text: `Gracias, mil gracias 🙏 mándalo a ${ACCOUNT_SCAM}, es de mi cuñado, la mía la tengo con problemas por lo de la cuenta hackeada.`,
      time: '16:24',
      senal: 'cuenta',
    },
  ],
  respuestas: [
    {
      texto: 'Esa cuenta no es tuya. Antes te llamo.',
      goto: 'n3b',
      label: 'Hizo notar que la cuenta era de otra persona',
    },
    {
      texto: 'Ya te mando los 220.',
      goto: 'n6',
      label: 'Fue a transferir el dinero a la cuenta que le pasaron',
    },
  ],
}

const DOES_NOT_CALL: ScreenView = {
  ...CHAT,
  msgs: [
    OPENING,
    { text: 'Mejor te llamo y hablamos.', time: '16:24', mine: true },
    {
      text: 'Es que estoy en el trabajo y no puedo contestar 🙈 escríbeme nomás por aquí, porfa.',
      time: '16:25',
      senal: 'no-llama',
    },
  ],
  respuestas: [
    {
      texto: 'Entonces hablamos otro día.',
      goto: 'e_corta',
      label: 'Cortó la conversación sin mandar dinero',
    },
    {
      texto: 'Bueno, igual te presto. Pásame la cuenta.',
      goto: 'n3',
      label: 'Aceptó prestar el dinero sin haber podido hablar',
    },
  ],
}

const NETWORK: ScreenView = {
  kind: 'web',
  app: 'Red social',
  url: 'inicio',
  secure: true,
  brand: 'Inicio',
  title: '¿A quién buscas?',
  opciones: [
    {
      texto: `Buscar "${FRIEND}"`,
      detalle: 'Busca a tu amiga en la red',
      goto: 'n5',
      label: 'Buscó a su amiga en la red social',
    },
    { texto: 'Notificaciones', detalle: '3 reacciones nuevas' },
    { texto: 'Tu perfil', detalle: 'Fotos, amigos y publicaciones' },
    { texto: 'Grupos', detalle: 'Barrio, colegio y trabajo' },
  ],
  fields: [],
  button: '',
}

const SEARCH: ScreenView = {
  kind: 'web',
  app: 'Red social',
  url: 'buscar',
  secure: true,
  brand: 'Resultados',
  title: FRIEND,
  subtitle: 'Dos personas coinciden con ese nombre.',
  opciones: [
    {
      texto: `${FRIEND} · desde 2013`,
      detalle: '214 amigos en común · años de fotos · es tu amiga desde siempre',
      goto: 'e_verifica',
      label: 'Entró al perfil real de su amiga y le escribió',
    },
    {
      texto: `${FRIEND} · desde hace 6 días`,
      detalle: '31 amigos · ninguno en común · 4 fotos',
      goto: 'n1b',
      label: 'Entró al perfil nuevo desde la búsqueda',
    },
  ],
  fields: [],
  button: '',
}

const REAL_PROFILE: ScreenView = {
  kind: 'web',
  app: 'Red social',
  url: 'perfil',
  secure: true,
  brand: 'Perfil',
  title: FRIEND,
  subtitle: 'Amigas desde 2013.',
  datos: [
    { etiqueta: 'Última publicación', valor: 'Ayer, fotos del cumpleaños de su hija' },
    { etiqueta: 'Su respuesta', valor: '"¡Ay no! Esa cuenta no es mía, me están clonando. Gracias por avisar, ya lo estoy reportando."', senal: 'responde' },
    { etiqueta: 'Amigos en común', valor: '214' },
  ],
  aviso:
    'Cuando alguien te escriba desde una cuenta nueva, búscalo en la red: si la cuenta de siempre sigue activa, la nueva es una copia.',
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
    { etiqueta: 'Titular', valor: 'Jonathan Pico Arteaga' },
    { etiqueta: 'Valor', valor: '$220,00' },
  ],
  aviso: 'Las transferencias enviadas no se pueden reversar.',
  button: 'Transferir $220,00',
  botonGoto: 'e_paga',
  botonLabel: 'Transfirió los $220 a la cuenta que le pasaron por el chat',
  cerrarGoto: 'n6',
  cerrarLabel: 'Volvió atrás sin transferir',
  fields: [],
}

const APPS: PhoneApp[] = [
  { Icono: MessageCircle, texto: 'Mensajes', color: '#2f9e44', hilo: 'sms' },
  {
    Icono: Users,
    texto: 'Red social',
    color: '#1971c2',
    goto: 'n4',
    label: 'Abrió la red social para comprobar por su cuenta',
  },
  {
    Icono: Wallet,
    texto: 'Banco del Litoral',
    color: '#155e75',
    goto: 'n6',
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
  n1b: { kind: 'scene', view: FAKE_PROFILE },
  n2: { kind: 'scene', view: ASKS },
  n2b: { kind: 'scene', view: EXCUSE_ACCOUNT },
  n3: { kind: 'scene', view: ACCOUNT },
  n3b: { kind: 'scene', view: DOES_NOT_CALL },
  n4: { kind: 'scene', view: NETWORK },
  n5: { kind: 'scene', view: SEARCH },
  n6: { kind: 'scene', view: BANK },
  n7: { kind: 'scene', view: TRANSFER },
  e_paga: {
    kind: 'bad',
    view: TRANSFER,
    verdict: 'Caíste en la suplantación',
    outcome:
      'Los $220 se fueron a la cuenta de un desconocido. Marcela nunca perdió su cuenta: la de siempre seguía publicando fotos esa misma semana. Alguien copió su nombre y sus fotos, abrió una cuenta nueva y escribió a toda la gente que aparecía en sus comentarios.',
  },
  e_verifica: {
    kind: 'good',
    view: REAL_PROFILE,
    verdict: 'No caíste · la buscaste en la red',
    outcome:
      'La cuenta de siempre de Marcela seguía ahí, activa y con vuestros 214 amigos en común. Le escribiste por ahí y te confirmó lo que ya se veía: no era ella. Cuando alguien "cambia de cuenta", la de antes es la que dice la verdad.',
  },
  e_corta: {
    kind: 'good',
    view: DOES_NOT_CALL,
    verdict: 'No caíste · no mandaste nada',
    outcome:
      'No mandaste dinero a alguien con quien no pudiste hablar. Es todo lo que hacía falta: nadie que de verdad te conozca se ofende porque quieras oírle la voz antes de prestarle plata.',
  },
  e_ignora: {
    kind: 'partial',
    view: CHAT,
    verdict: 'No perdiste nada, pero quedó a medias',
    outcome:
      'Saliste de la conversación y no entregaste nada, que es lo importante. Lo que falta es avisar: si a ti te escribieron, a los demás contactos de Marcela también, y ella no sabe que la están copiando.',
    score: 50,
  },
}

const SIGNALS: Signal[] = [
  {
    id: 's1',
    targetId: 'cuenta-nueva',
    pantalla: 'n1',
    texto:
      'Lo primero que dice es que <b>cambió de cuenta</b>. Es la frase con la que empieza casi toda suplantación: sirve para explicar por qué no hay historial y por qué no la reconoces.',
  },
  {
    id: 's2',
    targetId: 'antiguedad',
    pantalla: 'n1b',
    texto:
      'La cuenta tiene <b>seis días</b> y ningún amigo en común contigo. La de una amiga de años arrastra fotos, comentarios y gente conocida.',
  },
  {
    id: 's3',
    targetId: 'fotos',
    pantalla: 'n1b',
    texto:
      'Las fotos son de Marcela, pero <b>subidas todas el mismo día</b>: se descargaron de su perfil real y se volvieron a subir de golpe.',
  },
  {
    id: 's4',
    targetId: 'plata',
    pantalla: 'n2',
    texto:
      'La conversación llega enseguida a <b>pedir dinero</b>, con una cifra concreta y un plazo corto. Ese es el único objetivo de haber copiado el perfil.',
  },
  {
    id: 's5',
    targetId: 'cuenta',
    pantalla: 'n3',
    texto:
      'La cuenta de destino está <b>a nombre de otra persona</b>, con una excusa lista. El dinero nunca va a la cuenta de quien dice necesitarlo.',
  },
  {
    id: 's6',
    targetId: 'no-llama',
    pantalla: 'n3b',
    texto:
      'Nunca puede <b>hablar por teléfono</b>. Una llamada rompe el engaño en tres segundos, así que siempre hay un motivo para no atenderla.',
  },
  {
    id: 's7',
    targetId: 'responde',
    pantalla: 'e_verifica',
    texto:
      'La <b>cuenta de siempre seguía activa</b>, y su dueña contestó. Cuando alguien dice que perdió su cuenta, esa es la comprobación: mirar si la vieja sigue viva.',
  },
]

const RULE =
  'Regla de oro: una foto y un nombre <b>no identifican a nadie</b>: se copian en un minuto. Si una cuenta nueva dice ser alguien conocido, búscalo en la red o llámalo por su número de siempre, y no mandes dinero a una cuenta que está a otro nombre.'

const SUMMARY = 'Una amiga te escribe desde una cuenta nueva y termina pidiéndote dinero prestado.'

const CONTEXT: Context = {
  antes: (
    <>
      <strong>Marcela</strong> es amiga tuya desde el colegio. Se escriben de vez en cuando por la
      red social, donde tenéis <strong>muchos amigos en común</strong>.
    </>
  ),
  ahora: (
    <>
      <strong>Una tarde cualquiera</strong> te llega un mensaje suyo, pero desde una cuenta que no
      es la de siempre.
    </>
  ),
}

function ClonedProfile() {
  return (
    <ScenarioStory
      escenarioId="suplantacion/perfil-clonado"
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
          Actúa sobre el teléfono como lo harías con el tuyo: contesta, toca el nombre para ver el
          perfil desde el que te escriben y usa <strong>cualquier app de abajo</strong>.
        </p>
      }
      pista={
        <p>
          Puedes seguir la conversación, mirar quién te escribe, salir del chat, prestarle el dinero
          desde la app del banco o buscar a tu amiga por tu cuenta en la red social.
        </p>
      }
    />
  )
}

export default ClonedProfile
