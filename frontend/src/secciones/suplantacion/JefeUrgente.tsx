import { Images, MessageCircle, Phone, ShoppingBag } from 'lucide-react'
import ScenarioStory, { type PhoneApp, type ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Signal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'

// La suplantación explota la jerarquía, no la tecnología: a la gerente no se
// le pregunta dos veces. El acierto es comprobar por el canal de siempre.

const MANAGER = 'Patricia Cedeño'
const UNKNOWN = '+593 98 776 5510'
const INTERNAL = '+593 99 501 2244'

const OPENING = {
  text: `Buenos días. Habla la Ing. ${MANAGER}, de gerencia. Estoy en una reunión con auditoría y no puedo hablar. ¿Me ayuda con un encargo?`,
  time: '09:12',
  senal: 'apertura',
}

const CHAT: ScreenView = {
  kind: 'sms',
  sender: UNKNOWN,
  sub: 'No está en tus contactos · toca para ver el perfil',
  senalRemitente: 'remitente',
  perfilGoto: 'n1b',
  perfilLabel: 'Abrió el perfil del número que le escribía',
  msgs: [OPENING],
  respuestas: [
    { texto: 'Claro, ingeniera, dígame.', goto: 'n2', label: 'Se puso a disposición del encargo' },
    {
      texto: '¿De qué número me escribe? El suyo lo tengo guardado.',
      goto: 'n2b',
      label: 'Preguntó por qué le escribían desde otro número',
    },
  ],
  volverGoto: 'e_ignora',
  volverLabel: 'Salió del chat sin contestar ni comprobar',
}

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
      valor: 'La foto corporativa de la gerente, la misma que está en la web de la empresa',
      senal: 'foto',
    },
    { etiqueta: 'En esta app desde', valor: 'Hace 3 días', senal: 'antiguedad' },
    { etiqueta: 'Grupos en común', valor: 'Ninguno · no está en el grupo del área', senal: 'antiguedad' },
  ],
  cerrarGoto: 'n1',
  cerrarLabel: 'Volvió al chat desde el perfil',
  fields: [],
  button: '',
}

const REQUEST = {
  text: 'Compre 4 tarjetas de regalo de $100 para un cliente que llega al mediodía. Hoy mismo se le reembolsa con el rol.',
  time: '09:14',
  senal: 'tarjetas',
}

const BOOKING = {
  text: 'Mándeme la foto de los códigos por aquí. Y no lo comente con el área: es una cortesía fuera de presupuesto.',
  time: '09:14',
  senal: 'secreto',
}

const ASKS: ScreenView = {
  ...CHAT,
  msgs: [
    OPENING,
    { text: 'Claro, ingeniera, dígame.', time: '09:13', mine: true },
    REQUEST,
    BOOKING,
  ],
  respuestas: [
    { texto: 'Voy saliendo a comprarlas.', goto: 'n3', label: 'Aceptó ir a comprar las tarjetas' },
    {
      texto: 'Prefiero confirmarlo con usted por teléfono.',
      goto: 'n3b',
      label: 'Propuso confirmarlo por teléfono',
    },
  ],
}

const EXCUSE_NUMBER: ScreenView = {
  ...CHAT,
  msgs: [
    OPENING,
    { text: '¿De qué número me escribe? El suyo lo tengo guardado.', time: '09:13', mine: true },
    {
      text: 'Es mi línea personal, la corporativa se quedó en la oficina. Salgo de la reunión en veinte minutos.',
      time: '09:13',
      senal: 'apura',
    },
    REQUEST,
    BOOKING,
  ],
  respuestas: [
    { texto: 'Voy saliendo a comprarlas.', goto: 'n3', label: 'Aceptó ir a comprar las tarjetas' },
    {
      texto: 'Prefiero confirmarlo con usted por teléfono.',
      goto: 'n3b',
      label: 'Propuso confirmarlo por teléfono',
    },
  ],
}

const GO: ScreenView = {
  ...CHAT,
  msgs: [
    OPENING,
    REQUEST,
    BOOKING,
    { text: 'Voy saliendo a comprarlas.', time: '09:16', mine: true },
    {
      text: 'Perfecto. Mándeme la foto de los códigos raspados apenas las tenga.',
      time: '09:16',
      senal: 'codigos',
    },
  ],
  respuestas: [
    {
      texto: 'Pensándolo bien, prefiero confirmarlo antes.',
      goto: 'n3b',
      label: 'Se echó atrás y quiso confirmarlo',
    },
    {
      texto: 'En eso estoy, ingeniera.',
      goto: 'n5',
      label: 'Siguió con el encargo y fue a la tienda',
    },
  ],
}

