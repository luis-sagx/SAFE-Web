import { Camera, MessageCircle, ShoppingBag, Wallet } from 'lucide-react'
import StoryEscenario, { type AppTelefono, type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { CUENTA_FICTICIA, IDENTIDAD_FICTICIA } from '../../lib/identidadFicticia'

/**
 * El espejo legítimo de "Saldo contable".
 *
 * Espeja a "Saldo contable" y a "Celular a mitad de precio" con la misma
 * escena y las señales al revés: el dinero está en el saldo disponible, el
 * comprador propone verse en un sitio público y la cuenta que pagó está a su
 * propio nombre.
 *
 * Existe porque un módulo que solo enseña fraudes enseña a desconfiar de todo,
 * y eso también hace daño: quien no vuelve a vender nada por internet pagó la
 * lección más cara de lo que valía. Aquí el acierto es cerrar el trato, y el
 * fallo es dejarlo caer sin motivo o inventarse comprobaciones que no tocan.
 */

const COMPRADORA = 'Gabriela Ponce'
const NUMERO_COMPRADORA = '+593 99 271 4508'

const AVISA = {
  text: 'Buenos días. Ya le hice la transferencia de los $180 por la lavadora. Cuando pueda confirme y coordinamos, yo paso a recogerla con mi hermano y una camioneta.',
  time: '09:14',
  senal: 'sin-prisa',
}

const CHAT: ScreenView = {
  kind: 'sms',
  sender: COMPRADORA,
  sub: `${NUMERO_COMPRADORA} · compradora de la lavadora`,
  msgs: [AVISA],
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

const ESPERA: ScreenView = {
  ...CHAT,
  msgs: [
    AVISA,
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

/// El mismo banco del escenario del saldo contable, con los dos números
/// diciendo lo mismo. Aquí no hay nada en proceso: el dinero ya es tuyo.
const BANCO: ScreenView = {
  kind: 'web',
  app: IDENTIDAD_FICTICIA.banco,
  url: 'bancolitoral.ec',
  secure: true,
  brand: 'Banca móvil',
  title: 'Cuenta de ahorros',
  subtitle: CUENTA_FICTICIA,
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

const ENTREGA: ScreenView = {
  ...CHAT,
  msgs: [
    AVISA,
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

const ANUNCIO: ScreenView = {
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
      valor: `${COMPRADORA} · cuenta desde 2019`,
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

const APPS: AppTelefono[] = [
  { Icono: MessageCircle, texto: 'Mensajes', color: '#2f9e44', hilo: 'sms' },
  {
    Icono: Wallet,
    texto: IDENTIDAD_FICTICIA.banco,
    color: '#155e75',
    goto: 'n2',
    label: 'Abrió la app del banco',
  },
  {
    Icono: ShoppingBag,
    texto: 'Mercado Abierto',
    color: '#7048e8',
    goto: 'n5',
    label: 'Abrió su anuncio para ver el perfil de la compradora',
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
  n1b: { kind: 'scene', view: ESPERA },
  n2: { kind: 'scene', view: BANCO },
  n3: { kind: 'scene', view: MOVIMIENTOS },
  n4: { kind: 'scene', view: ENTREGA },
  n5: { kind: 'scene', view: ANUNCIO },
  e_entrega: {
    kind: 'good',
    view: ENTREGA,
    verdict: 'Acertaste · la venta era buena y la cerraste',
    outcome:
      'Comprobaste antes de entregar y todo cuadraba: el dinero estaba en tu saldo disponible, acreditado y a nombre de quien te escribía. Quedaste con ella, entregaste la lavadora y se acabó. Dónde entregarla era cosa de comodidad, no de seguridad: lo que cerró bien esta venta fue haber mirado la cuenta antes. Esto es lo que se ve cuando una venta es de verdad, y reconocerlo importa tanto como reconocer la otra.',
  },
  e_confia: {
    kind: 'partial',
    view: CHAT,
    verdict: 'Salió bien, pero no comprobaste nada',
    outcome:
      'Confirmaste sin mirar tu cuenta y esta vez no pasó nada, porque Gabriela había pagado de verdad. Pero decidiste igual que si el comprobante fuera el dinero: la misma frase de un estafador te habría encontrado igual. Mirar el saldo disponible cuesta dos toques y es lo único que separa esta venta de la otra.',
    score: 60,
  },
  e_deja: {
    kind: 'bad',
    view: CHAT,
    verdict: 'Dejaste caer una venta que estaba bien',
    outcome:
      'Dejaste caer el trato con todo a favor: el dinero estaba acreditado en tu cuenta, a nombre de la compradora, y ella no te pidió nada raro ni te metió prisa. Te quedaste con la lavadora que querías vender y ella tuvo que buscar otra. Desconfiar de todo también cuesta: lo que hay que aprender no es a no vender, es a mirar el saldo disponible antes de entregar.',
    score: 20,
  },
}

const SENALES: Senal[] = [
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

const RESUMEN = 'Vendes una lavadora y la compradora dice que ya te transfirió.'

const CONTEXTO: Contexto = {
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
  detalle: 'La lavadora sigue en tu casa y tienes la app del banco en el teléfono.',
}

function PagoLavadora() {
  return (
    <StoryEscenario
      escenarioId="estafa/pago-lavadora"
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

export default PagoLavadora
