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
        'Con gusto. Cuénteme qué reclama la clienta y en qué tono desea responder. Con esa información puedo preparar una respuesta clara y cordial.',
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

const RESPUESTA_CON_DATOS = `Con gusto. Aquí tiene la respuesta: «Estimada señora ${NOMBRE}: reciba un cordial saludo. Hemos recibido su reclamo por el cobro adicional de $45 registrado en su cuenta ${CUENTA} durante el presente mes. Nuestro equipo ya se encuentra revisando el detalle y le confirmaremos el motivo a la brevedad. Agradecemos su paciencia.» Puedo ajustar el tono si lo prefiere más breve.`

const ENVIO_CON_DATOS = conRespuestaIA(CHAT, HORA, marcar(PROMPT_CON_DATOS, MARCAS), RESPUESTA_CON_DATOS)
const ENVIO_SIN_DATOS = conRespuestaIA(
  CHAT,
  HORA,
  PROMPT_SIN_DATOS,
  'Con gusto. Aquí tiene la respuesta: «Estimada clienta: reciba un cordial saludo. Hemos recibido su reclamo por el cobro adicional de $45 registrado durante el presente mes. Nuestro equipo ya se encuentra revisando el detalle y le confirmaremos el motivo a la brevedad. Agradecemos su paciencia.» Complete el nombre y los datos de la cuenta antes de enviarla.',
)
const ENVIO_PIDE_SECRETO = conRespuestaIA(
  CHAT,
  HORA,
  marcar(PROMPT_PIDE_SECRETO, MARCAS),
  `Entendido, trataré la información como confidencial. ${RESPUESTA_CON_DATOS}`,
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