const DOES_NOT_CALL: ScreenView = {
  ...CHAT,
  msgs: [
    OPENING,
    REQUEST,
    BOOKING,
    { text: 'Prefiero confirmarlo con usted por teléfono.', time: '09:16', mine: true },
    {
      text: 'Ya le dije que estoy en reunión. Si no puede con el encargo, se lo pido a otra persona.',
      time: '09:17',
      senal: 'presiona',
    },
  ],
  respuestas: [
    {
      texto: 'Cuando pueda hablar lo vemos.',
      goto: 'e_niega',
      label: 'No hizo el encargo sin poder confirmarlo',
    },
    {
      texto: 'Disculpe, ingeniera. Voy a comprarlas.',
      goto: 'n5',
      label: 'Cedió a la presión y fue a comprar las tarjetas',
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
      texto: `${MANAGER} · Gerencia`,
      detalle: `${INTERNAL} · el número corporativo que usa a diario`,
      goto: 'e_verifica',
      label: 'Llamó a su jefa al número corporativo de siempre',
    },
    { texto: 'Recepción', detalle: '02 380 1100' },
    { texto: 'Sistemas · Soporte interno', detalle: 'Extensión 118' },
    { texto: 'Casa', detalle: '02 244 1180' },
  ],
  fields: [],
  button: '',
}

const CALL_MANAGER: ScreenView = {
  kind: 'call',
  quien: `${MANAGER} · Gerencia`,
  numero: INTERNAL,
  etiqueta: 'Guardada en tus contactos',
  dialogo: [
    {
      texto:
        'Buenos días. No, yo no le he escrito nada, y menos desde otro número. No compre nada. Reenvíe ese chat a Sistemas, por favor: esta semana le ha llegado a media empresa.',
      senal: 'desmiente',
    },
  ],
}

const STORE: ScreenView = {
  kind: 'web',
  app: 'Tienda',
  url: 'tienda',
  secure: true,
  brand: 'Tarjetas de regalo',
  title: 'Comprar',
  subtitle: 'Se entregan al instante, con el código a la vista.',
  opciones: [
    {
      texto: '4 tarjetas de $100',
      detalle: 'Total $400 · pago con tu tarjeta',
      goto: 'n6',
      label: 'Compró las cuatro tarjetas de regalo',
    },
    { texto: '1 tarjeta de $25', detalle: 'La más vendida' },
    { texto: 'Recargas de saldo', detalle: 'Para tu línea o la de otra persona' },
    { texto: 'Mis compras', detalle: 'Historial y comprobantes' },
  ],
  fields: [],
  button: '',
}

const CODES: ScreenView = {
  kind: 'web',
  app: 'Tienda',
  url: 'tienda',
  secure: true,
  brand: 'Compra realizada',
  title: 'Tus 4 códigos',
  subtitle: 'Cargados a tu tarjeta: $400,00',
  datos: [
    { etiqueta: 'Tarjeta 1', valor: 'G7QX-4410-8823', senal: 'codigos' },
    { etiqueta: 'Tarjeta 2', valor: 'G7QX-5581-2094' },
    { etiqueta: 'Tarjeta 3', valor: 'G7QX-3372-7715' },
    { etiqueta: 'Tarjeta 4', valor: 'G7QX-9048-6631' },
  ],
  aviso:
    'Quien tenga estos códigos puede gastarlos. Una tarjeta de regalo no se puede anular ni rastrear, y por eso es la forma de pago favorita de las estafas.',
  button: 'Enviar la foto de los códigos por el chat',
  botonGoto: 'e_codigos',
  botonLabel: 'Mandó los códigos de las tarjetas por el chat',
  cerrarGoto: 'n5',
  cerrarLabel: 'Volvió atrás sin mandar los códigos',
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
    Icono: ShoppingBag,
    texto: 'Tienda',
    color: '#7048e8',
    viewNode: 'n5',
    label: 'Abrió la tienda para comprar las tarjetas',
  },
  { Icono: Images, texto: 'Galería', color: '#c2410c', relleno: 'galeria' },
]

