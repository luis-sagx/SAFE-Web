import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'

const CORREO: ScreenView = {
  kind: 'mail',
  from: 'Soporte TI · Corporación Andes',
  address: 'soporte-ti@andes-ec.net',
  to: 'mí',
  subject: 'Tu contraseña caduca hoy · acción requerida',
  date: 'hoy 16:05',
  body: `
    <p>Hola,</p>
    <p>
      Tu contraseña de correo institucional <b>caduca hoy a las 18:00</b>. Si no la renuevas,
      perderás el acceso a tu buzón y tendrás que abrir un ticket con Sistemas para
      recuperarlo.
    </p>
    <p><a class="cta" href="#">Mantener mi contraseña actual</a></p>
    <p class="fine">
      Departamento de Tecnología · Corporación Andes<br />
      Correo generado automáticamente por el servidor de identidad.
    </p>
  `,
}

const PAGINA: ScreenView = {
  kind: 'web',
  url: 'https://correo.andes-ec.net/owa/login',
  secure: true,
  brand: 'Corporación Andes',
  title: 'Inicia sesión para continuar',
  subtitle: 'Confirma tu contraseña actual para mantenerla vigente 90 días más.',
  fields: [
    { label: 'Correo institucional', placeholder: 'nombre.apellido@andes.com.ec' },
    { label: 'Contraseña actual', placeholder: '••••••••' },
  ],
  button: 'Mantener contraseña',
}

const STORY: Story<ScreenNode> = {
  n1: {
    kind: 'scene',
    view: CORREO,
    choices: [
      { label: 'Hacer clic en el botón para no perder el acceso.', goto: 'n2' },
      {
        label: 'Escribir a Soporte TI usando el contacto del directorio interno para confirmar.',
        goto: 'e_confirma',
      },
      { label: 'Reenviar el correo a mis compañeros para avisarles del plazo.', goto: 'n1b' },
    ],
  },
  n1b: {
    kind: 'scene',
    view: CORREO,
    choices: [
      { label: 'Ahora sí, entrar al enlace y renovar mi contraseña.', goto: 'n2' },
      { label: 'Revisar el dominio del remitente antes de hacer nada más.', goto: 'e_remitente' },
    ],
  },
  n2: {
    kind: 'scene',
    view: PAGINA,
    choices: [
      { label: 'La página es igual a la de siempre: escribo mi contraseña.', goto: 'e_clave' },
      {
        label: 'Comparar la dirección con la del correo institucional real.',
        goto: 'e_remitente',
      },
    ],
  },
  e_clave: {
    kind: 'bad',
    view: PAGINA,
    verdict: 'Caíste en la trampa',
    outcome:
      'La página era una copia alojada en andes-ec.net. Con tu contraseña entraron a tu buzón y desde ahí escribieron a contabilidad pidiendo una transferencia a tu nombre.',
  },
  e_remitente: {
    kind: 'good',
    view: PAGINA,
    verdict: 'No caíste · comparaste el dominio',
    outcome:
      'El dominio de la empresa es andes.com.ec y el del correo y la página era andes-ec.net. Cerraste todo y avisaste a Sistemas: era una campaña dirigida a varias personas del área.',
  },
  e_confirma: {
    kind: 'good',
    view: CORREO,
    verdict: 'No caíste · verificaste por el canal interno',
    outcome:
      'Soporte TI respondió que ellos no enviaron nada y que las contraseñas nunca se renuevan por enlace. Bloquearon el remitente para toda la empresa.',
  },
}

const SIGNALS = [
  'El dominio del remitente es <b>andes-ec.net</b>, parecido al real <b>andes.com.ec</b>.',
  'Tiene <b>candado y https</b>: la conexión segura no dice nada de quién está del otro lado.',
  'Amenaza con <b>perder el acceso hoy mismo</b> para que actúes sin pensar.',
  'Pide escribir tu <b>contraseña actual</b> en una página abierta desde un correo.',
  'No te llama por tu nombre ni menciona ningún dato tuyo.',
]
const RULE =
  'Regla de oro: el candado verde no significa que el sitio sea legítimo, solo que la conexión va cifrada. <b>Lee el dominio completo</b> y cambia tus contraseñas entrando por el sistema de la empresa, nunca desde un enlace.'

const RESUMEN = 'Un correo de "Soporte TI" avisa que tu contraseña caduca hoy a las 18:00.'

const CONTEXTO = (
  <>
    <p>
      Trabajas en <strong>Corporación Andes</strong>. Tu correo institucional termina en{' '}
      <strong>@andes.com.ec</strong> y sí has recibido antes avisos de Sistemas por cambios de
      contraseña.
    </p>
    <p>
      Son las cuatro de la tarde, estás cerrando pendientes, y llega un mensaje con un plazo que
      vence en dos horas.
    </p>
  </>
)

function ClaveCaducada() {
  return (
    <StoryEscenario
      escenarioId="phishing/clave-caducada"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      signalsTitle="Las señales de este correo"
      signals={SIGNALS}
      rule={RULE}
      restartLabel="↻ Repetir el escenario"
    />
  )
}

export default ClaveCaducada
