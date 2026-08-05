import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import { ACCIONES_BARRA, finalesDeBarra } from './barraDeCorreo'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'

// QR decorativo y fijo: no es escaneable de verdad, solo tiene que leerse como
// un código QR dentro del cuerpo del correo.
const QR_SVG = `
  <div style="text-align:center;margin:14px 0;">
    <svg width="120" height="120" viewBox="0 0 29 29" style="background:#fff;border:1px solid #ddd;padding:6px;">
      <rect width="29" height="29" fill="#fff"/>
      <g fill="#111">
        <rect x="0" y="0" width="7" height="7"/><rect x="1" y="1" width="5" height="5" fill="#fff"/><rect x="2" y="2" width="3" height="3"/>
        <rect x="22" y="0" width="7" height="7"/><rect x="23" y="1" width="5" height="5" fill="#fff"/><rect x="24" y="2" width="3" height="3"/>
        <rect x="0" y="22" width="7" height="7"/><rect x="1" y="23" width="5" height="5" fill="#fff"/><rect x="2" y="24" width="3" height="3"/>
        <rect x="9" y="1" width="2" height="2"/><rect x="13" y="1" width="2" height="2"/><rect x="17" y="3" width="2" height="2"/>
        <rect x="9" y="9" width="3" height="3"/><rect x="14" y="9" width="2" height="4"/><rect x="18" y="10" width="4" height="2"/>
        <rect x="9" y="14" width="4" height="2"/><rect x="16" y="14" width="2" height="6"/><rect x="20" y="15" width="3" height="3"/>
        <rect x="9" y="18" width="2" height="4"/><rect x="13" y="19" width="3" height="2"/><rect x="9" y="24" width="6" height="2"/>
        <rect x="18" y="20" width="4" height="4"/><rect x="24" y="9" width="2" height="6"/><rect x="24" y="18" width="4" height="2"/>
        <rect x="24" y="22" width="2" height="5"/>
      </g>
    </svg>
  </div>
`

const CORREO: ScreenView = {
  kind: 'mail',
  from: 'Banco del Litoral · Actualización de datos',
  address: 'notificaciones@bancodellitoral.com',
  subject: 'Actualice sus datos antes de que se limite su cuenta',
  date: 'hoy 09:10',
  label: 'Externo',
  body: `
    <p>Estimado cliente:</p>
    <p>
      Según nuestra política de actualización de datos, necesitamos que confirme su información
      antes de <b>72 horas</b>. Escanee el siguiente código con la cámara de su celular para
      continuar:
    </p>
    ${QR_SVG}
    <p class="fine">
      Banco del Litoral · Este es un mensaje automático.
    </p>
  `,
}

const PAGINA: ScreenView = {
  kind: 'web',
  url: 'litoral-actualiza.web.app',
  secure: false,
  brand: 'Banco del Litoral',
  title: 'Actualización de datos',
  subtitle: 'Confirme su información para evitar la limitación de su cuenta.',
  fields: [
    { label: 'Cédula', placeholder: '0000000000' },
    { label: 'Clave de acceso', placeholder: '••••••••' },
  ],
  button: 'Confirmar datos',
}

const STORY: Story<ScreenNode> = {
  // Responder, reenviar, archivar, eliminar y marcar como spam.
  ...finalesDeBarra('fraude', CORREO),
  n1: {
    kind: 'scene',
    view: CORREO,
    choices: [
      { label: 'Escanear el código y completar el formulario que abre.', goto: 'n2' },
      {
        label: 'Escanear, leer la vista previa del enlace antes de tocar nada más.',
        goto: 'e_preview',
      },
      { label: 'Ignorar el QR y hacer la actualización entrando directo a la app del banco.', goto: 'e_app' },
    ],
  },
  n2: {
    kind: 'scene',
    view: PAGINA,
    choices: [
      { label: 'Completar cédula y clave para evitar que limiten mi cuenta.', goto: 'e_datos' },
      { label: 'Notar que pide la clave de acceso y cerrar sin completar nada.', goto: 'e_cierra' },
    ],
  },
  e_datos: {
    kind: 'bad',
    view: PAGINA,
    verdict: 'Caíste en la trampa',
    outcome:
      'Entregaste tu cédula y tu clave en litoral-actualiza.web.app, un sitio que no es del banco. Con esos datos entraron a tu cuenta esa misma noche.',
  },
  e_cierra: {
    kind: 'good',
    view: PAGINA,
    verdict: 'No caíste · el formulario te delató',
    outcome:
      'Una actualización de datos real nunca pide tu clave de acceso. Cerraste la página antes de escribir nada.',
  },
  e_preview: {
    kind: 'good',
    view: CORREO,
    verdict: 'No caíste · leíste el enlace antes de tocarlo',
    outcome:
      'La vista previa mostraba litoral-actualiza.web.app, no un dominio del banco. No completaste el escaneo y reportaste el correo.',
  },
  e_app: {
    kind: 'good',
    view: CORREO,
    verdict: 'No caíste · entraste por tu cuenta',
    outcome:
      'Abriste la app del banco por tu cuenta. No había ninguna actualización de datos pendiente: el correo era falso.',
  },
}

const SIGNALS = [
  'Un <b>QR es un enlace que no puedes leer antes de escanearlo</b>: no hay texto que inspeccionar.',
  'El destino real es <b>litoral-actualiza.web.app</b>, sin el dominio del banco.',
  'El formulario pide la <b>clave de acceso</b>, algo que una actualización de datos nunca necesita.',
  'Mete <b>prisa</b> con un plazo de 72 horas.',
]
const RULE =
  'Regla de oro: al escanear un QR, primero <b>lee la vista previa de la URL</b> y recién ahí decide. Vale igual para los QR de correos, locales, surtidores y parquímetros.'

const RESUMEN = 'Un correo del banco pide escanear un QR para "actualizar tus datos".'

const CONTEXTO = (
  <>
    <p>
      Sos cliente del <strong>Banco del Litoral</strong>. Este mes el banco sí pidió, dentro de su
      app, que los clientes actualicen algunos datos.
    </p>
    <p>
      Ahora te llega un correo aparte, con un código QR grande y ningún enlace de texto que puedas
      revisar antes de escanear.
    </p>
  </>
)

function QuishingActualice() {
  return (
    <StoryEscenario
      escenarioId="phishing/quishing-actualice"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      accionesCorreo={ACCIONES_BARRA}
      signalsTitle="Las señales de este correo"
      signals={SIGNALS}
      rule={RULE}
      restartLabel="↻ Repetir el escenario"
    />
  )
}

export default QuishingActualice
