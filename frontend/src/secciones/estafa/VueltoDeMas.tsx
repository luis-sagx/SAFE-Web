import { Camera, MessageCircle, Phone, Wallet } from 'lucide-react'
import StoryEscenario, { type AppTelefono, type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { CUENTA_FICTICIA, IDENTIDAD_FICTICIA } from '../../lib/identidadFicticia'

/**
 * El error que se paga con dinero propio: te transfieren de más y te piden la
 * diferencia.
 *
 * Es el más difícil del módulo porque el dinero *sí* entra, y entra de verdad:
 * lo ves en tu saldo. Lo que no se ve es de dónde salió. Cuando el dueño de la
 * cuenta robada reclama, el banco reversa esos $1.300 y tú ya devolviste
 * $1.170 de tu bolsillo a un desconocido.
 *
 * La salida no es reconocer nada raro en el mensaje, porque no lo hay: es
 * saber a quién le toca arreglarlo. Un dinero que llegó por error se devuelve
 * por el banco, nunca de mano a mano.
 */

const COMPRADOR = 'Diego Alarcón'
const NUMERO_COMPRADOR = '+593 96 720 3384'
const CUENTA_DEVOLUCION = '3388-9012-45 · Wilson Pinto Cedeño'
const BANCO_TELEFONO = '1700 100 200'

const DISCULPA = {
  text: 'Buenas tardes 😳 le acabo de transferir por la bicicleta pero me equivoqué feo: puse $1.300 en vez de $130. Se me fue un cero. Por favor devuélvame la diferencia, son $1.170.',
  time: '16:41',
  senal: 'error',
}

const CHAT: ScreenView = {
  kind: 'sms',
  sender: COMPRADOR,
  sub: `${NUMERO_COMPRADOR} · comprador de la bicicleta`,
  msgs: [DISCULPA],
  respuestas: [
    {
      texto: 'Uy, qué problema. Deje reviso y le devuelvo.',
      goto: 'n2',
      label: 'Se ofreció a devolver la diferencia',
    },
    {
      texto: 'Deje reviso mi cuenta primero.',
      goto: 'n2b',
      label: 'Dijo que iba a revisar su cuenta antes de responder',
    },
  ],
  volverGoto: 'e_ignora',
  volverLabel: 'Salió del chat sin contestar',
}

const CUENTA_PEDIDA: ScreenView = {
  ...CHAT,
  msgs: [
    DISCULPA,
    { text: 'Uy, qué problema. Deje reviso y le devuelvo.', time: '16:43', mine: true },
    {
      text: `Gracias, de verdad 🙏 mándeme los $1.170 a esta cuenta: ${CUENTA_DEVOLUCION}. Es la de mi cuñado, la mía quedó con el límite topado por la transferencia de hoy.`,
      time: '16:44',
      senal: 'otra-cuenta',
    },
  ],
  respuestas: [
    {
      texto: 'Voy a transferirle ahorita.',
      goto: 'n4',
      label: 'Fue a transferir la diferencia a la cuenta que le pasaron',
    },
    {
      texto: 'Esa cuenta no es la suya. Esto lo arreglamos por el banco.',
      goto: 'n3',
      label: 'Se negó a devolver a una cuenta de otra persona',
    },
  ],
}

const REVISADO: ScreenView = {
  ...CHAT,
  msgs: [
    DISCULPA,
    { text: 'Deje reviso mi cuenta primero.', time: '16:43', mine: true },
    {
      text: 'Sí sí, revise nomás, ahí está el depósito 🙏 pero apúrese porfa que ese dinero era para el arriendo y me van a sacar del departamento hoy mismo 😭',
      time: '16:44',
      senal: 'presion',
    },
  ],
  respuestas: [
    {
      texto: 'Ya vi que entró. Deme la cuenta y le devuelvo.',
      goto: 'n2',
      label: 'Aceptó devolver el dinero por su cuenta',
    },
    {
      texto: 'Esto se devuelve por el banco, no de mano a mano.',
      goto: 'n3',
      label: 'Dijo que la devolución tenía que hacerse por el banco',
    },
  ],
}

const INSISTE: ScreenView = {
  ...CHAT,
  msgs: [
    DISCULPA,
    { text: 'Esto se devuelve por el banco, no de mano a mano.', time: '16:47', mine: true },
    {
      text: 'Por el banco se demora quince días hábiles y a mí me sacan hoy 😭 usted ya tiene la plata ahí, solo es apretar un botón. No sea así por favor, yo confié en usted.',
      time: '16:48',
      senal: 'culpa',
    },
  ],
  respuestas: [
    {
      texto: 'Está bien, no quiero problemas. Deme la cuenta.',
      goto: 'n2',
      label: 'Cedió a la presión y aceptó devolver el dinero',
    },
    {
      texto: 'Lo siento, pero el que reversa es el banco. Ya lo llamé.',
      goto: 'e_banco',
      label: 'Se mantuvo y dejó la devolución en manos del banco',
    },
  ],
}

const BANCO: ScreenView = {
  kind: 'web',
  app: IDENTIDAD_FICTICIA.banco,
  url: 'bancolitoral.ec',
  secure: true,
  brand: 'Banca móvil',
  title: 'Cuenta de ahorros',
  subtitle: CUENTA_FICTICIA,
  datos: [
    { etiqueta: 'Saldo disponible', valor: '$1.540,50' },
    {
      etiqueta: 'Hoy · 16:38',
      valor: 'Transferencia recibida $1.300,00 · de M. J. Sarango Ordóñez',
      senal: 'otro-nombre',
    },
    { etiqueta: 'Ayer · 12:04', valor: 'Compra Farmacia La Espiga $12,60' },
  ],
  aviso:
    'Si recibiste un valor que no esperabas, repórtalo al banco. Devolverlo por tu cuenta no anula una reversa posterior.',
  opciones: [
    {
      texto: 'Transferir',
      detalle: 'A cuentas propias o de terceros',
      goto: 'n4',
      label: 'Abrió la transferencia en la app del banco',
    },
    {
      texto: 'Reportar un movimiento',
      detalle: 'Avisar al banco de un depósito que no esperabas',
      goto: 'e_banco',
      label: 'Reportó el depósito al banco desde la app',
    },
    { texto: 'Pagar servicios', detalle: 'Luz, agua, teléfono e internet' },
  ],
  cerrarGoto: 'n2b',
  cerrarLabel: 'Volvió al chat después de mirar su cuenta',
  fields: [],
  button: '',
}

const TRANSFERENCIA: ScreenView = {
  kind: 'web',
  app: IDENTIDAD_FICTICIA.banco,
  url: 'bancolitoral.ec',
  secure: true,
  brand: 'Transferir a terceros',
  title: 'Confirma la transferencia',
  subtitle: 'Revisa los datos antes de enviar el dinero.',
  datos: [
    { etiqueta: 'Cuenta de destino', valor: CUENTA_DEVOLUCION, senal: 'otra-cuenta' },
    { etiqueta: 'Titular', valor: 'Wilson Pinto Cedeño' },
    { etiqueta: 'Valor', valor: '$1.170,00' },
  ],
  aviso: 'Las transferencias enviadas no se pueden reversar.',
  button: 'Transferir $1.170,00',
  botonGoto: 'e_devuelve',
  botonLabel: 'Devolvió los $1.170 por su cuenta a un tercero',
  cerrarGoto: 'n2',
  cerrarLabel: 'Volvió atrás sin transferir',
  fields: [],
}

const LLAMADA_BANCO: ScreenView = {
  kind: 'call',
  quien: IDENTIDAD_FICTICIA.banco,
  numero: BANCO_TELEFONO,
  etiqueta: 'El número impreso en tu tarjeta',
  dialogo: [
    {
      texto:
        'Lo registro como depósito no reconocido. No devuelva nada usted, por favor: si el origen resulta fraudulento nosotros reversamos el valor completo, y lo que usted envíe por fuera lo pierde. Le queda el caso abierto y le avisamos.',
      rol: 'mujer',
      senal: 'contesta',
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
      texto: IDENTIDAD_FICTICIA.banco,
      detalle: `${BANCO_TELEFONO} · el número impreso en tu tarjeta`,
      goto: 'e_banco',
      label: 'Llamó al banco por el número de su tarjeta',
    },
    { texto: 'Casa', detalle: '02 244 1180' },
    { texto: 'Taller Vélez', detalle: '+593 99 100 4477' },
    { texto: 'Trabajo', detalle: '02 380 1100' },
  ],
  fields: [],
  button: '',
}

const APPS: AppTelefono[] = [
  { Icono: MessageCircle, texto: 'Mensajes', color: '#2f9e44', hilo: 'sms' },
  {
    Icono: Wallet,
    texto: IDENTIDAD_FICTICIA.banco,
    color: '#155e75',
    goto: 'n5',
    label: 'Abrió la app del banco',
  },
  {
    Icono: Phone,
    texto: 'Teléfono',
    color: '#1971c2',
    goto: 'n6',
    label: 'Abrió la agenda para llamar por su cuenta',
    hilo: 'call',
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
  n2: { kind: 'scene', view: CUENTA_PEDIDA },
  n2b: { kind: 'scene', view: REVISADO },
  n3: { kind: 'scene', view: INSISTE },
  n4: { kind: 'scene', view: TRANSFERENCIA },
  n5: { kind: 'scene', view: BANCO },
  n6: { kind: 'scene', view: AGENDA },
  e_devuelve: {
    kind: 'bad',
    view: TRANSFERENCIA,
    verdict: 'Caíste en la estafa',
    outcome:
      'Los $1.170 salieron de tu cuenta a la de Wilson Pinto y no se pueden reversar. Nueve días después, la dueña de la cuenta desde la que te llegaron los $1.300 denunció que se la habían vaciado, y el banco te retiró ese valor del saldo. La bicicleta la tienes, pero pusiste $1.170 tuyos y te quedaste debiendo la diferencia. Diego no volvió a escribir.',
  },
  e_banco: {
    kind: 'good',
    view: LLAMADA_BANCO,
    verdict: 'No caíste · lo dejaste en manos del banco',
    outcome:
      'No devolviste nada por tu cuenta, y eso fue lo que te salvó. El depósito venía de una cuenta robada: el banco lo reversó a las dos semanas y tu saldo volvió a lo que era, sin que perdieras un dólar. Un dinero que llega por error se devuelve por donde llegó.',
  },
  e_ignora: {
    kind: 'partial',
    view: CHAT,
    verdict: 'No perdiste nada, pero lo dejaste a medias',
    outcome:
      'No devolviste el dinero, que era lo importante. Pero tampoco avisaste al banco, y ese depósito seguía ahí, en tu cuenta y a tu nombre, mientras la persona a la que se lo robaron lo denunciaba. Un valor que no esperabas se reporta el mismo día, aunque no pienses tocarlo.',
    score: 50,
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'otra-cuenta',
    pantalla: 'n2',
    texto:
      'La devolución la pide a <b>otra cuenta y a otro nombre</b>. Un error de verdad se corrige devolviendo a la misma cuenta de donde salió el dinero, no a la de un cuñado.',
  },
  {
    id: 's2',
    targetId: 'otro-nombre',
    pantalla: 'n5',
    texto:
      'El depósito <b>no viene de Diego</b>: viene de M. J. Sarango, alguien que no tiene nada que ver con la compra. Es la cuenta que le robaron, y por eso el dinero se puede reversar.',
  },
  {
    id: 's3',
    targetId: 'presion',
    pantalla: 'n2b',
    texto:
      'El <b>arriendo y el desalojo de hoy</b> están ahí para que no te dé tiempo de llamar al banco. Toda la estafa cabe en la ventana entre que el dinero entra y el dueño lo denuncia.',
  },
  {
    id: 's4',
    targetId: 'culpa',
    pantalla: 'n3',
    texto:
      'Cuando dices que no, pasa a <b>hacerte sentir culpable</b>: "yo confié en usted". No es un reproche, es la última herramienta que le queda cuando la prisa no funcionó.',
  },
  {
    id: 's5',
    targetId: 'error',
    pantalla: 'n1',
    texto:
      'El <b>error del cero de más</b> es el anzuelo entero. Nadie se equivoca en diez veces el precio, y quien lo hace de verdad llama a su banco, no al vendedor.',
  },
  {
    id: 's6',
    targetId: 'contesta',
    pantalla: 'e_banco',
    texto:
      'El banco lo dijo claro: <b>no devuelvas nada por fuera</b>. Lo que reversan ellos vuelve solo; lo que mandas tú por tu cuenta se pierde.',
  },
]

const RULE =
  'Regla de oro: un dinero que te llega por error <b>se devuelve por el banco, nunca de mano a mano</b>. Si el depósito venía de una cuenta robada, el banco te lo va a quitar igual, y lo que hayas devuelto tú sale de tu bolsillo. Llama al número de tu tarjeta y repórtalo el mismo día.'

const RESUMEN =
  'Un comprador te transfiere de más "por error" y te pide que le devuelvas la diferencia.'

const CONTEXTO: Contexto = {
  antes: (
    <>
      Vendiste una <strong>bicicleta en $130</strong> por una página de compraventa. Quedaste con el
      comprador en que te pagaba por transferencia y pasaba a recogerla.
    </>
  ),
  ahora: (
    <>
      <strong>Esta tarde</strong> te escribe muy apurado: dice que se equivocó al escribir el valor
      y que te mandó $1.300 en vez de $130.
    </>
  ),
}

function VueltoDeMas() {
  return (
    <StoryEscenario
      escenarioId="estafa/vuelto-de-mas"
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
          <strong>cualquier app de abajo</strong>. El dinero está de verdad en tu cuenta.
        </p>
      }
      pista={
        <p>
          Puedes seguirle la conversación, mirar de dónde vino ese depósito en tu banco, devolverle
          el dinero o llamar por tu cuenta. Piensa en a quién le toca corregir un error así.
        </p>
      }
    />
  )
}

export default VueltoDeMas
