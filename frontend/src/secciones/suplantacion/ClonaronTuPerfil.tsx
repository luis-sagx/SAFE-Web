import { MessageCircle, Users, Wallet } from 'lucide-react'
import ScenarioStory, { type PhoneApp, type ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Signal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { IDENTITY_FAKE } from '../../lib/identidadFicticia'

// El otro lado del módulo: el perfil clonado eres tú. El error que mide no es caer en
// nada, sino escribirle a la cuenta falsa, eso entrega datos reales a quien ya usa tu nombre.

const FRIEND = 'Verónica'
const NUMBER_FRIEND = '+593 99 618 2274'

const NOTICE = {
  text: 'Oyeee, ¿tú abriste otra cuenta? Me está escribiendo alguien con tu nombre y tus mismas fotos, pidiéndome que le preste 150 dólares 😳',
  time: '19:32',
  senal: 'aviso',
}

const CHAT: ScreenView = {
  kind: 'sms',
  sender: FRIEND,
  sub: `${NUMBER_FRIEND} · guardada en tus contactos`,
  senalRemitente: 'remitente',
  msgs: [NOTICE],
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

const THANKS: ScreenView = {
  ...CHAT,
  msgs: [
    NOTICE,
    {
      text: 'No, esa no soy yo. Gracias por avisar 🙏',
      time: '19:34',
      mine: true,
    },
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

// Única pantalla del proyecto que enseña la suplantación desde fuera: lo que Verónica ve.
// Por eso va dibujada como captura de verdad, no contada en texto.
const CAPTURE: ScreenView = {
  ...CHAT,
  msgs: [
    NOTICE,
    { text: '¿Me mandas una captura?', time: '19:34', mine: true },
    {
      text: 'Mira, esto es lo que me llegó 😳',
      time: '19:35',
      senal: 'captura',
      captura: {
        quien: '{nombre}',
        sub: 'en línea',
        mensajes: [
          'amiga, ando en un apuro',
          '¿me prestas 150 hasta el viernes? te devuelvo el lunes 🙏',
        ],
      },
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

const NETWORK: ScreenView = {
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

const RESULTS: ScreenView = {
  kind: 'web',
  app: 'Red social',
  url: 'buscar',
  secure: true,
  brand: 'Resultados',
  title: '{nombre}',
  // Las dos salen con el mismo nombre, que es justo el problema: lo que las
  // separa no es cómo se llaman sino desde cuándo existen y quién las sigue.
  subtitle: 'Dos cuentas coinciden.',
  opciones: [
    {
      texto: '{nombre} · desde 2014',
      detalle: 'Tu cuenta de siempre, con todos tus amigos',
      goto: 'n6',
      label: 'Entró a su propio perfil',
    },
    {
      texto: '{nombre} · desde hace 4 días',
      detalle: '18 amigos, todos conocidos tuyos · 6 fotos copiadas de tu perfil',
      goto: 'n5',
      label: 'Entró al perfil que estaba copiando el suyo',
    },
  ],
  fields: [],
  button: '',
}

const CLONE: ScreenView = {
  kind: 'web',
  app: 'Red social',
  url: 'perfil',
  secure: true,
  brand: 'Perfil',
  title: '{nombre}',
  subtitle: 'Cuenta creada hace 4 días.',
  datos: [
    {
      etiqueta: 'Fotos',
      valor: 'Seis, todas descargadas de tu perfil público',
      senal: 'copia',
    },
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

const YOUR_PROFILE: ScreenView = {
  kind: 'web',
  app: 'Red social',
  url: 'perfil',
  secure: true,
  brand: 'Tu perfil',
  title: '{nombre}',
  subtitle: 'Desde 2014 · 312 amigos',
  opciones: [
    {
      texto: 'Publicar un aviso para tus contactos',
      detalle: '"Están usando mi nombre y mis fotos: no presten dinero a esa cuenta"',
      goto: 'e_avisa',
      label: 'Avisó a sus contactos de la cuenta falsa',
    },
    { texto: 'Editar tu información', detalle: 'Nombre, ciudad, trabajo' },
    {
      texto: 'Quién puede ver tus fotos',
      detalle: 'Configuración de privacidad',
    },
    { texto: 'Tus publicaciones', detalle: '128 desde 2014' },
  ],
  cerrarGoto: 'n4',
  cerrarLabel: 'Volvió a los resultados de búsqueda',
  fields: [],
  button: '',
}

const CHAT_CLONE: ScreenView = {
  kind: 'sms',
  sender: '{nombre} (cuenta falsa)',
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
      texto: `Aquí está mi cédula ${IDENTITY_FAKE.cedula}, mírala y borra esa cuenta.`,
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

const APPS: PhoneApp[] = [
  { Icono: MessageCircle, texto: 'Mensajes', color: '#2f9e44', hilo: 'sms' },
  {
    Icono: Users,
    texto: 'Red social',
    color: '#1971c2',
    viewNode: 'n3',
    label: 'Abrió la red social',
  },
  { Icono: Wallet, texto: 'Banco del Litoral', color: '#155e75', relleno: 'banco' },
]

export const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: CHAT },
  n2: { kind: 'scene', view: THANKS },
  n2b: { kind: 'scene', view: CAPTURE },
  n3: { kind: 'scene', view: NETWORK },
  n4: { kind: 'scene', view: RESULTS },
  n5: { kind: 'scene', view: CLONE },
  n6: { kind: 'scene', view: YOUR_PROFILE },
  n7: { kind: 'scene', view: CHAT_CLONE },
  e_reporta: {
    kind: 'good',
    view: CLONE,
    verdict: 'Acertaste · reportaste la copia',
    outcome:
      'Reportar el perfil es lo único que lo cierra: la red lo revisa y lo baja. Verónica no perdió nada porque preguntó, y avisar a tus contactos corta el resto del daño.',
  },
  e_avisa: {
    kind: 'good',
    view: YOUR_PROFILE,
    verdict: 'Acertaste · avisaste a tu gente',
    outcome:
      'Publicaste el aviso antes de que alguien mandara dinero. La cuenta falsa vive de que te crean a ti, así que repórtala también para que la cierren.',
  },
  e_escribe: {
    kind: 'bad',
    view: CHAT_CLONE,
    verdict: 'Le entregaste justo lo que le faltaba',
    outcome: `Le mandaste tu cédula ${IDENTITY_FAKE.cedula} a quien usaba tu nombre, y no borró nada. Ahora tiene un documento tuyo para estafas más creíbles y para abrir cuentas a tu nombre.`,
    score: 0,
  },
  e_ignora: {
    kind: 'partial',
    view: CHAT,
    verdict: 'No hiciste nada, y el daño no era tuyo',
    outcome:
      'Le creíste a Verónica y ahí quedó. La cuenta sigue escribiéndole a tu gente con tus fotos, y reportarla toma dos minutos.',
    score: 50,
  },
}

const SIGNALS: Signal[] = [
  {
    id: 's1',
    targetId: 'aviso',
    pantalla: 'n1',
    texto:
      '<b>Tu amiga de siempre te avisa, por su chat de siempre.</b> Preguntar antes de prestar es justo lo correcto.',
  },
  {
    id: 's2',
    targetId: 'captura',
    pantalla: 'n2b',
    texto:
      '<b>La captura usa tu nombre y tu foto</b> para pedir una cantidad pequeña con plazo corto.',
  },
  {
    id: 's3',
    targetId: 'copia',
    pantalla: 'n5',
    texto:
      '<b>La cuenta tiene cuatro días y dieciocho amigos tuyos.</b> Las fotos son copias de tu perfil.',
  },
  {
    id: 's4',
    targetId: 'provoca',
    pantalla: 'n7',
    texto:
      '<b>Te provoca para que "demuestres" quién eres.</b> Solo busca que le mandes un documento.',
  },
  {
    id: 's5',
    targetId: 'mas-gente',
    pantalla: 'n2',
    texto:
      '<b>Le escribieron a más gente tuya, no solo a ti.</b> Avisar a tus contactos corta ese daño.',
  },
]

const RULE =
  'Regla de oro: <b>repórtalo y avisa a tus contactos, en ese orden.</b> Nunca le escribas ni le mandes documentos a la cuenta falsa.'

const SUMMARY = 'Una amiga te avisa de que alguien usa tu nombre y tus fotos para pedir dinero.'

const CONTEXT: Context = {
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
}

function ClonedProfileAlert() {
  return (
    <ScenarioStory
      escenarioId="suplantacion/clonaron-tu-perfil"
      resumen={SUMMARY}
      contexto={CONTEXT}
      story={STORY}
      senales={SIGNALS}
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

export default ClonedProfileAlert
