import { Landmark, Newspaper, Search } from 'lucide-react'
import ScenarioStory, { type ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { BrowserBookmark } from '../../components/ui/Navegador'
import { ACTIONS_BAR, createToolbarEndings } from './barraDeCorreo'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Signal } from '../../components/ui/PanelVeredicto'
import { FOOTER_LINKS } from '../../components/ui/armazonSitio'
import { ACCOUNT_FAKE, IDENTITY_FAKE } from '../../lib/identidadFicticia'
import lotteryPrizeImg from '../../assets/escenarios/phishing/premio-loteria.webp'

// Anzuelo no técnico (sin dominio casi idéntico ni clon difícil de distinguir): la señal decisiva
// no está en la pantalla, se responde con "¿yo jugué?", de ahí la dificultad 1.

const FAKE_URL = 'http://loteria-pacifico-premios.online/reclamo'

const EMAIL: ScreenView = {
  kind: 'mail',
  from: 'Lotería del Pacífico · Premios',
  address: 'notificaciones@loteria-pacifico-premios.online',
  senalDireccion: 'remitente',
  label: 'Externo',
  senalEtiqueta: 'externo',
  subject: 'Acción requerida hoy: confirme su premio de USD 48.500',
  date: 'hoy 07:14',
  marca: {
    nombre: 'Lotería del Pacífico',
    detalle: 'Premios y sorteos internacionales',
    icono: 'premio',
    variante: 'publicidad',
  },
  body: `
    <p><span data-signal="saludo">Estimado(a) ganador(a):</span></p>
    <img class="mailHero" src="${lotteryPrizeImg}" alt="" />
    <p>
      Su correo fue seleccionado como ganador del Sorteo Internacional de este mes.
    </p>
    <div class="correoDato">
      <span>Premio reservado</span>
      <strong>USD 48.500</strong>
    </div>
    <p>Para autorizar la transferencia debe pagar
      <mark class="marca" data-signal="pago">USD 85 por concepto de impuestos y validación</mark>
      antes de <mark class="marca" data-signal="plazo">hoy a las 18:00</mark>. Si el pago no se
      registra dentro del plazo, el premio será reasignado automáticamente.</p>
    <p><a class="cta" href="${FAKE_URL}" data-hotspot-goto="n2" data-hotspot-label="Pulsó &quot;Reclamar mi premio ahora&quot; en el correo">Reclamar mi premio ahora</a></p>
    <p class="fine">Este mensaje fue generado automáticamente. No responda a este correo.</p>
  `,
  footer: `
    <p>Lotería del Pacífico · Departamento de Premios y Reclamos</p>
    <p>Este mensaje es confidencial y está dirigido únicamente a la persona ganadora.</p>
  `,
}

const CLAIM: ScreenView = {
  kind: 'web',
  url: FAKE_URL,
  secure: false,
  senalUrl: 'url-insegura',
  brand: 'Lotería del Pacífico',
  menu: ['Sorteos', 'Resultados', 'Ganadores', 'Ayuda'],
  title: 'Liberación de premio',
  subtitle: 'Complete sus datos para recibir la transferencia de USD 48.500,00.',
  // Campos ya rellenos con los datos del briefing: con ceros de ejemplo, enviar se
  // sentía como enviar casillas vacías; con sus números, es verse entregar lo suyo.
  fields: [
    { label: 'Cédula', placeholder: '', valor: 'cedula' },
    { label: 'Banco y número de cuenta', placeholder: '', valor: 'cuenta', senal: 'campo-cuenta' },
  ],
  aviso:
    'El pago del impuesto es un requisito de ley y no puede descontarse del monto premiado. Los datos que registre se usan únicamente para acreditar la transferencia.',
  footer: 'Lotería del Pacífico · Departamento de Premios y Reclamos',
  pie: FOOTER_LINKS,
  button: 'Pagar $85 y liberar mi premio',
  botonGoto: 'e_paga',
  botonLabel: 'Pagó los $85 para liberar el premio',
  cerrarGoto: 'n1',
  cerrarLabel: 'Cerró la página del reclamo y volvió al correo',
}

// El buscador: no existe ninguna lotería con ese nombre, y eso desmonta el correo entero.
const SEARCH: ScreenView = {
  kind: 'web',
  url: 'https://www.buscador.ec/?q=loteria+del+pacifico',
  secure: true,
  brand: 'Buscador',
  title: 'lotería del pacífico',
  subtitle: 'Cerca de 1.240 resultados (0,38 segundos)',
  // Resultados de verdad, no una ficha de datos: se entrena reconocer dónde se está
  // mirando. Ninguno dice "es una estafa" a la cara; dicen que el sorteo no consta en ningún lado.
  resultados: [
    {
      titulo: 'Sorteos y loterías con permiso vigente en el Ecuador',
      url: 'https://www.sorteosautorizados.ec › listado',
      fragmento:
        'Listado oficial de los sorteos con permiso vigente. No consta ninguna "Lotería del Pacífico" ni sorteo internacional con ese nombre.',
      senal: 'sin-registro',
    },
    {
      titulo: '"Gané un premio que nunca jugué": cómo funciona la estafa del sorteo por correo',
      url: 'https://www.diarioandino.ec › seguridad › estafa-sorteo-correo',
      fragmento:
        'El mensaje anuncia un premio alto y pide un pago por adelantado para liberarlo. Quien paga recibe un segundo cobro, y luego otro.',
    },
    {
      titulo: 'Me llegó un correo de la Lotería del Pacífico · Foros EC',
      url: 'https://foros.ec › t › loteria-del-pacifico-premio',
      fragmento:
        'A mí me llegó igual, con el mismo monto y la misma exigencia de pagar primero. Le escribí y lo único que querían era la transferencia de los $85.',
    },
  ],
  fields: [],
  button: '',
  cerrarGoto: 'n1',
  cerrarLabel: 'Buscó la lotería por su cuenta y volvió al correo',
}

