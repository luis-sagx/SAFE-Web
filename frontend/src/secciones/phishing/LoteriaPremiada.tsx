import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import { ACCIONES_BARRA, finalesDeBarra } from './barraDeCorreo'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'

/**
 * El premio que nunca se jugó, con pago por adelantado para cobrarlo.
 *
 * Es el fraude más antiguo que sigue funcionando, y el que más golpea al
 * público de este curso. Su anzuelo no es técnico: no hay dominio casi idéntico
 * ni página clonada difícil de distinguir. Lo que empuja es la ilusión y la
 * prisa, y por eso el escenario es de dificultad 1 — la señal decisiva no hay
 * que buscarla en la pantalla, se responde con una pregunta: ¿yo jugué?
 *
 * La lotería es inventada, como el Banco del Litoral o TiendaExpress. Los
 * escenarios solo usan nombres reales cuando la institución es el asunto del
 * ejercicio, como el SRI en factura-sri.
 */

const URL_FALSA = 'http://loteria-pacifico-premios.online/reclamo'

const CORREO: ScreenView = {
  kind: 'mail',
  from: 'Lotería del Pacífico · Premios',
  address: 'notificaciones@loteria-pacifico-premios.online',
  senalDireccion: 'remitente',
  label: 'Externo',
  senalEtiqueta: 'externo',
  subject: '¡Felicidades! Su número resultó ganador — reclamo pendiente',
  date: 'hoy 07:14',
  body: `
    <p><span data-signal="saludo">Estimado ganador:</span></p>
    <p>
      Nos complace informarle que su correo electrónico resultó
      <b>preseleccionado</b> en el sorteo internacional del mes y le corresponde un premio de
      <b>USD 48.500,00</b>.
    </p>
    <p>
      Para liberar la transferencia debe cubrir el
      <mark class="marca" data-signal="pago">impuesto único de $85</mark>, que la ley no permite
      descontar del monto premiado. Dispone de
      <mark class="marca" data-signal="plazo">48 horas</mark>; pasado ese plazo el premio se
      reasigna a otro participante.
    </p>
    <p><a class="cta" href="${URL_FALSA}" data-hotspot-goto="n2" data-hotspot-label="Pulsó "Reclamar mi premio ahora" en el correo">Reclamar mi premio ahora</a></p>
  `,
  footer: `
    <p>Lotería del Pacífico · Departamento de Premios y Reclamos</p>
    <p>Este mensaje es confidencial y está dirigido únicamente al ganador seleccionado.</p>
  `,
}

const RECLAMO: ScreenView = {
  kind: 'web',
  url: URL_FALSA,
  secure: false,
  senalUrl: 'url-insegura',
  brand: 'Lotería del Pacífico',
  title: 'Liberación de premio',
  subtitle: 'Complete sus datos para recibir la transferencia de USD 48.500,00.',
  fields: [
    { label: 'Cédula', placeholder: '0000000000' },
    { label: 'Banco y número de cuenta', placeholder: 'Banco · 00000000', senal: 'campo-cuenta' },
  ],
  button: 'Pagar $85 y liberar mi premio',
  botonGoto: 'e_paga',
  botonLabel: 'Pagó los $85 para liberar el premio',
  cerrarGoto: 'e_frena',
  cerrarLabel: 'Cerró la página del reclamo sin pagar ni escribir nada',
}

