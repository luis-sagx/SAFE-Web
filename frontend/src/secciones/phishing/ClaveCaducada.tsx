import { Building2, Landmark, Newspaper } from 'lucide-react'
import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { MarcadorNavegador } from '../../components/ui/Navegador'
import { ACCIONES_BARRA, finalesDeBarra } from './barraDeCorreo'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'

const URL_FALSA = 'https://correo.andes-ec.net/owa/login'

const CORREO: ScreenView = {
  kind: 'mail',
  from: 'Soporte TI · Corporación Andes',
  address: 'soporte-ti@andes-ec.net',
  senalDireccion: 'remitente',
  label: 'Externo',
  senalEtiqueta: 'externo',
  subject: 'Tu contraseña caduca hoy · acción requerida',
  date: 'hoy 16:05',
  body: `
    <p><span data-signal="saludo">Hola,</span></p>
    <p>
      Tu contraseña de correo institucional <mark class="marca" data-signal="plazo">caduca hoy a las 18:00</mark>. Si no la renuevas,
      perderás el acceso a tu buzón y tendrás que abrir un ticket con Sistemas para
      recuperarlo.
    </p>
    <p><a class="cta" href="${URL_FALSA}" data-hotspot-goto="n2" data-hotspot-label="Pulsó &quot;Renovar mi contraseña ahora&quot; en el correo">Renovar mi contraseña ahora</a></p>
  `,
  footer: `
    <p>Departamento de Tecnología · Corporación Andes<br />
      Correo generado automáticamente por el servidor de identidad.</p>
  `,
}

const PAGINA: ScreenView = {
  kind: 'web',
  url: URL_FALSA,
  secure: true,
  senalUrl: 'url',
  brand: 'Corporación Andes',
  title: 'Inicia sesión para continuar',
  subtitle: 'Confirma tu contraseña actual para renovarla por 90 días más.',
  fields: [
    { label: 'Correo institucional', placeholder: '', valor: 'correo' },
    {
      label: 'Contraseña actual',
      placeholder: '••••••••',
      senal: 'campo-clave',
    },
  ],
  button: 'Mantener contraseña',
  botonGoto: 'e_clave',
  botonLabel: 'Escribió su contraseña en la página del correo',
  cerrarGoto: 'e_remitente',
  cerrarLabel: 'Cerró la página sin escribir nada',
}

const INTRANET: ScreenView = {
  kind: 'web',
  url: 'https://intranet.andes.com.ec/directorio/soporte-ti',
  secure: true,
  senalUrl: 'url-real',
  brand: 'Corporación Andes',
  title: 'Directorio interno',
  subtitle: 'Soporte TI · Departamento de Tecnología',
  datos: [
    { etiqueta: 'Correo', valor: 'soporte.ti@andes.com.ec', senal: 'correo-real' },
    { etiqueta: 'Extensión', valor: '2140' },
    { etiqueta: 'Horario', valor: 'Lunes a viernes, de 08:00 a 18:00' },
  ],
  fields: [],
  button: '',
  footer: 'Soporte TI nunca solicita contraseñas por correo ni por teléfono.',
  cerrarGoto: 'e_confirma',
  cerrarLabel: 'Consultó el directorio interno y cerró la pestaña',
}

const STORY: Story<ScreenNode> = {
  // Responder, reenviar, eliminar y marcar como spam.
  ...finalesDeBarra('fraude', CORREO),
  n1: { kind: 'scene', view: CORREO },
  n2: { kind: 'scene', view: PAGINA },
  n3: { kind: 'scene', view: INTRANET },
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

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'remitente',
    pantalla: 'n1',
    texto: 'El dominio del remitente es <b>andes-ec.net</b>, parecido al real <b>andes.com.ec</b>.',
  },
  {
    id: 's2',
    targetId: 'url',
    pantalla: 'n2',
    texto:
      'Tiene <b>candado y https</b>: la conexión segura no dice nada de quién está del otro lado.',
  },
  {
    id: 's3',
    targetId: 'plazo',
    pantalla: 'n1',
    texto: 'Amenaza con <b>perder el acceso hoy mismo</b> para que actúes sin pensar.',
  },
  {
    id: 's4',
    targetId: 'campo-clave',
    pantalla: 'n2',
    texto: 'Pide escribir tu <b>contraseña actual</b> en una página abierta desde un correo.',
  },
  {
    id: 's5',
    targetId: 'saludo',
    pantalla: 'n1',
    texto: 'No te llama por tu nombre ni menciona ningún dato tuyo.',
  },
]
/// La intranet es la vía de verificación que no pasa por el correo: abrirla por
/// cuenta propia es lo que aquí equivale a "entrar al portal escribiendo tú la
/// dirección". Los otros dos marcadores son sitios de siempre, para que el
/// bueno no sea el único pulsable y se delate.
const MARCADORES: MarcadorNavegador[] = [
  { Icono: Landmark, texto: 'Banco del Litoral' },
  {
    Icono: Building2,
    texto: 'Intranet Andes',
    goto: 'n3',
    label: 'Abrió la intranet para buscar el contacto real de Soporte TI',
  },
  { Icono: Newspaper, texto: 'El Comercio' },
]

const INSTRUCCION = (
  <>
    <p className="text-lg leading-relaxed text-body">
      Actúa sobre la ventana como lo harías frente a tu correo de verdad: puedes usar{' '}
      <strong>cualquier parte de ella</strong>, incluidos los marcadores. Antes de tocar un enlace,
      mantén el cursor encima para ver a dónde lleva.
    </p>
    <p className="text-base leading-relaxed text-body">
      Lo primero que hagas cierra el escenario y te muestra en qué terminaba. Cambiar de pestaña no
      decide nada.
    </p>
  </>
)

const PISTA = (
  <p>
    Tienes cuatro caminos posibles: hacer lo que el correo pide, contestarle, decidir qué hacer con
    el mensaje desde la barra del cliente, o dejarlo de lado y buscar a Soporte TI por tu cuenta en
    la intranet de la empresa. Cuál de ellos es el acertado es justamente lo que decides tú.
  </p>
)

const SENAL_REAL: Senal = {
  id: 's6',
  targetId: 'correo-real',
  pantalla: 'n3',
  texto:
    'Así se escribe Soporte TI de verdad: <b>soporte.ti@andes.com.ec</b>. El del correo era <b>soporte-ti@andes-ec.net</b> — otro dominio, aunque se parezca.',
}

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
      accionesCorreo={ACCIONES_BARRA}
      marcadores={MARCADORES}
      instruccion={INSTRUCCION}
      pista={PISTA}
      dominioCorreo="andes.com.ec"
      senales={[...SENALES, SENAL_REAL]}
      rule={RULE}
      reloj={{ hora: '16:12' }}
      restartLabel="↻ Repetir el escenario"
    />
  )
}

export default ClaveCaducada
