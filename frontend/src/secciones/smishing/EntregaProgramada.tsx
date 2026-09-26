import { MessageSquareText, Package, Wallet } from 'lucide-react'
import ScenarioStory, { type PhoneApp, type ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Signal } from '../../components/ui/PanelVeredicto'

// Cierra el módulo con la lección que falta a los seis fraudulentos: desconfiar de todo
// también se paga. Este aviso no pide nada; el fallo (como en alerta-consumo) es devolver sin mirar.

const GUIDE = '8842-EC'
const RESPONSE = '¿A qué hora exactamente? No voy a estar en la mañana.'

const SMS: ScreenView = {
  kind: 'sms',
  sender: 'ENVIAEXPRESS',
  sub: 'Remitente habitual · SMS',
  senalRemitente: 'remitente',
  msgs: [
    {
      text: `ENVIAEXPRESS: su envio ${GUIDE} sale a reparto manana entre 09h00 y 13h00. No requiere ningun pago. Puede ver el detalle en nuestra app.`,
      time: '18:05',
      senal: 'mensaje',
    },
  ],
  respuestas: [
    {
      texto: RESPONSE,
      goto: 'e_responde',
      label: 'Contestó al número del aviso preguntando por la hora',
    },
  ],
  volverGoto: 'e_ignora',
  volverLabel: 'Salió del hilo sin hacer nada',
}

const REPLIED_SMS: ScreenView = {
  ...SMS,
  respuestas: undefined,
  volverGoto: undefined,
  msgs: [...SMS.msgs, { text: RESPONSE, time: '18:06', mine: true }],
}

// Abrirla no es todavía haber comprobado: se puede mirar el envío o devolverlo a ciegas.
const APP_HOME: ScreenView = {
  kind: 'web',
  app: 'EnvíaExpress',
  url: 'enviaexpress.ec',
  secure: true,
  brand: 'Mis envíos',
  title: `Guía ${GUIDE}`,
  subtitle: 'En bodega de reparto · Quito',
  opciones: [
    {
      texto: 'Ver el detalle del envío',
      detalle: 'Estado, horario y datos del remitente',
      goto: 'e_app',
      label: 'Revisó el detalle del envío en la app',
    },
    {
      texto: 'Reprogramar la entrega',
      detalle: 'Elige otro día dentro de la próxima semana',
    },
    {
      texto: 'Devolver al remitente',
      detalle: 'Cancela la entrega de forma definitiva',
      goto: 'e_devuelve',
      label: 'Devolvió el envío sin haber mirado el detalle',
    },
    { texto: 'Mis direcciones', detalle: 'Domicilio y oficina' },
  ],
  fields: [],
  button: '',
  cerrarGoto: 'e_ignora',
  cerrarLabel: 'Abrió la app y salió sin mirar nada',
}

// El acierto se enseña en pantalla, no solo se cuenta.
const APP_DETAIL: ScreenView = {
  kind: 'web',
  app: 'EnvíaExpress',
  url: 'enviaexpress.ec',
  secure: true,
  brand: `Guía ${GUIDE}`,
  title: 'Detalle del envío',
  subtitle: 'Actualizado hace 40 minutos.',
  datos: [
    { etiqueta: 'Contenido', valor: 'Paquete pequeño · tienda en línea', senal: 'coincide' },
    { etiqueta: 'Entrega', valor: 'Mañana, 09h00 a 13h00' },
    { etiqueta: 'Valores pendientes', valor: 'Ninguno', senal: 'sin-pago' },
    { etiqueta: 'Recibe', valor: 'Cualquier persona mayor de edad en la dirección' },
  ],
  aviso:
    'EnvíaExpress nunca solicita pagos por mensaje ni enlaces para liberar un envío. Los valores aduaneros, cuando existen, se cobran al momento de la entrega y con comprobante.',
  fields: [],
  button: '',
}

const APPS: PhoneApp[] = [
  {
    Icono: Package,
    texto: 'EnvíaExpress',
    color: '#d9480f',
    viewNode: 'n3',
    label: 'Abrió la app del courier',
  },
  { Icono: MessageSquareText, texto: 'Mensajes', color: '#2f9e44' },
  { Icono: Wallet, texto: 'Banco', color: '#155e75', relleno: 'banco' },
]