const STORY: Story<ScreenNode> = {
  ...createToolbarEndings('fraude', EMAIL),
  n1: { kind: 'scene', view: EMAIL },
  n2: { kind: 'scene', view: CLAIM },
  n3: { kind: 'scene', view: SEARCH },
  e_paga: {
    kind: 'bad',
    view: CLAIM,
    verdict: 'Caíste en la estafa',
    outcome: `Pagaste $85 y entregaste tu cédula ${IDENTITY_FAKE.cedula} y tu cuenta ${ACCOUNT_FAKE}. El premio no llegó: llegó otro cobro, de $190. Cada pago abre la puerta al siguiente.`,
  },
}

const MARKERS: BrowserBookmark[] = [
  { Icono: Landmark, texto: 'Banco del Litoral' },
  {
    Icono: Search,
    texto: 'Buscador',
    goto: 'n3',
    label: 'Buscó la lotería por su cuenta en internet',
  },
  { Icono: Newspaper, texto: 'Diario Andino' },
]

const INSTRUCTION = (
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

const CLUE = (
  <p>
    Tienes cuatro caminos posibles: hacer lo que el correo pide, contestarle, decidir qué hacer con
    el mensaje desde la barra del cliente, o comprobar por tu cuenta si esa lotería existe. Cuál de
    ellos es el acertado es justamente lo que decides tú.
  </p>
)

// Redacción compacta (issue de UX): la señal decisiva va primero y en
// negrita, seguida como mucho de una frase corta. En pruebas de usuario, a
// partir del segundo o tercer escenario la gente dejaba de leer bloques
// largos; esto entra de un vistazo aunque se lea solo la primera línea.
const SIGNALS: Signal[] = [
  {
    id: 'sin-jugar',
    pantalla: 'n1',
    targetId: 'saludo',
    texto: '<b>Nadie gana un sorteo en el que no participó</b>. Por eso tampoco te llama por tu nombre.',
  },
  {
    id: 'pago-adelantado',
    pantalla: 'n1',
    targetId: 'pago',
    texto:
      '<b>Pagar para poder cobrar no existe</b>. Un premio real se descuenta del monto, nunca se libera con tu transferencia.',
  },
  {
    id: 'plazo',
    pantalla: 'n1',
    targetId: 'plazo',
    texto: '<b>Solo unas horas de plazo</b>: la prisa es para que no le preguntes a nadie.',
  },
  {
    id: 'dominio',
    pantalla: 'n1',
    targetId: 'remitente',
    texto:
      '<b>loteria-pacifico-premios.online</b> es un dominio comprado para esta campaña. Una lotería real siempre escribe desde el mismo sitio.',
  },
  {
    id: 'cuenta',
    pantalla: 'n2',
    targetId: 'campo-cuenta',
    texto: '<b>Tu cédula y tu cuenta juntas</b> en el formulario. Para recibir dinero nunca hacen falta las dos.',
  },
]

const SIGNAL_SEARCH: Signal = {
  id: 'sin-registro',
  pantalla: 'n3',
  targetId: 'sin-registro',
  texto: '<b>Esa lotería no existe</b>: no consta en ningún listado oficial de sorteos.',
}

const RULE =
  'Regla de oro: <b>nunca se paga para cobrar un premio</b>. Si no jugaste, no hay nada que reclamar.'

const SUMMARY =
  'Un correo anuncia que ganaste un premio de una lotería y pide un pago para cobrarlo.'

const CONTEXT: Context = {
  antes: 'No juegas a la lotería: no recuerdas haber comprado ningún boleto.',
  ahora: (
    <>
      <strong>Temprano</strong>, revisando el correo, aparece entre los mensajes de siempre uno que
      dice que ganaste <strong>casi cincuenta mil dólares</strong> en un sorteo.
    </>
  ),
}

function LotteryPrize() {
  return (
    <ScenarioStory
      escenarioId="phishing/loteria-premiada"
      resumen={SUMMARY}
      contexto={CONTEXT}
      story={STORY}
      accionesCorreo={ACTIONS_BAR}
      identidad={['cedula', 'cuenta']}
      marcadores={MARKERS}
      instruccion={INSTRUCTION}
      pista={CLUE}
      senales={[...SIGNALS, SIGNAL_SEARCH]}
      rule={RULE}
      restartLabel="↻ Repetir el escenario"
    />
  )
}

export default LotteryPrize
