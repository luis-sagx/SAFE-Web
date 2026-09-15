import type { ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import AIChatScenario from './EscenarioChatIA'
import {
  createAIChat,
  withEditableDraft,
  buildDraftSegments,
  withAIResponse,
  evaluateData,
  worstLevel,
  mark,
  signal,
  type SensitiveDatum,
} from './chatIA'

/** El más difícil: los datos son de una clienta (no de un compañero), y el camino limpio no termina en el
 *  primer mensaje —la IA ofrece completar un borrador ya usable a cambio del nombre y la cuenta, y resistir
 *  ese favor es lo que mide. Dar solo el nombre para el saludo queda como parcial.
 *
 *  Issue #185: en el primer paso, el borrador ya trae el nombre, la cuenta, el saldo y el teléfono reales
 *  de la clienta, marcados para tocar y reemplazar. El segundo paso (aceptar o no la oferta de "dejártela
 *  lista") se queda como burbujas: no es un ejercicio de decidir qué dato tocar, es resistir o no un favor
 *  — ceder ahí no depende de qué se edita, sino de si se acepta. Lo que se dejó en el primer paso se resume
 *  como "(tu mensaje)" en las pantallas del segundo paso: seguir mostrándolo literal ahí habría exigido que
 *  el motor de guiones recuerde texto dinámico entre dos pantallas distintas, que es más de lo que este
 *  cambio necesita resolver. */

const TIME = '11:47'

const NAME = 'Mónica Zambrano'
const [FIRST_NAME, LAST_NAME] = NAME.split(' ') as [string, string]
const ACCOUNT = '2100-0000-45'
const BALANCE = '$2.340,15'
const PHONE = '099 000 0045'

const SITE = { titulo: 'Asistente IA', url: 'https://chat.asistente-ia.com/nuevo' }

// --- Paso 2: qué contestas a la oferta de la IA (se queda como burbujas) ---
const PROMPT_COMPLETE_VERSION = `Sí, es ${NAME}, cuenta ${ACCOUNT}. Déjala lista para enviar.`
const PROMPT_ONLY_NAME = `Solo el nombre para el saludo: ${NAME}.`
const PROMPT_APPROVES_AS_IS = 'Así está bien, el resto lo completo yo al enviarla.'

// --- Paso 1: qué le escribes a la IA de entrada, ahora redactado libre ---
const DATA_POINTS: SensitiveDatum[] = [
  { id: 'dato-nombre', tipo: 'nombre', etiqueta: 'el nombre completo de la clienta', nombre: FIRST_NAME, apellido: LAST_NAME },
  { id: 'dato-cuenta', tipo: 'numero', etiqueta: 'el número de cuenta real de la clienta', valor: ACCOUNT },
  { id: 'dato-saldo', tipo: 'texto', etiqueta: 'el saldo real de la clienta', valor: BALANCE },
  { id: 'dato-telefono', tipo: 'numero', etiqueta: 'el teléfono real de la clienta', valor: PHONE },
]

function onEnviarPaso1(texto: string): { goto: string; label?: string } {
  const nivel = worstLevel(evaluateData(texto, DATA_POINTS))
  const goto = nivel === 'fuga' ? 'e_con_datos' : nivel === 'parcial' ? 'e_parcial_paso1' : 'n2_generico'
  return { goto, label: 'Tocó "Enviar" con lo que decidió dejar del borrador' }
}

// Va en el computador: los reclamos se contestan con el sistema de clientes abierto al lado, de donde salen los datos que terminan en el chat.
const OPENING = [
  { texto: 'Hola, ayúdame a responder el reclamo de una clienta.', mio: true as const },
  {
    texto:
      'Con gusto. Cuéntame qué reclama la clienta y en qué tono quieres responder. Con eso te preparo una respuesta clara y cordial.',
  },
]

// El borrador ya trae los cuatro datos reales de la clienta; buildDraftSegments los marca para tocar y reemplazar.
const DRAFT_PASO1 = `Reclama por qué le cobramos $45 de más este mes. Sus datos: ${NAME}, cuenta ${ACCOUNT}, saldo ${BALANCE}, teléfono ${PHONE}. Respóndele formal y amable.`

const CHAT = withEditableDraft(createAIChat('Redactor de respuestas · servicio externo', OPENING, TIME, [], SITE), {
  segmentos: buildDraftSegments(DRAFT_PASO1, DATA_POINTS),
  hora: TIME,
  respuestaIA: 'Aquí tienes una respuesta para el reclamo. Avísame si quieres ajustar el tono.',
  onEnviar: onEnviarPaso1,
})

// El borrador ya sirve para enviar (saludo neutro, cubre el cobro); lo único que "falta" es el nombre — y esa es la carnada.
const RESPONSE_GENERIC = [
  'Aquí tienes un borrador general:',
  '',
  'Hola, buenas tardes. Lamentamos la confusión por el cobro adicional de $45,00. Estamos revisando el detalle de la facturación de este mes y le informaremos el motivo apenas lo tengamos; de existir un error, procederemos con la corrección.',
  '',
  'Si me pasas el nombre de la clienta y el número de cuenta, te la dejo lista para enviar: con el saludo personalizado y el detalle del cobro ya redactado.',
].join('<br>')

const RESPONSE_COMPLETE_VERSION = mark(
  [
    'Lista para enviar:',
    '',
    `Hola, ${FIRST_NAME}. Buenas tardes.`,
    '',
    `Lamentamos la confusión ocasionada por el cobro adicional de $45,00 en su cuenta ${ACCOUNT}. Estamos revisando el detalle de la facturación de este mes y le informaremos el motivo apenas lo tengamos; de existir un error, procederemos con la corrección.`,
    '',
    'Gracias por comunicarnos su inquietud y disculpe las molestias.',
  ].join('<br>'),
  { 'dato-devuelto': `en su cuenta ${ACCOUNT}` },
)

const RESPONSE_ONLY_NAME = mark(
  [
    'Aquí tienes la respuesta con el saludo:',
    '',
    `Hola, ${FIRST_NAME}. Buenas tardes.`,
    '',
    'Lamentamos la confusión ocasionada por el cobro adicional de $45,00. Estamos revisando el detalle de la facturación de este mes y le informaremos el motivo apenas lo tengamos; de existir un error, procederemos con la corrección.',
    '',
    'Gracias por comunicarnos su inquietud y disculpe las molestias.',
  ].join('<br>'),
  { 'dato-devuelto': `Hola, ${FIRST_NAME}` },
)

const RESPONSE_APPROVES_AS_IS =
  'Perfecto. Copia el borrador y completa el saludo con el nombre y los datos de la cuenta al enviarlo.'

// Paso 2: el chat sigue con un resumen neutral del paso 1 (nunca el texto literal —ver nota arriba) y la oferta de la IA.
const GENERIC_CHAT = {
  ...createAIChat('Redactor de respuestas · servicio externo', OPENING, TIME, [], SITE),
  msgs: [
    ...OPENING.map((line) => ({ text: line.texto, time: TIME, mine: line.mio })),
    { text: '(Tu mensaje, sin datos de la clienta)', time: TIME, mine: true },
    { text: RESPONSE_GENERIC, time: TIME },
  ],
  respuestas: [
    { texto: PROMPT_COMPLETE_VERSION, goto: 'e_recae' },
    { texto: PROMPT_ONLY_NAME, goto: 'e_solo_nombre' },
    { texto: PROMPT_APPROVES_AS_IS, goto: 'e_sin_datos' },
  ],
}

const SUBMISSION_RELAPSES = withAIResponse(
  GENERIC_CHAT,
  TIME,
  mark(PROMPT_COMPLETE_VERSION, { 'dato-nombre': NAME, 'dato-cuenta': ACCOUNT }),
  RESPONSE_COMPLETE_VERSION,
)
const SUBMISSION_ONLY_NAME = withAIResponse(
  GENERIC_CHAT,
  TIME,
  mark(PROMPT_ONLY_NAME, { 'dato-nombre': NAME }),
  RESPONSE_ONLY_NAME,
)
const SUBMISSION_WITHOUT_DATA = withAIResponse(GENERIC_CHAT, TIME, PROMPT_APPROVES_AS_IS, RESPONSE_APPROVES_AS_IS)

const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: CHAT },
  n2_generico: { kind: 'scene', view: GENERIC_CHAT },
  e_con_datos: {
    kind: 'bad',
    view: CHAT,
    senales: DATA_POINTS.map((dato) =>
      signal(
        dato.id,
        'e_con_datos',
        `Si tu mensaje incluyó <b>${dato.etiqueta}</b>: para explicar un cobro de $45 de más, la IA no lo necesitaba, y quedó en un servicio externo. (Pedirle a la IA que "no lo guarde" tampoco deshace que ya lo escribiste — el dato salió igual.)`,
      ),
    ),
    verdict: 'Datos financieros de una clienta compartidos con la IA',
    outcome:
      'Tu mensaje incluyó el nombre completo, el número de cuenta, el saldo o el teléfono real de Mónica. Para redactar la respuesta bastaba con el motivo del reclamo.',
  },
  e_parcial_paso1: {
    kind: 'partial',
    view: CHAT,
    senales: [
      signal(
        'borrador-enviado',
        'e_parcial_paso1',
        'Quedó algún fragmento identificable —solo el nombre de pila, o los últimos dígitos de la cuenta— sin llegar al dato completo. No es un dato inventado: sigue siendo real, solo que a medias.',
      ),
    ],
    verdict: 'Quedó algo identificable, aunque no el dato completo',
    outcome:
      'Tu mensaje no llegó a incluir un dato completo de Mónica, pero sí un fragmento real. Lo más seguro es contar solo el motivo del reclamo, sin ningún rastro de sus datos.',
  },
  e_recae: {
    kind: 'bad',
    view: SUBMISSION_RELAPSES,
    senales: [
      signal(
        'dato-nombre',
        'e_recae',
        'El <b>nombre completo</b>, que la oferta de "dejártela lista" te sacó. El borrador genérico que la IA ya te había dado servía para enviar tal cual.',
      ),
      signal(
        'dato-cuenta',
        'e_recae',
        'Y el <b>número de cuenta</b>, justo lo que habías evitado dar en el primer mensaje. Una respuesta a un reclamo no necesita el número de cuenta para nada.',
      ),
      signal(
        'dato-devuelto',
        'e_recae',
        'La IA los escribió de vuelta en el borrador final. El nombre y la cuenta de Mónica quedaron en un historial guardado en el servidor de otra empresa.',
      ),
    ],
    verdict: 'La oferta de "dejártela lista" te sacó los datos',
    outcome:
      'Evitaste dar los datos al principio, pero la IA no pidió los datos de entrada: primero te dio algo genérico y después los pidió como un favor, para "dejarla lista". El borrador genérico ya alcanzaba.',
  },
  e_solo_nombre: {
    kind: 'partial',
    view: SUBMISSION_ONLY_NAME,
    senales: [
      signal(
        'dato-nombre',
        'e_solo_nombre',
        'El <b>nombre completo</b> de la clienta. Frenaste el número de cuenta, pero el nombre tampoco hacía falta: el saludo lo pones tú al enviar la respuesta.',
      ),
      signal(
        'dato-devuelto',
        'e_solo_nombre',
        'Y la IA lo repitió en el saludo. Un nombre junto a un reclamo por un cobro ya identifica a una clienta concreta en un servicio externo.',
      ),
    ],
    verdict: 'Cediste el nombre a la oferta',
    outcome:
      'Diste menos que el paquete completo, pero diste. El borrador genérico se enviaba sin el nombre; personalizar el saludo era cosa tuya, dentro del sistema de la empresa.',
  },
  e_sin_datos: {
    kind: 'good',
    view: SUBMISSION_WITHOUT_DATA,
    senales: [
      signal(
        'borrador-enviado',
        'n2_generico',
        'Le contaste a la IA solo el motivo del reclamo — y cuando te ofreció "dejarla lista" a cambio del nombre y la cuenta, dijiste que así estaba bien. Nada de lo que le diste identifica a la clienta.',
      ),
    ],
    verdict: 'Te quedaste con el borrador genérico',
    outcome:
      'El borrador que la IA ya te había dado alcanzaba. Rechazaste la oferta de completarlo: el nombre y la cuenta de la clienta los pones tú al enviar la respuesta, dentro del sistema de la empresa, no en el chat.',
  },
}

