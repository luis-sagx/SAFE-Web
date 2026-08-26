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
  title: 'Foto para el boletín',
  subtitle: 'Valeria necesita una foto rápida',
  datos: [
    {
      etiqueta: 'Pantalla',
      valor: 'Sistema de nómina abierto - datos visibles',
      senal: 'peligro',
    },
    {
      etiqueta: 'Nota adhesiva',
      valor: 'Contraseña WiFi escrita a mano',
      senal: 'peligro',
    },
    {
      etiqueta: 'Documentos',
      valor: 'Carpeta de cliente sobre el escritorio',
      senal: 'peligro',
    },
    {
      etiqueta: 'Gafete',
      valor: 'Carnet de acceso código visible',
      senal: 'peligro',
    },
  ],
  aviso:
    'Valeria, de Comunicaciones, te va a tomar una foto para el boletín interno. Tienes poco tiempo (20 segundos) antes de que se dispare. Sobre tu escritorio hay varios objetos que pueden revelar información sensible.',
  opciones: [
    {
      texto: 'Dejar todo visible en el escritorio - la foto sale rápido',
      goto: 'e_expone',
      label: 'Dejó datos confidenciales expuestos en la foto',
    },
    {
      texto: 'Ocultar rápidamente los objetos de riesgo',
      goto: 'e_oculta',
      label: 'Protegió la información antes de la foto',
    },
    {
      texto: 'Pedir a Valeria que espere mientras limpias el escritorio',
      goto: 'e_espera',
      label: 'Pidió tiempo para preparar el espacio correctamente',
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
    verdict: 'Dejaste información confidencial visible en la foto',
    outcome:
      'La foto se publica en el boletín interno y en redes de la empresa. Cualquiera que la vea puede ver: tu pantalla con nóminas, la contraseña WiFi en la nota adhesiva, datos del cliente en la carpeta, tu código de empleado en el gafete. Es una exposición de información crítica de seguridad.',
  },
  e_oculta: {
    kind: 'good',
    view: ESCENA,
    verdict: 'Ocultaste los datos antes de la foto',
    outcome:
      'Correcto. Bloqueaste la pantalla, guardaste la nota y los documentos, volteaste el gafete. La foto se ve profesional y no expone ninguna información sensible. Es la forma correcta de manejar una foto en el workspace.',
  },
  e_espera: {
    kind: 'partial',
    view: ESCENA,
    verdict: 'Pediste tiempo pero retraso el trabajo',
    outcome:
      'Mejor que dejar todo expuesto, pero no es ideal. Pedir tiempo interrumpe el flujo de trabajo de otros. Lo correcto es aprender a mantener el escritorio limpio de datos sensibles en todo momento, no solo cuando hay fotos.',
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'peligro',
    pantalla: 'n1',
    texto:
      '<b>Datos sensibles visibles en una foto</b> — nóminas, contraseñas, documentos, carnets — son una exposición de información crítica que se distribuye en boletines y redes.',
  },
]

const RESUMEN = 'Necesitas preparar tu escritorio antes de que te tomen una foto para el boletín.'

const CONTEXTO: Contexto = {
  antes: 'Trabajas en una oficina donde se publican fotos de empleados regularmente en boletines internos.',
  ahora: (
    <>
      <strong>Mediodía.</strong> Valeria de Comunicaciones te avisa que necesita una foto de tu escritorio para el
      boletín interno — será rápido, solo un segundo. Sobre tu escritorio tienes información sensible visible: la
      pantalla con el sistema de nómina, una nota adhesiva con la contraseña del WiFi, una carpeta de cliente, y tu
      gafete con el código de empleado visible.
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
      rule='Regla de oro: <b>mantén tu escritorio limpio de información sensible en todo momento</b>, no solo cuando sabes que hay fotos. Las pantallas, notas, documentos y carnets deben estar ocultos o guardados siempre.'
      restartLabel="↻ Repetir el escenario"
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Valeria te va a tomar una foto. <strong>¿Qué haces con los datos sensibles de tu escritorio?</strong> Elige tu
          acción.
        </p>
      }
      pista={
        <p>
          Antes de cualquier foto, bloquea la pantalla, guarda documentos confidenciales y asegura que ningún dato
          sensible sea visible. El escritorio limpio es responsabilidad de cada empleado en todo momento.
        </p>
      }
    />
  )
}

export default Foto
