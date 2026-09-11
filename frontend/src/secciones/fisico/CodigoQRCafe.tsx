import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'

const ESCENA: ScreenView = { kind: 'escena', src: '/escenarios/fisico/internet-cafe.webp', alt: 'Código QR de WiFi en la pared de un café', zonas: [{ id: 'qr-cafe', x: '52%', y: '42%', ancho: '18%', alto: '28%' }] }
const ESCENA_CON_DESTELLO: ScreenView = { ...ESCENA, destello: { x: '61%', y: '56%', goto: 'n_opciones', label: 'Se acercó al código QR' } }
const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: ESCENA_CON_DESTELLO },
  n_opciones: { kind: 'scene', view: ESCENA, choices: [
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
  return <StoryEscenario escenarioId="fisico/qr-cafe-wifi" resumen="Código QR en café — decide si escanearlo" contexto={contexto} nota="Comprueba el canal legítimo antes de usar un código QR público." story={STORY} senales={SENALES} rule="<b>No escanees QR desconocidos para conectarte.</b> Pide la información de red al personal." restartLabel="Intentar de nuevo" cuandoTermina="Cuando elijas cómo conectarte." pista="Nadie del café puede confirmar a dónde lleva ese código: pregunta la red directamente al personal, en vez de escanear algo pegado en la pared." />
}
