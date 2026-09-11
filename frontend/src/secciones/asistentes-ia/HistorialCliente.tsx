import type { ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import EscenarioChatIA from './EscenarioChatIA'
import { crearChatIA, conRespuestaIA, conSeguimientoIA, marcar, senal } from './chatIA'

/** El más difícil: los datos son de una clienta (no de un compañero), y el camino limpio no termina en el
 *  primer mensaje —la IA ofrece completar un borrador ya usable a cambio del nombre y la cuenta, y resistir
 *  ese favor es lo que mide. Dar solo el nombre para el saludo queda como parcial. */

const HORA = '11:47'

const NOMBRE = 'Mónica Zambrano'
const PRIMER_NOMBRE = NOMBRE.split(' ')[0]
const CUENTA = '2100-0000-45'
const SALDO = '$2.340,15'
const TELEFONO = '099 000 0045'

const RECLAMO = 'Reclama por qué le cobramos $45 de más este mes.'
const DATOS = `Sus datos: ${NOMBRE}, cuenta ${CUENTA}, saldo ${SALDO}, teléfono ${TELEFONO}.`

// --- Paso 1: qué le escribes a la IA de entrada ---
const PROMPT_CON_DATOS = `${RECLAMO} ${DATOS}`
const PROMPT_SIN_DATOS = `${RECLAMO} Respóndele formal y amable, diciéndole que ya estamos revisando. No inventes datos de la cuenta.`
const PROMPT_PIDE_SECRETO = `${PROMPT_CON_DATOS} No guardes estos datos, son confidenciales.`

// --- Paso 2: qué contestas a la oferta de la IA ---
const PROMPT_ARMA_COMPLETA = `Sí, es ${NOMBRE}, cuenta ${CUENTA}. Déjala lista para enviar.`
const PROMPT_SOLO_NOMBRE = `Solo el nombre para el saludo: ${NOMBRE}.`
const PROMPT_ASI_ESTA_BIEN = 'Así está bien, el resto lo completo yo al enviarla.'

// Va en el computador: los reclamos se contestan con el sistema de clientes abierto al lado, de donde salen los datos que terminan en el chat.
const CHAT = crearChatIA(
  'Redactor de respuestas · servicio externo',
  [
    { texto: 'Hola, ayúdame a responder el reclamo de una clienta.', mio: true },
    {
      texto:
        'Con gusto. Cuéntame qué reclama la clienta y en qué tono quieres responder. Con eso te preparo una respuesta clara y cordial.',
    },
  ],
  HORA,
  [
    { texto: PROMPT_CON_DATOS, goto: 'e_con_datos' },
    { texto: PROMPT_SIN_DATOS, goto: 'n2_generico' },
    { texto: PROMPT_PIDE_SECRETO, goto: 'e_pide_secreto' },
  ],
  { titulo: 'Asistente IA', url: 'https://chat.asistente-ia.com/nuevo' },
)

const MARCAS = {
  'dato-nombre': NOMBRE,
  'dato-cuenta': CUENTA,
  'dato-saldo': SALDO,
  'dato-telefono': TELEFONO,
}

// La IA repite la cuenta, el saldo y el teléfono en su respuesta: ese eco es media lección, con su propia señal.
const RESPUESTA_CON_DATOS = marcar(
  [
    'Aquí tienes la respuesta:',
    '',
    `Hola, ${PRIMER_NOMBRE}. Buenas tardes.`,
    '',
    `Lamentamos la confusión ocasionada por el cobro adicional de $45,00 en su cuenta ${CUENTA}, cuyo saldo disponible es de ${SALDO}. Vamos a revisar el detalle de la facturación de este mes para verificar a qué corresponde ese valor y confirmar si el cobro fue realizado correctamente.`,
    '',
    `Una vez que tengamos el detalle le informaremos el motivo y, de existir algún error, procederemos con la corrección. Si necesita más información puede escribirnos o llamarnos al ${TELEFONO}.`,
    '',
    'Gracias por comunicarnos su inquietud y disculpe las molestias.',
  ].join('<br>'),
  { 'dato-devuelto': `cuyo saldo disponible es de ${SALDO}` },
)

// El borrador ya sirve para enviar (saludo neutro, cubre el cobro); lo único que "falta" es el nombre — y esa es la carnada.
const RESPUESTA_GENERICA = [
  'Aquí tienes un borrador general:',
  '',
  'Hola, buenas tardes. Lamentamos la confusión por el cobro adicional de $45,00. Estamos revisando el detalle de la facturación de este mes y le informaremos el motivo apenas lo tengamos; de existir un error, procederemos con la corrección.',
  '',
  'Si me pasas el nombre de la clienta y el número de cuenta, te la dejo lista para enviar: con el saludo personalizado y el detalle del cobro ya redactado.',
].join('<br>')

const RESPUESTA_ARMA_COMPLETA = marcar(
  [
    'Lista para enviar:',
    '',
    `Hola, ${PRIMER_NOMBRE}. Buenas tardes.`,
    '',
    `Lamentamos la confusión ocasionada por el cobro adicional de $45,00 en su cuenta ${CUENTA}. Estamos revisando el detalle de la facturación de este mes y le informaremos el motivo apenas lo tengamos; de existir un error, procederemos con la corrección.`,
    '',
    'Gracias por comunicarnos su inquietud y disculpe las molestias.',
  ].join('<br>'),
  { 'dato-devuelto': `en su cuenta ${CUENTA}` },
)

const RESPUESTA_SOLO_NOMBRE = marcar(
  [
    'Aquí tienes la respuesta con el saludo:',
    '',
    `Hola, ${PRIMER_NOMBRE}. Buenas tardes.`,
    '',
    'Lamentamos la confusión ocasionada por el cobro adicional de $45,00. Estamos revisando el detalle de la facturación de este mes y le informaremos el motivo apenas lo tengamos; de existir un error, procederemos con la corrección.',
    '',
    'Gracias por comunicarnos su inquietud y disculpe las molestias.',
  ].join('<br>'),
  { 'dato-devuelto': `Hola, ${PRIMER_NOMBRE}` },
)

const RESPUESTA_ASI_ESTA_BIEN =
  'Perfecto. Copia el borrador y completa el saludo con el nombre y los datos de la cuenta al enviarlo.'

const ENVIO_CON_DATOS = conRespuestaIA(CHAT, HORA, marcar(PROMPT_CON_DATOS, MARCAS), RESPUESTA_CON_DATOS)
const ENVIO_PIDE_SECRETO = conRespuestaIA(
  CHAT,
  HORA,
  marcar(PROMPT_PIDE_SECRETO, MARCAS),
  `Entendido, trataré la información como confidencial.<br><br>${RESPUESTA_CON_DATOS}`,
)

// Paso 2: prompt limpio, la IA devuelve el borrador genérico y ofrece completarlo; el chat sigue abierto con tres respuestas nuevas.
const CHAT_GENERICO = conSeguimientoIA(CHAT, HORA, PROMPT_SIN_DATOS, RESPUESTA_GENERICA, [
  { texto: PROMPT_ARMA_COMPLETA, goto: 'e_recae' },
  { texto: PROMPT_SOLO_NOMBRE, goto: 'e_solo_nombre' },
  { texto: PROMPT_ASI_ESTA_BIEN, goto: 'e_sin_datos' },
])

const ENVIO_RECAE = conRespuestaIA(
  CHAT_GENERICO,
  HORA,
  marcar(PROMPT_ARMA_COMPLETA, { 'dato-nombre': NOMBRE, 'dato-cuenta': CUENTA }),
  RESPUESTA_ARMA_COMPLETA,
)
const ENVIO_SOLO_NOMBRE = conRespuestaIA(
  CHAT_GENERICO,
  HORA,
  marcar(PROMPT_SOLO_NOMBRE, { 'dato-nombre': NOMBRE }),
  RESPUESTA_SOLO_NOMBRE,
)
const ENVIO_SIN_DATOS = conRespuestaIA(CHAT_GENERICO, HORA, PROMPT_ASI_ESTA_BIEN, RESPUESTA_ASI_ESTA_BIEN)

const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: CHAT },
  n2_generico: { kind: 'scene', view: CHAT_GENERICO },
  e_con_datos: {
    kind: 'bad',
    view: ENVIO_CON_DATOS,
    senales: [
      senal(
        'dato-nombre',
        'e_con_datos',
        'El <b>nombre completo</b> de la clienta. Es lo que convierte al resto de la línea en los datos de una persona concreta y no en un ejemplo.',
      ),
      senal(
        'dato-cuenta',
        'e_con_datos',
        'Su <b>número de cuenta</b>. Es el dato con el que alguien que llame haciéndose pasar por el banco suena creíble desde la primera frase.',
      ),
      senal(
        'dato-saldo',
        'e_con_datos',
        'Su <b>saldo</b>. No hace falta para explicar un cobro de $45, y es información que ni siquiera todos dentro de la empresa deberían ver.',
      ),
      senal(
        'dato-telefono',
        'e_con_datos',
        'Su <b>teléfono</b>. Junto con lo anterior deja armado el paquete completo para llamarla, saber cuánto tiene y decirle su número de cuenta.',
      ),
      senal(
        'dato-devuelto',
        'e_con_datos',
        'Y la IA los escribió otra vez en su respuesta. Ya no están una vez en la conversación sino dos, en un historial guardado en el servidor de otra empresa.',
      ),
    ],
    verdict: 'Datos financieros de una clienta compartidos con la IA',
    outcome:
      'El nombre, la cuenta, el saldo y el teléfono de Mónica quedaron en un servicio externo. Para redactar la respuesta bastaba con el motivo del reclamo.',
  },
  e_pide_secreto: {
    kind: 'bad',
    view: ENVIO_PIDE_SECRETO,
    senales: [
      senal(
        'dato-cuenta',
        'e_pide_secreto',
        'La cuenta ya está escrita. La frase que pide confidencialidad viene <b>después</b>, y el mensaje se envió entero de una sola vez.',
      ),
      senal(
        'dato-saldo',
        'e_pide_secreto',
        'El saldo también. Pedir que "no lo guarde" es una instrucción dentro del texto, no un permiso que puedas retirar después.',
      ),
    ],
    verdict: 'Pedir confidencialidad no deshace haber compartido el dato',
    outcome:
      'Los datos de Mónica ya quedaron escritos en la conversación, y la IA los repitió en su respuesta. Pedirle que no los guarde no cambia que ya salieron de donde debían quedarse.',
  },
  e_recae: {
    kind: 'bad',
    view: ENVIO_RECAE,
    senales: [
      senal(
        'dato-nombre',
        'e_recae',
        'El <b>nombre completo</b>, que la oferta de "dejártela lista" te sacó. El borrador genérico que la IA ya te había dado servía para enviar tal cual.',
      ),
      senal(
        'dato-cuenta',
        'e_recae',
        'Y el <b>número de cuenta</b>, justo lo que habías evitado dar en el primer mensaje. Una respuesta a un reclamo no necesita el número de cuenta para nada.',
      ),
      senal(
        'dato-devuelto',
        'e_recae',
        'La IA los escribió de vuelta en el borrador final. El nombre y la cuenta de Mónica quedaron en un historial guardado en el servidor de otra empresa.',
      ),
    ],
    verdict: 'La oferta de "dejártela lista" te sacó los datos',
    outcome:
      'La IA no pidió los datos de entrada: primero te dio algo genérico y después los pidió como un favor, para "dejarla lista". El borrador genérico ya alcanzaba; lo que sumó darle el nombre y la cuenta fue un saludo con nombre, a cambio de que esos datos salieran de la empresa.',
  },
  e_solo_nombre: {
    kind: 'partial',
    view: ENVIO_SOLO_NOMBRE,
    senales: [
      senal(
        'dato-nombre',
        'e_solo_nombre',
        'El <b>nombre completo</b> de la clienta. Frenaste el número de cuenta, pero el nombre tampoco hacía falta: el saludo lo pones tú al enviar la respuesta.',
      ),
      senal(
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
    view: ENVIO_SIN_DATOS,
    senales: [
      senal(
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

const SENALES = [
  senal(
    'cuenta-en-juego',
    'n1',
    'La IA te pregunta <b>qué reclama la clienta</b> y en qué tono responder. Tienes el sistema abierto al lado con su cuenta, su saldo y su teléfono — y nada de eso contesta esas dos preguntas.',
  ),
]

const RULE =
  'Regla de oro: los datos de un cliente son de la empresa, no de un servicio externo. Una IA no siempre pide los datos de golpe: a veces te da algo genérico y te ofrece "dejártelo listo" si se los pasas. El borrador genérico casi siempre alcanza; lo que falta lo completas tú al enviarlo.'

const RESUMEN = 'Le pides a una IA que responda el reclamo de una clienta, con la cuenta y el saldo de ella a la vista.'

const CONTEXTO: Contexto = {
  antes: 'Atiendes reclamos de clientes y sueles usar una IA para darle un tono más claro a tus respuestas.',
  ahora: (
    <>
      <strong>Abres el asistente de IA</strong> en el computador, con el sistema de clientes al lado: ahí
      están el número de cuenta, el saldo y el teléfono de quien reclama.
    </>
  ),
}

function HistorialCliente() {
  return (
    <EscenarioChatIA
      escenarioId="asistentes-ia/historial-cliente"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule={RULE}
    />
  )
}

export default HistorialCliente