const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: SMS },
  n3: { kind: 'scene', view: APP_HOME },
  e_app: {
    kind: 'good',
    view: APP_DETAIL,
    verdict: 'Acertaste · el aviso era legítimo',
    outcome:
      '<b>El envío era el que esperabas</b>, salía a reparto al día siguiente y no había ningún valor pendiente. Comprobarlo en la app te tomó diez segundos.',
  },
  e_devuelve: {
    kind: 'bad',
    view: APP_HOME,
    verdict: 'Aviso legítimo, reacción peligrosa',
    outcome:
      '<b>Devolviste un paquete que sí habías comprado</b>, sin mirar antes de qué se trataba. El reembolso tarda semanas, y el aviso no tenía nada de raro.',
  },
  e_responde: {
    kind: 'partial',
    view: REPLIED_SMS,
    verdict: 'Contestaste a un número que no lee',
    outcome:
      'No pasó nada malo: el remitente era el de siempre. Pero los <b>avisos automáticos no reciben respuestas</b>, así que tu pregunta no llegó a ninguna parte.',
  },
  e_ignora: {
    kind: 'partial',
    view: SMS,
    verdict: 'Lo dejaste pasar',
    outcome:
      'No perdiste nada grave: el mensaje era auténtico. Pero al día siguiente no había nadie en casa, y el envío volvió a bodega.',
  },
}

const SIGNALS: Signal[] = [
  {
    id: 's1',
    targetId: 'mensaje',
    pantalla: 'n1',
    texto: '<b>No pide nada.</b> Sin enlace, sin pago, sin plazo: un aviso de verdad informa y se queda quieto.',
  },
  {
    id: 's2',
    targetId: 'remitente',
    pantalla: 'n1',
    texto: 'Llega del <b>remitente habitual</b> del courier, no de un celular.',
  },
  {
    id: 's3',
    targetId: 'sin-pago',
    pantalla: 'e_app',
    texto: 'En la app <b>no hay ningún valor pendiente</b>. Lo que sí hay que pagar se cobra al entregar, con comprobante.',
  },
  {
    id: 's4',
    targetId: 'coincide',
    pantalla: 'e_app',
    texto: 'El envío <b>coincide con lo que estabas esperando</b>: no basta con que el mensaje parezca correcto.',
  },
]

const RULE =
  'Regla de oro: un aviso auténtico <b>informa y no te pide nada</b>. Compruébalo en la app del courier con tu número de guía; descartar sin mirar también tiene un costo.'

const SUMMARY = 'Un SMS del courier avisa que tu paquete llega mañana en la mañana.'

export const CONTEXT: Context = {
  antes: 'Compraste algo por internet hace unos días y estás esperando que llegue.',
  ahora: (
    <>
      <strong>Al final de la tarde</strong> llega un mensaje del courier avisando la entrega para{' '}
      <strong>mañana por la mañana</strong>.
    </>
  ),
}

function ScheduledDelivery() {
  return (
    <ScenarioStory
      escenarioId="smishing/entrega-programada"
      resumen={SUMMARY}
      contexto={CONTEXT}
      story={STORY}
      senales={SIGNALS}
      rule={RULE}
      restartLabel="↻ Repetir el escenario"
      accionesEnPantalla
      apps={APPS}
      instruccion={
        <>
          <p className="text-lg leading-relaxed text-body">
            Actúa sobre el teléfono como lo harías con el tuyo: puedes usar{' '}
            <strong>cualquier parte de él</strong>, incluidas las apps de abajo.
          </p>
          <p className="text-base leading-relaxed text-body">
            Cuidado: no todos los mensajes del curso son falsos. Aquí lo que se juzga es lo que
            decidas hacer, y descartar también es una decisión.
          </p>
        </>
      }
      pista={
        <p>
          Puedes contestar el mensaje, dejarlo pasar, o comprobar el envío en la app del courier.
          Cuál de ellos es el acertado es justamente lo que decides tú.
        </p>
      }
    />
  )
}

export default ScheduledDelivery
