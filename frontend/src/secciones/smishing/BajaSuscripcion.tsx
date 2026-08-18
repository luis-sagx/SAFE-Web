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

const SMS: ScreenView = {
  kind: 'sms',
  sender: '5050',
  sub: 'Número corto · SMS',
  senalRemitente: 'remitente',
  msgs: [{ text: TEXTO, time: '07:52', senal: 'mensaje' }],
  composerGoto: 'n2',
  composerLabel: 'Fue a escribir una respuesta al mensaje',
  // Salir del hilo es dejarlo pasar: no entrega nada, pero tampoco comprueba
  // si el cobro existe.
  volverGoto: 'e_ignora',
  volverLabel: 'Salió del hilo sin hacer nada',
}

/// Escribir y enviar se separan a propósito: deja ver qué se iba a mandar
/// antes de que salga, que es justo el instante en el que uno se lo repiensa.
const SMS_BORRADOR: ScreenView = {
  ...SMS,
  borrador: 'BAJA',
  senalBorrador: 'respuesta',
  composerGoto: undefined,
  enviarGoto: 'e_responde',
  enviarLabel: 'Envió "BAJA" al número del mensaje',
}

/// La app de la operadora: aquí es donde se ve que la suscripción no existe.
/// El acierto tiene que enseñarse, no solo contarse.
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
    goto: 'e_verifica',
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
  n2: { kind: 'scene', view: SMS_BORRADOR },
  e_responde: {
    kind: 'bad',
    view: SMS_BORRADOR,
    verdict: 'Caíste en la trampa',
    outcome:
      'No había ninguna suscripción que cancelar: el mensaje solo buscaba que contestaras. Tu respuesta confirmó que la línea está activa y en uso, tu número pasó a una lista que se revende, y esa misma semana empezaron a llegar tres o cuatro mensajes parecidos al día. El "BAJA" además se cobró como mensaje de tarificación adicional.',
  },
  e_ignora: {
    kind: 'partial',
    view: SMS,
    verdict: 'No contestaste, pero quedaste con la duda',
    outcome:
      'Saliste del hilo sin responder, que es lo que evita el daño: nadie confirmó que tu número esté activo. Pero te quedaste sin saber si ese cobro de $2,99 existía de verdad, y esa duda es la que hace que mucha gente termine contestando al tercer mensaje.',
  },
  e_verifica: {
    kind: 'good',
    view: OPERADORA,
    verdict: 'No caíste · lo comprobaste con tu operadora',
    outcome:
      'En tu línea no había ninguna suscripción activa ni ningún cargo por ese servicio: el mensaje era falso de principio a fin. Lo comprobaste donde de verdad consta, sin contestarle a nadie.',
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'mensaje',
    pantalla: 'n1',
    texto:
      'Anuncia un cobro por algo que <b>nunca contrataste</b>. Antes de cancelar nada, la pregunta es si ese cargo existe: casi siempre no existe.',
  },
  {
    id: 's2',
    targetId: 'respuesta',
    pantalla: 'n2',
    texto:
      'La única acción que te ofrece es <b>responder</b>. Ahí está la trampa: no hay enlace que inspeccionar ni formulario que delate nada, solo una respuesta que ellos necesitan.',
  },
  {
    id: 's3',
    targetId: 'remitente',
    pantalla: 'n1',
    texto:
      'Llega de un <b>número corto</b> que no tienes guardado. Un número corto no prueba nada: se contratan por campaña y cambian cada semana.',
  },
  {
    id: 's4',
    targetId: 'sin-suscripcion',
    pantalla: 'e_verifica',
    texto:
      'En tu operadora <b>no consta ninguna suscripción</b>. Las altas y bajas de verdad se ven y se gestionan ahí, no por mensaje.',
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
  detalle: 'No recuerdas haber contratado nada parecido, y el saldo sí te ha bajado últimamente.',
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
