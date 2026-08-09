import { Landmark, Newspaper, Search } from 'lucide-react'
import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { MarcadorNavegador } from '../../components/ui/Navegador'
import { ACCIONES_BARRA, finalesDeBarra } from './barraDeCorreo'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import { CUENTA_FICTICIA, IDENTIDAD_FICTICIA } from '../../lib/identidadFicticia'

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
    <p><a class="cta" href="${URL_FALSA}" data-hotspot-goto="n2" data-hotspot-label="Pulsó &quot;Reclamar mi premio ahora&quot; en el correo">Reclamar mi premio ahora</a></p>
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
  // Los campos vienen ya rellenos con los datos que el participante vio en el
  // briefing, como los rellenaría el autocompletado del navegador. Con ceros de
  // ejemplo, enviar el formulario se sentía como enviar casillas vacías; con
  // sus números a la vista, pulsar el botón es verse entregar lo suyo.
  fields: [
    { label: 'Cédula', placeholder: '', valor: 'cedula' },
    { label: 'Banco y número de cuenta', placeholder: '', valor: 'cuenta', senal: 'campo-cuenta' },
  ],
  button: 'Pagar $85 y liberar mi premio',
  botonGoto: 'e_paga',
  botonLabel: 'Pagó los $85 para liberar el premio',
  cerrarGoto: 'e_frena',
  cerrarLabel: 'Cerró la página del reclamo sin pagar ni escribir nada',
}

/// El buscador: aquí es donde "comprobarlo por mi cuenta" deja de ser una
/// intención y se ve. No existe ninguna lotería con ese nombre, y eso es lo que
/// desmonta el correo entero.
const BUSCADOR: ScreenView = {
  kind: 'web',
  url: 'https://www.buscador.ec/?q=loteria+del+pacifico',
  secure: true,
  brand: 'Buscador',
  title: 'lotería del pacífico',
  subtitle: 'Cerca de 1.240 resultados (0,38 segundos)',
  // Con resultados de verdad y no una ficha de datos: parte de lo que se
  // entrena es reconocer dónde está uno mirando, y una lista de pares
  // etiqueta/valor no se lee como un buscador. Ninguno de los tres dice
  // "esto es una estafa" a la cara; lo que dicen es que el sorteo no consta
  // en ningún lado, que es como se comprueba algo de verdad.
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
      titulo: 'Me llegó un correo de la Lotería del Pacífico — Foros EC',
      url: 'https://foros.ec › t › loteria-del-pacifico-premio',
      fragmento:
        'A mí me llegó igual, con el mismo monto y las mismas 48 horas. Le escribí y lo único que querían era la transferencia de los $85.',
    },
  ],
  fields: [],
  button: '',
  cerrarGoto: 'e_verifica',
  cerrarLabel: 'Buscó la lotería por su cuenta y cerró la pestaña',
}

const STORY: Story<ScreenNode> = {
  // Responder, reenviar, eliminar y marcar como spam.
  ...finalesDeBarra('fraude', CORREO),
  n1: { kind: 'scene', view: CORREO },
  n2: { kind: 'scene', view: RECLAMO },
  n3: { kind: 'scene', view: BUSCADOR },
  e_paga: {
    kind: 'bad',
    view: RECLAMO,
    verdict: 'Caíste en la estafa',
    outcome: `Pagaste los $85 y, de paso, entregaste tu cédula ${IDENTIDAD_FICTICIA.cedula} y tu cuenta ${CUENTA_FICTICIA}. El premio no llegó: llegó otro correo pidiendo un "seguro de transferencia" de $190. Así funciona — cada pago abre la puerta al siguiente, y quien ya pagó cuesta más que se detenga. Los datos, además, ya no se pueden recuperar.`,
  },
  e_frena: {
    kind: 'good',
    view: RECLAMO,
    verdict: 'No caíste · viste el pago por adelantado',
    outcome:
      'Cerraste la página al notar que te pedían pagar para poder cobrar, y tus datos se quedaron donde estaban. Un premio real se descuenta del monto o se entrega ante notario; nunca se cobra por adelantado.',
  },
  e_verifica: {
    kind: 'good',
    view: BUSCADOR,
    verdict: 'No caíste · lo comprobaste por tu cuenta',
    outcome:
      'Antes de tocar el enlace buscaste la lotería por tu lado, y no existía: ni ese sorteo ni ese premio. Comprobar por fuera del mensaje es lo que resuelve estos casos, porque un correo falso no puede desmentirse a sí mismo.',
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
      Lo primero que hagas cierra el escenario y te muestra en qué terminaba. Cambiar de pestaña no
      decide nada.
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
