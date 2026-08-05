import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import { ACCIONES_BARRA, finalesDeBarra } from './barraDeCorreo'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'

const CORREO: ScreenView = {
  kind: 'mail',
  from: 'Banco del Litoral · Seguridad',
  address: 'alertas@bancodellitoral.com.ec',
  senalDireccion: 'remitente',
  label: 'Externo',
  senalEtiqueta: 'externo',
  subject: 'Alerta de seguridad: nuevo inicio de sesión',
  date: 'hoy 21:47',
  body: `
    <p>Estimado cliente:</p>
    <p>
      Detectamos un inicio de sesión en su cuenta desde <b>Bogotá, Colombia</b>, un dispositivo que
      no reconocemos.
    </p>
    <p>Si fue usted, puede ignorar este mensaje. Si no, actúe de inmediato:</p>
    <p><a class="cta" href="#">No fui yo — proteger mi cuenta</a></p>
    <p class="fine">
      Banco del Litoral · Departamento de Seguridad
    </p>
  `,
}

const PAGINA_CLAVE: ScreenView = {
  kind: 'web',
  url: 'bancodellitoral.com.ec.seguridad-alertas.com',
  secure: true,
  senalUrl: 'url',
  brand: 'Banco del Litoral',
  title: 'Verificación de seguridad',
  subtitle: 'Confirme su contraseña para cerrar el acceso no reconocido.',
  fields: [{ label: 'Contraseña de banca en línea', placeholder: '••••••••', senal: 'campo-clave' }],
  button: 'Cerrar acceso no reconocido',
}

const PAGINA_OTP: ScreenView = {
  kind: 'web',
  url: 'bancodellitoral.com.ec.seguridad-alertas.com',
  secure: true,
  brand: 'Banco del Litoral',
  title: 'Un paso más',
  subtitle: 'Ingrese el código que le acabamos de enviar por SMS.',
  fields: [{ label: 'Código de verificación', placeholder: '000000' }],
  button: 'Confirmar y cerrar sesión',
}

const STORY: Story<ScreenNode> = {
  // Responder, reenviar, archivar, eliminar y marcar como spam.
  ...finalesDeBarra('fraude', CORREO),
  n1: {
    kind: 'scene',
    view: CORREO,
    choices: [
      { label: 'Hacer clic en "No fui yo — proteger mi cuenta".', goto: 'n2' },
      { label: 'Abrir la app del banco por mi cuenta y revisar los accesos ahí.', goto: 'e_app' },
    ],
  },
  n2: {
    kind: 'scene',
    view: PAGINA_CLAVE,
    choices: [
      { label: 'Escribir mi contraseña para cerrar el acceso no reconocido.', goto: 'n3' },
      {
        label: 'Leer la dirección de derecha a izquierda antes de escribir nada.',
        goto: 'e_dominio',
      },
    ],
  },
  n3: {
    kind: 'scene',
    view: PAGINA_OTP,
    choices: [
      { label: 'Escribir el código que llegó por SMS.', goto: 'e_otp' },
      { label: 'Detenerme: un sitio web no debería pedir un código de mi teléfono.', goto: 'e_detiene' },
    ],
  },
  e_otp: {
    kind: 'bad',
    view: PAGINA_OTP,
    verdict: 'Caíste en la trampa',
    outcome:
      'Mientras escribías el código, el atacante lo usaba en vivo para entrar a tu cuenta real. Cuando terminaste, tu cuenta ya estaba vacía.',
  },
  e_detiene: {
    kind: 'good',
    view: PAGINA_OTP,
    verdict: 'No caíste · te detuviste a tiempo',
    outcome:
      'Ya habías escrito la contraseña en el sitio falso, pero no llegaste a dar el código. Cambiaste la contraseña desde la app oficial antes de que la usaran.',
  },
  e_dominio: {
    kind: 'good',
    view: PAGINA_CLAVE,
    verdict: 'No caíste · leíste el dominio completo',
    outcome:
      'El dominio real es "seguridad-alertas.com" — bancodellitoral.com.ec es solo un subdominio dentro de esa trampa. Cerraste la página sin escribir nada.',
  },
  e_app: {
    kind: 'good',
    view: CORREO,
    verdict: 'No caíste · verificaste por la app',
    outcome:
      'Entraste a la app del banco por tu cuenta. No había ningún acceso desde Bogotá: el correo era falso.',
  },
}

const SENALES: Senal[] = [
  { id: 's1', texto: 'El botón "seguro" ("No fui yo") es la trampa: te lleva directo a pedir credenciales.' },
  { id: 's2', targetId: 'remitente', texto: 'El dominio real es <b>seguridad-alertas.com</b>; "bancodellitoral.com.ec" es apenas un subdominio.' },
  { id: 's3', targetId: 'campo-clave', texto: 'Pide el <b>código OTP dentro de una página web</b>, en vez de dentro de la app del banco.' },
  { id: 's4', texto: 'El correo está impecable — sin errores — porque la trampa no está en la redacción.' },
]
const RULE =
  'Regla de oro: lee el dominio de derecha a izquierda; lo real es lo que está inmediatamente antes de la primera barra. Ninguna alerta se atiende desde el enlace de la propia alerta.'

const RESUMEN = 'Un correo avisa que alguien inició sesión en tu cuenta desde Bogotá.'

const CONTEXTO = (
  <>
    <p>
      Sos cliente del <strong>Banco del Litoral</strong>. Nunca viajaste a Colombia y no reconocés
      ningún acceso reciente desde ahí.
    </p>
    <p>Son casi las diez de la noche cuando te llega la alerta.</p>
  </>
)

function SesionBogota() {
  return (
    <StoryEscenario
      escenarioId="phishing/sesion-bogota"
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

export default SesionBogota
