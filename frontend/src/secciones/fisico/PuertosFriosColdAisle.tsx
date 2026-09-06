import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'

const ESCENA: ScreenView = { kind: 'escena', src: '/PuertaAbiertaServidores.jpeg', alt: 'Puerta abierta del pasillo frío de servidores', zonas: [{ id: 'puerta-abierta', x: '41%', y: '10%', ancho: '30%', alto: '80%' }] }
const ESCENA_CON_DESTELLO: ScreenView = { ...ESCENA, destello: { x: '56%', y: '45%', goto: 'n_opciones', label: 'Se acercó a la puerta' } }
const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: ESCENA_CON_DESTELLO },
  n_opciones: { kind: 'scene', view: ESCENA, choices: [
    { label: 'Cerrar la puerta y reportar a infraestructura', goto: 'e_cierra_reporta' },
    { label: 'Cerrar la puerta y seguir adelante', goto: 'e_solo_cierra' },
    { label: 'Seguir de largo, alguien se encargará', goto: 'e_nada' },
  ] },
  e_cierra_reporta: { kind: 'good', view: ESCENA, verdict: 'Decisión excelente', outcome: 'Cerraste la puerta para contener el problema y avisaste a infraestructura para que compruebe los equipos. La acción rápida y la comunicación evitaron daños.' },
  e_solo_cierra: { kind: 'partial', view: ESCENA, verdict: 'Acción rápida, respuesta incompleta', outcome: 'Contuviste el aire caliente, pero no reportaste el incidente. Sin una revisión no se sabe si los servidores sufrieron daño térmico.' },
  e_nada: { kind: 'bad', view: ESCENA, verdict: 'Fallo crítico - Equipos comprometidos', outcome: 'La puerta siguió abierta, subió la temperatura y los servidores empezaron a apagarse. Una falla que se resolvía en segundos exige ahora recuperación.' },
}
const SENALES: Senal[] = [{ id: 'puerta', targetId: 'puerta-abierta', texto: 'La <b>puerta abierta</b> deja entrar aire caliente. La urgencia exige cerrarla y comunicar el incidente para revisar el impacto.' }]
const contexto: Contexto = { antes: 'El pasillo frío mantiene los servidores a temperatura segura; una puerta abierta altera el flujo de aire de inmediato.', ahora: <><strong>En el datacenter</strong> ves una puerta de pasillo frío abierta: la temperatura ya es 28.5 °C y el rango normal es 18 °C.</> }
export default function PuertosFriosColdAisle() {
  return <StoryEscenario escenarioId="fisico/puertos-frios-datacenter" resumen="Puerta del pasillo frío abierta — actúa antes de que suba la temperatura" contexto={contexto} nota="La respuesta de una incidencia física urgente combina contención y reporte." story={STORY} senales={SENALES} rule="<b>Contén el riesgo y repórtalo.</b> Cerrar la puerta no sustituye la revisión del equipo responsable." restartLabel="Intentar de nuevo" cuandoTermina="Cuando elijas una de las tres acciones." pista="Piensa qué acción evita el daño ahora y quién debe verificar lo ocurrido." />
}
