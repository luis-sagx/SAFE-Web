import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { crearChatIA, conRespuestaIA } from './chatIA'

/**
 * Puerta de entrada de la sección: la IA no engaña a nadie, es una herramienta
 * legítima. El riesgo está en lo que el propio participante le pega antes de
 * pedir ayuda — aquí, el nombre completo, la cédula y el correo de un
 * compañero, que no hacen falta para mejorar la redacción de un texto.
 */

const HORA = '10:14'

const BORRADOR =
  'Mejora este correo: Estimado Sebastián, le escribo para indicarle que el estudiante Luis Andrango, con cédula 1723456789 y correo luis.andrango99@gmail.com, solicita el cambio de horario de la materia de Redes.'

const CHAT = crearChatIA('Redactor de mensajes · servicio externo', BORRADOR, HORA)

const ENVIO_COMPLETO = conRespuestaIA(
  CHAT,
  HORA,
  BORRADOR,
  'Aquí tienes una versión más formal: "Estimado Sebastián: le escribo para solicitar, en representación del estudiante Luis Andrango (CI 1723456789, luis.andrango99@gmail.com), el cambio de horario de la materia de Redes."',
)
const ENVIO_ANONIMIZADO = conRespuestaIA(
  CHAT,
  HORA,
  'Mejora este correo: Estimado Sebastián, le escribo para indicarle que el estudiante [nombre del compañero], con cédula [cédula] y correo [correo], solicita el cambio de horario de la materia de Redes.',
  'Aquí tienes una versión más formal: "Estimado Sebastián: le escribo para solicitar, en representación de [nombre del compañero] ([cédula], [correo]), el cambio de horario de la materia de Redes." Reemplaza los corchetes con los datos antes de enviarlo.',
)

const STORY: Story<ScreenNode> = {
  n1: {
    kind: 'scene',
    view: CHAT,
    choices: [
      {
        label: 'Enviar el mensaje tal cual, para que la IA lo mejore',
        goto: 'e_datos_completos',
      },
      {
        label: 'Quitar el nombre, la cédula y el correo de Luis antes de enviarlo, y pedir solo que mejore el texto',
        goto: 'e_anonimizado',
      },
      {
        label: 'No usar la IA para este correo y escribirlo tú mismo',
        goto: 'e_no_usa_ia',
      },
    ],
  },
  e_datos_completos: {
    kind: 'bad',
    view: ENVIO_COMPLETO,
    senales: [
      {
        id: 'borrador-enviado',
        targetId: 'borrador-enviado',
        pantalla: 'e_datos_completos',
        texto:
          'El nombre completo, la <b>cédula</b> y el <b>correo</b> de Luis salieron hacia un servicio externo. La IA no necesitaba saber quién era la persona para mejorar la redacción.',
      },
    ],
    verdict: 'Datos de un compañero compartidos con la IA',
    outcome:
      'Para mejorar un texto, la IA no necesita el nombre completo, la cédula ni el correo de la persona involucrada. Esos datos ya quedaron en un servicio externo, fuera de tu control.',
  },
  e_anonimizado: {
    kind: 'good',
    view: ENVIO_ANONIMIZADO,
    senales: [
      {
        id: 'borrador-enviado',
        targetId: 'borrador-enviado',
        pantalla: 'e_anonimizado',
        texto:
          'Los datos de Luis se reemplazaron por marcadores antes de pedir ayuda: la IA mejoró el texto sin conocer a quién pertenecían.',
      },
    ],
    verdict: 'Redacción mejorada, sin compartir datos de nadie',
    outcome:
      'Reemplazaste el nombre, la cédula y el correo de Luis por marcadores antes de pedir ayuda. La IA mejoró la redacción sin conocer esos datos, y los agregaste tú mismo al final.',
  },
  e_no_usa_ia: {
    kind: 'partial',
    view: CHAT,
    verdict: 'Evitaste el riesgo, pero no hacía falta',
    outcome:
      'No compartiste ningún dato, pero tampoco hacía falta perder la ayuda de redacción: bastaba con quitar el nombre, la cédula y el correo de Luis antes de pedirla.',
  },
}

const SENALES: Senal[] = [
  {
    id: 'borrador',
    targetId: 'borrador',
    pantalla: 'n1',
    texto:
      'El borrador ya trae el <b>nombre completo</b>, la <b>cédula</b> y el <b>correo</b> de otra persona. Pedirle a una IA que "mejore la redacción" no exige entregarle esos datos.',
  },
]

const RULE =
  'Regla de oro: antes de pegar un texto en una IA, revisa si trae <b>nombres, cédulas, correos o teléfonos de otras personas</b>. Si no hacen falta para lo que le pides, quítalos primero.'

const RESUMEN = 'Un borrador de correo ya trae los datos de un compañero, antes de pedirle ayuda a una IA.'

const CONTEXTO: Contexto = {
  antes: 'Coordinas trámites de tus compañeros de clase y sueles usar una IA para mejorar tus correos formales.',
  ahora: (
    <>
      <strong>Escribiste un borrador</strong> para pedir un cambio de horario a nombre de un compañero, y
      quieres que la IA te ayude a mejorarlo antes de mandarlo.
    </>
  ),
}

function CorreoDatosTerceros() {
  return (
    <StoryEscenario
      escenarioId="asistentes-ia/correo-datos-terceros"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule={RULE}
      accionesEnPantalla
      pregunta="¿Qué haces con el borrador?"
      cuandoTermina="Cuando decidas qué hacer con el borrador antes de pedirle ayuda a la IA."
      pista={
        <p>
          La IA puede mejorar la redacción sin saber de quién habla el texto. Lo que decides es si se lo
          dices de todos modos.
        </p>
      }
    />
  )
}

export default CorreoDatosTerceros
