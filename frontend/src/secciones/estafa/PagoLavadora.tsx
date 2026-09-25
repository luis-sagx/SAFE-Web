import { Images, MessageCircle, ShoppingBag, Wallet } from 'lucide-react'
import ScenarioStory, { type PhoneApp, type ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Signal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { ACCOUNT_FAKE, IDENTITY_FAKE } from '../../lib/identidadFicticia'

/** El espejo legítimo de "Saldo contable" y "Celular a mitad de precio": misma escena, señales al revés
 *  (saldo disponible, comprador que propone verse, cuenta a su propio nombre). Enseña que desconfiar de
 *  todo también cuesta: aquí el acierto es cerrar el trato, no dejarlo caer sin motivo. */

const BUYER = 'Gabriela Ponce'
const NUMBER_BUYER = '+593 99 271 4508'

const WARNS = {
  text: 'Buenos días. Ya le hice la transferencia de los $180 por la lavadora. Cuando pueda confirme y coordinamos, yo paso a recogerla con mi hermano y una camioneta.',
  time: '09:14',
  senal: 'sin-prisa',
}

const CHAT: ScreenView = {
  kind: 'sms',
  sender: BUYER,
  sub: `${NUMBER_BUYER} · compradora de la lavadora`,
  msgs: [WARNS],
  respuestas: [
    {
      texto: 'Deme un momento, reviso mi banco.',
      goto: 'n2',
      label: 'Dijo que iba a revisar su cuenta antes de confirmar',
    },
    {
      texto: 'Listo, venga cuando quiera.',
      goto: 'e_confia',
      label: 'Confirmó la venta sin revisar su cuenta',
    },
  ],
  volverGoto: 'e_deja',
  volverLabel: 'Salió del chat sin contestar',
}

const WAIT: ScreenView = {
  ...CHAT,
  msgs: [
    WARNS,
    { text: 'Deme un momento, reviso mi banco.', time: '09:16', mine: true },
    {
      text: 'Claro, revise con calma 🙂 si algo no aparece me avisa y lo vemos. Yo estoy libre esta tarde o mañana, como a usted le quede mejor.',
      time: '09:17',
      senal: 'sin-prisa',
    },
  ],
  respuestas: [
    {
      texto: 'Ya vi que entró. ¿Le queda bien esta tarde?',
      goto: 'n4',
      label: 'Confirmó que el dinero estaba y propuso la entrega',
    },
  ],
}

// Mismo banco que "Saldo contable", incluso los mismos dos números: aquí no hay nada pendiente, el dinero ya es tuyo.
const BANK: ScreenView = {
  kind: 'web',
  app: IDENTITY_FAKE.banco,
  url: 'bancolitoral.ec',
  secure: true,
  brand: 'Banca móvil',
  title: 'Cuenta de ahorros',
  subtitle: ACCOUNT_FAKE,
  datos: [
    { etiqueta: 'Saldo contable', valor: '$1.160,50' },
    { etiqueta: 'Saldo disponible', valor: '$1.160,50', senal: 'disponible' },
  ],
  aviso:
    'El saldo disponible es el dinero que puedes usar. Cuando coincide con el contable, no hay nada pendiente de confirmar.',
  opciones: [
    {
      texto: 'Ver movimientos',
      detalle: 'Últimos 30 días',
      goto: 'n3',
      label: 'Abrió los movimientos de la cuenta',
    },
    { texto: 'Transferir', detalle: 'A cuentas propias o de terceros' },
    { texto: 'Pagar servicios', detalle: 'Luz, agua, teléfono e internet' },
  ],
  cerrarGoto: 'n1b',
  cerrarLabel: 'Volvió al chat después de mirar su saldo',
  fields: [],
  button: '',
}

const TRANSACTIONS: ScreenView = {
  kind: 'web',
  app: IDENTITY_FAKE.banco,
  url: 'bancolitoral.ec',
  secure: true,
  brand: 'Movimientos',
  title: 'Cuenta de ahorros',
  subtitle: 'Últimos movimientos, del más nuevo al más antiguo.',
  datos: [
    {
      etiqueta: 'Hoy · 09:11',
      valor: 'Transferencia recibida $180,00 · de Gabriela Ponce Salazar · ACREDITADA',
      senal: 'acreditada',
    },
    {
      etiqueta: 'Ayer · 17:40',
      valor: 'Compra Supermercado La Favorita $32,80',
    },
    { etiqueta: '12 ago', valor: 'Depósito de sueldo $780,00' },
  ],
  aviso: 'Un movimiento acreditado ya forma parte de tu saldo disponible.',
  cerrarGoto: 'n2',
  cerrarLabel: 'Volvió al resumen de la cuenta',
  fields: [],
  button: '',
}

const DELIVERY: ScreenView = {
  ...CHAT,
  msgs: [
    WARNS,
    {
      text: 'Ya vi que entró. ¿Le queda bien esta tarde?',
      time: '09:24',
      mine: true,
    },
    {
      text: 'Perfecto. ¿Le parece que nos veamos a las 4 en el parqueadero del centro comercial, que ahí hay espacio para la camioneta? O si prefiere paso por su casa, como usted esté más cómodo.',
      time: '09:26',
      senal: 'en-persona',
    },
  ],
  respuestas: [
    {
      texto: 'A las 4 en el centro comercial, perfecto.',
      goto: 'e_entrega',
      label: 'Cerró la venta y quedó en el centro comercial',
    },
    {
      texto: 'Sabe qué, mejor ya no. Le devuelvo su plata.',
      goto: 'e_deja',
      label: 'Se echó atrás con la venta ya cobrada',
    },
  ],
}

const AD: ScreenView = {
  kind: 'web',
  app: 'Mercado Abierto',
  url: 'mercadoabierto.ec',
  secure: true,
  brand: 'Tu anuncio',
  title: 'Lavadora 12 kg, buen estado',
  subtitle: '$180 · publicado hace 9 días',
  datos: [
    {
      etiqueta: 'Interesada',
      valor: `${BUYER} · cuenta desde 2019`,
      senal: 'perfil',
    },
    {
      etiqueta: 'Calificaciones',
      valor: '14 compras, todas valoradas bien',
      senal: 'perfil',
    },
    { etiqueta: 'Precio de mercado', valor: '$170 a $210 por una parecida' },
    {
      etiqueta: 'Otros interesados',
      valor: 'Dos, ninguno con oferta en firme',
    },
  ],
  cerrarGoto: 'n1b',
  cerrarLabel: 'Volvió al chat desde su anuncio',
  fields: [],
  button: '',
}

const APPS: PhoneApp[] = [
  { Icono: MessageCircle, texto: 'Mensajes', color: '#2f9e44', hilo: 'sms' },
  {
    Icono: Wallet,
    texto: IDENTITY_FAKE.banco,
    color: '#155e75',
    viewNode: 'n2',
    label: 'Abrió la app del banco',
  },
  {
    Icono: ShoppingBag,
    texto: 'Mercado Abierto',
    color: '#7048e8',
    viewNode: 'n5',
    label: 'Abrió su anuncio para ver el perfil de la compradora',
  },
  { Icono: Images, texto: 'Galería', color: '#c2410c', relleno: 'galeria' },
]

export const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: CHAT },
  n1b: { kind: 'scene', view: WAIT },
  n2: { kind: 'scene', view: BANK },
  n3: { kind: 'scene', view: TRANSACTIONS },
  n4: { kind: 'scene', view: DELIVERY },
  n5: { kind: 'scene', view: AD },
  e_entrega: {
    kind: 'good',
    view: DELIVERY,
    verdict: 'Acertaste · la venta era buena y la cerraste',
    outcome:
      'Comprobaste antes de entregar: el dinero estaba acreditado, a nombre de quien te escribía. Quedaste con ella, entregaste la lavadora y se acabó.',
  },
  e_confia: {
    kind: 'partial',
    view: CHAT,
    verdict: 'Salió bien, pero no comprobaste nada',
    outcome:
      'Confirmaste sin mirar tu cuenta, y esta vez no pasó nada porque Gabriela sí había pagado. La misma frase de un estafador te habría encontrado igual.',
    score: 60,
  },
  e_deja: {
    kind: 'bad',
    view: CHAT,
    verdict: 'Dejaste caer una venta que estaba bien',
    outcome:
      'El dinero ya estaba acreditado y a tu nombre, sin nada raro de por medio. Te quedaste con la lavadora, y ella tuvo que buscar otra.',
    score: 20,
  },
}

