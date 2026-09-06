import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'

const LLAMADA: ScreenView = { kind: 'escena', src: '/LlamadaBanco.jpeg', alt: 'Llamada del banco por fraude en la tarjeta', zonas: [{ id: 'alerta-banco', x: '31%', y: '28%', ancho: '38%', alto: '35%' }] }
const RECUERDO: ScreenView = { kind: 'escena', src: '/EscaneoBilletera.jpeg', alt: 'Escaneo de una billetera en la calle', zonas: [{ id: 'billetera-escaneada', x: '37%', y: '40%', ancho: '30%', alto: '35%' }] }
const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: LLAMADA, choices: [
    { label: 'Bloquear la tarjeta inmediatamente y denunciar el fraude', goto: 'e_bloquea_denuncia' },
    { label: 'Ignorar la notificación y esperar…', goto: 'e_ignora' },
    { label: 'Bloquear la tarjeta pero no reportar nada…', goto: 'e_bloquea_callado' },
    { label: 'Cambiar de banco y abrir una nueva cuenta', goto: 'e_cambia_banco' },
  ] },
  n_recuerdo: { kind: 'scene', view: RECUERDO },
  e_bloquea_denuncia: { kind: 'good', view: LLAMADA, verdict: 'Tarjeta protegida', outcome: 'Bloqueaste la tarjeta de inmediato y denunciaste el fraude. El banco puede detener movimientos y abrir la investigación.' },
  e_ignora: { kind: 'bad', view: LLAMADA, verdict: 'Riesgo detectado', outcome: 'Esperar permite que las transacciones fraudulentas continúen y hace más difícil responder a tiempo.' },
  e_bloquea_callado: { kind: 'partial', view: LLAMADA, verdict: 'Respuesta incompleta', outcome: 'Bloquear limita el daño, pero sin reportar no activas el seguimiento ni la investigación del fraude.' },
  e_cambia_banco: { kind: 'partial', view: LLAMADA, verdict: 'Respuesta incompleta', outcome: 'Abrir otra cuenta no resuelve el fraude actual ni bloquea de inmediato la tarjeta comprometida.' },
}
const SENALES: Senal[] = [{ id: 'alerta', targetId: 'alerta-banco', pantalla: 'n1', texto: 'Una <b>alerta del banco</b> por fraude exige actuar de inmediato: bloquea y reporta.' }, { id: 'escaneo', targetId: 'billetera-escaneada', pantalla: 'n_recuerdo', texto: 'Mientras te distraían, alguien pudo <b>escanear tu billetera</b>. La prevención física evita que el fraude empiece.' }]
const contexto: Contexto = { antes: 'La clonación puede ocurrir sin que entregues la tarjeta: basta una distracción y un lector cerca de la billetera.', ahora: <><strong>El banco te llama</strong>: detectó movimientos que no reconoces. Hace cuatro días alguien te distrajo en la calle.</> }
export default function TarjetaClonada() { return <StoryEscenario escenarioId="fisico/tarjeta-clonada" resumen="Alerta de fraude — responde a tiempo" contexto={contexto} nota="La fase de observación ya ocurrió: ahora la decisión es cómo responder al fraude." story={STORY} senales={SENALES} rule="<b>Ante fraude, bloquea y reporta inmediatamente.</b> La rapidez limita pérdidas y permite investigar." restartLabel="Intentar de nuevo" cuandoTermina="Cuando elijas una de las cuatro acciones ante la alerta." pista="La primera prioridad es detener operaciones y dejar constancia del fraude." /> }
