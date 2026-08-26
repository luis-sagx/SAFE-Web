import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'

const ESCRITORIO: ScreenView = {
  kind: 'web',
  app: 'Escritorio',
  url: 'puesto',
  secure: true,
  brand: 'Tu puesto de trabajo',
  title: 'Foto para el boletín',
  subtitle: 'Valeria de Comunicaciones te pide una foto rápida',
  datos: [
    {
      etiqueta: 'Pantalla del computador',
      valor: 'Abierta con sistema de nómina',
      senal: 'peligro',
    },
    {
      etiqueta: 'Nota adhesiva',
      valor: 'Contraseña WiFi: Of2026*Net!',
      senal: 'peligro',
    },
    {
      etiqueta: 'Carpeta sobre el escritorio',
      valor: 'Datos de cliente XYZ (confidencial)',
      senal: 'peligro',
    },
    {
      etiqueta: 'Gafete de acceso',
      valor: 'Código ID 04521 visible',
      senal: 'peligro',
    },
  ],
  aviso:
    'Valeria de Comunicaciones: "¡Hola! Estoy armando el boletín interno de este mes, ¿te tomo una foto rápida en tu puesto? Solo será un segundo."',
  opciones: [
    {
      texto: 'Dejar todo tal cual y dejarla tomar la foto',
      goto: 'e_expone',
      label: 'Dejó información sensible visible en la foto publicada',
    },
    {
      texto: 'Bloquear la pantalla del computador',
      goto: 'n2',
      label: 'Bloqueó la pantalla antes de la foto',
    },
    {
      texto: 'Quitar la nota adhesiva con la contraseña',
      goto: 'n3',
      label: 'Ocultó la contraseña antes de la foto',
    },
    {
      texto: 'Guardar la carpeta de documentos',
      goto: 'n4',
      label: 'Guardó los documentos confidenciales',
    },
    {
      texto: 'Voltear el gafete de acceso',
      goto: 'n5',
      label: 'Ocultó el código de acceso del gafete',
    },
  ],
  fields: [],
  button: '',
}

const NIVEL2: ScreenView = {
  ...ESCRITORIO,
  subtitle: 'Bloqueaste la pantalla - Aún hay más riesgos',
  opciones: [
    {
      texto: 'Permitir la foto así (quedan nota y carpeta visibles)',
      goto: 'e_parcial',
      label: 'Dejó parcialmente información sensible en la foto',
    },
    {
      texto: 'Quitar la nota adhesiva con la contraseña',
      goto: 'n4b',
      label: 'Ocultó la contraseña antes de la foto',
    },
    {
      texto: 'Guardar la carpeta de documentos',
      goto: 'n5b',
      label: 'Guardó los documentos confidenciales',
    },
    {
      texto: 'Voltear el gafete de acceso',
      goto: 'n6',
      label: 'Ocultó el código de acceso del gafete',
    },
  ],
  fields: [],
  button: '',
}

const NIVEL3: ScreenView = {
  ...ESCRITORIO,
  subtitle: 'Ocultaste la nota - Aún hay más riesgos',
  opciones: [
    {
      texto: 'Permitir la foto así (quedan carpeta y gafete)',
      goto: 'e_parcial',
      label: 'Dejó parcialmente información sensible en la foto',
    },
    {
      texto: 'Guardar la carpeta de documentos',
      goto: 'n7',
      label: 'Guardó los documentos confidenciales',
    },
    {
      texto: 'Voltear el gafete de acceso',
      goto: 'n8',
      label: 'Ocultó el código de acceso del gafete',
    },
  ],
  fields: [],
  button: '',
}

const FINAL_SEGURO: ScreenView = {
  ...ESCRITORIO,
  subtitle: '✓ Escritorio impecable - Listo para la foto',
  datos: [
    {
      etiqueta: 'Pantalla del computador',
      valor: 'Bloqueada',
      senal: 'seguro',
    },
    {
      etiqueta: 'Nota adhesiva',
      valor: 'Guardada',
      senal: 'seguro',
    },
    {
      etiqueta: 'Carpeta',
      valor: 'Guardada',
      senal: 'seguro',
    },
    {
      etiqueta: 'Gafete de acceso',
      valor: 'Volteado',
      senal: 'seguro',
    },
  ],
  aviso: 'Valeria: "¡Perfecto! Quedó genial. Ya la subo al boletín."',
  fields: [],
  button: '',
  opciones: [],
}

