import { Landmark, Newspaper, Search } from 'lucide-react'
import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { MarcadorNavegador } from '../../components/ui/Navegador'
import { ACCIONES_BARRA, finalesDeBarra } from './barraDeCorreo'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import { ENLACES_PIE } from '../../components/ui/armazonSitio'
import { CUENTA_FICTICIA, IDENTIDAD_FICTICIA } from '../../lib/identidadFicticia'

// Anzuelo no técnico (sin dominio casi idéntico ni clon difícil de distinguir): la señal decisiva
// no está en la pantalla, se responde con "¿yo jugué?" — de ahí la dificultad 1.

const URL_FALSA = 'http://loteria-pacifico-premios.online/reclamo'

const CORREO: ScreenView = {
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
    <img class="mailHero" src="/escenarios/phishing/premio-loteria.webp" alt="" />
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
    <p><a class="cta" href="${URL_FALSA}" data-hotspot-goto="n2" data-hotspot-label="Pulsó &quot;Reclamar mi premio ahora&quot; en el correo">Reclamar mi premio ahora</a></p>
    <p class="fine">Este mensaje fue generado automáticamente. No responda a este correo.</p>
  `,
  footer: `
    <p>Lotería del Pacífico · Departamento de Premios y Reclamos</p>
    <p>Este mensaje es confidencial y está dirigido únicamente a la persona ganadora.</p>
  `,
}

const RECLAMO: ScreenView = {
  kind: 'web',
  url: URL_FALSA,
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
  pie: ENLACES_PIE,
  button: 'Pagar $85 y liberar mi premio',
  botonGoto: 'e_paga',
  botonLabel: 'Pagó los $85 para liberar el premio',
  cerrarGoto: 'n1',
  cerrarLabel: 'Cerró la página del reclamo y volvió al correo',
}

// El buscador: no existe ninguna lotería con ese nombre, y eso desmonta el correo entero.
const BUSCADOR: ScreenView = {
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
  ...finalesDeBarra('fraude', CORREO),
  n1: { kind: 'scene', view: CORREO },
  n2: { kind: 'scene', view: RECLAMO },
  n3: { kind: 'scene', view: BUSCADOR },
  e_paga: {
    kind: 'bad',
    view: RECLAMO,
    verdict: 'Caíste en la estafa',
    outcome: `Pagaste los $85 y, de paso, entregaste tu cédula ${IDENTIDAD_FICTICIA.cedula} y tu cuenta ${CUENTA_FICTICIA}. El premio no llegó: llegó otro correo pidiendo un "seguro de transferencia" de $190. Así funciona: cada pago abre la puerta al siguiente, y quien ya pagó cuesta más que se detenga. Los datos, además, ya no se pueden recuperar.`,
  },
}

const MARCADORES: MarcadorNavegador[] = [
  { Icono: Landmark, texto: 'Banco del Litoral' },
  {
    Icono: Search,
    texto: 'Buscador',
    goto: 'n3',
    label: 'Buscó la lotería por su cuenta en internet',
  },
  { Icono: Newspaper, texto: 'Diario Andino' },
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
    el mensaje desde la barra del cliente, o comprobar por tu cuenta si esa lotería existe. Cuál de
    ellos es el acertado es justamente lo que decides tú.
  </p>
)

const SENALES: Senal[] = [
  {
    id: 'sin-jugar',
    pantalla: 'n1',
    targetId: 'saludo',
    texto:
      'No hay ningún boleto: <b>nadie gana un sorteo en el que no participó</b>. Y no te llama por tu nombre, porque el mismo correo salió para miles de direcciones.',
  },
  {
    id: 'pago-adelantado',
    pantalla: 'n1',
    targetId: 'pago',
    texto:
      'Piden <b>pagar por adelantado para cobrar</b>. Un premio real se descuenta del monto; ninguno se libera con una transferencia tuya.',
  },
  {
    id: 'plazo',
    pantalla: 'n1',
    targetId: 'plazo',
    texto:
      'El plazo de <b>solo unas horas</b> está para que no te dé tiempo de preguntarle a nadie. La prisa es parte del método.',
  },
  {
    id: 'dominio',
    pantalla: 'n1',
    targetId: 'remitente',
    texto:
      'La dirección del remitente es <b>loteria-pacifico-premios.online</b>, un nombre comprado para esta campaña y que además describe el premio. Una lotería de verdad escribe desde la dirección de su sitio de siempre.',
  },
  {
    id: 'cuenta',
    pantalla: 'n2',
    targetId: 'campo-cuenta',
    texto:
      'El formulario ya venía con <b>tu cédula y tu cuenta</b>, las que viste antes de empezar. Para <i>recibir</i> dinero nunca hacen falta las dos juntas, y con ellas se puede intentar mucho más que un depósito.',
  },
]

const SENAL_BUSCADOR: Senal = {
  id: 'sin-registro',
  pantalla: 'n3',
  targetId: 'sin-registro',
  texto:
    'Buscarla por tu cuenta lo resuelve en un minuto: <b>esa lotería no existe</b>. Un premio de verdad se puede confirmar fuera del correo que lo anuncia.',
}

const RULE =
  'Regla de oro: <b>nunca se paga para cobrar un premio</b>. Y antes de mirar cualquier otra señal, pregúntate si llegaste a jugar: si no compraste el boleto, no hay premio que reclamar.'

const RESUMEN =
  'Un correo anuncia que ganaste un premio de una lotería y pide un pago para cobrarlo.'

const CONTEXTO: Contexto = {
  antes: 'No juegas a la lotería: no recuerdas haber comprado ningún boleto.',
  ahora: (
    <>
      <strong>Temprano</strong>, revisando el correo, aparece entre los mensajes de siempre uno que
      dice que ganaste <strong>casi cincuenta mil dólares</strong> en un sorteo.
    </>
  ),
}

function LoteriaPremiada() {
  return (
    <StoryEscenario
      escenarioId="phishing/loteria-premiada"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      accionesCorreo={ACCIONES_BARRA}
      identidad={['cedula', 'cuenta']}
      marcadores={MARCADORES}
      instruccion={INSTRUCCION}
      pista={PISTA}
      senales={[...SENALES, SENAL_BUSCADOR]}
      rule={RULE}
      restartLabel="↻ Repetir el escenario"
    />
  )
}

export default LoteriaPremiada
