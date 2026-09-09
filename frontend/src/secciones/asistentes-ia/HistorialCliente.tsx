import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { crearChatIA, conRespuestaIA } from './chatIA'

/**
 * El más difícil de la sección: los datos no son propios ni de un compañero,
 * sino de un cliente que confió esa información a la empresa, no a un
 * servicio externo de IA. Y pedirle a la IA que "no los use" después de
 * pegarlos no deshace que ya salieron.
 */

const HORA = '11:47'

const BORRADOR =
  'Ayúdame a responder este correo. Datos de la cuenta: cliente María Fuentes, cuenta 0102345678, saldo $2.340,15, teléfono 099 456 7890. Pregunta por qué se le cobró $45 de más este mes.'

const CHAT = crearChatIA('Redactor de respuestas · servicio externo', BORRADOR, HORA)

const ENVIO_CON_DATOS = conRespuestaIA(
  CHAT,
  HORA,
  BORRADOR,
  'Aquí tienes una respuesta: "Estimada María Fuentes, revisamos el cobro adicional de $45 en su cuenta 0102345678 y le confirmaremos el motivo a la brevedad."',
)
const ENVIO_SOLO_MOTIVO = conRespuestaIA(
  CHAT,
  HORA,
  'Ayúdame a responder un correo de un cliente que reclama un cobro de $45 de más este mes en su cuenta. Escribe un tono formal y empático, sin inventar datos de la cuenta.',
  'Aquí tienes: "Estimado/a cliente, gracias por escribirnos. Estamos revisando el cobro adicional de $45 que menciona y le confirmaremos el motivo a la brevedad." Agrega el nombre y los datos de la cuenta al enviarlo.',
)
const ENVIO_PIDE_SECRETO = conRespuestaIA(
  CHAT,
  HORA,
  `${BORRADOR} No uses estos datos para nada más, son confidenciales.`,
  'Entendido, no los usaré para otra cosa. Aquí tienes la respuesta: "Estimada María Fuentes, revisamos el cobro adicional de $45 en su cuenta 0102345678 y le confirmaremos el motivo a la brevedad."',
)

const STORY: Story<ScreenNode> = {
  n1: {
    kind: 'scene',
    view: CHAT,
    choices: [
      { label: 'Pegar todos los datos de la cuenta y pedir la respuesta', goto: 'e_con_datos' },
      {
        label: 'Pedir la respuesta solo con el motivo del reclamo, sin los datos de la cuenta',
        goto: 'e_solo_motivo',
      },
      {
        label: 'Pegar todos los datos, pero pedirle a la IA que no los use para nada más',
        goto: 'e_pide_secreto',
      },
    ],
  },
  e_con_datos: {
    kind: 'bad',
    view: ENVIO_CON_DATOS,
    senales: [
      {
        id: 'datos-cliente',
        targetId: 'borrador-enviado',
        pantalla: 'e_con_datos',
        texto:
          'El <b>número de cuenta</b>, el <b>saldo</b> y el <b>teléfono</b> de María salieron hacia un servicio externo. La IA solo necesitaba saber que hubo un cobro de más.',
      },
    ],
    verdict: 'Datos financieros de un cliente compartidos con la IA',
    outcome:
      'El número de cuenta, el saldo y el teléfono de María quedaron en un servicio externo. Para redactar la respuesta bastaba con el motivo del reclamo, no con esos datos.',
  },
  e_solo_motivo: {
    kind: 'good',
    view: ENVIO_SOLO_MOTIVO,
    senales: [
      {
        id: 'sin-datos',
        targetId: 'borrador-enviado',
        pantalla: 'e_solo_motivo',
        texto: 'La IA redactó la respuesta sabiendo solo el motivo del reclamo, sin los datos de la cuenta.',
      },
    ],
    verdict: 'Respuesta redactada sin exponer los datos del cliente',
    outcome:
      'La IA redactó la respuesta sabiendo que hubo un cobro de $45 de más, sin necesitar el número de cuenta, el saldo ni el teléfono de María. Esos datos los agregaste tú al enviarla.',
  },
  e_pide_secreto: {
    kind: 'bad',
    view: ENVIO_PIDE_SECRETO,
    senales: [
      {
        id: 'pide-secreto',
        targetId: 'borrador-enviado',
        pantalla: 'e_pide_secreto',
        texto:
          'Pedirle a la IA que "no use" un dato no borra que ese dato ya salió de tu sistema hacia un servicio externo.',
      },
    ],
    verdict: 'Pedir confidencialidad no deshace haber compartido el dato',
    outcome:
      'Los datos de la cuenta de María ya quedaron escritos en la conversación. Pedirle a la IA que no los use después no cambia que ya salieron de donde deberían haberse quedado.',
  },
}

const SENALES: Senal[] = [
  {
    id: 'borrador',
    targetId: 'borrador',
    pantalla: 'n1',
    texto:
      'El mensaje trae el <b>número de cuenta</b>, el <b>saldo</b> y el <b>teléfono</b> de un cliente. Para responder por qué hubo un cobro de más, la IA no necesita esos datos.',
  },
]

const RULE =
  'Regla de oro: los datos de un cliente son de la empresa, no de un servicio externo. Antes de pedirle ayuda a una IA, pregúntate qué necesita saber de verdad para lo que le pides — casi nunca es el número de cuenta completo.'

const RESUMEN = 'Un cliente reclama un cobro de más, y tienes a la mano todos sus datos de cuenta.'

const CONTEXTO: Contexto = {
  antes: 'Atiendes reclamos de clientes y sueles usar una IA para darle un tono más claro a tus respuestas.',
  ahora: (
    <>
      <strong>Un cliente escribió</strong> preguntando por qué se le cobró $45 de más, y tienes a la mano su
      número de cuenta, su saldo y su teléfono.
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
      pregunta="¿Qué le pides a la IA?"
      cuandoTermina="Cuando decidas qué datos del cliente incluir en el mensaje a la IA."
      pista={
        <p>
          La IA puede redactar la respuesta sabiendo solo el motivo del reclamo. Lo que decides es si le das
          además el resto de la cuenta.
        </p>
      }
    />
  )
}

export default HistorialCliente
