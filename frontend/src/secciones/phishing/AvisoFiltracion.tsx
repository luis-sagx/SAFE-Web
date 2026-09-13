import { Newspaper, ShoppingBag, Store } from 'lucide-react'
import ScenarioStory, { type ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import { FOOTER_LINKS } from '../../components/ui/armazonSitio'
import type { BrowserBookmark } from '../../components/ui/Navegador'
import { ACTIONS_BAR, createToolbarEndings } from './barraDeCorreo'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Signal } from '../../components/ui/PanelVeredicto'
import securityNoticeImg from '../../assets/escenarios/phishing/aviso-seguridad.webp'

// Cierra el módulo con la lección que falta a los otros siete: desconfiar de
// todo también se paga. Sin enlace a propósito, para forzar el hábito de entrar por marcadores.

const EMAIL: ScreenView = {
  kind: 'mail',
  from: 'TiendaExpress',
  address: 'seguridad@tiendaexpress.com.ec',
  senalDireccion: 'remitente',
  subject: 'Aviso importante de seguridad',
  date: 'hoy 08:15',
  marca: {
    nombre: 'TiendaExpress',
    detalle: 'Seguridad de la información',
    icono: 'tienda',
    variante: 'seguridad',
  },
  body: `
    <p>Estimado(a) cliente:</p>
    <img class="mailHero" src="${securityNoticeImg}" alt="" />
    <p>
      Hace tres días detectamos un <b>incidente de seguridad</b> que expuso los correos,
      teléfonos e historial de pedidos de un grupo de clientes, incluido el suyo.
    </p>
    <p>
      <mark class="marca" data-signal="alcance">No se expusieron datos de tarjetas ni
      contraseñas.</mark> Por precaución, le recomendamos
      <mark class="marca" data-signal="sin-enlace">cambiar su contraseña ingresando usted mismo a
      tiendaexpress.com.ec</mark>, no hace falta ningún enlace para esto, y por eso este correo no
      trae ninguno.
    </p>
    <p class="fine">
      TiendaExpress · Seguridad de la información
    </p>
  `,
}

const SITE_OFFICIAL: ScreenView = {
  kind: 'web',
  url: 'https://www.tiendaexpress.com.ec/mi-cuenta/seguridad',
  secure: true,
  senalUrl: 'dominio-real',
  brand: 'TiendaExpress',
  menu: ['Inicio', 'Mis pedidos', 'Mi cuenta', 'Ayuda'],
  title: 'Cambiar contraseña',
  subtitle: 'Elige una contraseña nueva para tu cuenta.',
  fields: [
    { label: 'Contraseña actual', placeholder: '••••••••' },
    { label: 'Contraseña nueva', placeholder: '••••••••' },
  ],
  aviso:
    'Usa una contraseña que no tengas en ningún otro sitio. Nunca te pediremos la contraseña por correo ni por teléfono.',
  footer: 'TiendaExpress · Seguridad de la información',
  pie: FOOTER_LINKS,
  button: 'Guardar contraseña',
  botonGoto: 'n3',
  botonLabel: 'Cambió su contraseña en el sitio real de TiendaExpress',
  cerrarGoto: 'n1',
  cerrarLabel: 'Entró al sitio real, no cambió nada y volvió al correo',
}

/// El segundo paso, que es donde este escenario se separa de "ya cambié la
/// clave": la misma contraseña estaba repetida en otros sitios, y ahí sigue.
const REPEATED: ScreenView = {
  kind: 'web',
  url: 'https://www.tiendaexpress.com.ec/mi-cuenta/seguridad',
  secure: true,
  brand: 'TiendaExpress',
  menu: ['Inicio', 'Mis pedidos', 'Mi cuenta', 'Ayuda'],
  title: 'Contraseña actualizada',
  subtitle:
    'Tu navegador tiene guardada esa misma contraseña en otros dos sitios: tu correo personal y tu red social.',
  fields: [],
  aviso:
    'Reutilizar la misma contraseña es lo que convierte la filtración de una tienda en un problema en todas tus cuentas.',
  footer: 'TiendaExpress · Seguridad de la información',
  pie: FOOTER_LINKS,
  button: 'Cambiarla también en esos dos sitios',
  botonGoto: 'e_todos_lados',
  botonLabel: 'Cambió también la contraseña repetida en los otros sitios',
  // Excepción a la regla del issue #24: aquí cerrar llega después de ya haber
  // cambiado la contraseña, y registra haberse quedado en un solo sitio.
  cerrarGoto: 'e_una_tienda',
  cerrarLabel: 'Dejó la misma contraseña en los otros sitios',
}

