import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'

const ESCENA: ScreenView = {
  kind: 'escena',
  src: '/USBEstacionamiento.jpeg',
  alt: 'USB abandonado en el estacionamiento',
  zonas: [
    { id: 'usb-suelo', x: '39%', y: '61%', ancho: '22%', alto: '18%' },
    { id: 'estacionamiento-vacio', x: '5%', y: '8%', ancho: '86%', alto: '48%' },
  ],
}

const ESCENA_CON_DESTELLO: ScreenView = {
  ...ESCENA,
  destello: { x: '55%', y: '64%', goto: 'n_opciones', label: 'Inspeccionó el USB' },
}

const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: ESCENA_CON_DESTELLO },
  n_opciones: { kind: 'scene', view: ESCENA, choices: [
    { label: 'Agarrarlo, alguien lo dejó y probablemente lo necesita', goto: 'e_agarra' },
    { label: 'Dejarlo ahí, no es asunto tuyo', goto: 'e_deja' },
    { label: 'Dejarlo donde está y avisar a IT', goto: 'e_reporta' },
  ] },
  e_agarra: { kind: 'bad', view: ESCENA, verdict: 'Riesgo detectado', outcome: 'Recogiste un USB desconocido. Un dispositivo preparado puede ejecutar código o simular un teclado al conectarse; encontrarlo tirado era precisamente el cebo.' },
  e_deja: { kind: 'partial', view: ESCENA, verdict: 'Respuesta incompleta', outcome: 'No te expusiste al USB, pero lo dejaste disponible para que otra persona lo conecte. El riesgo sigue en el estacionamiento.' },
  e_reporta: { kind: 'good', view: ESCENA, verdict: 'Decisión segura', outcome: 'No tocaste el USB y avisaste a IT para que lo retire e inspeccione en un entorno controlado. Así evitas exponerte y proteges a quien pase después.' },
}

const SENALES: Senal[] = [
  { id: 'usb', targetId: 'usb-suelo', texto: 'Un <b>USB abandonado</b> puede ser un cebo: no hace falta que parezca sospechoso para comprometer un equipo.' },
  { id: 'vacio', targetId: 'estacionamiento-vacio', texto: 'No hay a quién preguntar de quién es. En vez de llevártelo, <b>repórtalo a IT</b> para que lo gestione sin conectarlo.' },
]

const contexto: Contexto = {
  antes: 'Los dispositivos encontrados en estacionamientos, salas de descanso o escritorios pueden estar preparados para comprometer un equipo cuando alguien los conecta.',
  ahora: <><strong>Hoy temprano</strong> encuentras un USB negro tirado junto a tu auto. No hay nadie cerca para saber de quién es.</>,
}

export default function TrampaUSB() {
  return <StoryEscenario escenarioId="fisico/trampa-usb" resumen="USB abandonado — decide qué hacer con él" contexto={contexto}
    nota="Un USB encontrado no es un objeto perdido que debas conectar ni llevarte." story={STORY} senales={SENALES}
    rule="<b>No conectes ni recojas dispositivos desconocidos.</b> Déjalos donde están y avisa al área responsable."
    restartLabel="Intentar de nuevo" cuandoTermina="Cuando elijas qué hacer con el USB. La primera decisión cierra el escenario."
    pista="Considera tanto tu seguridad como la de la siguiente persona que pase por el estacionamiento." />
}
