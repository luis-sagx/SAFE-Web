import { Camera, MessageCircle, Users, Wallet } from 'lucide-react'
import StoryEscenario, { type AppTelefono, type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { CUENTA_FICTICIA } from '../../lib/identidadFicticia'

/**
 * El perfil clonado: la misma foto, el mismo nombre, una cuenta nueva.
 *
 * Aquí no hay número que comprobar —el mensaje llega por la red social, no por
 * el teléfono— así que la verificación es otra: buscar a la persona en la
 * propia red y encontrarla dos veces. La cuenta de verdad sigue ahí, con sus
 * años de fotos y sus amigos en común; la copia se hizo esta semana.
 *
 * Es el escenario que enseña que "me escribió Marcela" y "me escribió alguien
 * con la foto de Marcela" son cosas distintas.
 */

const AMIGA = 'Marcela Ríos'
const CUENTA_ESTAFA = '3300-9182-44 · Jonathan Pico Arteaga'

const APERTURA = {
  text: 'Holaaa 😊 qué gusto, ¿cómo has estado? Perdí el acceso a mi cuenta anterior y tuve que abrir esta, ya estoy avisando a todos.',
  time: '16:20',
  senal: 'cuenta-nueva',
}

const CHAT: ScreenView = {
  kind: 'sms',
  sender: AMIGA,
  sub: 'Mensaje de alguien que no está en tu lista de amigos',
  senalRemitente: 'remitente',
  perfilGoto: 'n1b',
  perfilLabel: 'Abrió el perfil desde el que le escribían',
  msgs: [APERTURA],
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

const PERFIL_FALSO: ScreenView = {
  kind: 'web',
  app: 'Red social',
  url: 'perfil',
  secure: true,
  brand: 'Perfil',
  title: AMIGA,
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

const PIDE: ScreenView = {
  ...CHAT,
  msgs: [
    APERTURA,
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

const EXCUSA_CUENTA: ScreenView = {
  ...CHAT,
  msgs: [
    APERTURA,
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

const CUENTA: ScreenView = {
  ...CHAT,
  msgs: [
    APERTURA,
    { text: 'Claro, pásame la cuenta.', time: '16:24', mine: true },
    {
      text: `Gracias, mil gracias 🙏 mándalo a ${CUENTA_ESTAFA}, es de mi cuñado, la mía la tengo con problemas por lo de la cuenta hackeada.`,
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
  ],
}

const NO_LLAMA: ScreenView = {
  ...CHAT,
  msgs: [
    APERTURA,
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
  ],
}

/// La red social, con su buscador. Encontrar a la persona dos veces es la
/// comprobación entera del escenario, y hay que hacerla: abrir la app no
/// enseña nada por sí solo.
const RED: ScreenView = {
  kind: 'web',
  app: 'Red social',
  url: 'inicio',
  secure: true,
  brand: 'Inicio',
  title: '¿A quién buscas?',
  opciones: [
    {
      texto: `Buscar "${AMIGA}"`,
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

const BUSQUEDA: ScreenView = {
  kind: 'web',
  app: 'Red social',
  url: 'buscar',
  secure: true,
  brand: 'Resultados',
  title: AMIGA,
  subtitle: 'Dos personas coinciden con ese nombre.',
  opciones: [
    {
      texto: `${AMIGA} · desde 2013`,
      detalle: '214 amigos en común · años de fotos · es tu amiga desde siempre',
      goto: 'e_verifica',
      label: 'Entró al perfil real de su amiga y le escribió',
    },
    {
      texto: `${AMIGA} · desde hace 6 días`,
      detalle: '31 amigos · ninguno en común · 4 fotos',
      goto: 'n1b',
      label: 'Entró al perfil nuevo desde la búsqueda',
    },
  ],
  fields: [],
  button: '',
}

const PERFIL_REAL: ScreenView = {
  kind: 'web',
  app: 'Red social',
  url: 'perfil',
  secure: true,
  brand: 'Perfil',
  title: AMIGA,
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

const APPS: AppTelefono[] = [
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
  n1b: { kind: 'scene', view: PERFIL_FALSO },
  n2: { kind: 'scene', view: PIDE },
  n2b: { kind: 'scene', view: EXCUSA_CUENTA },
  n3: { kind: 'scene', view: CUENTA },
  n3b: { kind: 'scene', view: NO_LLAMA },
  n4: { kind: 'scene', view: RED },
  n5: { kind: 'scene', view: BUSQUEDA },
  n6: { kind: 'scene', view: BANCO },
  n7: { kind: 'scene', view: TRANSFERENCIA },
  e_paga: {
    kind: 'bad',
    view: TRANSFERENCIA,
    verdict: 'Caíste en la suplantación',
    outcome:
      'Los $220 se fueron a la cuenta de un desconocido. Marcela nunca perdió su cuenta: la de siempre seguía publicando fotos esa misma semana. Alguien copió su nombre y sus fotos, abrió una cuenta nueva y escribió a toda la gente que aparecía en sus comentarios.',
  },
  e_verifica: {
    kind: 'good',
    view: PERFIL_REAL,
    verdict: 'No caíste · la buscaste en la red',
    outcome:
      'La cuenta de siempre de Marcela seguía ahí, activa y con vuestros 214 amigos en común. Le escribiste por ahí y te confirmó lo que ya se veía: no era ella. Cuando alguien "cambia de cuenta", la de antes es la que dice la verdad.',
  },
  e_corta: {
    kind: 'good',
    view: NO_LLAMA,
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

const SENALES: Senal[] = [
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

const RESUMEN = 'Una amiga te escribe desde una cuenta nueva y termina pidiéndote dinero prestado.'

const CONTEXTO: Contexto = {
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
  detalle: 'Tiene su nombre completo y su misma foto de perfil.',
}

function PerfilClonado() {
  return (
    <StoryEscenario
      escenarioId="suplantacion/perfil-clonado"
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

export default PerfilClonado
