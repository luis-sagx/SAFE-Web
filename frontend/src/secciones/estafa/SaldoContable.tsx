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
 * El pago entra como depósito con cheque, que es donde esas dos líneas se
 * separan de verdad en un banco ecuatoriano: el cheque se acredita "salvo buen
 * cobro" y se queda en efectivización hasta que el banco lo cobra. Si la cuenta
 * de quien lo firmó no tiene fondos, sale protestado y el banco anula el
 * depósito.
 *
 * Es el fraude de venta más común del país y el más barato de evitar: no hace
 * falta reconocer nada raro, solo esperar a que el dinero se pueda usar. Toda
 * la estafa consiste en que no esperes, y por eso el guion aprieta con el
 * courier y con la hora.
 */

const COMPRADOR = 'Fernando Zurita'
const NUMERO_COMPRADOR = '+593 98 447 1926'

const AVISA = {
  text: `Buenas, ya le deposité los $1.000 por la laptop, con cheque, en su cuenta. Revise que ya debe estar reflejado. Le mando el comprobante.`,
  time: '10:12',
  senal: 'avisa',
}

/// La papeleta del depósito. Va dibujada como una foto de verdad, con su banco
/// y su número de transacción, porque falsificarla cuesta cinco minutos y
/// creerla es exactamente el error que mide el escenario.
const COMPROBANTE = {
  text: 'Ahí está, mire 👆',
  time: '10:13',
  senal: 'comprobante',
  captura: {
    quien: 'Banco Nacional del Pacífico',
    sub: 'Comprobante de depósito',
    icono: 'banco' as const,
    datos: [
      { etiqueta: 'Valor', valor: '$1.000,00' },
      { etiqueta: 'Cuenta destino', valor: IDENTIDAD_FICTICIA.cuenta },
      { etiqueta: 'Forma de pago', valor: 'Cheque otro banco n.º 0004821' },
      { etiqueta: 'Fecha', valor: 'Hoy · 10:09' },
      { etiqueta: 'N.º de transacción', valor: '884120397' },
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
    'El saldo disponible es el dinero que puedes usar. El contable incluye valores en efectivización: depósitos que el banco anotó pero todavía no ha cobrado.',
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
      valor: 'Depósito cheque otro banco $1.000,00 · EN EFECTIVIZACIÓN, salvo buen cobro',
      senal: 'proceso',
    },
    { etiqueta: 'Ayer · 18:22', valor: 'Compra Supermercado La Favorita $46,10' },
    { etiqueta: 'Ayer · 09:15', valor: 'Pago de luz $18,40' },
    { etiqueta: '12 ago', valor: 'Depósito de sueldo $780,00' },
  ],
  aviso:
    'Salvo buen cobro quiere decir que el dinero todavía no es tuyo. Si al cobrar el cheque la cuenta de quien lo firmó no tiene fondos, sale protestado y el banco anula el depósito.',
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
    {
      text: 'En mi banco aparece en efectivización, todavía no disponible.',
      time: '10:19',
      mine: true,
    },
    {
      text: 'Eso es normal, el cheque es de otro banco y siempre demora un día. La papeleta ya le dice que el depósito se hizo. Yo ya cumplí, mándeme la laptop 🙏',
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
      'La laptop salió y al día siguiente el cheque volvió protestado por insuficiencia de fondos. El banco anuló el depósito y te descontó los $1.000 del saldo, tal como avisaba la pantalla. La papeleta era auténtica y no servía de nada: solo probaba que alguien dejó un cheque en la ventanilla, no que ese cheque tuviera fondos detrás. Te quedaste sin equipo y sin los mil dólares.',
  },
  e_espera: {
    kind: 'good',
    view: DESPUES_DE_VER,
    verdict: 'No caíste · esperaste el saldo disponible',
    outcome:
      'No despachaste, y eso bastó. El cheque salió protestado al día siguiente y los mil dólares desaparecieron del saldo contable sin llegar nunca al disponible. Fernando dejó de escribir esa misma tarde. Tú seguías con tu laptop.',
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
      'El <b>saldo contable</b> incluye lo que el banco anotó pero todavía no cobró. Sube en cuanto alguien deposita un cheque, y baja igual de rápido si ese cheque no tiene fondos.',
  },
  {
    id: 's3',
    targetId: 'proceso',
    pantalla: 'n4',
    texto:
      'El movimiento lo dice con todas sus letras: <b>en efectivización, salvo buen cobro</b>. El banco te anota el valor, pero el cheque todavía no está cobrado: si sale protestado, te lo descuenta.',
  },
  {
    id: 's4',
    targetId: 'comprobante',
    pantalla: 'n1',
    texto:
      'El <b>comprobante no es el dinero</b>. Se falsifica en cinco minutos, y aunque sea auténtico solo prueba que alguien dejó un cheque en la ventanilla, no que ese cheque tenga fondos.',
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
      '"Es de otro banco, por eso demora" <b>es verdad y no cambia nada</b>. Que demore es justo la razón para esperar: lo que se entrega es contra dinero disponible, no contra una explicación.',
  },
]

const RULE =
  'Regla de oro: no entregues nada hasta que el dinero esté en tu <b>saldo disponible</b>. Ni el comprobante, ni la captura, ni el saldo contable son el pago; solo el disponible es tuyo, y esperar un día no le cuesta nada a un comprador de verdad.'

const RESUMEN =
  'Vendes una laptop y el comprador manda un comprobante de depósito pidiendo que despaches ya.'

const CONTEXTO: Contexto = {
  antes: (
    <>
      Pusiste en venta tu <strong>laptop en $1.000</strong> por una página de compraventa, y un
      comprador de otra ciudad quedó en depositarte el pago en tu cuenta.
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
          movimientos o ir directo a despachar. Fíjate en qué dice tu banco y no en qué dice la
          papeleta.
        </p>
      }
    />
  )
}

export default SaldoContable
