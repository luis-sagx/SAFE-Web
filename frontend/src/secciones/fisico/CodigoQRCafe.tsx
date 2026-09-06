import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'

const ESCENA: ScreenView = { kind: 'escena', src: '/InternetCafe.jpeg', alt: 'Código QR de WiFi en la pared de un café', zonas: [{ id: 'qr-cafe', x: '59%', y: '21%', ancho: '14%', alto: '25%' }] }
const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: ESCENA, choices: [
    { label: 'Escanear el código QR para conectarme al WiFi', goto: 'e_escanea' },
    { label: 'Preguntar al personal del café por la contraseña del WiFi', goto: 'e_pregunta' },
    { label: 'Usar datos móviles aunque sea lento', goto: 'e_datos' },
  ] },
  e_escanea: { kind: 'bad', view: ESCENA, verdict: 'Riesgo detectado', outcome: 'El QR puede llevar a un sitio falso que robe credenciales o inicie una descarga. No puedes verificar su destino a simple vista.' },
  e_pregunta: { kind: 'good', view: ESCENA, verdict: 'Decisión segura', outcome: 'Pediste la contraseña directamente al personal, usando el canal que el café puede confirmar.' },
  e_datos: { kind: 'partial', view: ESCENA, verdict: 'Respuesta prudente', outcome: 'Los datos móviles evitan el QR desconocido, aunque pedir la contraseña al personal habría verificado la red legítima.' },
}
const SENALES: Senal[] = [{ id: 'qr', targetId: 'qr-cafe', texto: 'Un código pegado en una pared no revela <b>a dónde te llevará</b>. Confirma la red con el personal antes de escanearlo.' }]
const contexto: Contexto = { antes: 'Los QR también pueden esconder enlaces maliciosos: el código no permite juzgar su destino a simple vista.', ahora: <><strong>Ahora</strong> necesitas conectarte en un café y ves un QR que ofrece WiFi gratis.</> }
export default function CodigoQRCafe() {
  return <StoryEscenario escenarioId="fisico/qr-cafe-wifi" resumen="Código QR en café — decide si escanearlo" contexto={contexto} nota="Comprueba el canal legítimo antes de usar un código QR público." story={STORY} senales={SENALES} rule="<b>No escanees QR desconocidos para conectarte.</b> Pide la información de red al personal." restartLabel="Intentar de nuevo" cuandoTermina="Cuando elijas cómo conectarte." pista="El origen verificable de la red importa más que la velocidad." />
}
