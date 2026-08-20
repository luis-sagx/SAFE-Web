import { Camera, MessageCircle, Package, Wallet } from 'lucide-react'
import StoryEscenario, { type AppTelefono, type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { CUENTA_FICTICIA, IDENTIDAD_FICTICIA } from '../../lib/identidadFicticia'

/**
 * La puerta de entrada del módulo: vendes algo y te enseñan un comprobante.
 *
 * Aquí nadie suplanta a nadie. El comprador es un desconocido cualquiera, el
 * trato lo empezaste tú y el dinero sale de tu mano por tu propia decisión. Lo
 * único que hay que saber está escrito en tu propia app del banco, en dos
 * líneas que casi nadie distingue: saldo contable y saldo disponible.
 *
 * Es el fraude de venta más común del país y el más barato de evitar: no hace
 * falta reconocer nada raro, solo esperar a que el dinero se pueda usar. Toda
 * la estafa consiste en que no esperes, y por eso el guion aprieta con el
 * courier, con la hora y con la amenaza de reportarte.
 */

const COMPRADOR = 'Fernando Zurita'
const NUMERO_COMPRADOR = '+593 98 447 1926'

const AVISA = {
  text: `Buenas, ya le hice la transferencia de los $1.000 por la laptop. Revise su cuenta que ya debe estar reflejado. Le mando el comprobante.`,
  time: '10:12',
  senal: 'avisa',
}

/// El comprobante. Va dibujado como una captura de verdad, con su banco y su
/// número de aprobación, porque falsificarlo cuesta cinco minutos y creerlo es
/// exactamente el error que mide el escenario.
const COMPROBANTE = {
  text: 'Ahí está, mire 👆',
  time: '10:13',
  senal: 'comprobante',
  captura: {
    quien: 'Banco Nacional del Pacífico',
    sub: 'Transferencia realizada',
    icono: 'banco' as const,
    datos: [
      { etiqueta: 'Valor', valor: '$1.000,00' },
      { etiqueta: 'Destino', valor: IDENTIDAD_FICTICIA.cuenta },
      { etiqueta: 'Fecha', valor: 'Hoy · 10:09' },
      { etiqueta: 'N.º de aprobación', valor: '884120397' },
      { etiqueta: 'Estado', valor: 'Procesada' },
    ],
  },
}

const CHAT: ScreenView = {
  kind: 'sms',
  sender: COMPRADOR,
  sub: `${NUMERO_COMPRADOR} · comprador de la laptop`,
  msgs: [AVISA, COMPROBANTE],
  respuestas: [
    {
      texto: 'Listo, ya mismo le despacho la laptop.',
      goto: 'n5',
      label: 'Aceptó despachar sin comprobar su cuenta',
    },
    {
      texto: 'Deme un momento, reviso mi banco.',
      goto: 'n2',
      label: 'Dijo que iba a revisar su cuenta antes de despachar',
    },
  ],
  volverGoto: 'e_ignora',
  volverLabel: 'Salió del chat sin contestar ni comprobar',
}

const APURA: ScreenView = {
  ...CHAT,
  msgs: [
    AVISA,
    COMPROBANTE,
    { text: 'Deme un momento, reviso mi banco.', time: '10:14', mine: true },
    {
      text: 'Dele nomás, pero apúrese que el courier ya está en camino a recoger. Si no sale hoy me cobran otro flete 😤',
      time: '10:14',
      senal: 'prisa',
    },
  ],
  respuestas: [
    {
      texto: 'Ya voy, deje veo la app.',
      goto: 'n3',
      label: 'Abrió la app del banco para revisar',
    },
    {
      texto: 'Está bien, no se preocupe, ya le despacho.',
      goto: 'n5',
      label: 'Cedió a la prisa y fue a despachar sin comprobar',
    },
  ],
}

/// La pantalla entera del escenario. Las dos líneas están juntas, con las
/// mismas letras, y dicen cosas distintas: contable es lo que el banco anotó,
/// disponible es lo que puedes usar.
const BANCO: ScreenView = {
  kind: 'web',
  app: IDENTIDAD_FICTICIA.banco,
  url: 'bancolitoral.ec',
  secure: true,
  brand: 'Banca móvil',
  title: 'Cuenta de ahorros',
  subtitle: CUENTA_FICTICIA,
  datos: [
    { etiqueta: 'Saldo contable', valor: '$1.240,50', senal: 'contable' },
    { etiqueta: 'Saldo disponible', valor: '$240,50', senal: 'disponible' },
  ],
  aviso:
    'El saldo disponible es el dinero que puedes usar. El contable incluye valores que todavía están en proceso y que el banco puede reversar.',
  opciones: [
    {
      texto: 'Ver movimientos',
      detalle: 'Últimos 30 días',
      goto: 'n4',
      label: 'Abrió los movimientos de la cuenta',
    },
    { texto: 'Transferir', detalle: 'A cuentas propias o de terceros' },
    { texto: 'Pagar servicios', detalle: 'Luz, agua, teléfono e internet' },
  ],
  cerrarGoto: 'n2b',
  cerrarLabel: 'Volvió al chat después de mirar su saldo',
  fields: [],
  button: '',
}

const MOVIMIENTOS: ScreenView = {
  kind: 'web',
  app: IDENTIDAD_FICTICIA.banco,
  url: 'bancolitoral.ec',
  secure: true,
  brand: 'Movimientos',
  title: 'Cuenta de ahorros',
  subtitle: 'Últimos movimientos, del más nuevo al más antiguo.',
  datos: [
    {
      etiqueta: 'Hoy · 10:09',
      valor: 'Depósito recibido $1.000,00 · EN PROCESO, no disponible hasta su confirmación',
      senal: 'proceso',
    },
    { etiqueta: 'Ayer · 18:22', valor: 'Compra Supermercado La Favorita $46,10' },
    { etiqueta: 'Ayer · 09:15', valor: 'Pago de luz $18,40' },
    { etiqueta: '12 ago', valor: 'Depósito de sueldo $780,00' },
  ],
  aviso:
    'Un depósito en proceso todavía no es tuyo. Si el origen del dinero se cae o resulta ser fraudulento, el banco lo retira de tu cuenta.',
  cerrarGoto: 'n3',
  cerrarLabel: 'Volvió al resumen de la cuenta',
  fields: [],
  button: '',
}

const DESPUES_DE_VER: ScreenView = {
  ...CHAT,
  msgs: [
    AVISA,
    COMPROBANTE,
    { text: 'Deme un momento, reviso mi banco.', time: '10:14', mine: true },
    {
      text: 'Dele nomás, pero apúrese que el courier ya está en camino a recoger. Si no sale hoy me cobran otro flete 😤',
      time: '10:14',
      senal: 'prisa',
    },
    { text: 'En mi banco el dinero aparece en proceso, no disponible.', time: '10:19', mine: true },
    {
      text: 'Eso es normal, es porque somos de bancos distintos, siempre demora. El comprobante ya le dice que salió de mi cuenta. Yo ya cumplí, mándeme la laptop 🙏',
      time: '10:20',
      senal: 'excusa',
    },
  ],
  respuestas: [
    {
      texto: 'Cuando esté disponible le despacho, no antes.',
      goto: 'e_espera',
      label: 'Se negó a despachar hasta que el dinero estuviera disponible',
    },
    {
      texto: 'Tiene razón, ya le mando el equipo.',
      goto: 'n5',
      label: 'Aceptó la explicación y fue a despachar el equipo',
    },
  ],
}

const COURIER: ScreenView = {
  kind: 'web',
  app: 'Envíos Andina',
  url: 'enviosandina.ec',
  secure: true,
  brand: 'Nuevo envío',
  title: 'Confirma el despacho',
  subtitle: 'Revisa los datos antes de entregar el paquete al motorizado.',
  datos: [
    { etiqueta: 'Contenido', valor: 'Laptop usada, valor declarado $1.000,00' },
    { etiqueta: 'Destinatario', valor: COMPRADOR },
    { etiqueta: 'Destino', valor: 'Guayaquil · dirección entregada por el comprador' },
    { etiqueta: 'Pago del flete', valor: 'Contra entrega, lo paga quien recibe' },
  ],
  aviso: 'Una vez despachado, el envío no se puede detener ni devolver.',
  button: 'Despachar el paquete',
  botonGoto: 'e_envia',
  botonLabel: 'Despachó la laptop antes de que el dinero estuviera disponible',
  cerrarGoto: 'n2b',
  cerrarLabel: 'Volvió al chat sin despachar',
  fields: [],
}

const APPS: AppTelefono[] = [
  { Icono: MessageCircle, texto: 'Mensajes', color: '#2f9e44', hilo: 'sms' },
  {
    Icono: Wallet,
    texto: IDENTIDAD_FICTICIA.banco,
    color: '#155e75',
    goto: 'n3',
    label: 'Abrió la app del banco',
  },
  {
    Icono: Package,
    texto: 'Envíos Andina',
    color: '#e8590c',
    goto: 'n5',
    label: 'Abrió la app del courier para despachar',
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
  n2: { kind: 'scene', view: APURA },
  n2b: { kind: 'scene', view: DESPUES_DE_VER },
  n3: { kind: 'scene', view: BANCO },
  n4: { kind: 'scene', view: MOVIMIENTOS },
  n5: { kind: 'scene', view: COURIER },
  e_envia: {
    kind: 'bad',
    view: COURIER,
    verdict: 'Caíste en la estafa',
    outcome:
      'La laptop salió y el depósito se cayó dos días después: venía de una cuenta robada, y el banco te lo retiró del saldo tal como avisaba la pantalla. El comprobante era auténtico en la forma y falso en el fondo, porque una transferencia se puede iniciar y reversar. Te quedaste sin equipo y sin los mil dólares.',
  },
  e_espera: {
    kind: 'good',
    view: DESPUES_DE_VER,
    verdict: 'No caíste · esperaste el saldo disponible',
    outcome:
      'No despachaste, y eso bastó. El depósito nunca llegó a confirmarse: se cayó al segundo día y desapareció del saldo contable. Fernando dejó de escribir esa misma tarde. Tú seguías con tu laptop.',
  },
  e_ignora: {
    kind: 'partial',
    view: CHAT,
    verdict: 'No perdiste nada, pero fue por casualidad',
    outcome:
      'Saliste del chat y no despachaste, que es lo que importaba. Pero tampoco comprobaste nada: si el comprador hubiera insistido un poco más, o si hubieras tenido el courier a mano, la decisión habría sido la misma sin saber por qué. Mirar el saldo disponible cuesta dos toques.',
    score: 50,
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'disponible',
    pantalla: 'n3',
    texto:
      'El <b>saldo disponible</b> es el único número que cuenta: es el dinero que ya es tuyo y puedes usar. Los mil dólares no estaban ahí.',
  },
  {
    id: 's2',
    targetId: 'contable',
    pantalla: 'n3',
    texto:
      'El <b>saldo contable</b> incluye lo que el banco anotó pero todavía no confirmó. Sube en cuanto alguien inicia una transferencia, y baja igual de rápido si se cae.',
  },
  {
    id: 's3',
    targetId: 'proceso',
    pantalla: 'n4',
    texto:
      'El movimiento lo dice con todas sus letras: <b>en proceso, no disponible</b>. Un depósito en proceso se puede reversar, y si el dinero venía de una cuenta robada, se reversa.',
  },
  {
    id: 's4',
    targetId: 'comprobante',
    pantalla: 'n1',
    texto:
      'El <b>comprobante no es el dinero</b>. Se falsifica en cinco minutos, y aunque sea auténtico solo prueba que alguien inició una transferencia, no que llegara a tu cuenta para quedarse.',
  },
  {
    id: 's5',
    targetId: 'prisa',
    pantalla: 'n2',
    texto:
      'La <b>prisa del courier</b> es del guion, no del envío. Quien quiere el equipo antes de que el dinero se confirme necesita justo eso: que despaches dentro de la ventana en la que todavía se puede reversar.',
  },
  {
    id: 's6',
    targetId: 'excusa',
    pantalla: 'n2b',
    texto:
      '"Es que somos de bancos distintos" <b>no cambia nada</b>. Puede que demore, y por eso mismo se espera: lo que se entrega es contra dinero disponible, no contra una explicación.',
  },
]

const RULE =
  'Regla de oro: no entregues nada hasta que el dinero esté en tu <b>saldo disponible</b>. Ni el comprobante, ni la captura, ni el saldo contable son el pago; solo el disponible es tuyo, y esperar un día no le cuesta nada a un comprador de verdad.'

const RESUMEN = 'Vendes una laptop y el comprador manda un comprobante pidiendo que despaches ya.'

const CONTEXTO: Contexto = {
  antes: (
    <>
      Pusiste en venta tu <strong>laptop en $1.000</strong> por una página de compraventa, y un
      comprador de otra ciudad quedó en pagarte por transferencia.
    </>
  ),
  ahora: (
    <>
      <strong>Esta mañana</strong> te escribe diciendo que ya hizo el pago y te manda el
      comprobante. Quiere que despaches hoy mismo.
    </>
  ),
  detalle: 'La laptop sigue en tu casa y el courier no ha pasado todavía.',
}

function SaldoContable() {
  return (
    <StoryEscenario
      escenarioId="estafa/saldo-contable"
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
          Actúa sobre el teléfono como lo harías con el tuyo: contéstale al comprador y usa{' '}
          <strong>cualquier app de abajo</strong>.
        </p>
      }
      pista={
        <p>
          Puedes seguirle la conversación, abrir tu banco a mirar la cuenta, entrar en los
          movimientos o ir directo a despachar. Fíjate en qué dice tu banco y no en qué dice el
          comprobante.
        </p>
      }
    />
  )
}

export default SaldoContable