const SIGNALS = [
  signal(
    'cuenta-en-juego',
    'n1',
    'La IA te pregunta <b>qué reclama la clienta</b> y en qué tono responder. Tienes el sistema abierto al lado con su cuenta, su saldo y su teléfono — y nada de eso contesta esas dos preguntas.',
  ),
]

const RULE =
  'Regla de oro: los datos de un cliente son de la empresa, no de un servicio externo. Una IA no siempre pide los datos de golpe: a veces te da algo genérico y te ofrece "dejártelo listo" si se los pasas. El borrador genérico casi siempre alcanza; lo que falta lo completas tú al enviarlo.'

const SUMMARY = 'Le pides a una IA que responda el reclamo de una clienta, con la cuenta y el saldo de ella a la vista.'

const CONTEXT: Context = {
  antes: 'Atiendes reclamos de clientes y sueles usar una IA para darle un tono más claro a tus respuestas.',
  ahora: (
    <>
      <strong>Abres el asistente de IA</strong> en el computador, con el sistema de clientes al lado: ahí
      están el número de cuenta, el saldo y el teléfono de quien reclama. Escribe tú mismo lo que le
      pedirías.
    </>
  ),
}

function CustomerHistory() {
  return (
    <AIChatScenario
      escenarioId="asistentes-ia/historial-cliente"
      resumen={SUMMARY}
      contexto={CONTEXT}
      story={STORY}
      senales={SIGNALS}
      rule={RULE}
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Toca las palabras marcadas para cambiarlas y toca "Enviar", o —en el segundo paso— toca una de
          las respuestas del chat.
        </p>
      }
    />
  )
}

export default CustomerHistory
