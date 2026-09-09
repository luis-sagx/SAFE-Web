import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { crearChatIA, conRespuestaIA } from './chatIA'

/**
 * El único de la sección donde lo que se filtra no es de una persona sino de
 * la propia empresa: cifras sin publicar y un plan que ni siquiera los
 * empleados afectados conocen todavía. Mide si el criterio de "no compartas
 * datos de otros" también se aplica cuando el dato es institucional.
 */

const HORA = '15:02'

const BORRADOR =
  'Resume esto en un párrafo claro: "En el tercer trimestre la empresa tuvo pérdidas de $340.000 y planea reducir el 15% del personal de planta en enero. Todavía no se ha comunicado a los empleados."'

const CHAT = crearChatIA('Redactor de resúmenes · servicio externo', BORRADOR, HORA)

const ENVIO_CON_CIFRAS = conRespuestaIA(
  CHAT,
  HORA,
  BORRADOR,
  'Resumen: "La empresa cerró el tercer trimestre con pérdidas de $340.000 y planea un recorte del 15% de la planta en enero, aún no comunicado al personal."',
)
const ENVIO_SIN_CIFRAS = conRespuestaIA(
  CHAT,
  HORA,
  'Ayúdame a estructurar un resumen ejecutivo de un informe trimestral: necesito un párrafo que mencione el resultado financiero del período y una decisión operativa pendiente de anunciar, sin que yo te dé las cifras todavía.',
  'Aquí tienes una estructura: "En el tercer trimestre, [resultado financiero]. Como parte de los ajustes del período, se evalúa [decisión operativa], que será comunicada oportunamente al personal." Completa los corchetes con tus cifras al final.',
)

const STORY: Story<ScreenNode> = {
  n1: {
    kind: 'scene',
    view: CHAT,
    choices: [
      { label: 'Pegar el fragmento completo del informe y pedir el resumen', goto: 'e_con_cifras' },
      {
        label: 'Pedir solo la estructura del resumen, sin pegar las cifras ni el plan de despidos',
        goto: 'e_sin_cifras',
      },
      { label: 'No usar ninguna IA y redactar el resumen tú mismo, por si acaso', goto: 'e_no_usa_ia' },
    ],
  },
  e_con_cifras: {
    kind: 'bad',
    view: ENVIO_CON_CIFRAS,
    senales: [
      {
        id: 'cifras',
        targetId: 'borrador-enviado',
        pantalla: 'e_con_cifras',
        texto:
          'Cifras financieras sin publicar y un plan de despidos que <b>todavía no se comunicó a los empleados</b> salieron hacia un servicio externo, antes que a las propias personas afectadas.',
      },
    ],
    verdict: 'Información confidencial de la empresa compartida con la IA',
    outcome:
      'El resultado financiero del trimestre y el plan de reducción de personal —que ni el propio personal conoce todavía— quedaron en manos de un servicio externo.',
  },
  e_sin_cifras: {
    kind: 'good',
    view: ENVIO_SIN_CIFRAS,
    senales: [
      {
        id: 'sin-cifras',
        targetId: 'borrador-enviado',
        pantalla: 'e_sin_cifras',
        texto: 'Pediste ayuda con la forma del resumen, sin entregar el contenido confidencial.',
      },
    ],
    verdict: 'Resumen armado sin exponer datos de la empresa',
    outcome:
      'Pediste ayuda con la estructura del resumen, no con el contenido: las cifras y el plan de despidos los agregaste tú mismo, después, fuera de la conversación con la IA.',
  },
  e_no_usa_ia: {
    kind: 'partial',
    view: CHAT,
    verdict: 'Evitaste el riesgo, pero no hacía falta',
    outcome:
      'No compartiste nada, pero tampoco hacía falta perder la ayuda de redacción: bastaba con no pegar las cifras ni el plan de despidos todavía sin publicar.',
  },
}

const SENALES: Senal[] = [
  {
    id: 'borrador',
    targetId: 'borrador',
    pantalla: 'n1',
    texto:
      'El fragmento trae <b>cifras financieras sin publicar</b> y un <b>plan de despidos</b> que la propia empresa no ha comunicado. Pedir ayuda para redactar no exige entregar ese contenido.',
  },
]

const RULE =
  'Regla de oro: la información <b>confidencial de tu empresa</b> —cifras sin publicar, planes sin anunciar— no se pega en una IA externa. Pide ayuda con la forma del texto, y completa los datos sensibles tú mismo, aparte.'

const RESUMEN = 'Un informe trimestral trae cifras sin publicar y un plan de despidos sin anunciar.'

const CONTEXTO: Contexto = {
  antes: 'Te piden preparar un resumen ejecutivo de un informe financiero interno para la próxima reunión.',
  ahora: (
    <>
      <strong>El informe trae cifras</strong> que todavía no se publicaron y un plan que la empresa no ha
      comunicado, y quieres que la IA te ayude a resumirlo más claro.
    </>
  ),
}

function ResumenDocumentoInterno() {
  return (
    <StoryEscenario
      escenarioId="asistentes-ia/resumen-documento-interno"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule={RULE}
      accionesEnPantalla
      pregunta="¿Qué le pides a la IA?"
      cuandoTermina="Cuando decidas qué parte del informe pedirle a la IA."
      pista={
        <p>
          La IA puede ayudarte con la estructura de un resumen sin conocer las cifras reales. Lo que
          decides es si se las das de todos modos.
        </p>
      }
    />
  )
}

export default ResumenDocumentoInterno
