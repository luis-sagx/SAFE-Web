import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { crearChatIA, conRespuestaIA, marcar } from './chatIA'

/**
 * El más difícil de la sección: los datos no son propios ni de un compañero,
 * sino de una clienta que confió esa información a la empresa, no a un
 * servicio externo de IA. Y pedirle a la IA que "no los guarde" después de
 * escribirlos no deshace que ya salieron.
 */

const HORA = '11:47'

const NOMBRE = 'Mónica Zambrano'
const CUENTA = '2100-0000-45'
const SALDO = '$2.340,15'
const TELEFONO = '099 000 0045'

const RECLAMO = 'Reclama por qué le cobramos $45 de más este mes.'
const DATOS = `Sus datos: ${NOMBRE}, cuenta ${CUENTA}, saldo ${SALDO}, teléfono ${TELEFONO}.`
const PROMPT_CON_DATOS = `${RECLAMO} ${DATOS}`
const PROMPT_SIN_DATOS = `${RECLAMO} Respóndele formal y amable, diciéndole que ya estamos revisando. No inventes datos de la cuenta.`
const PROMPT_PIDE_SECRETO = `${PROMPT_CON_DATOS} No guardes estos datos, son confidenciales.`

// Va en el computador: los reclamos se contestan desde el puesto de trabajo,
// con el sistema de clientes abierto al lado — que es justo de donde salen los
// datos que terminan pegados en el chat.
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
    { texto: PROMPT_SIN_DATOS, goto: 'e_sin_datos' },
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

// Un reclamo se contesta por el mismo canal por el que llegó —un mensaje—, no
// con un correo formal de asunto y firma: la IA devuelve algo que se pega y se
// manda tal cual. Y de paso vuelve a escribir la cuenta, el saldo y el teléfono
// que le diste: ese eco es media lección del escenario, así que la respuesta
// lleva su propia señal.
const RESPUESTA_CON_DATOS = marcar(
  [
    'Aquí tienes la respuesta:',
    '',
    `Hola, ${NOMBRE.split(' ')[0]}. Buenas tardes.`,
    '',
    `Lamentamos la confusión ocasionada por el cobro adicional de $45,00 en su cuenta ${CUENTA}, cuyo saldo disponible es de ${SALDO}. Vamos a revisar el detalle de la facturación de este mes para verificar a qué corresponde ese valor y confirmar si el cobro fue realizado correctamente.`,
    '',
    `Una vez que tengamos el detalle le informaremos el motivo y, de existir algún error, procederemos con la corrección. Si necesita más información puede escribirnos o llamarnos al ${TELEFONO}.`,
    '',
    'Gracias por comunicarnos su inquietud y disculpe las molestias.',
    '',
    '¿Quieres que la deje más corta o con un tono más cercano?',
  ].join('<br>'),
  { 'dato-devuelto': `cuyo saldo disponible es de ${SALDO}` },
)

const ENVIO_CON_DATOS = conRespuestaIA(CHAT, HORA, marcar(PROMPT_CON_DATOS, MARCAS), RESPUESTA_CON_DATOS)
const ENVIO_SIN_DATOS = conRespuestaIA(
  CHAT,
  HORA,
  PROMPT_SIN_DATOS,
  [
    'Aquí tienes la respuesta:',
    '',
    'Hola, buenas tardes.',
    '',
    'Lamentamos la confusión ocasionada por el cobro adicional de $45,00. Vamos a revisar el detalle de la facturación de este mes para verificar a qué corresponde ese valor y confirmar si el cobro fue realizado correctamente.',
    '',
    'Una vez que tengamos el detalle le informaremos el motivo y, de existir algún error, procederemos con la corrección.',
    '',
    'Gracias por comunicarnos su inquietud y disculpe las molestias.',
    '',
    'Agrega su nombre al inicio antes de enviarla.',
  ].join('<br>'),
)
const ENVIO_PIDE_SECRETO = conRespuestaIA(
  CHAT,
  HORA,
  marcar(PROMPT_PIDE_SECRETO, MARCAS),
  `Entendido, trataré la información como confidencial.<br><br>${RESPUESTA_CON_DATOS}`,
)

