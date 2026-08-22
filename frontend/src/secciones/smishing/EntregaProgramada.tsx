import { Compass, MessageSquareText, Package, Wallet } from 'lucide-react'
import StoryEscenario, { type AppTelefono, type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'

/**
 * El aviso de entrega que sí era de verdad.
 *
 * Cierra el módulo con la lección que le falta a los seis fraudulentos:
 * desconfiar de todo también se paga. Espeja con `paquete-retenido`, que es el
 * mismo courier y el mismo envío contados por un impostor.
 *
 * La diferencia no está en el diseño del mensaje sino en lo que pide: este no
 * pide nada. No hay enlace, no hay pago, no hay plazo. Un aviso real informa y
 * se queda quieto, y comprobarlo es abrir la app —no contestarle al número.
 *
 * El fallo vive dentro de la app, como en `alerta-consumo`: devolver el envío
 * sin mirarlo es la reacción exagerada que este escenario mide.
 */

const GUIA = '8842-EC'

const AVISO = {
      text: `ENVIAEXPRESS: su envio ${GUIA} sale a reparto manana entre 09h00 y 13h00. No requiere ningun pago. Puede ver el detalle en nuestra app.`,
      time: '18:05',
      senal: 'mensaje',
    }

const SMS: ScreenView = {
  kind: 'sms',
  sender: 'ENVIAEXPRESS',
  sub: 'Remitente habitual · SMS',
  senalRemitente: 'remitente',
  msgs: [AVISO],
  // Ninguna entrega un dato: el aviso era auténtico y no pedía nada. Lo que
  // cambia entre las dos es el precio de contestarle a un número automático,
  // y ese precio lo pone la prisa de la segunda.
  respuestas: [
    {
      texto: '¿A qué hora exactamente? No voy a estar en la mañana.',
      goto: 'e_responde',
      label: 'Contestó al número del aviso preguntando por la hora',
    },
    {
      texto: 'Yo no pedí nada, no me lo traigan.',
      goto: 'e_rechaza',
      label: 'Contestó al aviso rechazando el envío',
    },
  ],
  volverGoto: 'e_ignora',
  volverLabel: 'Salió del hilo sin hacer nada',
}

/// El hilo con la respuesta ya enviada. Los dos finales que nacen de contestar
/// se ven sobre la burbuja propia: sin ella el participante no sabe qué salió
/// de su teléfono, solo que el escenario se acabó.
const SMS_PREGUNTADO: ScreenView = {
  ...SMS,
  respuestas: undefined,
  volverGoto: undefined,
  msgs: [
    AVISO,
    { text: '¿A qué hora exactamente? No voy a estar en la mañana.', time: '18:07', mine: true },
  ],
}

const SMS_RECHAZADO: ScreenView = {
  ...SMS,
  respuestas: undefined,
  volverGoto: undefined,
  msgs: [AVISO, { text: 'Yo no pedí nada, no me lo traigan.', time: '18:07', mine: true }],
}

/// El inicio de la app. Abrirla no es todavía haber comprobado: desde aquí se
/// puede mirar el envío o devolverlo a ciegas, que es el error que este
/// escenario mide de verdad.
const APP_INICIO: ScreenView = {
  kind: 'web',
  app: 'EnvíaExpress',
  url: 'enviaexpress.ec',
  secure: true,
  brand: 'Mis envíos',
  title: `Guía ${GUIA}`,
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

/// El detalle: el envío existe, es el que estaba esperando y no pide un
/// centavo. El acierto se enseña en pantalla, no solo se cuenta.
const APP_DETALLE: ScreenView = {
  kind: 'web',
  app: 'EnvíaExpress',
  url: 'enviaexpress.ec',
  secure: true,
  brand: `Guía ${GUIA}`,
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

const APPS: AppTelefono[] = [
  {
    Icono: Package,
    texto: 'EnvíaExpress',
    color: '#d9480f',
    goto: 'n3',
    label: 'Abrió la app del courier',
  },
  { Icono: MessageSquareText, texto: 'Mensajes', color: '#2f9e44' },
  {
    Icono: Wallet,
    texto: 'Banco',
    color: '#155e75',
    vacia: 'Banca móvil · Saldo disponible $312,45. Sin notificaciones nuevas.',
  },
  {
    Icono: Compass,
    texto: 'Navegador',
    color: '#1971c2',
    vacia: 'Nueva pestaña. No hay ninguna dirección escrita todavía.',
  },
]

const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: SMS },
  n3: { kind: 'scene', view: APP_INICIO },
  e_app: {
    kind: 'good',
    view: APP_DETALLE,
    verdict: 'Acertaste · el aviso era legítimo',
    outcome:
      'El envío era el que estabas esperando, salía a reparto al día siguiente y no había ningún valor pendiente. Comprobarlo en la app te tomó diez segundos y te dejó con la información que el mensaje anunciaba: a qué hora estar en casa.',
  },
  e_devuelve: {
    kind: 'bad',
    view: APP_INICIO,
    verdict: 'Aviso legítimo, reacción peligrosa',
    outcome:
      'Devolviste al remitente un paquete que sí habías comprado, sin mirar antes de qué se trataba. El envío se fue de vuelta, el reembolso tarda semanas y el aviso no tenía nada de raro: ni pedía pago, ni traía enlace, ni metía prisa. Desconfiar de todo cuesta tanto como confiar de más.',
  },
  e_responde: {
    kind: 'partial',
    view: SMS_PREGUNTADO,
    verdict: 'Contestaste a un número que no lee',
    outcome:
      'No pasó nada malo: el remitente era el de siempre. Pero los avisos automáticos salen de un número que no recibe respuestas, así que tu pregunta no llegó a ninguna parte. Y la hora ya venía escrita en el propio mensaje, entre las nueve y la una; el detalle completo estaba en la app, a un toque.',
  },
  e_rechaza: {
    kind: 'partial',
    view: SMS_RECHAZADO,
    verdict: 'Rechazaste un envío que sí era tuyo',
    outcome:
      'Nadie leyó ese mensaje, así que por suerte el paquete salió igual a reparto: era el que sí habías comprado. Pero saliste convencido de que no venía, no estabas en casa al día siguiente y el envío volvió a bodega. El aviso no pedía nada, no traía enlace y no metía prisa; mirarlo en la app costaba diez segundos.',
  },
  e_ignora: {
    kind: 'partial',
    view: SMS,
    verdict: 'Lo dejaste pasar',
    outcome:
      'No perdiste nada grave, porque el mensaje era auténtico y el paquete llegó igual. Pero al día siguiente no había nadie en casa a las diez de la mañana, y el envío volvió a bodega: el aviso servía justamente para eso.',
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'mensaje',
    pantalla: 'n1',
    texto:
      '<b>No pide nada.</b> No hay enlace, ni pago, ni plazo, ni un dato que darles. Un aviso de verdad informa y se queda quieto; el engaño necesita que hagas algo.',
  },
  {
    id: 's2',
    targetId: 'remitente',
    pantalla: 'n1',
    texto:
      'Llega del <b>remitente por el que el courier te escribe siempre</b>, no de un celular. Compáralo con el del paquete retenido y verás la diferencia.',
  },
  {
    id: 's3',
    targetId: 'sin-pago',
    pantalla: 'e_app',
    texto:
      'En la app <b>no hay ningún valor pendiente</b>. Cuando de verdad hay que pagar algo, se cobra al entregar y con comprobante, nunca por un enlace.',
  },
  {
    id: 's4',
    targetId: 'coincide',
    pantalla: 'e_app',
    texto:
      'El envío <b>coincide con lo que estabas esperando</b>. Ese es el segundo dato: no basta con que el mensaje parezca correcto, tiene que cuadrar con algo tuyo.',
  },
]

const RULE =
  'Regla de oro: un aviso auténtico <b>informa y no te pide nada</b>. Compruébalo en la app del courier con tu número de guía, que es lo mismo que harías con uno falso; la diferencia es que este resiste la comprobación. Y descartar de un plumazo lo que sí era real también cuesta.'

const RESUMEN = 'Un SMS del courier avisa que tu paquete llega mañana en la mañana.'

const CONTEXTO: Contexto = {
  antes: 'Compraste algo por internet hace unos días y estás esperando que llegue.',
  ahora: (
    <>
      <strong>Al final de la tarde</strong> llega un mensaje del courier avisando la entrega para{' '}
      <strong>mañana por la mañana</strong>.
    </>
  ),
  detalle: 'Hace poco te llegó otro mensaje parecido que resultó ser falso, y quedaste escaldado.',
}

function EntregaProgramada() {
  return (
    <StoryEscenario
      escenarioId="smishing/entrega-programada"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
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

export default EntregaProgramada
