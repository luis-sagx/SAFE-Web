import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'

const HILO_PREVIO = `
  <div style="border-left:3px solid #d7dde1;padding-left:12px;margin:14px 0;color:#5f6b7a;font-size:13px;line-height:1.55;">
    <p style="margin:0 0 8px;"><b>Secretaría — Unidad Educativa San Rafael</b> · hace 3 días<br/>
    Buenas tardes, le recuerdo que la pensión de julio vence el día 30. El monto es $145.</p>
    <p style="margin:0;"><b>Yo</b> · hace 3 días<br/>
    Perfecto, gracias, hago la transferencia esta semana a la cuenta de siempre.</p>
  </div>
`

const CORREO: ScreenView = {
  kind: 'mail',
  from: 'Secretaría — Unidad Educativa San Rafael',
  address: 'secretaria@unidadsanrafael.edu.ec',
  to: 'mí',
  subject: 'Re: Pensión de julio',
  date: 'hoy 11:15',
  body: `
    <p>Buenas de nuevo:</p>
    <p>
      Antes de que transfiera, le cuento que <b>cambiamos de banco</b> este mes. Adjunto el
      comprobante corregido con el nuevo número de cuenta para la pensión de julio.
    </p>
    ${HILO_PREVIO}
  `,
  attachment: 'Comprobante_pension_julio.pdf',
}

const STORY: Story<ScreenNode> = {
  n1: {
    kind: 'scene',
    view: CORREO,
    choices: [
      { label: 'Transferir a la cuenta nueva que indica el correo.', goto: 'e_transfiere' },
      {
        label: 'Responder el mismo correo preguntando si el cambio de cuenta es real.',
        goto: 'n2',
      },
      {
        label: 'Llamar al número de la secretaría que ya tenía guardado, sin usar el correo.',
        goto: 'e_llama',
      },
    ],
  },
  n2: {
    kind: 'scene',
    view: CORREO,
    choices: [
      {
        label: 'La respuesta confirma el cambio: transferir a la cuenta nueva.',
        goto: 'e_confirma_falso',
      },
      {
        label: 'No confiar solo en la respuesta del mismo hilo: llamar de todas formas.',
        goto: 'e_llama',
      },
    ],
  },
  e_transfiere: {
    kind: 'bad',
    view: CORREO,
    verdict: 'Caíste en la estafa',
    outcome:
      'Transferiste a la cuenta nueva. La cuenta real de la secretaría fue comprometida: el atacante respondía desde ahí, con el hilo real y el PDF corregido. El dinero no llegó a la escuela.',
  },
  e_confirma_falso: {
    kind: 'bad',
    view: CORREO,
    verdict: 'Caíste en la estafa',
    outcome:
      'Preguntaste por el mismo correo comprometido, y quien respondió — el propio atacante — confirmó el cambio. Transferiste igual y el dinero se perdió.',
  },
  e_llama: {
    kind: 'good',
    view: CORREO,
    verdict: 'No caíste · llamaste al número que ya tenías',
    outcome:
      'La secretaria real no sabía nada de ningún cambio de banco: su cuenta de correo había sido hackeada. Avisaste a la escuela y evitaste transferir a la cuenta falsa.',
  },
}

const SIGNALS = [
  'No hay dominio falso, ni error de redacción, ni urgencia artificial: el hilo es <b>100% real</b>.',
  'La única anomalía es el hecho en sí: <b>un cambio de número de cuenta</b>.',
  'Responder dentro del mismo hilo <b>no verifica nada</b>: si la cuenta está comprometida, el atacante también contesta ahí.',
]
const RULE =
  'Regla de oro: todo cambio de número de cuenta se confirma <b>por llamada al número que ya tenías</b>, jamás por el mismo canal donde llegó el aviso. Responder el correo para verificar es preguntarle al estafador si es estafador.'

const RESUMEN = 'La secretaría del colegio de tu hijo dice que "cambió de banco" para la pensión.'

const CONTEXTO = (
  <>
    <p>
      Tenés un hilo de correo real y en curso con la <strong>secretaría del colegio</strong> de tu
      hijo, sobre la pensión de julio.
    </p>
    <p>
      Ya habías acordado transferir esta semana a la cuenta de siempre. Ahora llega una respuesta
      dentro del mismo hilo, desde la misma dirección de siempre.
    </p>
  </>
)

function SecuestroHilo() {
  return (
    <StoryEscenario
      escenarioId="phishing/secuestro-hilo"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      signalsTitle="Las señales de este correo"
      signals={SIGNALS}
      rule={RULE}
      restartLabel="↻ Repetir el escenario"
    />
  )
}

export default SecuestroHilo
