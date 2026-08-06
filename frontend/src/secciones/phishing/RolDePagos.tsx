import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import { ACCIONES_BARRA, finalesDeBarra } from './barraDeCorreo'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'

const CORREO: ScreenView = {
  kind: 'mail',
  from: 'Talento Humano · Corporación Andes',
  address: 'nomina@andes.com.ec',
  senalDireccion: 'remitente',
  subject: 'Tu rol de pagos de julio ya está disponible',
  date: 'ayer 17:20',
  body: `
    <p><span data-signal="saludo">Hola,</span></p>
    <p>
      Tu rol de pagos del período <b>julio 2026</b> ya está publicado en el portal del
      colaborador, junto con el detalle de horas extra y descuentos.
    </p>
    <p>
      Puedes consultarlo en <b data-signal="portal">portal.andes.com.ec</b>, con el mismo usuario de tu correo
      institucional. Si algo no cuadra, responde a este correo o escribe a <span data-signal="canal">la extensión 214</span>
      antes del 8 de agosto.
    </p>
  `,
  footer: `
    <p>Talento Humano · Corporación Andes<br />
      Nunca te pediremos tu contraseña por correo ni por teléfono.</p>
  `,
}

const PORTAL: ScreenView = {
  kind: 'web',
  url: 'https://portal.andes.com.ec/rrhh/rol',
  secure: true,
  senalUrl: 'portal-url',
  brand: 'Corporación Andes',
  title: 'Portal del colaborador',
  subtitle: 'Ingresa con tu usuario institucional para ver tu rol de pagos.',
  fields: [
    { label: 'Usuario', placeholder: '', valor: 'usuario' },
    { label: 'Contraseña', placeholder: '••••••••' },
  ],
  button: 'Ingresar',
  botonGoto: 'e_bien',
  botonLabel: 'Entró al portal del colaborador',
  cerrarGoto: 'e_borra',
  cerrarLabel: 'Cerró el portal sin revisar nada',
  footer: 'portal.andes.com.ec · Talento Humano',
}

const STORY: Story<ScreenNode> = {
  // Responder, reenviar, archivar, eliminar y marcar como spam.
  ...finalesDeBarra('legitimo', CORREO),
  n1: {
    kind: 'scene',
    view: CORREO,
    choices: [
      { label: 'Abrir el portal escribiendo yo mismo portal.andes.com.ec.', goto: 'n2' },
      {
        label: 'Responder el correo con mi usuario y contraseña para que me envíen el rol.',
        goto: 'e_credenciales',
      },
      { label: 'Borrarlo: todo correo con enlaces al portal es sospechoso.', goto: 'e_borra' },
    ],
  },
  n2: {
    kind: 'scene',
    view: PORTAL,
    choices: [
      { label: 'El dominio es el de la empresa: ingreso y reviso mi rol.', goto: 'e_bien' },
      { label: 'Cerrar igual, por si acaso, sin revisar nada.', goto: 'e_borra' },
    ],
  },
  e_bien: {
    kind: 'good',
    view: PORTAL,
    verdict: 'Acertaste · el correo era legítimo',
    outcome:
      'Era un aviso real de Talento Humano y entraste por el portal de la empresa. Revisaste tu rol y notaste que faltaban dos horas extra: las reclamaste a tiempo.',
  },
  e_credenciales: {
    kind: 'bad',
    view: CORREO,
    verdict: 'Correo legítimo, reacción peligrosa',
    outcome:
      'El remitente era real, pero tu contraseña quedó escrita en un correo. Cualquiera que lea ese buzón (o que lo intercepte) la tiene, y el propio mensaje avisaba que Talento Humano nunca la pide.',
    score: 0,
  },
  e_borra: {
    kind: 'partial',
    view: CORREO,
    verdict: 'Prudente, pero de más',
    outcome:
      'El correo era auténtico y lo descartaste sin mirarlo. No pasó nada malo, pero te quedaste sin revisar tu rol y el plazo para reclamar diferencias venció.',
    score: 50,
  },
}

const SENALES: Senal[] = [
  { id: 's1', targetId: 'remitente', pantalla: 'n1', texto: 'El dominio del remitente es <b>exactamente</b> el de la empresa: andes.com.ec.' },
  { id: 's2', targetId: 'saludo', pantalla: 'n1', texto: 'Te llama <b>por tu nombre</b> y menciona un período y un plazo concretos.' },
  { id: 's3', texto: '<b>No pide credenciales</b> ni datos: solo avisa dónde está la información.' },
  { id: 's4', targetId: 'canal', pantalla: 'n1', texto: 'Ofrece un <b>canal alterno verificable</b> (la extensión 214).' },
  { id: 's5', targetId: 'portal', pantalla: 'n1', texto: 'El portal está en el <b>dominio corporativo</b> y con conexión segura.' },
]
const RULE =
  'Regla de oro: no todo correo es una trampa. Lo que distingue a uno legítimo es que <b>no te pide tu clave y su dominio es el real</b>. Aun así, entra al portal escribiendo tú la dirección: es la costumbre que te protege siempre.'

const RESUMEN = 'Talento Humano avisa que tu rol de pagos de julio ya está en el portal.'

const CONTEXTO = (
  <>
    <p>
      Trabajas en <strong>Corporación Andes</strong>. Todos los meses Talento Humano publica el rol
      de pagos en el portal del colaborador y avisa por correo.
    </p>
    <p>
      Este mes trabajaste horas extra y quieres confirmar que estén incluidas antes de que cierre
      el plazo de reclamos.
    </p>
  </>
)

function RolDePagos() {
  return (
    <StoryEscenario
      escenarioId="phishing/rol-de-pagos"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      accionesCorreo={ACCIONES_BARRA}
      senales={SENALES}
      rule={RULE}
      restartLabel="↻ Repetir el escenario"
    />
  )
}

export default RolDePagos
