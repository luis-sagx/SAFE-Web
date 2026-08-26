import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'

const ESCENA: ScreenView = {
  kind: 'web',
  app: 'Oficina',
  url: 'seguridad',
  secure: true,
  brand: 'Puesto de seguridad',
  title: 'Carnet olvidado',
  subtitle: 'Encontraste un carnet en el piso',
  datos: [
    {
      etiqueta: 'Nombre',
      valor: 'Sergio Martín López',
      senal: 'peligro',
    },
    {
      etiqueta: 'Código de empleado',
      valor: 'ID-287451 | Área: Operaciones',
      senal: 'peligro',
    },
    {
      etiqueta: 'Foto de identificación',
      valor: 'Visible en el carnet',
      senal: 'peligro',
    },
    {
      etiqueta: 'Nivel de acceso',
      valor: 'Nivel 3 (Acceso a áreas restringidas)',
      senal: 'peligro',
    },
  ],
  aviso:
    'Encontraste un carnet de identificación en el piso del vestíbulo. Tiene toda la información de un empleado: nombre, número de empleado, foto y hasta el nivel de acceso. El carnet tiene un holograma de seguridad pero sigue siendo un documento válido.',
  opciones: [
    {
      texto: 'Publicar en el chat de la empresa: "¿De quién es este carnet?"',
      goto: 'e_expone',
      label: 'Expuso públicamente los datos de un empleado',
    },
    {
      texto: 'Guardarlo en tu escritorio "por si acaso"',
      goto: 'e_guarda',
      label: 'Guardó un documento de identificación sin autorización',
    },
    {
      texto: 'Entregarlo al área de Seguridad o Recursos Humanos',
      goto: 'e_entrega',
      label: 'Reportó el documento perdido a las autoridades correctas',
    },
    {
      texto: 'Dejarlo donde lo encontraste para que el dueño lo vea',
      goto: 'e_deja',
      label: 'Dejó un documento de identificación en lugar visible',
    },
  ],
  fields: [],
  button: '',
}

export const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: ESCENA },
  e_expone: {
    kind: 'bad',
    view: ESCENA,
    verdict: 'Expusiste públicamente los datos personales de un empleado',
    outcome:
      'Publicar los datos de un empleado en el chat de la empresa es una violación grave de privacidad. Acabas de exponer su nombre, código de empleado y nivel de acceso a toda la organización. Alguien malintencionado podría usar esa información para phishing o suplantación.',
  },
  e_guarda: {
    kind: 'bad',
    view: ESCENA,
    verdict: 'Guardaste un documento de identificación sin autorización',
    outcome:
      'Un carnet de empleado es un documento de identidad y acceso. Guardarlo en tu escritorio significa que podrías usarlo para impersonar a esa persona o acceder a áreas que no te corresponden. Es ilegal y constituye un robo de identidad parcial.',
  },
  e_entrega: {
    kind: 'good',
    view: ESCENA,
    verdict: 'Actuaste correctamente entregando el documento',
    outcome:
      'Correcto. Entregar un carnet perdido al área de Seguridad o Recursos Humanos es lo apropiado. Ellos se encargarán de identificar al dueño de forma segura y hacer que se reemita si es necesario. Es la forma segura de manejar un documento de acceso.',
  },
  e_deja: {
    kind: 'partial',
    view: ESCENA,
    verdict: 'No actuaste, dejaste el riesgo expuesto',
    outcome:
      'Dejar el carnet en el lugar donde lo encontraste es mejor que guardarlo o publicarlo, pero igualmente riesgoso. Cualquiera que pase podría encontrarlo y usarlo para acceder a áreas restringidas o usarlo en una suplantación. El carnet sigue siendo un riesgo de seguridad.',
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'peligro',
    pantalla: 'n1',
    texto:
      'Un <b>carnet de identificación perdido</b> es un documento de acceso que puede ser usado por otros para impersonación o acceso no autorizado a áreas restringidas.',
  },
]

const RESUMEN = 'Encontraste un carnet de identificación de un empleado en el piso.'

const CONTEXTO: Contexto = {
  antes: 'Trabajas en una oficina donde los carnets son documentos de control de acceso físico a áreas restringidas.',
  ahora: (
    <>
      <strong>Mañana temprano.</strong> Mientras llegas a la oficina por la entrada del vestíbulo, ves un carnet tirado
      en el piso. Lo levantas y ves que tiene toda la información: nombre del empleado (Sergio Martín), su código de
      empleado, su foto, y su nivel de acceso (Nivel 3 — acceso a áreas restringidas). El carnet tiene un holograma que
      indica que es válido.
    </>
  ),
}

function CarnetOlvidado() {
  return (
    <StoryEscenario
      escenarioId="fisico/carnet-olvidado"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule='Regla de oro: <b>documentos de acceso perdidos no se publican, no se guardan, se entregan inmediatamente a Seguridad</b>. Son herramientas de acceso, no objetos personales.'
      restartLabel="↻ Repetir el escenario"
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Encontraste un carnet con datos de un empleado. <strong>¿Qué haces?</strong> Elige la opción que consideres
          más segura.
        </p>
      }
      pista={
        <p>
          Los documentos de acceso deben entregarse directamente a Seguridad o Recursos Humanos. No los publiques, no
          los guardes, no los dejes expuestos.
        </p>
      }
    />
  )
}

export default CarnetOlvidado