const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: CHAT },
  e_con_datos: {
    kind: 'bad',
    view: ENVIO_CON_DATOS,
    senales: [
      {
        id: 'dato-nombre',
        targetId: 'dato-nombre',
        pantalla: 'e_con_datos',
        texto:
          'El <b>nombre completo</b> de la clienta. Es lo que convierte al resto de la línea en los datos de una persona concreta y no en un ejemplo.',
      },
      {
        id: 'dato-cuenta',
        targetId: 'dato-cuenta',
        pantalla: 'e_con_datos',
        texto:
          'Su <b>número de cuenta</b>. Es el dato con el que alguien que llame haciéndose pasar por el banco suena creíble desde la primera frase.',
      },
      {
        id: 'dato-saldo',
        targetId: 'dato-saldo',
        pantalla: 'e_con_datos',
        texto:
          'Su <b>saldo</b>. No hace falta para explicar un cobro de $45, y es información que ni siquiera todos dentro de la empresa deberían ver.',
      },
      {
        id: 'dato-telefono',
        targetId: 'dato-telefono',
        pantalla: 'e_con_datos',
        texto:
          'Su <b>teléfono</b>. Junto con lo anterior deja armado el paquete completo para llamarla, saber cuánto tiene y decirle su número de cuenta.',
      },
      {
        id: 'dato-devuelto',
        targetId: 'dato-devuelto',
        pantalla: 'e_con_datos',
        texto:
          'Y la IA los escribió otra vez en su respuesta. Ya no están una vez en la conversación sino dos, en un historial guardado en el servidor de otra empresa.',
      },
    ],
    verdict: 'Datos financieros de una clienta compartidos con la IA',
    outcome:
      'El nombre, la cuenta, el saldo y el teléfono de Mónica quedaron en un servicio externo. Para redactar la respuesta bastaba con el motivo del reclamo.',
  },
  e_sin_datos: {
    kind: 'good',
    view: ENVIO_SIN_DATOS,
    senales: [
      {
        id: 'borrador-enviado',
        targetId: 'borrador-enviado',
        pantalla: 'e_sin_datos',
        texto:
          'Le contaste a la IA el motivo del reclamo y el tono que querías. Nada de eso identifica a nadie ni sirve para entrar a ninguna cuenta.',
      },
    ],
    verdict: 'Respuesta redactada sin exponer los datos de la clienta',
    outcome:
      'La IA escribió la respuesta sabiendo solo que hubo un cobro de $45 de más. El nombre y la cuenta los pusiste tú al enviarla, dentro del sistema de la empresa.',
  },
  e_pide_secreto: {
    kind: 'bad',
    view: ENVIO_PIDE_SECRETO,
    senales: [
      {
        id: 'dato-cuenta',
        targetId: 'dato-cuenta',
        pantalla: 'e_pide_secreto',
        texto:
          'La cuenta ya está escrita. La frase que pide confidencialidad viene <b>después</b>, y el mensaje se envió entero de una sola vez.',
      },
      {
        id: 'dato-saldo',
        targetId: 'dato-saldo',
        pantalla: 'e_pide_secreto',
        texto:
          'El saldo también. Pedir que "no lo guarde" es una instrucción dentro del texto, no un permiso que puedas retirar después.',
      },
    ],
    verdict: 'Pedir confidencialidad no deshace haber compartido el dato',
    outcome:
      'Los datos de Mónica ya quedaron escritos en la conversación, y la IA los repitió en su respuesta. Pedirle que no los guarde no cambia que ya salieron de donde debían quedarse.',
  },
}

const SENALES: Senal[] = [
  {
    id: 'cuenta-en-juego',
    pantalla: 'n1',
    texto:
      'La IA te pregunta <b>qué reclama la clienta</b> y en qué tono responder. Tienes el sistema abierto al lado con su cuenta, su saldo y su teléfono — y nada de eso contesta esas dos preguntas.',
  },
]

const RULE =
  'Regla de oro: los datos de un cliente son de la empresa, no de un servicio externo. Antes de escribirle a una IA, pregúntate qué necesita saber de verdad — casi nunca es el número de cuenta.'

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
    <StoryEscenario
      escenarioId="asistentes-ia/historial-cliente"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule={RULE}
      accionesEnPantalla
      cuandoTermina="Cuando toques una de las respuestas del chat."
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Toca una de las respuestas para contestarle a la IA.
        </p>
      }
      pista={
        <p>
          La IA puede redactar la respuesta sabiendo solo el motivo del reclamo. Lo que decides es si le
          das además el resto de la cuenta.
        </p>
      }
    />
  )
}

export default HistorialCliente
