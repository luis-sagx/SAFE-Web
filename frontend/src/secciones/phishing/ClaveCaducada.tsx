import { Building2, Landmark, Newspaper } from 'lucide-react'
import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
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
  menu: ['Correo', 'Calendario', 'Contactos', 'Ayuda'],
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
  // El aviso lo copia del sitio real, como copia el logotipo: un kit de
  // phishing no deja fuera la letra pequeña, y aquí además sirve de coartada.
  aviso:
    'Por seguridad, tu sesión se cerrará al terminar. Si no solicitaste esta renovación, comunícate con Soporte TI antes de continuar.',
  footer: 'Corporación Andes · Todos los derechos reservados',
  pie: ['Aviso de privacidad', 'Términos de uso', 'Soporte'],
  button: 'Mantener contraseña',
  botonGoto: 'e_clave',
  botonLabel: 'Escribió su contraseña en la página del correo',
  // Cerrarla devuelve al correo. Irse de una página que da mala espina no es
  // todavía una decisión sobre el mensaje (issue #24).
  cerrarGoto: 'n1',
  cerrarLabel: 'Cerró la página falsa y volvió al correo',
}

const INTRANET: ScreenView = {
  kind: 'web',
  url: 'https://intranet.andes.com.ec/directorio/soporte-ti',
  secure: true,
  senalUrl: 'url-real',
  brand: 'Corporación Andes',
  menu: ['Directorio', 'Solicitudes', 'Noticias', 'Ayuda'],
  title: 'Directorio interno',
  subtitle: 'Soporte TI · Departamento de Tecnología',
  datos: [
    { etiqueta: 'Correo', valor: 'soporte.ti@andes.com.ec', senal: 'correo-real' },
    { etiqueta: 'Extensión', valor: '2140' },
    { etiqueta: 'Horario', valor: 'Lunes a viernes, de 08:00 a 18:00' },
    { etiqueta: 'Responsable', valor: 'Ing. Marcela Bustos · Jefa de Soporte' },
    { etiqueta: 'Oficina', valor: 'Edificio A, piso 3' },
  ],
  fields: [],
  button: '',
  aviso:
    'Soporte TI nunca solicita contraseñas por correo ni por teléfono. Si recibes un mensaje que las pida, repórtalo a la extensión 2140.',
  footer: 'Corporación Andes · Todos los derechos reservados',
  pie: ['Aviso de privacidad', 'Términos de uso', 'Soporte'],
  cerrarGoto: 'n1',
  cerrarLabel: 'Consultó el directorio interno y volvió al correo',
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
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'remitente',
    pantalla: 'n1',
    texto:
      'La dirección del remitente termina en <b>andes-ec.net</b>, y la de tu empresa es <b>andes.com.ec</b>. De lejos se parecen, pero el final es distinto, y esa parte final es la que dice quién es el dueño: son dos direcciones de dos dueños distintos.',
  },
  {
    id: 's2',
    targetId: 'url',
    pantalla: 'n2',
    texto:
      'La página tiene <b>candado</b> y su dirección empieza por <b>https</b>. Eso solo significa que nadie puede espiar lo que escribes mientras viaja, no que la página sea de tu empresa. Una página falsa consigue ese candado gratis y en minutos.',
  },
  {
    id: 's3',
    targetId: 'plazo',
    pantalla: 'n1',
    texto:
      'Amenaza con <b>perder el acceso hoy mismo</b> para que actúes sin pensar y no te dé tiempo de preguntar en sistemas.',
  },
  {
    id: 's4',
    targetId: 'campo-clave',
    pantalla: 'n2',
    texto:
      'Te pide escribir tu <b>contraseña actual</b> en una página que abriste desde un correo. Tu empresa ya sabe cuál es tu cuenta: nunca necesita que le repitas la clave para renovarla.',
  },
  {
    id: 's5',
    targetId: 'saludo',
    pantalla: 'n1',
    texto:
      'No te llama por tu nombre ni menciona ningún dato tuyo: el mismo texto le sirve igual a cualquiera que lo reciba.',
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
      El escenario termina cuando decidas qué hacer con el mensaje, o si caes en lo que pide.
      Moverte por las pantallas no decide nada: puedes abrir una página, mirarla y cerrarla, y
      seguirás donde estabas.
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
    'Así se escribe Soporte TI de verdad: <b>soporte.ti@andes.com.ec</b>. El del correo era <b>soporte-ti@andes-ec.net</b>, otro dominio, aunque se parezca.',
}

const RULE =
  'Regla de oro: el candado verde no significa que el sitio sea legítimo, solo que la conexión va cifrada. <b>Lee el dominio completo</b> y cambia tus contraseñas entrando por el sistema de la empresa, nunca desde un enlace.'

const RESUMEN = 'Un correo de "Soporte TI" avisa que tu contraseña caduca hoy a las 18:00.'

const CONTEXTO: Contexto = {
  antes: (
    <>
      Trabajas en <strong>Corporación Andes</strong> y tu correo institucional termina en{' '}
      <strong>@andes.com.ec</strong>.
    </>
  ),
  ahora: (
    <>
      <strong>A las cuatro de la tarde</strong>, cerrando pendientes, llega un mensaje de Sistemas
      sobre tu contraseña, con un <strong>plazo que vence en dos horas</strong>.
    </>
  ),
  detalle: 'Sí has recibido antes avisos de Sistemas por cambios de contraseña.',
}

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
