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
  brand: 'Plano de oficina',
  title: 'Trampa USB',
  subtitle: 'Inspecciona cada zona',
  datos: [
    {
      etiqueta: 'Zona 1',
      valor: 'Estacionamiento - USB en el piso',
      senal: 'peligro',
    },
    {
      etiqueta: 'Zona 2',
      valor: 'Sala de descanso - Dispositivo en el escritorio',
      senal: 'peligro',
    },
    {
      etiqueta: 'Zona 3',
      valor: 'Área administrativa - Cable en el suelo',
      senal: 'peligro',
    },
    {
      etiqueta: 'Zona 4',
      valor: 'Pasillo/Archivo - Memoria USB promocional',
      senal: 'peligro',
    },
  ],
  aviso:
    'En el plano de abajo hay 4 zonas marcadas. En cada zona vas a encontrar una situación distinta con un dispositivo USB o de carga de origen desconocido. Haz clic sobre cada zona para inspeccionar.',
  opciones: [
    {
      texto: 'Zona 1: Estacionamiento - Conectar el USB a mi laptop',
      goto: 'e_estacionamiento_si',
      label: 'Conectó un USB desconocido del estacionamiento',
    },
    {
      texto: 'Zona 2: Sala de descanso - Usar el dispositivo de carga',
      goto: 'e_descanso_si',
      label: 'Usó un dispositivo de carga desconocido',
    },
    {
      texto: 'Zona 3: Área administrativa - Conectar el cable a la computadora',
      goto: 'e_administrativa_si',
      label: 'Conectó un cable desconocido a su computadora',
    },
    {
      texto: 'Zona 4: Pasillo/Archivo - Llevar la memoria USB a casa',
      goto: 'e_pasillo_si',
      label: 'Llevó un dispositivo desconocido fuera de la oficina',
    },
  ],
  fields: [],
  button: '',
}

export const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: ESCENA },
  e_estacionamiento_si: {
    kind: 'bad',
    view: ESCENA,
    verdict: 'Conectaste un USB desconocido',
    outcome:
      'Un USB tirado en el estacionamiento con una etiqueta "NÓMINA" es una trampa clásica. Un USB desconocido puede ejecutar código automáticamente (ataque HID "Rubber Ducky") o instalar malware. La etiqueta es el cebo diseñado para que lo conectes. Nunca conectes dispositivos desconocidos a tu computadora de trabajo.',
  },
  e_descanso_si: {
    kind: 'bad',
    view: ESCENA,
    verdict: 'Usaste un dispositivo de carga desconocido',
    outcome:
      'Los dispositivos de carga pueden ser modificados para inyectar malware cuando los conectas. Un cargador "perdido" en una zona común es una trampa física de ingeniería social. Siempre usa tu propio dispositivo de carga.',
  },
  e_administrativa_si: {
    kind: 'bad',
    view: ESCENA,
    verdict: 'Conectaste un cable desconocido',
    outcome:
      'Los cables pueden ser modificados para capturar datos o inyectar código. Un cable suelto en un área administrativa es una herramienta de ataque. Nunca uses cables o adaptadores de origen desconocido.',
  },
  e_pasillo_si: {
    kind: 'bad',
    view: ESCENA,
    verdict: 'Llevaste un dispositivo desconocido fuera de la oficina',
    outcome:
      'Una memoria USB promocional puede ser legítima, pero una encontrada en la oficina es sospechosa. Llevarla fuera expone tu dispositivo personal a riesgos. Nunca lleves dispositivos desconocidos fuera de la oficina, y si los encuentras, repórtalos a Seguridad.',
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'peligro',
    pantalla: 'n1',
    texto:
      '<b>Dispositivos USB y cables de origen desconocido</b> pueden contener malware, pueden capturar datos, o pueden inyectar código. Nunca conectes un dispositivo cuyo origen desconoces.',
  },
]

const RESUMEN = 'Encontraste dispositivos USB y cables desconocidos en diferentes zonas de la oficina.'

const CONTEXTO: Contexto = {
  antes: 'Trabajas en una oficina donde la seguridad física de los dispositivos es importante.',
  ahora: (
    <>
      <strong>Mañana normal de trabajo.</strong> Mientras recorres la oficina, encuentras dispositivos y cables de origen
      desconocido en diferentes zonas: un USB en el estacionamiento, un cargador en la sala de descanso, un cable en el
      área administrativa, y una memoria USB promocional en el pasillo.
    </>
  ),
}

function Baiting() {
  return (
    <StoryEscenario
      escenarioId="fisico/baiting"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule='Regla de oro: <b>nunca conectes, uses, ni lleves dispositivos USB o cables de origen desconocido</b>. Si los encuentras en la oficina, repórtalos a Seguridad o IT. Son herramientas de ataque físico.'
      restartLabel="↻ Repetir el escenario"
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Encontraste dispositivos y cables desconocidos en 4 zonas diferentes. <strong>¿Qué haces con cada uno?</strong>{' '}
          Elige tu acción para cada zona.
        </p>
      }
      pista={
        <p>
          Los dispositivos USB y cables de origen desconocido nunca deben conectarse. Son herramientas de ataque comunes.
          Reporta cualquier dispositivo sospechoso a Seguridad.
        </p>
      }
    />
  )
}

export default Baiting
