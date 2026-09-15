import type { ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import AIChatScenario from './EscenarioChatIA'
import {
  createAIChat,
  withEditableDraft,
  buildDraftSegments,
  evaluateData,
  worstLevel,
  signal,
  type SensitiveDatum,
} from './chatIA'

/** La IA es legítima; el riesgo está en lo que el participante le escribe antes de pedir ayuda —aquí, los
 *  datos de una compañera que no hacían falta para redactar el texto.
 *
 *  Issue #185: el borrador ya viene escrito, con los datos reales de la compañera puestos — el nombre, la
 *  cédula y el correo quedan marcados para tocar y reemplazar. Lo que se evalúa es si esos datos REALES
 *  siguen en el mensaje al tocar "Enviar" — nunca por parecerse a un dato de ese tipo, sino por ser el
 *  dato de verdad (ver evaluateDatum). */

const TIME = '10:14'

// Imposible por construcción, como la del participante: tercer dígito 9, que el Registro Civil no asigna (ver identidadFicticia).
const ECUADORIAN_ID = '1799999990'
const FIRST_NAME = 'Andrea'
const LAST_NAME = 'Cedeño'
// Dominio de entrenamiento, no uno real: un gmail aquí podría existir y llegarle a alguien.
const EMAIL = 'andrea.cedeno02@safeweb.com'
const TEACHER = 'Ing. Marcelo Tapia'

const DATA_POINTS: SensitiveDatum[] = [
  { id: 'dato-nombre', tipo: 'nombre', etiqueta: 'el nombre completo de tu compañera', nombre: FIRST_NAME, apellido: LAST_NAME },
  { id: 'dato-cedula', tipo: 'numero', etiqueta: 'la cédula de tu compañera', valor: ECUADORIAN_ID },
  { id: 'dato-correo', tipo: 'texto', etiqueta: 'el correo de tu compañera', valor: EMAIL },
]

function onEnviar(texto: string): { goto: string; label?: string } {
  const nivel = worstLevel(evaluateData(texto, DATA_POINTS))
  return {
    goto: nivel === 'fuga' ? 'e_fuga' : nivel === 'parcial' ? 'e_parcial' : 'e_seguro',
    label: 'Tocó "Enviar" con lo que decidió dejar del borrador',
  }
}

// El borrador ya trae el nombre, la cédula y el correo reales de la compañera; buildDraftSegments los marca
// para que se puedan tocar y reemplazar uno por uno antes de enviar.
const DRAFT = `Es para el ${TEACHER}, para pedirle un cambio de horario a nombre de mi compañera ${FIRST_NAME} ${LAST_NAME}, cédula ${ECUADORIAN_ID}, correo ${EMAIL}. Es de la materia de Redes.`

const CHAT = withEditableDraft(
  createAIChat(
    'Redactor de mensajes · servicio externo',
    [
      { texto: 'Hola, ayúdame a redactar un correo.', mio: true },
      {
        texto:
          'Claro que sí. Cuéntame sobre qué asunto es el correo, a quién va dirigido y qué debe incluir. Con eso te lo entrego formal y listo para enviar.',
      },
    ],
    TIME,
    [],
    { titulo: 'Asistente IA', url: 'https://chat.asistente-ia.com/nuevo' },
  ),
  {
    segmentos: buildDraftSegments(DRAFT, DATA_POINTS),
    hora: TIME,
    respuestaIA:
      'Aquí tienes un correo formal con lo que me diste. Si quieres, puedo ajustar el tono o agregar algún detalle más.',
    onEnviar,
  },
)

const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: CHAT },
  e_fuga: {
    kind: 'bad',
    view: CHAT,
    senales: DATA_POINTS.map((dato) =>
      signal(
        dato.id,
        'e_fuga',
        `Si tu mensaje incluyó <b>${dato.etiqueta}</b>: para redactar el correo la IA no lo necesitaba, y ese dato real quedó en un servicio externo.`,
      ),
    ),
    verdict: 'Datos de tu compañera compartidos con la IA',
    outcome:
      'Tu mensaje incluyó el nombre completo, la cédula o el correo real de tu compañera. Ninguno de los tres cambia cómo se redacta la solicitud — bastaba con "una compañera" y la materia.',
  },
  e_parcial: {
    kind: 'partial',
    view: CHAT,
    senales: [
      signal(
        'borrador-enviado',
        'e_parcial',
        'Quedó algún fragmento identificable —solo un nombre de pila, solo un apellido, o los últimos dígitos de la cédula— sin llegar a la combinación completa. No es un dato inventado: sigue siendo real, solo que a medias.',
      ),
    ],
    verdict: 'Quedó algo identificable, aunque no el dato completo',
    outcome:
      'Tu mensaje no llegó a incluir un dato completo de tu compañera, pero sí un fragmento real —su nombre de pila, su apellido, o parte de su cédula—, no uno inventado. Lo más seguro es no dejar ningún rastro del dato real: usa un marcador como "mi compañera" en vez de una parte de su nombre.',
  },
  e_seguro: {
    kind: 'good',
    view: CHAT,
    senales: [
      signal(
        'borrador-enviado',
        'e_seguro',
        'Le diste a la IA lo que necesitaba —el asunto, a quién va, la materia— sin el nombre, la cédula ni el correo reales de tu compañera.',
      ),
    ],
    verdict: 'Correo redactado sin compartir datos reales de nadie',
    outcome:
      'Tu mensaje le dio a la IA lo que necesitaba para redactar el texto, sin el nombre, la cédula ni el correo reales de tu compañera. Esos datos los completas tú mismo al final, fuera de la conversación.',
  },
}

const SIGNALS = [
  signal(
    'datos-en-juego',
    'n1',
    'La IA te pregunta qué debe incluir el correo. Tienes a la mano el <b>nombre completo</b>, la <b>cédula</b> y el <b>correo</b> de tu compañera — y ninguno de los tres cambia cómo se redacta la solicitud.',
  ),
]

const RULE =
  'Regla de oro: antes de escribirle a una IA, revisa si tu mensaje trae <b>nombres, cédulas, correos o teléfonos de otras personas</b>. Si no hacen falta para lo que le pides, no los escribas — ni siquiera a medias.'

const SUMMARY = 'Le pides a una IA que redacte un correo a nombre de una compañera, con los datos de ella a la mano.'

const CONTEXT: Context = {
  antes: 'Coordinas trámites de tus compañeros de clase y sueles usar una IA para que tus correos suenen más formales.',
  ahora: (
    <>
      <strong>Abres el asistente de IA</strong> en el computador para que te ayude con el correo del
      cambio de horario que pidió tu compañera.
    </>
  ),
}

function ThirdPartyDataEmail() {
  return (
    <AIChatScenario
      escenarioId="asistentes-ia/correo-datos-terceros"
      resumen={SUMMARY}
      contexto={CONTEXT}
      story={STORY}
      senales={SIGNALS}
      rule={RULE}
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Toca las palabras marcadas para cambiarlas, y toca "Enviar" cuando el mensaje quede como
          quieres.
        </p>
      }
      pista={
        <p>
          La IA puede redactar el correo sin saber de quién habla. Lo que decides es si se lo dices de
          todos modos, y cómo lo escribes.
        </p>
      }
    />
  )
}

export default ThirdPartyDataEmail