export const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: ESCRITORIO },
  n2: { kind: 'scene', view: NIVEL2 },
  n3: { kind: 'scene', view: NIVEL3 },
  n4: { kind: 'scene', view: NIVEL3 },
  n4b: { kind: 'scene', view: NIVEL3 },
  n5: { kind: 'scene', view: NIVEL3 },
  n5b: { kind: 'scene', view: NIVEL3 },
  n6: { kind: 'scene', view: NIVEL3 },
  n7: { kind: 'scene', view: FINAL_SEGURO },
  n8: { kind: 'scene', view: FINAL_SEGURO },
  e_expone: {
    kind: 'bad',
    view: ESCRITORIO,
    verdict: 'Dejaste información sensible visible en la foto',
    outcome:
      'La pantalla con nómina, la contraseña, los documentos y el código de acceso quedan todos visibles en una foto que circulará en el boletín interno y posiblemente en redes sociales. Datos de clientes, infraestructura de seguridad y acceso a sistemas comprometidos.',
  },
  e_parcial: {
    kind: 'partial',
    view: ESCRITORIO,
    verdict: 'Ocultaste algo, pero no todo quedó protegido',
    outcome:
      'Hiciste bien ocultando algunos elementos, pero dejaste otros visibles. La foto aún expone datos que no deberían circular públicamente. En seguridad, "casi todo" no es suficiente.',
  },
  e_correcto: {
    kind: 'good',
    view: FINAL_SEGURO,
    verdict: 'Escritorio impecable - solo lo que debería verse',
    outcome:
      'Bloqueaste la pantalla, ocultaste la contraseña, guardaste documentos confidenciales y volteaste el gafete. Nada sensible quedó expuesto en la foto. Es lo que cualquier empleado debería hacer automáticamente antes de cualquier foto en su puesto.',
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'peligro',
    pantalla: 'n1',
    texto: 'Información sensible <b>visible en tu escritorio</b> puede salir en la foto publicada.',
  },
  {
    id: 's2',
    targetId: 'seguro',
    pantalla: 'e_correcto',
    texto: 'Ocultaste <b>toda la información confidencial</b> antes de la foto. Solo quedó visible lo que debería estar.',
  },
]

const RESUMEN = 'Valeria te pide una foto rápida para el boletín interno. Tu escritorio tiene información sensible visible.'

const CONTEXTO: Contexto = {
  antes: 'Trabajas en un ambiente de oficina con políticas de confidencialidad.',
  ahora: (
    <>
      <strong>Mediodía.</strong> Valeria de Comunicaciones te pide <strong>una foto rápida</strong> para el boletín interno
      del mes. Tu escritorio tiene <strong>información sensible visible</strong>: pantalla abierta, contraseña pegada, documentos
      de cliente, gafete con código de acceso.
    </>
  ),
}

function Foto() {
  return (
    <StoryEscenario
      escenarioId="fisico/foto"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule='Regla de oro: <b>antes de cualquier foto en tu puesto, verifica que no haya información sensible visible</b>. Pantalla bloqueada, documentos guardados, contraseñas ocultas, gafete volteado. La foto es un momento; la información comprometida es para siempre.'
      restartLabel="↻ Repetir el escenario"
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Valeria va a tomar una foto. <strong>¿Qué ocultaras o proteges antes?</strong> Cada acción mejora tu defensa.
          El objetivo es que no quede nada sensible visible en la foto que se publique.
        </p>
      }
      pista={
        <p>
          Tienes múltiples elementos en riesgo: pantalla, nota adhesiva, carpeta de cliente, gafete. La mayoría de las veces,
          lo correcto es ocultarlos TODOS antes de permitir cualquier foto.
        </p>
      }
    />
  )
}

export default Foto
