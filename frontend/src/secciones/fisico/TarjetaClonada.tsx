import ScenarioStory, { type ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Signal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import bankCallImg from '../../assets/escenarios/fisico/llamada-banco.webp'
import walletScanImg from '../../assets/escenarios/fisico/escaneo-billetera.webp'

const CALL: ScreenView = { kind: 'escena', src: bankCallImg, alt: 'Llamada del banco por fraude en la tarjeta', zonas: [{ id: 'alerta-banco', x: '31%', y: '28%', ancho: '38%', alto: '35%' }] }
const CALL_WITH_FLASH: ScreenView = { ...CALL, destello: { x: '53%', y: '57%', goto: 'n1', label: 'Atendió la llamada' } }
const MEMORY: ScreenView = { kind: 'escena', src: walletScanImg, alt: 'Escaneo de una billetera en la calle', zonas: [{ id: 'billetera-escaneada', x: '62%', y: '68%', ancho: '18%', alto: '20%' }] }
const MEMORY_WITH_PROGRESS: ScreenView = { ...MEMORY, progreso: { ms: 4000, texto: 'Recordando cómo pasó…' } }
const SIGNALS: Signal[] = [{ id: 'alerta', targetId: 'alerta-banco', pantalla: 'n1', texto: 'Una <b>alerta del banco</b> por fraude exige actuar de inmediato: bloquea y reporta.' }, { id: 'escaneo', targetId: 'billetera-escaneada', pantalla: 'n_recuerdo', texto: 'Mientras te distraían, alguien pudo <b>escanear tu billetera</b>. La prevención física evita que el fraude empiece.' }]
const STORY: Story<ScreenNode> = {
  // Puro recuerdo: no hay nada que decidir todavía, así que pasa solo, sin
  // destello que tocar.
  n_recuerdo: { kind: 'scene', view: MEMORY_WITH_PROGRESS, autoAvanza: { ms: 4000, goto: 'n1_ver' } },
  n1_ver: { kind: 'scene', view: CALL_WITH_FLASH },
  n1: { kind: 'scene', view: CALL, choices: [
    { label: 'Bloquear la tarjeta inmediatamente y denunciar el fraude', goto: 'e_bloquea_denuncia' },
    { label: 'Ignorar la notificación y esperar…', goto: 'e_ignora' },
    { label: 'Bloquear la tarjeta pero no reportar nada…', goto: 'e_bloquea_callado' },
    { label: 'Cambiar de banco y abrir una nueva cuenta', goto: 'e_cambia_banco' },
  ] },
  e_bloquea_denuncia: { kind: 'good', view: CALL, senales: SIGNALS, verdict: 'Tarjeta protegida', outcome: 'Bloqueaste la tarjeta de inmediato y denunciaste el fraude. El banco puede detener movimientos y abrir la investigación.' },
  e_ignora: { kind: 'bad', view: CALL, senales: SIGNALS, verdict: 'Riesgo detectado', outcome: 'Esperar permite que las transacciones fraudulentas continúen y hace más difícil responder a tiempo.' },
  e_bloquea_callado: { kind: 'partial', view: CALL, senales: SIGNALS, verdict: 'Respuesta incompleta', outcome: 'Bloquear limita el daño, pero sin reportar no activas el seguimiento ni la investigación del fraude.' },
  e_cambia_banco: { kind: 'partial', view: CALL, senales: SIGNALS, verdict: 'Respuesta incompleta', outcome: 'Abrir otra cuenta no resuelve el fraude actual ni bloquea de inmediato la tarjeta comprometida.' },
}
const context: Context = { antes: 'La clonación puede ocurrir sin que entregues la tarjeta: basta una distracción y un lector cerca de la billetera.', ahora: <><strong>El banco te llama</strong>: detectó movimientos que no reconoces. Hace cuatro días alguien te distrajo en la calle.</> }
export default function ClonedCard() { return <ScenarioStory escenarioId="fisico/tarjeta-clonada" resumen="Alerta de fraude — responde a tiempo" contexto={context} nota="Primero observa cómo ocurrió la clonación; luego responde a la alerta del banco." story={STORY} initialNode="n_recuerdo" senales={SIGNALS} rule="<b>Ante fraude, bloquea y reporta inmediatamente.</b> La rapidez limita pérdidas y permite investigar." restartLabel="Intentar de nuevo" cuandoTermina="Cuando elijas una de las cuatro acciones ante la alerta." pista="Ante un fraude ya confirmado, lo primero es bloquear la tarjeta y denunciarlo — no solo protegerte cambiando de banco o quedándote callado." /> }
