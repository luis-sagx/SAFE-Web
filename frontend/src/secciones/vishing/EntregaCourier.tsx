import { Camera, Package, Phone, Wallet } from 'lucide-react'
import StoryEscenario, { type AppTelefono, type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'

/**
 * El motorizado que sí está en la puerta.
 *
 * La llamada legítima más común de todas, y por eso la puerta de entrada a los
 * casos verdaderos: alguien te llama, sabe tu nombre y tu dirección, y no pasa
 * nada. Lo que este escenario mide no es si desconfías —desconfiar de todo es
 * fácil— sino si sabes dónde está el límite: puedes confirmar una entrega sin
 * problema, pero el número de tu tarjeta no se dicta por teléfono ni al
 * repartidor que de verdad está abajo con tu paquete.
 */

const NUMERO = '+593 99 214 0087'

const ENTRANTE: ScreenView = {
  kind: 'call',
  entrante: true,
  quien: NUMERO,
  numero: 'Celular · Ecuador',
  etiqueta: 'No está en tus contactos',
  senalQuien: 'quien',
  contestarGoto: 'n2',
  contestarLabel: 'Contestó la llamada',
  rechazarGoto: 'e_rechaza',
  rechazarLabel: 'Rechazó la llamada sin contestar',
}

const APERTURA = [
  {
    texto:
      '¡Aló, buenas! Le habla Jonathan, de EnvíaExpress. Estoy abajo en la puerta con su paquete, la guía cuatro cuatro siete uno EC.',
    senal: 'guia',
  },
  {
    texto:
      'Le timbré y no me contestó nadie. ¿Le dejo con el conserje o baja usted? Son tres cincuenta contra entrega, en efectivo o con tarjeta en el datáfono que traigo.',
    senal: 'cobro',
  },
]

const LLAMADA: ScreenView = {
  kind: 'call',
  quien: NUMERO,
  numero: 'Celular · Ecuador',
  etiqueta: 'No está en tus contactos',
  senalQuien: 'quien',
  dialogo: APERTURA,
  decir: [
    {
      texto: 'Déjelo con el conserje, ya bajo a pagarle los $3,50 en efectivo.',
      goto: 'e_recibe',
      label: 'Confirmó la entrega y quedó en pagar en efectivo',
    },
    {
      texto: 'Le dicto el número de mi tarjeta y me lo cobra desde ahí, así no bajo.',
      goto: 'e_tarjeta',
      label: 'Ofreció dictar el número de su tarjeta por teléfono',
    },
  ],
  colgarGoto: 'e_cuelga',
  colgarLabel: 'Colgó sin atender la entrega',
}

const COURIER: ScreenView = {
  kind: 'web',
  app: 'EnvíaExpress',
  url: 'envia-express.ec',
  secure: true,
  brand: 'Mis envíos',
  title: 'Hola de nuevo',
  subtitle: 'Tienes 1 envío en curso.',
  opciones: [
    {
      texto: 'Rastrear una guía',
      detalle: 'Consulta el estado con tu número de guía',
      goto: 'e_app',
      label: 'Rastreó la guía en la app del courier antes de responder',
    },
    { texto: 'Puntos de retiro', detalle: 'Encuentra la agencia más cercana' },
    { texto: 'Cotizar un envío', detalle: 'Calcula el costo por peso y destino' },
    { texto: 'Mi cuenta', detalle: 'Datos, direcciones y notificaciones' },
  ],
  fields: [],
  button: '',
}

const GUIA: ScreenView = {
  kind: 'web',
  app: 'EnvíaExpress',
  url: 'envia-express.ec',
  secure: true,
  brand: 'Seguimiento de envíos',
  title: 'Guía 4471-EC',
  subtitle: 'Tu compra del 26 de julio.',
  datos: [
    { etiqueta: 'Estado', valor: 'En reparto · repartidor Jonathan A.', senal: 'coincide' },
    { etiqueta: 'Valor contra entrega', valor: '$3,50 · efectivo o datáfono' },
    { etiqueta: 'Entrega estimada', valor: 'hoy, antes de las 18:00' },
  ],
  aviso:
    'El valor contra entrega se paga al repartidor en la puerta. Nunca dictes los datos de tu tarjeta por teléfono: si pagas con tarjeta, se hace en el datáfono y la tarjeta no sale de tu mano.',
  fields: [],
  button: '',
}

const APPS: AppTelefono[] = [
  { Icono: Phone, texto: 'Teléfono', color: '#2f9e44', hilo: 'call' },
  {
    Icono: Package,
    texto: 'EnvíaExpress',
    color: '#d9480f',
    goto: 'n3',
    label: 'Abrió la app del courier durante la llamada',
  },
  {
    Icono: Wallet,
    texto: 'Banco',
    color: '#155e75',
    vacia: 'Banca móvil · Saldo disponible $312,45. Sin notificaciones nuevas.',
  },
  {
    Icono: Camera,
    texto: 'Cámara',
    color: '#495057',
    vacia: 'La cámara está lista. No hay nada que fotografiar en este momento.',
  },
]

export const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: ENTRANTE },
  n2: { kind: 'scene', view: LLAMADA },
  n3: { kind: 'scene', view: COURIER },
  e_rechaza: {
    kind: 'partial',
    view: ENTRANTE,
    verdict: 'No perdiste nada, pero tampoco resolviste',
    outcome:
      'No contestaste. No perdiste ni un centavo (y no contestar a un desconocido nunca está mal), pero era el repartidor con el paquete que sí estabas esperando: se fue, el envío volvió a bodega y ahora te toca ir a retirarlo a la agencia.',
    score: 50,
  },
  e_cuelga: {
    kind: 'partial',
    view: LLAMADA,
    verdict: 'Colgaste a alguien que decía la verdad',
    outcome:
      'Colgar nunca te va a costar dinero, así que como reflejo no está mal. Pero el envío era real y no comprobaste nada: bastaba mirar la guía en la app del courier para saber que estaba en reparto y con cobro de $3,50.',
    score: 50,
  },
  e_recibe: {
    kind: 'good',
    view: LLAMADA,
    verdict: 'Acertaste · la llamada era legítima',
    outcome:
      'Era tu repartidor. La guía coincidía con tu compra, el cobro contra entrega estaba anunciado desde que hiciste el pedido y pagaste en efectivo en la puerta. No hacía falta desconfiar, porque no te pidió ni un dato.',
  },
  e_tarjeta: {
    kind: 'bad',
    view: LLAMADA,
    verdict: 'Llamada legítima, reacción peligrosa',
    outcome:
      'La llamada era de verdad, pero dictaste tu tarjeta por teléfono, y eso no se hace ni con quien está abajo con tu paquete. Un número completo con caducidad y CVV sirve para comprar en internet las veces que haga falta, y ya no depende de si el repartidor era honrado: lo oyó él, y quien estuviera cerca.',
  },
  e_app: {
    kind: 'good',
    view: GUIA,
    verdict: 'Acertaste · lo comprobaste en tu canal',
    outcome:
      'En la app estaba todo: la guía en reparto, el nombre del repartidor y el cobro de $3,50 contra entrega. Comprobar tarda quince segundos y sirve igual para descubrir un engaño que para confirmar que algo es verdad.',
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'guia',
    pantalla: 'n2',
    texto:
      'Trae <b>tu número de guía</b> y coincide con la compra que estás esperando. No lo dice para que "confirmes" nada: lo dice porque lo tiene delante.',
  },
  {
    id: 's2',
    targetId: 'cobro',
    pantalla: 'n2',
    texto:
      'El cobro es <b>en la puerta y pequeño</b>, el que ya sabías al comprar. Nadie te pide pagar por adelantado ni por un enlace para "liberar" el paquete.',
  },
  {
    id: 's3',
    targetId: 'cobro',
    pantalla: 'n2',
    texto:
      'No te pide <b>ningún dato</b>: ni cédula, ni tarjeta, ni códigos. Solo si bajas o se lo deja al conserje.',
  },
  {
    id: 's4',
    targetId: 'coincide',
    pantalla: 'e_app',
    texto:
      'En la app del courier <b>consta lo mismo</b> que te cuentan por teléfono. Eso es lo que convierte una sospecha en una certeza, en los dos sentidos.',
  },
]