const STORY: Story<ScreenNode> = {
  // Responder, reenviar, eliminar y marcar como spam. Aquí eliminar y
  // marcar como spam son un fallo: el correo era auténtico.
  ...createToolbarEndings('legitimo', EMAIL),
  n1: { kind: 'scene', view: EMAIL },
  n2: { kind: 'scene', view: SITE_OFFICIAL },
  n3: { kind: 'scene', view: REPEATED },
  e_una_tienda: {
    kind: 'partial',
    view: REPEATED,
    verdict: 'Bien encaminado, pero incompleto',
    outcome:
      'Cambiaste la clave en TiendaExpress entrando tú directamente, lo cual estuvo bien. Pero usabas esa misma contraseña en tu correo personal, y ahí quedó expuesta igual: al que tiene la lista filtrada le basta probarla.',
  },
  e_todos_lados: {
    kind: 'good',
    view: REPEATED,
    verdict: 'Correcto · reaccionaste bien',
    outcome:
      'Cambiaste la contraseña entrando tú mismo al sitio, y además la cambiaste en todos los demás sitios donde la habías repetido. La filtración dejó de ser una puerta abierta.',
  },
}

const MARKERS: BrowserBookmark[] = [
  {
    Icono: ShoppingBag,
    texto: 'TiendaExpress',
    goto: 'n2',
    label: 'Entró a TiendaExpress por su cuenta, sin enlaces',
  },
  { Icono: Store, texto: 'Mercado Andino' },
  { Icono: Newspaper, texto: 'Diario Andino' },
]

const INSTRUCTION = (
  <>
    <p className="text-lg leading-relaxed text-body">
      Actúa sobre la ventana como lo harías frente a tu correo de verdad: puedes usar{' '}
      <strong>cualquier parte de ella</strong>, incluidos los marcadores del navegador.
    </p>
    <p className="text-base leading-relaxed text-body">
      Cuidado: no todos los correos del curso son falsos. Aquí lo que se juzga es lo que decidas
      hacer, y descartar también es una decisión. Cambiar de pestaña no decide nada.
    </p>
  </>
)

const CLUE = (
  <p>
    Este correo no trae ningún enlace que seguir. Puedes deshacerte de él con la barra del cliente,
    contestarlo, o entrar por tu cuenta al sitio de la tienda desde los marcadores. Si es de fiar o
    no, eso lo decides tú.
  </p>
)

const SIGNALS: Signal[] = [
  {
    id: 's1',
    pantalla: 'n1',
    targetId: 'sin-enlace',
    texto:
      'No pide tu contraseña ni ningún dato, y <b>no trae enlace</b>: te manda a entrar tú mismo al sitio. Un correo de phishing necesita justo lo contrario, que uses su enlace.',
  },
  {
    id: 's2',
    pantalla: 'n1',
    targetId: 'alcance',
    texto:
      'Explica <b>qué se expuso y qué no</b>, con fecha concreta, en vez de generar pánico genérico. El engaño rara vez se limita a sí mismo.',
  },
  {
    id: 's3',
    pantalla: 'n1',
    targetId: 'remitente',
    texto:
      'La dirección del remitente es <b>la misma de la tienda donde compras</b>, sin palabras añadidas ni terminaciones raras al final. Ese final es donde se nota una imitación, y aquí coincide.',
  },
  {
    id: 's4',
    pantalla: 'n2',
    targetId: 'dominio-real',
    texto:
      'Al entrar por tus marcadores llegas al <b>sitio verdadero</b>, no al que te indique un mensaje. Es el hábito que sirve siempre: el aviso puede ser falso, la dirección que guardaste tú no.',
  },
]

const RULE =
  'Regla de oro: cambia la clave entrando tú al sitio, nunca por el enlace del correo. Y no repitas contraseñas: una filtración en una tienda abre todas las puertas que compartan esa clave. Desconfiar de todo tampoco es criterio: descartar un aviso real cuesta caro.'

const SUMMARY = 'TiendaExpress avisa que un incidente de seguridad expuso tus datos.'

const CONTEXT: Context = {
  antes: (
    <>
      Compras seguido en <strong>TiendaExpress</strong> y tienes cuenta con ellos desde hace tiempo.
    </>
  ),
  ahora: (
    <>
      Al revisar tu bandeja aparece un correo de la tienda: hubo un{' '}
      <strong>incidente de seguridad</strong>.
    </>
  ),
}

function DataLeakNotice() {
  return (
    <ScenarioStory
      escenarioId="phishing/aviso-filtracion"
      resumen={SUMMARY}
      contexto={CONTEXT}
      story={STORY}
      accionesCorreo={ACTIONS_BAR}
      identidad={['clave']}
      marcadores={MARKERS}
      instruccion={INSTRUCTION}
      pista={CLUE}
      senales={SIGNALS}
      rule={RULE}
      restartLabel="↻ Repetir el escenario"
    />
  )
}

export default DataLeakNotice
