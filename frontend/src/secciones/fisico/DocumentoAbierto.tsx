import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'

const ESCENA: ScreenView = {
  kind: 'web',
  app: 'Escritorio',
  url: 'oficina',
  secure: true,
  brand: 'Puesto de trabajo',
  title: 'Documentos visibles',
  subtitle: 'Tu compañero se fue al café',
  datos: [
    {
      etiqueta: 'Documento 1',
      valor: 'Evaluaciones de desempeño (CONFIDENCIAL)',
      senal: 'peligro',
    },
    {
      etiqueta: 'Documento 2',
      valor: 'Datos de clientes con montos de contrato',
      senal: 'peligro',
    },
    {
      etiqueta: 'Nota adhesiva',
      valor: 'Contraseña WiFi: Of2026*Net!',
      senal: 'peligro',
    },
  ],
  aviso:
    'Tu compañero Andrés dejó su escritorio hace 5 minutos diciendo "voy al café, regreso en 15". Ves documentos confidenciales visibles. Otros compañeros pasan frecuentemente por este pasillo.',
  opciones: [
    {
      texto: 'Leer rápido el documento',
      goto: 'e_lee',
      label: 'Accedió a información confidencial sin autorización',
    },
    {
      texto: 'Fotografiar el documento',
      goto: 'e_foto',
      label: 'Capturó documentos confidenciales con el celular',
    },
    {
      texto: 'Ignorarlo, no es mi responsabilidad',
      goto: 'e_ignora',
      label: 'No reportó un documento confidencial expuesto',
    },
    {
      texto: 'Avisar al compañero discretamente',
      goto: 'e_avisa',
      label: 'Reportó de forma discreta al dueño del documento',
    },
    {
      texto: 'Reportar a Recursos Humanos',
      goto: 'e_reporta',
      label: 'Reportó a las autoridades correspondientes',
    },
  ],
  fields: [],
  button: '',
}

export const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: ESCENA },
  e_lee: {
    kind: 'bad',
    view: ESCENA,
    verdict: 'Violaste políticas de seguridad',
    outcome:
      'Acceder a información confidencial sin autorización es una falta grave. No importa que sea "un vistazo rápido": viste datos que no autorizaban que vieras. Tu compañero podría ser responsabilizado por la exposición.',
  },
  e_foto: {
    kind: 'bad',
    view: ESCENA,
    verdict: 'Capturaste datos confidenciales',
    outcome:
      'Fotografiar documentos es aún más grave: ahora la información está en tu dispositivo personal, posiblemente sincronizado a la nube, completamente fuera del control de la empresa. Eso es un incidente de seguridad serio.',
  },
  e_ignora: {
    kind: 'partial',
    view: ESCENA,
    verdict: 'No actuaste, pero dejaste el riesgo activo',
    outcome:
      'No accediste a los datos, pero no reportar un documento confidencial expuesto significa que cualquier otra persona que pase puede leerlo, copiarlo o fotografiarlo. El riesgo sigue activo.',
  },
  e_avisa: {
    kind: 'good',
    view: ESCENA,
    verdict: 'Actuaste correctamente de forma discreta',
    outcome:
      'Correcto. Reportar de forma discreta al compañero le permite guardar sus documentos de inmediato. Proteges tanto la información como su responsabilidad ante la empresa. Es la acción más humana y efectiva.',
  },
  e_reporta: {
    kind: 'good',
    view: ESCENA,
    verdict: 'Seguiste el protocolo oficial',
    outcome:
      'También correcto. Si los documentos contienen información de terceros (clientes, empleados), reportar a Recursos Humanos o Seguridad es el protocolo adecuado. Es la ruta más formal cuando la exposición es severa.',
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'peligro',
    pantalla: 'n1',
    texto: 'Documentos confidenciales <b>visibles en una zona común</b> es un riesgo de seguridad activo.',
  },
]

const RESUMEN = 'Tu compañero dejó documentos confidenciales visibles en su escritorio mientras se fue al café.'

const CONTEXTO: Contexto = {
  antes: 'Trabajas en un ambiente de oficina donde hay políticas de seguridad de información.',
  ahora: (
    <>
      <strong>Mediodía.</strong> Tu compañero Andrés se levanta de su escritorio y se va al café. Cuando se va,
      ves que dejó varios <strong>documentos impresos visibles</strong>: evaluaciones de desempeño, datos de clientes con
      montos de contrato, y notas con contraseñas.
    </>
  ),
}

function DocumentoAbierto() {
  return (
    <StoryEscenario
      escenarioId="fisico/documento-abierto"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule='Regla de oro: <b>documentos confidenciales nunca se dejan visibles</b>, ni siquiera "por un momento". Si los ves expuestos, avisa discretamente al dueño o reporta a Seguridad. No leas, no fotografíes, no ignores.'
      restartLabel="↻ Repetir el escenario"
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Ves documentos confidenciales dejados visibles. <strong>¿Qué haces?</strong> Elige la opción que consideres más
          apropriada. Cada acción tiene una consecuencia diferente.
        </p>
      }
      pista={
        <p>
          Reportar el riesgo —ya sea al dueño o a Seguridad— es siempre la acción correcta. Leer, fotografiar o ignorar
          son faltas de seguridad.
        </p>
      }
    />
  )
}

export default DocumentoAbierto
