import { MessageSquareText, Signal } from 'lucide-react'
import ScenarioStory, { type PhoneApp, type ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Signal as ScenarioSignal } from '../../components/ui/PanelVeredicto'
import { APP_ACCENTS } from '../../components/ui/appAccents'

// Puerta de entrada del módulo (dificultad 1): único escenario sin enlace ni formulario.
// Lo único que el mensaje quiere es una respuesta, contestar no es la salida, es la puerta.

const TEXT = `SUSCRIPCION ACTIVA: Tonos y Horoscopo Premium. Se renovo por $2,99 semanales con cargo a tu saldo. Si no deseas continuar responde BAJA a este mismo numero.`

const SMS: Extract<ScreenView, { kind: 'sms' }> = {
  kind: 'sms',
  sender: '5050',
  sub: 'Número corto · SMS',
  senalRemitente: 'remitente',
  msgs: [{ text: TEXT, time: '07:52', senal: 'mensaje' }],
  respuestas: [
    { texto: 'BAJA', goto: 'e_responde', label: 'Escogió responder BAJA, como pedía el mensaje' },
  ],
  // Salir del hilo es dejarlo pasar: no entrega nada, pero tampoco comprueba
  // si el cobro existe.
  volverGoto: 'e_ignora',
  volverLabel: 'Salió del hilo sin hacer nada',
}

// El veredicto se ve sobre la burbuja propia en el hilo: un final que se dispara sin
// enseñar lo que salió del teléfono deja al participante sin saber qué mandó.
function withResponse(text: string): Extract<ScreenView, { kind: 'sms' }> {
  return {
    ...SMS,
    respuestas: undefined,
    volverGoto: undefined,
    msgs: [
      { text: TEXT, time: '07:52', senal: 'mensaje' },
      { text: text, time: '07:53', mine: true, senal: 'respuesta' },
    ],
  }
}

const CANCELLATION_SMS = withResponse('BAJA')

// El acierto tiene que enseñarse, no solo contarse: la pantalla que lo prueba es la que cierra.
const OPERATOR: ScreenView = {
  kind: 'web',
  app: 'Mi Operadora',
  appAccent: APP_ACCENTS.operator,
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

const APPS: PhoneApp[] = [
  {
    Icono: Signal,
    texto: 'Mi Operadora',
    color: APP_ACCENTS.operator,
    goto: 'e_verifica',
    label: 'Abrió la app de la operadora para comprobar el cobro',
  },
  { Icono: MessageSquareText, texto: 'Mensajes', color: '#2f9e44' },
]

const STORY: Story<ScreenNode> = {
  n1: {
    kind: 'scene',
    view: SMS,
    choices: [
      { label: 'Responder BAJA al mensaje', goto: 'e_responde' },
      { label: 'Revisar el cobro en Mi Operadora', goto: 'e_verifica' },
      { label: 'Salir del mensaje sin responder', goto: 'e_ignora' },
    ],
  },
  e_responde: {
    kind: 'bad',
    view: CANCELLATION_SMS,
    verdict: 'Caíste en la trampa',
    outcome:
      'No había ninguna suscripción: el mensaje solo buscaba que contestaras. Tu número pasó a una lista que se revende, y el "BAJA" se cobró como mensaje de tarificación adicional.',
  },
  e_ignora: {
    kind: 'partial',
    view: SMS,
    verdict: 'No contestaste, pero quedaste con la duda',
    outcome:
      'Saliste sin responder, que es lo que evita el daño. Pero te quedaste con la duda de si ese cobro existía.',
  },
  e_verifica: {
    kind: 'good',
    view: OPERATOR,
    verdict: 'No caíste · lo comprobaste con tu operadora',
    outcome:
      'En tu línea no había ninguna suscripción ni ningún cargo: el mensaje era falso. Lo comprobaste donde consta, sin contestarle a nadie.',
  },
}

const SIGNALS: ScenarioSignal[] = [
  {
    id: 's1',
    targetId: 'mensaje',
    pantalla: 'n1',
    texto: 'Anuncia un cobro por algo que <b>nunca contrataste</b>. Ese cargo casi nunca existe.',
  },
  {
    id: 's2',
    targetId: 'respuesta',
    pantalla: 'e_responde',
    texto: 'Lo único que pide es <b>que respondas</b>. No hay enlace ni formulario, solo eso.',
  },
  {
    id: 's3',
    targetId: 'remitente',
    pantalla: 'n1',
    texto: 'Llega de un <b>número corto</b> que no tienes guardado. Se contratan por campaña y cambian cada semana.',
  },
  {
    id: 's4',
    targetId: 'sin-suscripcion',
    pantalla: 'e_verifica',
    texto: 'En tu operadora <b>no consta ninguna suscripción</b>. Las altas y bajas se gestionan ahí, no por mensaje.',
  },
]

const RULE =
  'Regla de oro: a un mensaje que no esperabas <b>no se le contesta nada</b>, ni para darse de baja. Los cobros se revisan con tu operadora.'

const SUMMARY = 'Un SMS cobra una suscripción que nunca contrataste y ofrece cancelarla.'

export const CONTEXT: Context = {
  antes: 'Tienes una línea prepago y recargas cada tanto, sin llevar mucho la cuenta del saldo.',
  ahora: (
    <>
      <strong>Al levantarte</strong> encuentras un mensaje que dice que se te renovó una{' '}
      <strong>suscripción de $2,99 semanales</strong>.
    </>
  ),
}

function SubscriptionCancellation() {
  return (
    <ScenarioStory
      escenarioId="smishing/baja-suscripcion"
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

export default SubscriptionCancellation