const RULE =
  'Regla de oro: que una llamada sea de verdad <b>no significa que valga todo</b>. Puedes confirmar una entrega sin problema, pero el número de tu tarjeta no se dicta por teléfono nunca: se paga en efectivo o en el datáfono, con la tarjeta en tu mano.'

const RESUMEN = 'Un repartidor llama desde la puerta para entregarte un paquete.'

const CONTEXTO: Contexto = {
  antes: (
    <>
      Compraste algo por internet la semana pasada y{' '}
      <strong>sí estás esperando un paquete</strong>, con $3,50 de cobro contra entrega que ya
      aceptaste al hacer el pedido.
    </>
  ),
  ahora: (
    <>
      <strong>A media tarde</strong> te llama un celular que no tienes guardado: dice que está abajo
      con tu envío.
    </>
  ),
}

function EntregaCourier() {
  return (
    <StoryEscenario
      escenarioId="vishing/entrega-courier"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule={RULE}
      restartLabel="↻ Recibir la llamada otra vez"
      accionesEnPantalla
      apps={APPS}
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Actúa sobre el teléfono como lo harías con el tuyo: contesta o rechaza, cuelga cuando
          quieras y usa <strong>cualquier app de abajo</strong>, incluso con la llamada abierta.
        </p>
      }
      pista={
        <p>
          Puedes no contestar, atender la entrega, colgar o comprobar el envío por tu cuenta antes
          de responder. Fíjate en qué te está pidiendo exactamente quien llama.
        </p>
      }
    />
  )
}

export default EntregaCourier
