import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'

const CORREO: ScreenView = {
  kind: 'mail',
  from: 'SRI · Facturación Electrónica',
  address: 'notificaciones@sri-facturacion-ec.com',
  to: 'mí',
  subject: 'Factura electrónica pendiente de validación',
  date: 'hoy 08:42',
  label: 'Externo',
  body: `
    <p>Estimado contribuyente:</p>
    <p>
      Nuestro sistema detectó una <b>factura electrónica no validada</b> asociada a su RUC.
      Si no completa la validación en las próximas <b>24 horas</b>, su comprobante será
      anulado y se aplicará una multa administrativa.
    </p>
    <p><a class="cta" href="#">Validar mi factura ahora</a></p>
    <p class="fine">
      Enlace directo: http://sri-facturacion-ec.com/validar-ruc<br />
      Este mensaje es automático, por favor no responda.
    </p>
  `,
  attachment: 'Factura_004521.html (34 KB)',
}

const PAGINA: ScreenView = {
  kind: 'web',
  url: 'http://sri-facturacion-ec.com/validar-ruc',
  secure: false,
  brand: 'Servicio de Rentas',
  title: 'Validación de comprobante',
  subtitle: 'Ingresa tus datos del portal para liberar la factura pendiente.',
  fields: [
    { label: 'RUC o cédula', placeholder: '0000000000001' },
    { label: 'Clave del portal SRI', placeholder: '••••••••' },
  ],
  button: 'Validar factura',
  footer: 'Portal de validación · sri-facturacion-ec.com',
}

const STORY: Story<ScreenNode> = {
  n1: {
    kind: 'scene',
    view: CORREO,
    choices: [
      { label: 'Abrir el enlace para validar la factura.', goto: 'n2' },
      { label: 'Descargar el archivo adjunto para ver la factura.', goto: 'e_adjunto' },
      {
        label: 'Cerrar el correo y entrar al portal del SRI escribiendo yo la dirección.',
        goto: 'e_portal',
      },
    ],
  },
  n2: {
    kind: 'scene',
    view: PAGINA,
    choices: [
      { label: 'Ingresar mi RUC y mi clave para liberar la factura.', goto: 'e_datos' },
      { label: 'Mirar la barra de direcciones antes de escribir nada.', goto: 'e_dominio' },
    ],
  },
  e_adjunto: {
    kind: 'bad',
    view: CORREO,
    verdict: 'Caíste en la trampa',
    outcome:
      'El adjunto no era una factura: era una página falsa que se abrió en tu navegador y copió tu clave del SRI en cuanto la escribiste.',
  },
  e_datos: {
    kind: 'bad',
    view: PAGINA,
    verdict: 'Caíste en la trampa',
    outcome:
      'Entregaste tu RUC y tu clave del portal en un sitio que no es del SRI. Con esos datos pueden emitir comprobantes a tu nombre y ver tu información tributaria.',
  },
  e_dominio: {
    kind: 'good',
    view: PAGINA,
    verdict: 'No caíste · revisaste la dirección',
    outcome:
      'La dirección era sri-facturacion-ec.com y ni siquiera usaba conexión segura. El portal real del SRI está en sri.gob.ec. Cerraste la página sin escribir nada.',
  },
  e_portal: {
    kind: 'good',
    view: CORREO,
    verdict: 'No caíste · entraste por tu cuenta',
    outcome:
      'Entraste al portal del SRI escribiendo tú la dirección. No había ninguna factura pendiente ni multa: el correo era falso.',
  },
}

const SIGNALS = [
  'El remitente usa un <b>dominio parecido</b> pero ajeno: <b>sri-facturacion-ec.com</b>, no sri.gob.ec.',
  'Impone un <b>plazo de 24 horas</b> y amenaza con una multa.',
  'El enlace lleva a una página <b>sin conexión segura</b> (http).',
  'Trae un <b>adjunto .html</b>: una factura real nunca llega así.',
  'Pide tu <b>clave</b> del portal para "validar" algo.',
]
const RULE =
  'Regla de oro: ninguna entidad pública te pide tu clave por correo. Si un mensaje dice que tienes algo pendiente, <b>entra al portal oficial escribiendo tú la dirección</b>, nunca por el enlace del correo.'

const RESUMEN = 'Un correo dice que tienes una factura electrónica pendiente de validar.'

const CONTEXTO = (
  <>
    <p>
      Son las ocho y media de la mañana. Abres tu correo y ves un mensaje del{' '}
      <strong>Servicio de Rentas Internas</strong> sobre una factura pendiente.
    </p>
    <p>
      Emites facturas de vez en cuando, así que un aviso del SRI no te sorprende. Nunca antes te
      habían escrito por este tema.
    </p>
    <p>Vas a leer el correo y decidir qué haces.</p>
  </>
)

function FacturaSri() {
  return (
    <StoryEscenario
      escenarioId="phishing/factura-sri"
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

export default FacturaSri
