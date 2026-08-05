import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import { ACCIONES_BARRA, finalesDeBarra } from './barraDeCorreo'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'

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
      No se expusieron datos de tarjetas ni contraseñas. Por precaución, le recomendamos
      <b> cambiar su contraseña</b> ingresando directamente a tiendaexpress.com.ec — no hace falta
      ningún enlace para esto.
    </p>
    <p class="fine">
      TiendaExpress · Seguridad de la información
    </p>
  `,
}

const SITIO_OFICIAL: ScreenView = {
  kind: 'web',
  url: 'tiendaexpress.com.ec/mi-cuenta',
  secure: true,
  brand: 'TiendaExpress',
  title: 'Cambiar contraseña',
  subtitle: 'Elegí una contraseña nueva para tu cuenta.',
  fields: [
    { label: 'Contraseña actual', placeholder: '••••••••' },
    { label: 'Contraseña nueva', placeholder: '••••••••' },
  ],
  button: 'Guardar contraseña',
}

const STORY: Story<ScreenNode> = {
  // Responder, reenviar, archivar, eliminar y marcar como spam.
  ...finalesDeBarra('legitimo', CORREO),
  n1: {
    kind: 'scene',
    view: CORREO,
    choices: [
      { label: 'Ignorarlo: parece phishing, no voy a hacer nada.', goto: 'e_ignora' },
      {
        label: 'Entrar a tiendaexpress.com.ec por mi cuenta y cambiar la clave solo ahí.',
        goto: 'e_una_tienda',
      },
      {
        label: 'Entrar por mi cuenta y cambiar la clave ahí y en todo sitio donde uso la misma.',
        goto: 'e_todos_lados',
      },
    ],
  },
  e_ignora: {
    kind: 'bad',
    view: CORREO,
    verdict: 'Descartaste un aviso real',
    outcome:
      'El aviso era real: la filtración de TiendaExpress salió meses después en las noticias. Con tu correo y tu historial de pedidos ya circulando, empezaron a llegarte cobros dirigidos que usaban esos mismos datos.',
  },
  e_una_tienda: {
    kind: 'partial',
    view: SITIO_OFICIAL,
    verdict: 'Bien encaminado, pero incompleto',
    outcome:
      'Cambiaste la clave en TiendaExpress entrando tú directamente, lo cual estuvo bien. Pero usabas esa misma contraseña en tu correo personal, y ahí quedó expuesta igual.',
  },
  e_todos_lados: {
    kind: 'good',
    view: SITIO_OFICIAL,
    verdict: 'Correcto · reaccionaste bien',
    outcome:
      'Cambiaste la contraseña entrando tú mismo al sitio, y además la cambiaste en todos los demás sitios donde la habías repetido. La filtración dejó de ser una puerta abierta.',
  },
}

const SENALES: Senal[] = [
  { id: 's1', texto: 'No pide tu contraseña ni ningún dato: pide que <b>vos la cambies</b>, no te la solicita.' },
  { id: 's2', texto: 'Explica <b>qué se expuso y qué no</b>, en vez de generar pánico genérico.' },
  { id: 's3', targetId: 'remitente', pantalla: 'n1', texto: 'El enlace que menciona apunta al <b>dominio real</b>, y el cambio se puede hacer sin tocar ningún enlace.' },
  { id: 's4', texto: 'Un aviso así, buscado en internet, <b>aparece en noticias reales</b> de seguridad.' },
]
const RULE =
  'Regla de oro: cambiá la clave entrando vos al sitio, nunca por el enlace del correo. Y no repitas contraseñas — una filtración en una tienda abre todas las puertas que compartan esa clave.'

const RESUMEN = 'TiendaExpress avisa que un incidente de seguridad expuso tus datos.'

const CONTEXTO = (
  <>
    <p>
      Comprás seguido en <strong>TiendaExpress</strong>. Te llega un correo avisando que hubo un
      incidente de seguridad real.
    </p>
    <p>
      No es un correo pidiendo nada raro: solo te cuenta qué pasó y te sugiere cambiar tu
      contraseña por tu cuenta.
    </p>
  </>
)

function AvisoFiltracion() {
  return (
    <StoryEscenario
      escenarioId="phishing/aviso-filtracion"
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

export default AvisoFiltracion
