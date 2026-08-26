import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'

const ESCENA: ScreenView = {
  kind: 'web',
  app: 'Oficina',
  url: 'zona-comun',
  secure: true,
  brand: 'Basura de oficina',
  title: 'Basura sin destruir',
  subtitle: 'Documentos confidenciales en la papelera',
  datos: [
    {
      etiqueta: 'Papelera cerca',
      valor: 'Zona común — accesible para cualquiera',
      senal: 'peligro',
    },
    {
      etiqueta: 'Contenido visible',
      valor: 'Documentos impresos con evaluaciones de desempeño',
      senal: 'peligro',
    },
    {
      etiqueta: 'Más en la basura',
      valor: 'Nóminas, contratos, datos bancarios',
      senal: 'peligro',
    },
    {
      etiqueta: 'Acceso',
      valor: 'Zona común — personal de limpieza, visitantes',
      senal: 'peligro',
    },
  ],
  aviso:
    'Vas a la zona de descanso y ves la papelera llena de documentos impresos. Están rotos pero legibles: evaluaciones de desempeño, salarios, y extractos bancarios. Alguien más podría llegar, o la persona de limpieza que vuelve en una hora.',
  opciones: [
    {
      texto: 'Dejarlos ahí, no es tu responsabilidad',
      goto: 'e_deja',
      label: 'Dejó documentos confidenciales expuestos en basura común',
    },
    {
      texto: 'Sacarlos y guardarlos en un armario privado',
      goto: 'e_guarda',
      label: 'Guardó documentos ajenos sin autorización',
    },
    {
      texto: 'Destruir los documentos usando la trituradora',
      goto: 'e_destruye',
      label: 'Destruyó documentos confidenciales apropiadamente',
    },
    {
      texto: 'Reportar a tu supervisor para que investigue quién los tiró',
      goto: 'e_reporta',
      label: 'Reportó la exposición al supervisor correspondiente',
    },
  ],
  fields: [],
  button: '',
}

export const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: ESCENA },
  e_deja: {
    kind: 'bad',
    view: ESCENA,
    verdict: 'Dejaste documentos confidenciales expuestos en basura común',
    outcome:
      'Los documentos siguen en la papelera, donde cualquiera —personal de limpieza, visitantes, o compañeros curiosos— puede verlos. Aunque estén rotos, los salarios, evaluaciones y datos bancarios son legibles. Es una exposición de información clasificada.',
  },
  e_guarda: {
    kind: 'bad',
    view: ESCENA,
    verdict: 'Guardaste documentos ajenos sin autorización',
    outcome:
      'Sacaste documentos de la basura y los guardaste. Aunque tenías una intención defensiva, acabas de llevar información confidencial de personas que no son tú a un lugar privado. Eso es potencial acceso no autorizado y posesión de documentos clasificados.',
  },
  e_destruye: {
    kind: 'good',
    view: ESCENA,
    verdict: 'Destruiste los documentos apropiadamente',
    outcome:
      'Correcto. Llevar los documentos a la trituradora y destruirlos fue la acción defensiva correcta. Sacaste datos confidenciales de una zona común donde cualquiera podría encontrarlos, y los destruiste adecuadamente. Es la forma segura de manejar documentos clasificados encontrados en basura.',
  },
  e_reporta: {
    kind: 'good',
    view: ESCENA,
    verdict: 'Reportaste la exposición al supervisor',
    outcome:
      'También correcto. Reportar a tu supervisor (o directamente a Seguridad) que hay documentos confidenciales en la basura común permite que se investigue quién los tiró sin autorización. Es un incidente de seguridad que debe documentarse y prevenirse. Ellos pueden decidir si destruirlos o investigar.',
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'peligro',
    pantalla: 'n1',
    texto:
      '<b>Documentos confidenciales en basura común</b> — incluso rotos — son información expuesta. Nóminas, evaluaciones y datos bancarios nunca deben ir a la papelera sin pasar por una trituradora de seguridad.',
  },
]

const RESUMEN = 'Viste documentos confidenciales sin destruir en la papelera común.'

const CONTEXTO: Contexto = {
  antes: 'Trabajas en una oficina donde hay documentos clasificados y áreas comunes compartidas con otros.',
  ahora: (
    <>
      <strong>Pausa del café.</strong> Vas a la zona de descanso por un café. Ves la papelera llena — alguien ha tirado
      documentos impresos. Aunque están rotos, reconoces que son confidenciales: evaluaciones de desempeño con nombres,
      salarios de la nómina, y hasta extractos bancarios de un tercero. Están visibles en la papelera pública. La
      persona de limpieza llega en una hora.
    </>
  ),
}

function BasuraConfidencial() {
  return (
    <StoryEscenario
      escenarioId="fisico/basura-confidencial"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule='Regla de oro: <b>documentos confidenciales NUNCA van a la papelera común</b>. Siempre pasan por una trituradora de seguridad. Si los encuentras así, destruyelos o reporta al supervisor.'
      restartLabel="↻ Repetir el escenario"
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Encontraste documentos confidenciales sin destruir en la basura común. <strong>¿Qué haces?</strong> Elige la
          acción más segura.
        </p>
      }
      pista={
        <p>
          Los documentos confidenciales deben destruirse usando una trituradora de seguridad, nunca la papelera común.
          Si los encuentras así, destruyelos o reporta inmediatamente.
        </p>
      }
    />
  )
}

export default BasuraConfidencial
