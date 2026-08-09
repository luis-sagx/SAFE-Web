import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'

const HISTORIAL = [
  {
    text: 'Banco del Litoral: consumo aprobado $12,40 FARMACIA SANA 28/07 11:02, tarjeta *4417.',
    time: '28 jul',
  },
  {
    text: 'Banco del Litoral: transferencia recibida $820,00 el 30/07. Saldo disponible actualizado.',
    time: '30 jul',
  },
]

const NUEVO = {
  text: 'Banco del Litoral: consumo aprobado $42,90 SUPERMERCADO LA UNIÓN 02/08 19:14, tarjeta *4417. Si no lo reconoces, bloquéala desde la app o llama al número impreso en tu tarjeta.',
  time: '19:14',
}

const SMS: ScreenView = {
  kind: 'sms',
  sender: 'BancoLitoral',
  sub: 'Remitente verificado · mismo hilo de siempre',
  msgs: [...HISTORIAL, NUEVO],
}

const SMS_RESPONDIDO: ScreenView = {
  ...SMS,
  msgs: [
    ...HISTORIAL,
    NUEVO,
    { text: 'No reconozco ese consumo, mi tarjeta es la 4539 0011 8842 4417', time: '19:16', mine: true },
  ],
}

const STORY: Story<ScreenNode> = {
  n1: {
    kind: 'scene',
    view: SMS,
    choices: [
      { label: 'Abrir la app del banco y revisar el movimiento.', goto: 'e_app' },
      { label: 'Responder el SMS con los datos de mi tarjeta para reclamar.', goto: 'n1b' },
      { label: 'Ignorarlo: cualquier mensaje del banco puede ser falso.', goto: 'e_ignora' },
    ],
  },
  n1b: {
    kind: 'scene',
    view: SMS_RESPONDIDO,
    choices: [
      { label: 'Esperar la respuesta con mis datos ya enviados.', goto: 'e_responde' },
      {
        label: 'Borrar lo escrito antes de enviarlo y entrar mejor a la app.',
        goto: 'e_app',
      },
    ],
  },
  e_app: {
    kind: 'good',
    view: SMS,
    verdict: 'Acertaste · el aviso era legítimo',
    outcome:
      'En la app apareció el mismo consumo de $42,90: era tu compra del supermercado. El SMS venía del hilo de siempre del banco, no pedía nada y solo te avisaba.',
  },
  e_responde: {
    kind: 'bad',
    view: SMS_RESPONDIDO,
    verdict: 'Aviso legítimo, reacción peligrosa',
    outcome:
      'El aviso era real, pero enviaste el número completo de tu tarjeta por SMS. Ese canal no lo lee tu banco: quien controle ese número (o tu teléfono) ya tiene tus datos.',
    score: 0,
  },
  e_ignora: {
    kind: 'partial',
    view: SMS,
    verdict: 'Prudente, pero incompleto',
    outcome:
      'No entregaste nada, y eso está bien. Pero tampoco verificaste: si el consumo hubiera sido de otra persona, tendrías horas para bloquear la tarjeta y las dejaste pasar.',
    score: 50,
  },
}

const SENALES: Senal[] = [
  { id: 's1', texto: 'Llega en el <b>mismo hilo</b> de los mensajes anteriores del banco, no de un número nuevo.' },
  { id: 's2', texto: '<b>No trae enlaces</b> ni te pide responder nada.' },
  { id: 's3', texto: 'Muestra <b>solo los últimos dígitos</b> de la tarjeta, nunca el número completo.' },
  { id: 's4', texto: 'Te manda a <b>tus canales</b>: la app o el número impreso en la tarjeta.' },
  { id: 's5', texto: 'Informa un hecho concreto y verificable, sin urgencia ni amenaza.' },
]
const RULE =
  'Regla de oro: un aviso real del banco <b>informa, no pide</b>. Verifica siempre en la app o llamando al número impreso en tu tarjeta, y nunca escribas datos de tarjeta en un SMS, aunque el mensaje sea auténtico.'

const RESUMEN = 'Llega un SMS del banco avisando un consumo de $42,90 con tu tarjeta.'

const CONTEXTO: Contexto = {
  antes: (
    <>
      Cliente del <strong>Banco del Litoral</strong>, con las <strong>alertas de consumo</strong>{' '}
      activadas: cada compra con tu tarjeta te llega por mensaje de texto.
    </>
  ),
  ahora: (
    <>
      <strong>Esta tarde</strong>, al rato de salir del supermercado, tu teléfono vibra con un
      mensaje nuevo en el hilo de siempre del banco.
    </>
  ),
}

function AlertaConsumo() {
  return (
    <StoryEscenario
      escenarioId="smishing/alerta-consumo"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule={RULE}
      restartLabel="↻ Repetir el escenario"
    />
  )
}

export default AlertaConsumo
