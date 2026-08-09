import { Newspaper, ShoppingBag, Store } from 'lucide-react'
import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { MarcadorNavegador } from '../../components/ui/Navegador'
import { ACCIONES_BARRA, finalesDeBarra } from './barraDeCorreo'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'

/**
 * El aviso que sí era de verdad.
 *
 * Cierra el módulo con la lección que le falta a los otros siete: desconfiar de
 * todo también se paga. El correo no trae enlace a propósito —dice que entres
 * tú al sitio— así que la única forma de actuar bien es abrirlo por los
 * marcadores, que es exactamente el hábito que se quiere dejar instalado.
 *
 * Y el acierto completo no termina en la tienda: la contraseña filtrada abre
 * todas las puertas donde se repitió, así que el escenario obliga a dar ese
 * segundo paso.
 */

const CORREO: ScreenView = {
  kind: 'mail',
  from: 'TiendaExpress',
  address: 'seguridad@tiendaexpress.com.ec',
  senalDireccion: 'remitente',
  subject: 'Aviso importante de seguridad',
  date: 'hoy 08:15',
  body: `
    <p>Estimado cliente:</p>
    <p>
      El pasado 2 de agosto detectamos un <b>incidente de seguridad</b> que expuso los correos,
      teléfonos e historial de pedidos de un grupo de clientes, incluido el suyo.
    </p>
    <p>
      <mark class="marca" data-signal="alcance">No se expusieron datos de tarjetas ni
      contraseñas.</mark> Por precaución, le recomendamos
      <mark class="marca" data-signal="sin-enlace">cambiar su contraseña ingresando usted mismo a
      tiendaexpress.com.ec</mark> — no hace falta ningún enlace para esto, y por eso este correo no
      trae ninguno.
    </p>
    <p class="fine">
      TiendaExpress · Seguridad de la información
    </p>
  `,
}

const SITIO_OFICIAL: ScreenView = {
  kind: 'web',
  url: 'https://www.tiendaexpress.com.ec/mi-cuenta/seguridad',
  secure: true,
  senalUrl: 'dominio-real',
  brand: 'TiendaExpress',
  title: 'Cambiar contraseña',
  subtitle: 'Elige una contraseña nueva para tu cuenta.',
  fields: [
    { label: 'Contraseña actual', placeholder: '••••••••' },
    { label: 'Contraseña nueva', placeholder: '••••••••' },
  ],
  button: 'Guardar contraseña',
  botonGoto: 'n3',
  botonLabel: 'Cambió su contraseña en el sitio real de TiendaExpress',
  cerrarGoto: 'n1',
  cerrarLabel: 'Entró al sitio real, no cambió nada y volvió al correo',
}

/// El segundo paso, que es donde este escenario se separa de "ya cambié la
/// clave": la misma contraseña estaba repetida en otros sitios, y ahí sigue.
const REPETIDA: ScreenView = {
  kind: 'web',
  url: 'https://www.tiendaexpress.com.ec/mi-cuenta/seguridad',
  secure: true,
  brand: 'TiendaExpress',
  title: 'Contraseña actualizada',
  subtitle:
    'Tu navegador tiene guardada esa misma contraseña en otros dos sitios: tu correo personal y tu red social.',
  fields: [],
  button: 'Cambiarla también en esos dos sitios',
  botonGoto: 'e_todos_lados',
  botonLabel: 'Cambió también la contraseña repetida en los otros sitios',
  // La excepción a la regla del issue #24, y a propósito: aquí cerrar llega
  // *después* de haber cambiado la contraseña, que sí fue una decisión y ya
  // está tomada. Lo que se registra no es el cierre sino haberse quedado en
  // un solo sitio, que es lo que la corrida tiene que poder distinguir de
  // haberla cambiado en todos.
  cerrarGoto: 'e_una_tienda',
  cerrarLabel: 'Dejó la misma contraseña en los otros sitios',
}

const STORY: Story<ScreenNode> = {
  // Responder, reenviar, eliminar y marcar como spam. Aquí eliminar y
  // marcar como spam son un fallo: el correo era auténtico.
  ...finalesDeBarra('legitimo', CORREO),
  n1: { kind: 'scene', view: CORREO },
  n2: { kind: 'scene', view: SITIO_OFICIAL },
  n3: { kind: 'scene', view: REPETIDA },
  e_una_tienda: {
    kind: 'partial',
    view: REPETIDA,
    verdict: 'Bien encaminado, pero incompleto',
    outcome:
      'Cambiaste la clave en TiendaExpress entrando tú directamente, lo cual estuvo bien. Pero usabas esa misma contraseña en tu correo personal, y ahí quedó expuesta igual: al que tiene la lista filtrada le basta probarla.',
  },
  e_todos_lados: {
    kind: 'good',
    view: REPETIDA,
    verdict: 'Correcto · reaccionaste bien',
    outcome:
      'Cambiaste la contraseña entrando tú mismo al sitio, y además la cambiaste en todos los demás sitios donde la habías repetido. La filtración dejó de ser una puerta abierta.',
  },
}

const MARCADORES: MarcadorNavegador[] = [
  {
    Icono: ShoppingBag,
    texto: 'TiendaExpress',
    goto: 'n2',
    label: 'Entró a TiendaExpress por su cuenta, sin enlaces',
  },
  { Icono: Store, texto: 'Mercado Andino' },
  { Icono: Newspaper, texto: 'Diario Andino' },
]

const INSTRUCCION = (
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

const PISTA = (
  <p>
    Este correo no trae ningún enlace que seguir. Puedes deshacerte de él con la barra del cliente,
    contestarlo, o entrar por tu cuenta al sitio de la tienda desde los marcadores. Si es de fiar o
    no, eso lo decides tú.
  </p>
)

const SENALES: Senal[] = [
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
      'La dirección es del <b>dominio real de la tienda</b>, el mismo donde compras, sin palabras añadidas ni terminaciones raras.',
  },
  {
    id: 's4',
    pantalla: 'n2',
    targetId: 'dominio-real',
    texto:
      'Al entrar por los marcadores llegas al <b>sitio verdadero, con candado</b>. Es el hábito que sirve siempre: el aviso puede ser falso, pero la dirección que escribes tú no.',
  },
]

const RULE =
  'Regla de oro: cambia la clave entrando tú al sitio, nunca por el enlace del correo. Y no repitas contraseñas — una filtración en una tienda abre todas las puertas que compartan esa clave. Desconfiar de todo tampoco es criterio: descartar un aviso real cuesta caro.'

const RESUMEN = 'TiendaExpress avisa que un incidente de seguridad expuso tus datos.'

const CONTEXTO: Contexto = {
  antes: (
    <>
      Compras seguido en <strong>TiendaExpress</strong> y tienes cuenta con ellos desde hace
      tiempo.
    </>
  ),
  ahora: (
    <>
      Al revisar tu bandeja aparece un correo de la tienda: hubo un{' '}
      <strong>incidente de seguridad</strong>.
    </>
  ),
  detalle:
    'No te pide nada raro: solo cuenta qué pasó y sugiere que cambies tu contraseña por tu cuenta.',
}

function AvisoFiltracion() {
  return (
    <StoryEscenario
      escenarioId="phishing/aviso-filtracion"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      accionesCorreo={ACCIONES_BARRA}
      marcadores={MARCADORES}
      instruccion={INSTRUCCION}
      pista={PISTA}
      senales={SENALES}
      rule={RULE}
      restartLabel="↻ Repetir el escenario"
    />
  )
}

export default AvisoFiltracion
