import { Camera, MessageCircle, Users, Wallet } from 'lucide-react'
import StoryEscenario, { type AppTelefono, type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { IDENTIDAD_FICTICIA } from '../../lib/identidadFicticia'

/**
 * El otro lado del módulo: el perfil clonado eres tú.
 *
 * Los demás escenarios preguntan si reconoces una suplantación cuando te llega;
 * este pregunta qué haces cuando la suplantación se hace *contigo* y son tus
 * conocidos quienes reciben los mensajes. El aviso de tu amiga es auténtico, y
 * lo único que hace falta es actuar: reportar la copia y avisar a los demás
 * antes de que alguien pague.
 *
 * El error que mide no es caer en nada, sino lo que casi todo el mundo hace
 * primero: escribirle a la cuenta falsa. Ahí se entregan datos de verdad a
 * quien ya estaba usando tu nombre.
 */

const AMIGA = 'Verónica'
const NUMERO_AMIGA = '+593 99 618 2274'

const AVISO = {
  text: 'Oyeee, ¿tú abriste otra cuenta? Me está escribiendo alguien con tu nombre y tus mismas fotos, pidiéndome que le preste 150 dólares 😳',
  time: '19:32',
  senal: 'aviso',
}

const CHAT: ScreenView = {
  kind: 'sms',
  sender: AMIGA,
  sub: `${NUMERO_AMIGA} · guardada en tus contactos`,
  senalRemitente: 'remitente',
  msgs: [AVISO],
  respuestas: [
    {
      texto: 'No, esa no soy yo. Gracias por avisar 🙏',
      goto: 'n2',
      label: 'Confirmó a su amiga que esa cuenta no era suya',
    },
    {
      texto: '¿Me mandas una captura?',
      goto: 'n2b',
      label: 'Pidió una captura de la conversación',
    },
  ],
  volverGoto: 'e_ignora',
  volverLabel: 'Salió del chat sin hacer nada',
}

const GRACIAS: ScreenView = {
  ...CHAT,
  msgs: [
    AVISO,
    { text: 'No, esa no soy yo. Gracias por avisar 🙏', time: '19:34', mine: true },
    {
      text: 'Uf, menos mal pregunté. Le iba a mandar la plata porque la foto era tuya tal cual 😅 avísale a los demás, que a Karina también le escribió.',
      time: '19:35',
      senal: 'mas-gente',
    },
  ],
  respuestas: [
    {
      texto: 'Voy a ver esa cuenta ahora mismo.',
      goto: 'n3',
      label: 'Fue a buscar la cuenta falsa en la red social',
    },
    {
      texto: 'Déjalo, ya se cansarán.',
      goto: 'e_ignora',
      label: 'Decidió no hacer nada al respecto',
    },
  ],
}

const CAPTURA: ScreenView = {
  ...CHAT,
  msgs: [
    AVISO,
    { text: '¿Me mandas una captura?', time: '19:34', mine: true },
    {
      text: '[Captura] Tu nombre completo, tu foto de la playa y un mensaje: "amiga, ando en un apuro, ¿me prestas 150 hasta el viernes? te devuelvo el lunes" 😳',
      time: '19:35',
      senal: 'captura',
    },
  ],
  respuestas: [
    {
      texto: 'Esa cuenta no es mía. Voy a verla.',
      goto: 'n3',
      label: 'Fue a buscar la cuenta falsa en la red social',
    },
    {
      texto: 'Qué fastidio. Bueno, avísame si te escribe otra vez.',
      goto: 'e_ignora',
      label: 'Lo dejó pasar sin reportar ni avisar a nadie',
    },
  ],
}

const RED: ScreenView = {
  kind: 'web',
  app: 'Red social',
  url: 'inicio',
  secure: true,
  brand: 'Inicio',
  title: '¿A quién buscas?',
  opciones: [
    {
      texto: 'Buscar tu propio nombre',
      detalle: 'Mira si hay cuentas usando tus datos',
      goto: 'n4',
      label: 'Buscó su propio nombre en la red social',
    },
    { texto: 'Notificaciones', detalle: '5 solicitudes de amistad nuevas' },
    { texto: 'Tu perfil', detalle: 'Fotos, amigos y publicaciones' },
    { texto: 'Grupos', detalle: 'Barrio, colegio y trabajo' },
  ],
  fields: [],
  button: '',
}

const RESULTADOS: ScreenView = {
  kind: 'web',
  app: 'Red social',
  url: 'buscar',
  secure: true,
  brand: 'Resultados',
  title: 'Tu nombre',
  subtitle: 'Dos cuentas coinciden.',
  opciones: [
    {
      texto: 'Tu cuenta · desde 2014',
      detalle: 'La tuya de siempre, con todos tus amigos',
      goto: 'n6',
      label: 'Entró a su propio perfil',
    },
    {
      texto: 'Tu nombre · desde hace 4 días',
      detalle: '18 amigos, todos conocidos tuyos · 6 fotos copiadas de tu perfil',
      goto: 'n5',
      label: 'Entró al perfil que estaba copiando el suyo',
    },
  ],
  fields: [],
  button: '',
}

const CLON: ScreenView = {
  kind: 'web',
  app: 'Red social',
  url: 'perfil',
  secure: true,
  brand: 'Perfil',
  title: 'Tu nombre',
  subtitle: 'Cuenta creada hace 4 días.',
  datos: [
    { etiqueta: 'Fotos', valor: 'Seis, todas descargadas de tu perfil público', senal: 'copia' },
    {
      etiqueta: 'Amigos',
      valor: '18, y son gente tuya: tus primas, dos compañeros de trabajo',
      senal: 'copia',
    },
    { etiqueta: 'Publicaciones', valor: 'Ninguna' },
  ],
  opciones: [
    {
      texto: 'Reportar este perfil',
      detalle: 'Se hace pasar por mí',
      goto: 'e_reporta',
      label: 'Reportó el perfil que lo suplantaba',
    },
    {
      texto: 'Enviarle un mensaje',
      detalle: 'Escribir a esta cuenta',
      goto: 'n7',
      label: 'Le escribió a la cuenta que lo suplantaba',
    },
    { texto: 'Bloquear', detalle: 'Dejar de ver esta cuenta' },
  ],
  cerrarGoto: 'n4',
  cerrarLabel: 'Volvió a los resultados de búsqueda',
  fields: [],
  button: '',
}

const TU_PERFIL: ScreenView = {
  kind: 'web',
  app: 'Red social',
  url: 'perfil',
  secure: true,
  brand: 'Tu perfil',
  title: 'Tu cuenta',
  subtitle: 'Desde 2014 · 312 amigos',
  opciones: [
    {
      texto: 'Publicar un aviso para tus contactos',
      detalle: '"Están usando mi nombre y mis fotos: no presten dinero a esa cuenta"',
      goto: 'e_avisa',
      label: 'Avisó a sus contactos de la cuenta falsa',
    },
    { texto: 'Editar tu información', detalle: 'Nombre, ciudad, trabajo' },
    { texto: 'Quién puede ver tus fotos', detalle: 'Configuración de privacidad' },
    { texto: 'Tus publicaciones', detalle: '128 desde 2014' },
  ],
  cerrarGoto: 'n4',
  cerrarLabel: 'Volvió a los resultados de búsqueda',
  fields: [],
  button: '',
}

const CHAT_CLON: ScreenView = {
  kind: 'sms',
  sender: 'Tu nombre (cuenta falsa)',
  sub: 'Cuenta creada hace 4 días',
  msgs: [
    { text: 'Deja de usar mis fotos y mi nombre.', time: '19:44', mine: true },
    {
      text: 'jajaja y quién dice que son tuyas. Demuéstralo pues, mándame algo que diga que eres tú y borro todo.',
      time: '19:45',
      senal: 'provoca',
    },
  ],
  respuestas: [
    {
      texto: `Aquí está mi cédula ${IDENTIDAD_FICTICIA.cedula}, mírala y borra esa cuenta.`,
      goto: 'e_escribe',
      label: 'Le mandó su cédula a la cuenta que lo suplantaba',
    },
    {
      texto: 'No pienso mandarte nada. Te reporto.',
      goto: 'e_reporta',
      label: 'Cortó la conversación y reportó el perfil',
    },
  ],
}

const APPS: AppTelefono[] = [
  { Icono: MessageCircle, texto: 'Mensajes', color: '#2f9e44', hilo: 'sms' },
  {
    Icono: Users,
    texto: 'Red social',
    color: '#1971c2',
    goto: 'n3',
    label: 'Abrió la red social',
  },
  {
    Icono: Wallet,
    texto: 'Banco del Litoral',
    color: '#155e75',
    vacia: 'Banca móvil · Saldo disponible $980,20. Sin movimientos nuevos.',
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
  n2: { kind: 'scene', view: GRACIAS },
  n2b: { kind: 'scene', view: CAPTURA },
  n3: { kind: 'scene', view: RED },
  n4: { kind: 'scene', view: RESULTADOS },
  n5: { kind: 'scene', view: CLON },
  n6: { kind: 'scene', view: TU_PERFIL },
  n7: { kind: 'scene', view: CHAT_CLON },
  e_reporta: {
    kind: 'good',
    view: CLON,
    verdict: 'Acertaste · reportaste la copia',
    outcome:
      'Reportaste el perfil, que es lo único que lo baja: la red lo revisa y lo cierra. Verónica no perdió sus 150 dólares porque preguntó, y ahora conviene rematar avisando a tus contactos, porque a Karina también le escribieron.',
  },
  e_avisa: {
    kind: 'good',
    view: TU_PERFIL,
    verdict: 'Acertaste · avisaste a tu gente',
    outcome:
      'Publicaste el aviso y tus contactos lo vieron antes de que alguien mandara dinero. Es lo que más rápido corta el daño: la cuenta falsa vive de que la gente crea que eres tú, y un aviso tuyo la deja sin nada. Repórtala también, para que la cierren.',
  },
  e_escribe: {
    kind: 'bad',
    view: CHAT_CLON,
    verdict: 'Le entregaste justo lo que le faltaba',
    outcome: `Le mandaste tu cédula ${IDENTIDAD_FICTICIA.cedula} a quien estaba usando tu nombre. No borró nada: ahora, además de tus fotos, tiene un documento tuyo para hacer las estafas más creíbles y para abrir cuentas a tu nombre. A una cuenta falsa no se le demuestra nada: se reporta y se avisa a los demás.`,
    score: 0,
  },
  e_ignora: {
    kind: 'partial',
    view: CHAT,
    verdict: 'No hiciste nada, y el daño no era tuyo',
    outcome:
      'Le creíste a Verónica y ahí quedó. Tú no vas a perder dinero, pero la cuenta sigue abierta escribiéndole a tu gente con tus fotos: a Karina ya le escribió. Reportarla y avisar cuesta dos minutos y es lo único que la para.',
    score: 50,
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'aviso',
    pantalla: 'n1',
    texto:
      'El aviso llega de <b>tu amiga de siempre</b>, por su chat de siempre, y no te pide nada: es de verdad. Que alguien pregunte "¿eres tú?" antes de mandar plata es exactamente lo que hay que hacer.',
  },
  {
    id: 's2',
    targetId: 'captura',
    pantalla: 'n2b',
    texto:
      'El mensaje de la copia usa <b>tu nombre y tus fotos</b> para pedir una cantidad pequeña con plazo corto. Es el mismo guion que verías desde el otro lado.',
  },
  {
    id: 's3',
    targetId: 'copia',
    pantalla: 'n5',
    texto:
      'La cuenta tiene <b>cuatro días y dieciocho amigos</b>, todos conocidos tuyos: fueron sacados de tu lista pública. Tus fotos son las mismas, descargadas de tu perfil.',
  },
  {
    id: 's4',
    targetId: 'provoca',
    pantalla: 'n7',
    texto:
      'Si le escribes, te <b>provoca para que "demuestres" quién eres</b>. No busca discutir: busca que le mandes un documento tuyo.',
  },
  {
    id: 's5',
    targetId: 'mas-gente',
    pantalla: 'n2',
    texto:
      'No eres el único aviso: <b>le escribieron a más gente tuya</b>. Por eso avisar a tus contactos corta más daño que cualquier otra cosa.',
  },
]

const RULE =
  'Regla de oro: si copian tu perfil, <b>repórtalo y avisa a tus contactos</b>, en ese orden y sin escribirle a la cuenta falsa. Lo que la sostiene es que tu gente crea que eres tú, así que un aviso tuyo la desarma; y a quien te suplanta no se le demuestra nada con documentos.'

const RESUMEN = 'Una amiga te avisa de que alguien usa tu nombre y tus fotos para pedir dinero.'

const CONTEXTO: Contexto = {
  antes: (
    <>
      Tienes una cuenta en la red social desde hace años, con <strong>fotos públicas</strong> y tu
      lista de amigos a la vista, como casi todo el mundo.
    </>
  ),
  ahora: (
    <>
      <strong>Una noche cualquiera</strong> te escribe <strong>Verónica</strong>, amiga tuya de
      siempre, desde su chat de siempre.
    </>
  ),
  detalle: 'Ella no te pide nada: te está avisando de algo que le pareció raro.',
}

function ClonaronTuPerfil() {
  return (
    <StoryEscenario
      escenarioId="suplantacion/clonaron-tu-perfil"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule={RULE}
      restartLabel="↻ Repetir el escenario"
      accionesEnPantalla
      apps={APPS}
      identidad={['cedula']}
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Actúa sobre el teléfono como lo harías con el tuyo: contéstale a tu amiga y usa{' '}
          <strong>cualquier app de abajo</strong>. Aquí el problema no te lo mandaron a ti: te lo
          están haciendo.
        </p>
      }
      pista={
        <p>
          Puedes contestarle a tu amiga, dejarlo pasar, buscar la cuenta falsa en la red social,
          escribirle, reportarla o avisar a tus contactos. Piensa en qué es lo que de verdad para el
          daño.
        </p>
      }
    />
  )
}

export default ClonaronTuPerfil