const SIGNALS: Signal[] = [
  {
    id: 's1',
    targetId: 'disponible',
    pantalla: 'n2',
    texto:
      'El <b>saldo disponible coincide con el contable</b>: no hay nada pendiente. Ese dinero ya es tuyo.',
  },
  {
    id: 's2',
    targetId: 'acreditada',
    pantalla: 'n3',
    texto:
      'El movimiento aparece <b>acreditado y a nombre de la compradora</b>. Quien paga y quien te escribe son la misma persona.',
  },
  {
    id: 's3',
    targetId: 'sin-prisa',
    pantalla: 'n1',
    texto:
      'No hay <b>ninguna prisa</b>: revisa con calma y elige el día. Quien te apura es quien sabe que el dinero se va a caer.',
  },
  {
    id: 's4',
    targetId: 'en-persona',
    pantalla: 'n4',
    texto:
      'Propone <b>verse en persona</b> y te deja elegir sitio y hora. Un estafador hace lo contrario: cualquier cosa menos dar la cara.',
  },
  {
    id: 's5',
    targetId: 'perfil',
    pantalla: 'n5',
    texto:
      'La cuenta de la compradora tiene <b>años y calificaciones</b>. Sola no prueba nada, pero acompaña al resto.',
  },
]

const RULE =
  'Regla de oro: la misma comprobación sirve para las dos. Mira el <b>saldo disponible</b> antes de entregar; si el dinero está ahí, acreditado y a nombre de quien te habla, la venta es buena y cerrarla es lo correcto. Desconfiar de todo no es prudencia, es dejar de poder vender.'

const SUMMARY = 'Vendes una lavadora y la compradora dice que ya te transfirió.'

export const CONTEXT: Context = {
  antes: (
    <>
      Pusiste en venta tu <strong>lavadora en $180</strong> por una página de compraventa, y una
      compradora quedó en pagarte por transferencia.
    </>
  ),
  ahora: (
    <>
      <strong>Esta mañana</strong> te escribe diciendo que ya hizo el pago y que pasa a recogerla
      cuando a ti te quede bien.
    </>
  ),
}

function WashingMachinePayment() {
  return (
    <ScenarioStory
      escenarioId="estafa/pago-lavadora"
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
          Actúa sobre el teléfono como lo harías con el tuyo: contéstale a la compradora y usa{' '}
          <strong>cualquier app de abajo</strong>. No todo lo que llega es una trampa.
        </p>
      }
      pista={
        <p>
          Puedes seguirle la conversación, abrir tu banco a mirar la cuenta, ver el perfil de la
          compradora en tu anuncio o cerrar el trato. Comprueba lo mismo que comprobarías si
          sospecharas.
        </p>
      }
    />
  )
}

export default WashingMachinePayment