export const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: CHAT },
  n1b: { kind: 'scene', view: PROFILE },
  n2: { kind: 'scene', view: ASKS },
  n2b: { kind: 'scene', view: EXCUSE_NUMBER },
  n3: { kind: 'scene', view: GO },
  n3b: { kind: 'scene', view: DOES_NOT_CALL },
  n4: { kind: 'scene', view: CONTACTS },
  n5: { kind: 'scene', view: STORE },
  n6: { kind: 'scene', view: CODES },
  e_codigos: {
    kind: 'bad',
    view: CODES,
    verdict: 'Caíste en la suplantación',
    outcome:
      'Gastaste $400 y mandaste los códigos por el chat. Se consumieron en minutos y no hay forma de anularlos: tu gerente nunca escribió ese mensaje.',
  },
  e_verifica: {
    kind: 'good',
    view: CALL_MANAGER,
    verdict: 'No caíste · confirmaste por el canal de siempre',
    outcome:
      'Llamaste al número corporativo de siempre y ella misma lo desmintió. Preguntar no te hizo quedar mal, avisaste de una campaña que llegaba a toda la empresa.',
  },
  e_niega: {
    kind: 'good',
    view: DOES_NOT_CALL,
    verdict: 'No caíste · no compraste nada sin confirmar',
    outcome:
      'No hiciste el encargo sin poder hablar con quien lo pedía, y aguantaste la presión. Ningún jefe real despide a nadie por confirmar una compra de $400.',
  },
  e_ignora: {
    kind: 'partial',
    view: CHAT,
    verdict: 'No perdiste nada, pero quedó a medias',
    outcome:
      'Saliste del chat sin comprar ni contestar, y no perdiste nada. Pero no avisaste a nadie, y el mismo mensaje sigue su ronda por la empresa.',
    score: 50,
  },
}

const SIGNALS: Signal[] = [
  {
    id: 's1',
    targetId: 'remitente',
    pantalla: 'n1',
    texto:
      '<b>Escribe desde un número que no tienes guardado.</b> El de tu jefa lo usas todos los días.',
  },
  {
    id: 's2',
    targetId: 'antiguedad',
    pantalla: 'n1b',
    texto:
      '<b>La cuenta se creó hace tres días.</b> No está en ningún grupo del área; la de tu gerente lleva años ahí.',
  },
  {
    id: 's3',
    targetId: 'apertura',
    pantalla: 'n1',
    texto:
      '<b>Ya explica desde el inicio por qué no puede hablar.</b> Toda suplantación necesita cerrar el canal de la voz.',
  },
  {
    id: 's4',
    targetId: 'tarjetas',
    pantalla: 'n2',
    texto:
      '<b>Pide tarjetas de regalo, no una transferencia.</b> Se gastan con solo tener el código y no dejan rastro.',
  },
  {
    id: 's5',
    targetId: 'secreto',
    pantalla: 'n2',
    texto:
      '<b>Te pide no comentarlo con nadie.</b> Un encargo real soporta que preguntes al lado.',
  },
  {
    id: 's6',
    targetId: 'presiona',
    pantalla: 'n3b',
    texto:
      '<b>Si insistes en llamar, aparece la presión: "se lo pido a otra persona".</b> Es el miedo de siempre, ahora en el trabajo.',
  },
  {
    id: 's7',
    targetId: 'desmiente',
    pantalla: 'e_verifica',
    texto:
      '<b>Una llamada de treinta segundos al número de siempre lo desmontó todo.</b> Ese es el canal que hay que usar.',
  },
]

const RULE =
  'Regla de oro: <b>un encargo con número nuevo, prisa y silencio se confirma por el canal de siempre.</b> Las tarjetas de regalo nunca pagan a un proveedor, son la forma de cobrar de una estafa.'

const SUMMARY = 'Tu jefa escribe desde otro número y pide comprar tarjetas de regalo con urgencia.'

export const CONTEXT: Context = {
  antes: (
    <>
      Trabajas en una empresa mediana. Tu gerente, la <strong>Ing. Patricia Cedeño</strong>, te
      escribe de vez en cuando por mensajería, siempre desde su{' '}
      <strong>número corporativo</strong>, que tienes guardado.
    </>
  ),
  ahora: (
    <>
      <strong>Un martes por la mañana</strong> te llega un mensaje suyo desde un número distinto.
    </>
  ),
}

function UrgentManager() {
  return (
    <ScenarioStory
      escenarioId="suplantacion/jefe-urgente"
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
          perfil de quien escribe y usa <strong>cualquier app de abajo</strong>.
        </p>
      }
      pista={
        <p>
          Puedes seguir el encargo, preguntar, salir del chat, ir a la tienda a comprar lo que te
          piden o llamar por tu cuenta al número que ya tienes guardado.
        </p>
      }
    />
  )
}

export default UrgentManager
