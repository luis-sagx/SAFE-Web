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
    <p class="fine">Puede usar el marcador guardado de la tienda para llegar a su cuenta.</p>
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
  botonGoto: 'e_contrasena_cambiada',
  botonLabel: 'Cambió su contraseña en el sitio real de TiendaExpress',
  cerrarGoto: 'n1',
  cerrarLabel: 'Entró al sitio real, no cambió nada y volvió al correo',
}

const STORY: Story<ScreenNode> = {
  // Responder, reenviar, eliminar y marcar como spam. Aquí eliminar y
  // marcar como spam son un fallo: el correo era auténtico.
  ...createToolbarEndings('legitimo', EMAIL),
  n1: { kind: 'scene', view: EMAIL },
  n2: { kind: 'scene', view: SITE_OFFICIAL },
  e_contrasena_cambiada: {
    kind: 'good',
    view: SITE_OFFICIAL,
    verdict: 'Correcto · reaccionaste bien',
    outcome: 'Cambiaste la contraseña entrando tú mismo al sitio, sin seguir enlaces del correo. Fue un aviso legítimo.',
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
    contestarlo, o entrar por tu cuenta usando el marcador habitual de la tienda. Si es de fiar o
    no, eso lo decides tú.
  </p>
)

const SIGNALS: Signal[] = [
  {
    id: 's1',
    pantalla: 'n1',
    targetId: 'sin-enlace',
    texto: '<b>No trae ningún enlace</b>: te manda a entrar tú mismo al sitio. El phishing necesita justo lo contrario.',
  },
  {
    id: 's2',
    pantalla: 'n1',
    targetId: 'alcance',
    texto: 'Explica <b>qué se expuso y qué no</b>, con fecha concreta, en vez de generar pánico genérico.',
  },
  {
    id: 's3',
    pantalla: 'n1',
    targetId: 'remitente',
    texto: 'El remitente es <b>la misma dirección de siempre</b>, sin palabras ni terminaciones raras al final.',
  },
  {
    id: 's4',
    pantalla: 'n2',
    targetId: 'dominio-real',
    texto: 'Al entrar por tus marcadores llegas al <b>sitio verdadero</b>. El aviso puede ser falso, tu marcador no.',
  },
]

const RULE =
  'Regla de oro: cambia la clave entrando tú al sitio, nunca por el enlace del correo. Desconfiar de todo tampoco es criterio: descartar un aviso real también cuesta caro.'

const SUMMARY = 'TiendaExpress avisa que un incidente de seguridad expuso tus datos.'

export const CONTEXT: Context = {
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
