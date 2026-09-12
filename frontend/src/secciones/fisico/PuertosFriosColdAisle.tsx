import ScenarioStory, { type ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Signal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'

const SCENE: ScreenView = { kind: 'escena', src: '/escenarios/fisico/puerta-abierta-servidores.webp', alt: 'Puerta abierta del pasillo frío de servidores', zonas: [{ id: 'puerta-abierta', x: '41%', y: '10%', ancho: '30%', alto: '80%' }] }
const SCENE_WITH_FLASH: ScreenView = { ...SCENE, destello: { x: '56%', y: '45%', goto: 'n_opciones', label: 'Se acercó a la puerta' } }
const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: SCENE_WITH_FLASH },
  n_opciones: { kind: 'scene', view: SCENE, choices: [
    { label: 'Cerrar la puerta y reportar a infraestructura', goto: 'e_cierra_reporta' },
    { label: 'Cerrar la puerta y seguir adelante', goto: 'e_solo_cierra' },
    { label: 'Seguir de largo, alguien se encargará', goto: 'e_nada' },
  ] },
  e_cierra_reporta: { kind: 'good', view: SCENE, verdict: 'Decisión excelente', outcome: 'Cerraste la puerta para contener el problema y avisaste a infraestructura para que compruebe los equipos. La acción rápida y la comunicación evitaron daños.' },
  e_solo_cierra: { kind: 'partial', view: SCENE, verdict: 'Acción rápida, respuesta incompleta', outcome: 'Contuviste el aire caliente, pero no reportaste el incidente. Sin una revisión no se sabe si los servidores sufrieron daño térmico.' },
  e_nada: { kind: 'bad', view: SCENE, verdict: 'Fallo crítico - Equipos comprometidos', outcome: 'La puerta siguió abierta, subió la temperatura y los servidores empezaron a apagarse. Una falla que se resolvía en segundos exige ahora recuperación.' },
}
const SIGNALS: Signal[] = [{ id: 'puerta', targetId: 'puerta-abierta', texto: 'La <b>puerta abierta</b> deja entrar aire caliente. La urgencia exige cerrarla y comunicar el incidente para revisar el impacto.' }]
const context: Context = { antes: 'El pasillo frío mantiene los servidores a temperatura segura; una puerta abierta altera el flujo de aire de inmediato.', ahora: <><strong>En el datacenter</strong> ves una puerta de pasillo frío abierta: la temperatura ya es 28.5 °C y el rango normal es 18 °C.</> }
export default function ColdAislePorts() {
  return <ScenarioStory escenarioId="fisico/puertos-frios-datacenter" resumen="Puerta del pasillo frío abierta — actúa antes de que suba la temperatura" contexto={context} nota="La respuesta de una incidencia física urgente combina contención y reporte." story={STORY} senales={SIGNALS} rule="<b>Contén el riesgo y repórtalo.</b> Cerrar la puerta no sustituye la revisión del equipo responsable." restartLabel="Intentar de nuevo" cuandoTermina="Cuando elijas una de las tres acciones." pista="Cerrar la puerta frena el daño de inmediato, pero no basta por sí solo: alguien de infraestructura debe revisar si los servidores se vieron afectados." />
}
