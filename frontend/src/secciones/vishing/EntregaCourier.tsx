import { Package, Phone, Wallet } from 'lucide-react'
import ScenarioStory, { type PhoneApp, type ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Signal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'

// Llamada legítima común: mide si sabes dónde está el límite, no si
// desconfías de todo. Confirmar la entrega está bien; dictar la tarjeta no.

const NUMBER = '+593 99 214 0087'

const INCOMING: ScreenView = {
  kind: 'call',
  entrante: true,
  quien: NUMBER,
  numero: 'Celular · Ecuador',
  etiqueta: 'No está en tus contactos',
  senalQuien: 'quien',
  contestarGoto: 'n2',
  contestarLabel: 'Contestó la llamada',
  rechazarGoto: 'e_rechaza',
  rechazarLabel: 'Rechazó la llamada sin contestar',
}

const OPENING = [
  {
    texto:
      '¡Aló, buenas! Le habla Jonathan, de EnvíaExpress. Estoy abajo en la puerta con su paquete, la guía cuatro cuatro siete uno EC.',
    senal: 'guia',
  },
  {
    texto:
      'Le timbré y no me contestó nadie. ¿Le dejo con el conserje o baja usted? Son tres cincuenta contra entrega. Si quiere pagar con tarjeta, dícteme el número por teléfono y se lo cobro ahora mismo.',
    senal: 'cobro',
  },
]

const CALL: ScreenView = {
  kind: 'call',
  quien: NUMBER,
  numero: 'Celular · Ecuador',
  etiqueta: 'No está en tus contactos',
  senalQuien: 'quien',
  dialogo: OPENING,
  decir: [
    {
      texto: 'Déjelo con el conserje, ya bajo a pagarle los $3,50 en efectivo.',
      goto: 'e_recibe',
      label: 'Confirmó la entrega y quedó en pagar en efectivo',
    },
    {
      texto: 'Está bien, le dicto el número de mi tarjeta y me lo cobra desde ahí, así no bajo.',
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

const GUIDE: ScreenView = {
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

const APPS: PhoneApp[] = [
  { Icono: Phone, texto: 'Teléfono', color: '#2f9e44', hilo: 'call' },
  {
    Icono: Package,
    texto: 'EnvíaExpress',
    color: '#d9480f',
    viewNode: 'n3',
    label: 'Abrió la app del courier durante la llamada',
  },
  { Icono: Wallet, texto: 'Banco', color: '#155e75', relleno: 'banco' },
]

export const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: INCOMING },
  n2: { kind: 'scene', view: CALL },
  n3: { kind: 'scene', view: COURIER },
  e_rechaza: {
    kind: 'partial',
    view: INCOMING,
    verdict: 'No perdiste nada, pero tampoco resolviste',
    outcome:
      'No contestaste, y eso nunca cuesta dinero. Pero era el repartidor real: el envío volvió a bodega y ahora toca retirarlo en la agencia.',
    score: 50,
  },
  e_cuelga: {
    kind: 'partial',
    view: CALL,
    verdict: 'Colgaste a alguien que decía la verdad',
    outcome:
      'Colgar nunca cuesta dinero, pero el envío era real. Bastaba mirar la guía en la app del courier para confirmarlo.',
    score: 50,
  },
  e_recibe: {
    kind: 'good',
    view: CALL,
    verdict: 'Acertaste · la llamada era legítima',
    outcome:
      'La entrega era real y pagaste en efectivo, sin dar datos de tarjeta. Que el repartidor tenga tu guía no vuelve segura una petición de tarjeta por teléfono.',
  },
  e_tarjeta: {
    kind: 'bad',
    view: CALL,
    verdict: 'Llamada legítima, reacción peligrosa',
    outcome:
      'La entrega era real, pero dictaste tu tarjeta por teléfono. Ese número con caducidad y CVV sirve para comprar en internet, y lo oyó él y quien estuviera cerca.',
  },
  e_app: {
    kind: 'good',
    view: GUIDE,
    verdict: 'Acertaste · lo comprobaste en tu canal',
    outcome:
      'En la app estaba todo: la guía en reparto, el repartidor y el cobro de $3,50. La tarjeta se paga en el datáfono, no dictando sus datos.',
  },
}

const SIGNALS: Signal[] = [
  {
    id: 's1',
    targetId: 'guia',
    pantalla: 'n2',
    texto:
      '<b>Trae tu número de guía</b>, que coincide con tu compra. Lo dice porque lo tiene delante, no para que confirmes nada.',
  },
  {
    id: 's2',
    targetId: 'cobro',
    pantalla: 'n2',
    texto:
      '<b>El valor y la entrega sí coinciden</b> con tu compra, pero eso no autoriza a cobrarte la tarjeta por teléfono.',
  },
  {
    id: 's3',
    targetId: 'cobro',
    pantalla: 'n2',
    texto:
      '<b>Te pide el número de tu tarjeta por teléfono.</b> Aunque la entrega exista, eso solo se paga en el datáfono, presencial.',
  },
  {
    id: 's4',
    targetId: 'coincide',
    pantalla: 'e_app',
    texto:
      '<b>En la app consta lo mismo</b> que te cuentan por teléfono. Eso convierte la sospecha en certeza, en los dos sentidos.',
  },
]

const RULE =
  'Regla de oro: <b>una llamada real no significa que valga todo</b>. El número de tu tarjeta nunca se dicta: se paga en efectivo o datáfono.'

const SUMMARY = 'Un repartidor llama desde la puerta para entregarte un paquete.'

const CONTEXT: Context = {
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

function CourierDelivery() {
  return (
    <ScenarioStory
      escenarioId="vishing/entrega-courier"
      resumen={SUMMARY}
      contexto={CONTEXT}
      story={STORY}
      senales={SIGNALS}
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

export default CourierDelivery