const STORY: Story<ScreenNode> = {
  // Responder, reenviar, archivar, eliminar y marcar como spam.
  ...finalesDeBarra('fraude', CORREO),
  n1: {
    kind: 'scene',
    view: CORREO,
    choices: [
      { label: 'Abrir el enlace para reclamar el premio.', goto: 'n2' },
      {
        label: 'Preguntarme primero si alguna vez compré un boleto de esa lotería.',
        goto: 'e_nojugue',
      },
      {
        label: 'Buscar la lotería por mi cuenta y llamar al número de su sitio oficial.',
        goto: 'e_verifica',
      },
    ],
  },
  n2: {
    kind: 'scene',
    view: RECLAMO,
    choices: [
      { label: 'Pagar los $85: es poco al lado de lo que voy a recibir.', goto: 'e_paga' },
      {
        label: 'Escribir mi cédula y mi número de cuenta para que hagan la transferencia.',
        goto: 'e_cuenta',
      },
      {
        label: 'Frenar: me están pidiendo pagar para poder cobrar. Cerrar la página.',
        goto: 'e_frena',
      },
    ],
  },
  e_paga: {
    kind: 'bad',
    view: RECLAMO,
    verdict: 'Caíste en la estafa',
    outcome:
      'Pagaste los $85 y el premio no llegó. En su lugar llegó otro correo: ahora faltaba un "seguro de transferencia" de $190. Así funciona — cada pago abre la puerta al siguiente, y quien ya pagó cuesta más que se detenga.',
  },
  e_cuenta: {
    kind: 'bad',
    view: RECLAMO,
    verdict: 'Caíste en la estafa',
    outcome:
      'Entregaste tu cédula y tu número de cuenta. No hacía falta que pagaras nada: con esos datos ya pueden suplantarte ante tu banco e intentar movimientos a tu nombre.',
  },
  e_frena: {
    kind: 'good',
    view: RECLAMO,
    verdict: 'No caíste · viste el pago por adelantado',
    outcome:
      'Cerraste la página al notar que te pedían pagar para poder cobrar. Un premio real se descuenta del monto o se entrega ante notario; nunca se cobra por adelantado.',
  },
  e_nojugue: {
    kind: 'good',
    view: CORREO,
    verdict: 'No caíste · nunca jugaste',
    outcome:
      'No has comprado ningún boleto de esa lotería, así que no había nada que ganar. Es la pregunta que desarma este fraude entero, y no hace falta mirar la pantalla para responderla.',
  },
  e_verifica: {
    kind: 'good',
    view: CORREO,
    verdict: 'No caíste · verificaste por tu cuenta',
    outcome:
      'Buscaste la lotería y llamaste al número de su sitio oficial. No existía ningún sorteo con ese nombre ni ningún premio a tu nombre.',
  },
}

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
      'El <b>plazo de 48 horas</b> está para que no te dé tiempo de preguntarle a nadie. La prisa es parte del método.',
  },
  {
    id: 'dominio',
    pantalla: 'n1',
    targetId: 'remitente',
    texto:
      'El dominio es <b>loteria-pacifico-premios.online</b>: un nombre inventado para la ocasión, no el de una institución.',
  },
  {
    id: 'cuenta',
    pantalla: 'n2',
    targetId: 'campo-cuenta',
    texto:
      'Piden tu <b>cédula y tu número de cuenta</b>. Para <i>recibir</i> dinero nunca hacen falta los dos juntos, y con ellos se puede intentar mucho más que un depósito.',
  },
]

const RULE =
  'Regla de oro: <b>nunca se paga para cobrar un premio</b>. Y antes de mirar cualquier otra señal, pregúntate si llegaste a jugar: si no compraste el boleto, no hay premio que reclamar.'

const RESUMEN = 'Un correo anuncia que ganaste un premio de una lotería y pide un pago para cobrarlo.'

const CONTEXTO = (
  <>
    <p>
      Es temprano y estás revisando el correo. Entre los mensajes de siempre aparece uno que dice
      que ganaste <strong>casi cincuenta mil dólares</strong> en un sorteo.
    </p>
    <p>
      No recuerdas haber comprado ningún boleto, aunque el correo insiste en que tu dirección salió
      preseleccionada.
    </p>
  </>
)

function LoteriaPremiada() {
  return (
    <StoryEscenario
      escenarioId="phishing/loteria-premiada"
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

export default LoteriaPremiada
