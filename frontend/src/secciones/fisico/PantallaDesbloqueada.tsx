import EscenarioLayout from '../../components/EscenarioLayout'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import DeviceScreen, { type ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import PanelVeredicto from '../../components/ui/PanelVeredicto'
import { useStoryEngine, type Story, type StoryNode } from '../../hooks/useStoryEngine'

interface Opcion {
  texto: string
  goto: string
  label: string
}

const OPCIONES: Opcion[] = [
  {
    texto: 'Revisar rápidamente los correos de la carpeta confidencial',
    goto: 'e_lee',
    label: 'Accedió a información confidencial sin permiso',
  },
  {
    texto: 'Hacer una transferencia de prueba desde la app contable',
    goto: 'e_modifica',
    label: 'Intentó manipular sistemas financieros sin autorización',
  },
  {
    texto: 'Esperar a que regrese sin tocar nada',
    goto: 'e_espera',
    label: 'Respetó el acceso sin vigilancia',
  },
  {
    texto: 'Bloquear la pantalla (Ctrl+Alt+L o Win+L)',
    goto: 'e_bloquea',
    label: 'Actuó para proteger datos ajenos',
  },
]

const ESCENA: ScreenView = {
  kind: 'web',
  app: 'Escritorio',
  url: 'oficina',
  secure: true,
  brand: 'Puesto de trabajo',
  title: 'Pantalla desbloqueada',
  subtitle: 'Tu compañero se levantó unos minutos',
  datos: [
    {
      etiqueta: 'Acceso',
      valor: 'Sistema de nómina (RRHH) - sesión activa',
      senal: 'peligro',
    },
    {
      etiqueta: 'Correos abiertos',
      valor: 'Carpeta de proyectos confidenciales',
      senal: 'peligro',
    },
    {
      etiqueta: 'Aplicación de banca',
      valor: 'App de transferencias del área contable',
      senal: 'peligro',
    },
  ],
  aviso:
    'Tu compañero de equipo se levantó de su escritorio para ir por café. Su pantalla quedó completamente desbloqueada con tres ventanas importantes abiertas. Estarán fuera unos 10 minutos.',
  fields: [],
  button: '',
}

const STORY: Story<StoryNode> = {
  n1: { kind: 'scene' },
  e_lee: {
    kind: 'bad',
    verdict: 'Violaste la privacidad y confidencialidad',
    outcome:
      'Acceder a los correos de un compañero sin permiso es una falta grave. El hecho de que la pantalla esté sin vigilancia no te da derecho a usarla. Es tanto una violación de confianza como una violación de políticas de acceso.',
  },
  e_modifica: {
    kind: 'bad',
    verdict: 'Cometiste fraude al intentar manipular transferencias',
    outcome:
      'Intentar usar el acceso de otra persona para hacer transacciones financieras es fraude. Es uno de los ataques más graves: aprovechaste la confianza y la sesión abierta para intentar operaciones que no te autorizan. Esto tendría consecuencias legales graves.',
  },
  e_espera: {
    kind: 'partial',
    verdict: 'No actuaste, pero dejaste el riesgo activo',
    outcome:
      'No hiciste nada incorrecto personalmente, pero tampoco actuaste para reducir el riesgo. La pantalla sigue desbloqueada y disponible para cualquiera que pase. Un tercero podría ver datos o hacer cosas comprometedoras.',
  },
  e_bloquea: {
    kind: 'good',
    verdict: 'Actuaste correctamente para proteger datos ajenos',
    outcome:
      'Perfecto. Bloquear la pantalla de un compañero que se olvidó es lo correcto: proteges sus datos, su sesión y su responsabilidad frente a la empresa. Es una acción defensiva que muestra conciencia de seguridad.',
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'peligro',
    pantalla: 'n1',
    texto:
      'Una <b>pantalla desbloqueada con sesiones activas</b> es un riesgo para los datos y para quien la dejó: cualquiera podría usarla, ver información o hacer cosas en su nombre.',
  },
]

const RESUMEN = 'Tu compañero dejó su pantalla desbloqueada con sistemas importantes abiertos.'

const CONTEXTO: Contexto = {
  antes: 'Trabajas en un ambiente de oficina donde cada persona es responsable de bloquear su computadora.',
  ahora: (
    <>
      <strong>Pausa de café.</strong> Tu compañero se levanta de su escritorio diciendo {'"'}me voy un momentito{'"'}
      . Cuando se va, ves que su pantalla quedó completamente desbloqueada con tres cosas abiertas: el sistema de
      nómina (donde están todos los salarios), su correo con proyectos confidenciales, y la app de banca para hacer
      transferencias desde el área contable.
    </>
  ),
}

const REGLA =
  'Regla de oro: <b>nunca dejes tu pantalla desbloqueada</b>, y si ves una abierta, bloquéala discretamente. No accedas, no modifiques, no hagas nada con ella —solo protégela del siguiente que pase.'

function PantallaDesbloqueada() {
  const engine = useStoryEngine(STORY, 'n1', 'fisico/pantalla-desbloqueada')

  const pantalla = (
    <div
      id="pantalla-escenario"
      style={{ width: '100%', height: '100%' }}
    >
      <DeviceScreen view={ESCENA} />
    </div>
  )

  const decision = engine.isEnding ? (
    <PanelVeredicto
      escenarioId="fisico/pantalla-desbloqueada"
      node={engine.node}
      senales={SENALES}
      regla={REGLA}
      restartLabel="↻ Repetir el escenario"
      onRestart={engine.restart}
      contenedorId="pantalla-escenario"
    />
  ) : (
    <div className="grid gap-3">
      <p className="text-lg font-semibold text-ink">¿Qué haces?</p>
      <div className="grid gap-2">
        {OPCIONES.map((opcion) => (
          <button
            key={opcion.label}
            type="button"
            onClick={() => engine.choose(opcion.goto, opcion.label)}
            className="rounded-md border border-hairline-strong bg-surface px-4 py-3 text-left text-base transition hover:border-hairline-strong hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            {opcion.texto}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <EscenarioLayout
      escenarioId="fisico/pantalla-desbloqueada"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      identidad={[]}
      pantalla={pantalla}
      decision={decision}
      resultado={engine.resultado}
      onEmpezar={engine.restart}
      dispositivo="telefono"
    />
  )
}

export default PantallaDesbloqueada
