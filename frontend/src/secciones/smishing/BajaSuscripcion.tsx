import { Compass, MessageSquareText, Signal, Wallet } from 'lucide-react'
import StoryEscenario, { type AppTelefono, type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'

/**
 * El cobro que no existe, y la trampa que es contestar.
 *
 * Puerta de entrada del módulo (dificultad 1) y el único escenario sin enlace
 * ni formulario: no hay nada que abrir ni nada que rellenar. Lo único que el
 * mensaje quiere es una respuesta, y esa es toda la lección — en un SMS,
 * contestar no es la salida sino la puerta.
 *
 * Un número que responde queda marcado como activo y se revende. Y en las
 * campañas de tarificación adicional, el propio "BAJA" se cobra.
 *
 * La suscripción es falsa, y eso se comprueba en la app de la operadora: por
 * eso el acierto se enseña en pantalla en vez de contarse solo en el veredicto.
 */

const TEXTO = `SUSCRIPCION ACTIVA: Tonos y Horoscopo Premium. Se renovo por $2,99 semanales con cargo a tu saldo. Si no deseas continuar responde BAJA a este mismo numero.`

const SMS: Extract<ScreenView, { kind: 'sms' }> = {
  kind: 'sms',
  sender: '5050',
  sub: 'Número corto · SMS',
  senalRemitente: 'remitente',
  msgs: [{ text: TEXTO, time: '07:52', senal: 'mensaje' }],
  // Las dos son respuestas, y las dos pierden. No hay frase prudente que
  // mandar: en un SMS que no esperabas, lo que confirma que la línea existe no
  // es lo que escribes sino que escribas. Ofrecer una salida buena en el
  // composer enseñaría lo contrario.
  respuestas: [
    { texto: 'BAJA', goto: 'e_responde', label: 'Escogió responder BAJA, como pedía el mensaje' },
    {
      texto: 'Yo no contraté nada, dejen de cobrarme.',
      goto: 'e_reclama',
      label: 'Contestó reclamando que nunca contrató la suscripción',
    },
  ],
  // Salir del hilo es dejarlo pasar: no entrega nada, pero tampoco comprueba
  // si el cobro existe.
  volverGoto: 'e_ignora',
  volverLabel: 'Salió del hilo sin hacer nada',
}

/// El hilo con la respuesta ya enviada. Las dos frases salen igual y las dos
/// terminan igual de mal, así que las dos tienen que verse igual: la burbuja
/// propia en el hilo, y el veredicto sobre ella. Un final que se dispara sin
/// enseñar lo que salió del teléfono deja al participante sin saber qué mandó.
function conRespuesta(texto: string): Extract<ScreenView, { kind: 'sms' }> {
  return {
    ...SMS,
    respuestas: undefined,
    volverGoto: undefined,
    msgs: [
      { text: TEXTO, time: '07:52', senal: 'mensaje' },
      { text: texto, time: '07:53', mine: true, senal: 'respuesta' },
    ],
  }
}

const SMS_BAJA = conRespuesta('BAJA')
const SMS_RECLAMO = conRespuesta('Yo no contraté nada, dejen de cobrarme.')

/// El inicio de la app. Abrir la app todavía no es haber comprobado nada: desde
/// aquí se puede mirar las suscripciones o taparse el oído bloqueando los
/// números cortos, que es el gesto precipitado que este escenario mide. Un
/// icono que resuelve el escenario de un toque premia haber encontrado el
/// icono, no haber sabido qué hacer con él.
const OPERADORA_INICIO: ScreenView = {
  kind: 'web',
  app: 'Mi Operadora',
  url: 'inicio',
  secure: true,
  brand: 'Mi Operadora',
  title: 'Línea 09 8 123 4567',
  subtitle: 'Prepago · Saldo $4,80',
  opciones: [
    { texto: 'Recargar saldo', detalle: 'Con tarjeta o en puntos autorizados' },
    {
      texto: 'Paquetes y suscripciones',
      detalle: 'Lo que tienes contratado y sus cargos',
      goto: 'e_verifica',
      label: 'Revisó sus paquetes y suscripciones en la app de la operadora',
    },
    { texto: 'Consumo de datos', detalle: '1,2 GB de 3 GB usados este mes' },
    {
      texto: 'Bloquear mensajes de números cortos',
      detalle: 'No volverás a recibir SMS de servicios',
      goto: 'e_bloquea',
      label: 'Bloqueó los números cortos sin comprobar antes si el cobro existía',
    },
  ],
  fields: [],
  button: '',
}

/// Lo que se ve al mirar las suscripciones: no hay ninguna. El acierto tiene
/// que enseñarse, no solo contarse, y no queda nada abierto después de verlo:
/// la pantalla que lo prueba es la que cierra.
const OPERADORA: ScreenView = {
  kind: 'web',
  app: 'Mi Operadora',
  url: 'inicio',
  secure: true,
  brand: 'Mi Operadora',
  title: 'Servicios y suscripciones',
  subtitle: 'Línea 09 8 123 4567 · Prepago',
  datos: [
    { etiqueta: 'Suscripciones activas', valor: 'Ninguna', senal: 'sin-suscripcion' },
    { etiqueta: 'Cargos del mes', valor: 'Solo recargas y consumo de datos' },
    { etiqueta: 'Saldo', valor: '$4,80' },
  ],
  aviso:
    'Los servicios de suscripción se activan y se cancelan desde esta pantalla o llamando al *611. Nunca respondas mensajes de números cortos que no reconoces: la respuesta confirma que tu línea está activa.',
  fields: [],
  button: '',
}

const APPS: AppTelefono[] = [
  {
    Icono: Signal,
    texto: 'Mi Operadora',
    color: '#c2255c',
    goto: 'n4',
    label: 'Abrió la app de la operadora para comprobar el cobro',
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
  n4: { kind: 'scene', view: OPERADORA_INICIO },
  e_responde: {
    kind: 'bad',
    view: SMS_BAJA,
    verdict: 'Caíste en la trampa',
    outcome:
      'No había ninguna suscripción que cancelar: el mensaje solo buscaba que contestaras. Tu número pasó a una lista que se revende, y el "BAJA" se cobró como mensaje de tarificación adicional.',
  },
  e_reclama: {
    kind: 'bad',
    view: SMS_RECLAMO,
    verdict: 'Caíste en la trampa',
    outcome:
      'Reclamar también es contestar, y eso era todo lo que buscaban: confirmaste que alguien lee esa línea. Tu número pasó a la lista que se revende, y el cobro que reclamabas nunca existió.',
  },
  e_bloquea: {
    kind: 'partial',
    view: OPERADORA_INICIO,
    verdict: 'Te tapaste el oído, pero no comprobaste nada',
    outcome:
      'No contestar fue lo que impidió el daño. Pero sigues sin saber si el cargo de $2,99 existía: el bloqueo silencia el mensaje, no el cobro.',
  },
  e_ignora: {
    kind: 'partial',
    view: SMS,
    verdict: 'No contestaste, pero quedaste con la duda',
    outcome:
      'Saliste sin responder, que es lo que evita el daño. Pero te quedaste sin saber si ese cobro existía, y esa duda es la que hace contestar al tercer mensaje.',
  },
  e_verifica: {
    kind: 'good',
    view: OPERADORA,
    verdict: 'No caíste · lo comprobaste con tu operadora',
    outcome:
      'En tu línea no había ninguna suscripción ni ningún cargo por ese servicio: el mensaje era falso. Lo comprobaste donde consta, sin contestarle a nadie.',
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'mensaje',
    pantalla: 'n1',
    texto:
      'Anuncia un cobro por algo que <b>nunca contrataste</b>. Antes de cancelar nada: ¿ese cargo existe? Casi siempre no.',
  },
  {
    id: 's2',
    targetId: 'respuesta',
    pantalla: 'e_responde',
    texto:
      'Lo único que te ofrece es <b>responder</b>. Ahí está la trampa: no hay enlace ni formulario, solo la respuesta que ellos necesitan.',
  },
  {
    id: 's3',
    targetId: 'remitente',
    pantalla: 'n1',
    texto:
      'Llega de un <b>número corto</b> que no tienes guardado. No prueba nada: se contratan por campaña y cambian cada semana.',
  },
  {
    id: 's4',
    targetId: 'sin-suscripcion',
    pantalla: 'e_verifica',
    texto:
      'En tu operadora <b>no consta ninguna suscripción</b>. Las altas y bajas se gestionan ahí, no por mensaje.',
  },
]

const RULE =
  'Regla de oro: a un mensaje que no esperabas <b>no se le contesta nada</b>, ni siquiera para darse de baja. Responder confirma que tu número existe y que alguien lo lee, que es exactamente lo que se vende. Los cobros se revisan con tu operadora.'

const RESUMEN = 'Un SMS cobra una suscripción que nunca contrataste y ofrece cancelarla.'

const CONTEXTO: Contexto = {
  antes: 'Tienes una línea prepago y recargas cada tanto, sin llevar mucho la cuenta del saldo.',
  ahora: (
    <>
      <strong>Al levantarte</strong> encuentras un mensaje que dice que se te renovó una{' '}
      <strong>suscripción de $2,99 semanales</strong>.
    </>
  ),
}

function BajaSuscripcion() {
  return (
    <StoryEscenario
      escenarioId="smishing/baja-suscripcion"
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
          Actúa sobre el teléfono como lo harías con el tuyo: puedes usar{' '}
          <strong>cualquier parte de él</strong>, incluidas las apps de abajo.
        </p>
      }
      pista={
        <p>
          Este mensaje no trae ningún enlace. Puedes contestarle, salir del hilo, o comprobar por tu
          cuenta si ese cobro existe. Cuál de ellos es el acertado es justamente lo que decides tú.
        </p>
      }
    />
  )
}

export default BajaSuscripcion
