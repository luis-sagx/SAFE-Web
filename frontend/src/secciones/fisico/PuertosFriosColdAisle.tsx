import ScenarioStory, { type ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Signal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import itAccessImg from '../../assets/escenarios/fisico/acceso-ti.webp'

// Antes era una puerta del pasillo frío abierta: un riesgo ambiental, sin
// atacante y sin caso que lo respalde. Ahora es acceso físico no autorizado al
// área de TI, anclado en el robo del IESS (Quito, 13/07/2022): un intruso con
// credencial institucional entró al piso de Tecnologías de la Información y
// se llevó 17 laptops y la Mac que administraba la web; hubo que resetear las
// claves de sus usuarios. El id y el archivo no cambian, para conservar el
// historial de corridas.
const DOOR: ScreenView = {
  kind: 'escena',
  src: itAccessImg,
  alt: 'Frente a la puerta de vidrio del área de Tecnología, que abre con tarjeta, un hombre con credencial colgada, una mochila grande y un café te pide que le abras',
  zonas: [
    { id: 'lector-tarjeta', x: '86.5%', y: '43%', ancho: '7.5%', alto: '22%' },
    { id: 'credencial', x: '36.5%', y: '67%', ancho: '7%', alto: '20%' },
    { id: 'mochila', x: '0.5%', y: '31%', ancho: '26%', alto: '68%' },
  ],
}

const SIGNALS: Signal[] = [
  {
    id: 'lector',
    targetId: 'lector-tarjeta',
    texto:
      '<b>Cada persona entra con su propia tarjeta</b>: el lector la registra. Si tú le abres, la entrada queda a tu nombre.',
  },
  {
    id: 'credencial',
    targetId: 'credencial',
    texto:
      '<b>Su credencial está en blanco</b>, sin foto ni nombre. Y una credencial colgada no autoriza: el intruso del IESS en 2022 también llevaba una.',
  },
  {
    id: 'mochila',
    targetId: 'mochila',
    texto:
      '<b>Trae una mochila grande y vacía</b>, y nadie de TI salió a recibirlo. En el IESS, el intruso se fue con varias llenas de laptops.',
  },
]

const STORY: Story<ScreenNode> = {
  n1: {
    kind: 'scene',
    view: DOOR,
    choices: [
      { label: 'Sostenerle la puerta: lleva credencial', goto: 'e_abre' },
      { label: 'Revisar su credencial y dejarlo pasar si se ve real', goto: 'e_revisa_credencial' },
      { label: 'Dejarlo pasar, pero acompañarlo hasta donde va', goto: 'e_acompana' },
      {
        label: 'No abrirle: pedirle que se registre en recepción para que confirmen quién lo espera, y avisar a seguridad',
        goto: 'e_recepcion',
      },
    ],
  },
  e_abre: {
    kind: 'bad',
    view: DOOR,
    verdict: 'Entró con tu tarjeta',
    outcome:
      'Esa noche faltaban laptops y el equipo que administra la web institucional. El registro de la puerta muestra que se abrió con tu tarjeta.',
  },
  e_revisa_credencial: {
    kind: 'bad',
    view: DOOR,
    verdict: 'Entró con tu tarjeta',
    outcome:
      'La credencial se veía bien, pero mirarla no dice si esa persona está autorizada hoy. Esa noche faltaban laptops y hubo que resetear las claves de todos sus usuarios.',
  },
  e_acompana: {
    kind: 'partial',
    view: DOOR,
    verdict: 'Respuesta incompleta',
    outcome:
      'Lo vigilaste un rato, pero entró sin registrarse y en algún momento tuviste que volver a tu trabajo. Nadie sabe qué tocó mientras estuvo solo en el piso.',
  },
  e_recepcion: {
    kind: 'good',
    view: DOOR,
    verdict: 'Acceso controlado',
    outcome:
      'Recepción no tenía ninguna visita de mantenimiento agendada. Seguridad lo retuvo y revisó las cámaras: ya lo habían visto merodeando otros pisos.',
  },
}

const context: Context = {
  antes:
    'El piso de Tecnología guarda las laptops del equipo y los equipos que administran los sistemas de la institución. La puerta abre con tarjeta.',
  ahora: (
    <>
      <strong>Lunes, 7:40 de la mañana.</strong> Llegas al piso de Tecnología. Un hombre con credencial
      colgada, una mochila grande y un café te dice: «Buenos días, soy del proveedor de
      mantenimiento, se me desactivó la tarjeta. ¿Me hace el favor?»
    </>
  ),
}

export default function ColdAislePorts() {
  return (
    <ScenarioStory
      escenarioId="fisico/puertos-frios-datacenter"
      resumen="Entrada al área de sistemas, alguien necesita pasar"
      contexto={context}
      nota="Mira la escena con calma antes de decidir."
      story={STORY}
      senales={SIGNALS}
      rule="<b>Una credencial no es una autorización.</b> Cada persona entra con su propia tarjeta; las visitas se registran en recepción, que confirma quién las espera."
      cuandoTermina="Cuando decidas qué hacer con la persona que te pide pasar."
      pista="Piensa en quién puede confirmar que esta persona tiene que estar hoy en el piso. Tú no puedes saberlo mirando su credencial."
    />
  )
}
