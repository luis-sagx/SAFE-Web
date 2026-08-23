import { Camera, MessageCircle, Phone, ShoppingBag } from 'lucide-react'
import StoryEscenario, { type AppTelefono, type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'

/**
 * El jefe que escribe desde otro número.
 *
 * La suplantación en el trabajo no pide dinero: pide un encargo. Y funciona
 * por algo que no tiene que ver con la tecnología, sino con la jerarquía —a la
 * gerente no se le pregunta dos veces, y menos si dice que está en una reunión
 * con auditoría.
 *
 * Por eso el acierto no es solo no comprar: es comprobar por el canal de
 * siempre, que en una empresa está a un toque en la agenda. El escenario deja
 * a la vista lo incómodo que se siente hacerlo.
 */

const JEFA = 'Patricia Cedeño'
const DESCONOCIDO = '+593 98 776 5510'
const INTERNO = '+593 99 501 2244'

const APERTURA = {
  text: `Buenos días. Habla la Ing. ${JEFA}, de gerencia. Estoy en una reunión con auditoría y no puedo hablar. ¿Me ayuda con un encargo?`,
  time: '09:12',
  senal: 'apertura',
}

const CHAT: ScreenView = {
  kind: 'sms',
  sender: DESCONOCIDO,
  sub: 'No está en tus contactos · toca para ver el perfil',
  senalRemitente: 'remitente',
  perfilGoto: 'n1b',
  perfilLabel: 'Abrió el perfil del número que le escribía',
  msgs: [APERTURA],
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

const PERFIL: ScreenView = {
  kind: 'web',
  app: 'Mensajes',
  url: 'perfil',
  secure: true,
  brand: 'Información del contacto',
  title: DESCONOCIDO,
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

const ENCARGO = {
  text: 'Compre 4 tarjetas de regalo de $100 para un cliente que llega al mediodía. Hoy mismo se le reembolsa con el rol.',
  time: '09:14',
  senal: 'tarjetas',
}

const RESERVA = {
  text: 'Mándeme la foto de los códigos por aquí. Y no lo comente con el área: es una cortesía fuera de presupuesto.',
  time: '09:14',
  senal: 'secreto',
}

const PIDE: ScreenView = {
  ...CHAT,
  msgs: [
    APERTURA,
    { text: 'Claro, ingeniera, dígame.', time: '09:13', mine: true },
    ENCARGO,
    RESERVA,
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

const EXCUSA_NUMERO: ScreenView = {
  ...CHAT,
  msgs: [
    APERTURA,
    { text: '¿De qué número me escribe? El suyo lo tengo guardado.', time: '09:13', mine: true },
    {
      text: 'Es mi línea personal, la corporativa se quedó en la oficina. Salgo de la reunión en veinte minutos.',
      time: '09:13',
      senal: 'apura',
    },
    ENCARGO,
    RESERVA,
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

const VOY: ScreenView = {
  ...CHAT,
  msgs: [
    APERTURA,
    ENCARGO,
    RESERVA,
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

const NO_LLAMA: ScreenView = {
  ...CHAT,
  msgs: [
    APERTURA,
    ENCARGO,
    RESERVA,
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

const AGENDA: ScreenView = {
  kind: 'web',
  app: 'Teléfono',
  url: 'contactos',
  secure: true,
  brand: 'Contactos',
  title: 'Tu agenda',
  opciones: [
    {
      texto: `${JEFA} · Gerencia`,
      detalle: `${INTERNO} · el número corporativo que usa a diario`,
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

const LLAMADA_JEFA: ScreenView = {
  kind: 'call',
  quien: `${JEFA} · Gerencia`,
  numero: INTERNO,
  etiqueta: 'Guardada en tus contactos',
  dialogo: [
    {
      texto:
        'Buenos días. No, yo no le he escrito nada, y menos desde otro número. No compre nada. Reenvíe ese chat a Sistemas, por favor: esta semana le ha llegado a media empresa.',
      senal: 'desmiente',
    },
  ],
}

const TIENDA: ScreenView = {
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

const CODIGOS: ScreenView = {
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
    Icono: ShoppingBag,
    texto: 'Tienda',
    color: '#7048e8',
    goto: 'n5',
    label: 'Abrió la tienda para comprar las tarjetas',
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
  n2: { kind: 'scene', view: PIDE },
  n2b: { kind: 'scene', view: EXCUSA_NUMERO },
  n3: { kind: 'scene', view: VOY },
  n3b: { kind: 'scene', view: NO_LLAMA },
  n4: { kind: 'scene', view: AGENDA },
  n5: { kind: 'scene', view: TIENDA },
  n6: { kind: 'scene', view: CODIGOS },
  e_codigos: {
    kind: 'bad',
    view: CODIGOS,
    verdict: 'Caíste en la suplantación',
    outcome:
      'Gastaste $400 de tu propio dinero y mandaste los códigos por el chat. Se consumieron en minutos, en otro país, y no hay forma de anularlos ni de saber quién los usó. Tu gerente nunca escribió ese mensaje: el mismo texto le llegó esa semana a media empresa, con su foto sacada de la web corporativa.',
  },
  e_verifica: {
    kind: 'good',
    view: LLAMADA_JEFA,
    verdict: 'No caíste · confirmaste por el canal de siempre',
    outcome:
      'Llamaste al número corporativo que usas a diario y ella misma lo desmintió. Preguntar no te hizo quedar mal: al contrario, avisaste de una campaña que estaba llegándole a toda la empresa.',
  },
  e_niega: {
    kind: 'good',
    view: NO_LLAMA,
    verdict: 'No caíste · no compraste nada sin confirmar',
    outcome:
      'No hiciste el encargo sin poder hablar con quien lo pedía, y aguantaste la presión de que "se lo pido a otra persona". Ningún jefe real despide a nadie por confirmar una compra de $400. Lo que falta es avisar a Sistemas: si te llegó a ti, le está llegando a más gente.',
  },
  e_ignora: {
    kind: 'partial',
    view: CHAT,
    verdict: 'No perdiste nada, pero quedó a medias',
    outcome:
      'Saliste del chat sin comprar ni contestar, y no perdiste un centavo. Pero no comprobaste nada ni avisaste a nadie: el mismo mensaje siguió su ronda por la empresa, y alguien con menos calle puede estar comprando las tarjetas ahora mismo.',
    score: 50,
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'remitente',
    pantalla: 'n1',
    texto:
      'Escribe desde un <b>número que no tienes guardado</b>, aunque el de tu jefa lo usas todos los días. La jerarquía hace que preguntarlo cueste, y en eso se apoya el engaño.',
  },
  {
    id: 's2',
    targetId: 'antiguedad',
    pantalla: 'n1b',
    texto:
      'La cuenta se creó <b>hace tres días</b> y no está en ningún grupo del área. La de tu gerente lleva años ahí.',
  },
  {
    id: 's3',
    targetId: 'apertura',
    pantalla: 'n1',
    texto:
      'La primera frase ya explica <b>por qué no se puede hablar</b>. Toda suplantación necesita cerrar el canal donde se le caería el papel: la voz.',
  },
  {
    id: 's4',
    targetId: 'tarjetas',
    pantalla: 'n2',
    texto:
      'Pide <b>tarjetas de regalo</b>, no una transferencia. Es dinero que se gasta con solo tener el código, no se puede reversar y no deja rastro de quién lo usó.',
  },
  {
    id: 's5',
    targetId: 'secreto',
    pantalla: 'n2',
    texto:
      'Te pide <b>no comentarlo con nadie</b>. Cualquier encargo real de una empresa soporta que preguntes al lado; este necesita que no lo hagas.',
  },
  {
    id: 's6',
    targetId: 'presiona',
    pantalla: 'n3b',
    texto:
      'Si insistes en llamar, aparece la <b>presión</b>: "se lo pido a otra persona". Es el mismo miedo de siempre, esta vez a quedar mal en el trabajo.',
  },
  {
    id: 's7',
    targetId: 'desmiente',
    pantalla: 'e_verifica',
    texto:
      'Una llamada de treinta segundos al <b>número de siempre</b> lo desmontó todo. Ese es el canal que hay que usar, no el que eligió quien escribió.',
  },
]

const RULE =
  'Regla de oro: un encargo que llega por un <b>número nuevo</b>, con prisa y pidiendo silencio, se confirma por el canal de siempre antes de gastar un dólar. Y las <b>tarjetas de regalo</b> nunca son una forma de pagar a un proveedor: son la forma de cobrar de una estafa.'

const RESUMEN = 'Tu jefa escribe desde otro número y pide comprar tarjetas de regalo con urgencia.'

const CONTEXTO: Contexto = {
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

function JefeUrgente() {
  return (
    <StoryEscenario
      escenarioId="suplantacion/jefe-urgente"
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

export default JefeUrgente
