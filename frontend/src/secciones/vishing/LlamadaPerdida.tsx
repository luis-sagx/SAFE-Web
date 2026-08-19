import { Camera, Compass, MessageSquareText, Phone } from 'lucide-react'
import StoryEscenario, { type AppTelefono, type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'

/**
 * La llamada perdida de madrugada que sale carísima devolver.
 *
 * El único escenario del módulo que no empieza con el teléfono sonando: aquí
 * la llamada ya pasó y lo que hay es un registro. El engaño consiste en que la
 * decisión la tomes tú, marcando, y por eso no hay nadie apurándote — solo la
 * curiosidad de quién llamó a las tres de la mañana.
 */

const NUMERO = '+225 07 55 21 88'

/// El registro de llamadas es la pantalla de partida. Devolver la llamada es
/// una entrada más de la lista, como en cualquier teléfono: no un botón que el
/// ejercicio ponga aparte.
const REGISTRO: ScreenView = {
  kind: 'web',
  app: 'Teléfono',
  url: 'recientes',
  secure: true,
  brand: 'Recientes',
  title: 'Llamadas',
  subtitle: 'Hoy',
  opciones: [
    {
      texto: `${NUMERO} · Llamada perdida`,
      detalle: '03:12 · sonó una sola vez',
      goto: 'n2',
      label: 'Devolvió la llamada al número desconocido',
    },
    {
      texto: 'Bloquear y reportar este número',
      detalle: 'No volverás a recibir llamadas suyas',
      goto: 'e_bloquea',
      label: 'Bloqueó el número sin devolver la llamada',
    },
    { texto: 'Mamá · Saliente', detalle: 'Ayer, 19:40 · 12 min' },
    { texto: 'Buzón de voz', detalle: 'Sin mensajes nuevos' },
  ],
  fields: [],
  button: '',
}

const ESPERA = [
  {
    texto:
      'Su llamada está siendo procesada. Por favor, permanezca en línea; en breve será atendido por el siguiente operador disponible.',
    senal: 'grabacion',
  },
]

const LLAMANDO: ScreenView = {
  kind: 'call',
  quien: NUMERO,
  numero: 'Costa de Marfil · tarifa internacional',
  etiqueta: 'Llamada saliente · $2,40 por minuto',
  senalQuien: 'tarifa',
  dialogo: ESPERA,
  decir: [
    {
      texto: '¿Aló? ¿Hay alguien ahí?',
      goto: 'n3',
      label: 'Siguió al teléfono esperando que contestaran',
    },
  ],
  colgarGoto: 'e_cuelga',
  colgarLabel: 'Colgó al oír la grabación',
}

const SIGUE_ESPERANDO: ScreenView = {
  ...LLAMANDO,
  dialogo: [
    ...ESPERA,
    { texto: '¿Aló? ¿Hay alguien ahí?', mio: true },
    {
      texto:
        'Todos nuestros operadores están ocupados. No cuelgue, su llamada es importante para nosotros. Su tiempo de espera estimado es de dos minutos.',
      senal: 'nadie',
    },
  ],
  decir: [
    {
      texto: '(Te quedas esperando en línea a ver si contesta alguien.)',
      goto: 'e_espera',
      label: 'Se quedó esperando en la línea',
    },
  ],
}

const NAVEGADOR: ScreenView = {
  kind: 'web',
  app: 'Navegador',
  url: 'inicio',
  secure: true,
  brand: 'Sitios frecuentes',
  title: 'Nueva pestaña',
  opciones: [
    {
      texto: 'Buscar «+225 llamada perdida»',
      detalle: 'Busca el número antes de devolver la llamada',
      goto: 'e_busca',
      label: 'Buscó el número en internet antes de devolver la llamada',
    },
    { texto: 'elcomercio.com', detalle: 'Noticias del Ecuador' },
    { texto: 'bancolitoral.ec', detalle: 'Banca en línea' },
    { texto: 'arcotel.gob.ec', detalle: 'Agencia de Regulación de Telecomunicaciones' },
  ],
  fields: [],
  button: '',
}

const BUSQUEDA: ScreenView = {
  kind: 'web',
  url: 'https://busca.ec/?q=%2B225+llamada+perdida',
  secure: true,
  brand: 'Buscar',
  title: '+225 llamada perdida',
  resultados: [
    {
      titulo: 'Estafa del timbrazo: cuidado con las llamadas de un solo tono',
      url: 'arcotel.gob.ec › avisos',
      fragmento:
        'Números internacionales llaman de madrugada y cortan al primer timbre. Al devolver la llamada, el minuto se factura a tarifa especial y una grabación te mantiene esperando.',
      senal: 'timbrazo',
    },
    {
      titulo: '+225 es el prefijo de Costa de Marfil',
      url: 'prefijos.info › 225',
      fragmento: 'Código de país 225. Las llamadas desde Ecuador se facturan como internacional.',
    },
    {
      titulo: 'Foro: me llamaron a las 3 de la mañana de un número raro',
      url: 'foros.ec › telefonía',
      fragmento: 'A mí también, y a un vecino. Nadie contesta, solo una grabación pidiendo esperar.',
    },
  ],
  fields: [],
  button: '',
}

const APPS: AppTelefono[] = [
  {
    Icono: Phone,
    texto: 'Teléfono',
    color: '#2f9e44',
    goto: 'n1',
    label: 'Volvió al registro de llamadas',
  },
  {
    Icono: Compass,
    texto: 'Navegador',
    color: '#1971c2',
    goto: 'n4',
    label: 'Abrió el navegador para averiguar de quién es el número',
  },
  {
    Icono: MessageSquareText,
    texto: 'Mensajes',
    color: '#0b7285',
    vacia: 'No tienes mensajes nuevos. Ese número tampoco te escribió.',
  },
  {
    Icono: Camera,
    texto: 'Cámara',
    color: '#495057',
    vacia: 'La cámara está lista. No hay nada que fotografiar en este momento.',
  },
]

export const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: REGISTRO },
  n2: { kind: 'scene', view: LLAMANDO },
  n3: { kind: 'scene', view: SIGUE_ESPERANDO },
  n4: { kind: 'scene', view: NAVEGADOR },
  e_bloquea: {
    kind: 'good',
    view: REGISTRO,
    verdict: 'No caíste · no devolviste la llamada',
    outcome:
      'Bloqueaste el número y seguiste con tu día. Quien de verdad necesita hablar contigo vuelve a llamar, deja un mensaje o te escribe: nadie importante se comunica con un timbrazo a las tres de la mañana.',
  },
  e_busca: {
    kind: 'good',
    view: BUSQUEDA,
    verdict: 'No caíste · averiguaste antes de marcar',
    outcome:
      'Bastó buscar el número para encontrar el aviso: prefijo internacional, un solo timbre y una grabación que te hace esperar mientras corre el minuto. Medio minuto de búsqueda contra varios dólares de factura.',
  },
  e_cuelga: {
    kind: 'partial',
    view: LLAMANDO,
    verdict: 'Colgaste rápido, pero la llamada ya estaba hecha',
    outcome:
      'Colgaste en cuanto oíste la grabación, así que la factura será de un par de dólares y no de treinta. Pero devolviste la llamada: ese número ya sabe que tu línea existe y que contestas, y volverá a intentarlo.',
    score: 50,
  },
  e_espera: {
    kind: 'bad',
    view: SIGUE_ESPERANDO,
    verdict: 'Caíste en la trampa',
    outcome:
      'Nunca hubo ningún operador: la grabación existe solo para que te quedes en línea. Once minutos a tarifa especial aparecieron en tu factura del mes como veintiocho dólares, y una parte de ese dinero se la queda quien puso el número.',
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'timbrazo',
    pantalla: 'e_busca',
    texto:
      '<b>Sonó una sola vez.</b> Nadie que quiera hablar contigo cuelga al primer timbre: el timbrazo está calculado para que veas la perdida y devuelvas la llamada.',
  },
  {
    id: 's2',
    targetId: 'tarifa',
    pantalla: 'n2',
    texto:
      'El número empieza por <b>+225</b>, un prefijo internacional. Devolver la llamada no es gratis: se factura por minuto y a tarifa especial.',
  },
  {
    id: 's3',
    targetId: 'grabacion',
    pantalla: 'n2',
    texto:
      'Contesta una <b>grabación</b>, no una persona. Si quien llamó tuviera algo que decirte, habría alguien al otro lado.',
  },
  {
    id: 's4',
    targetId: 'nadie',
    pantalla: 'n3',
    texto:
      '"Su llamada es importante para nosotros", pero <b>no atiende nadie nunca</b>. Todo el negocio es el tiempo que te quedes escuchando.',
  },
]

const RULE =
  'Regla de oro: <b>a una llamada perdida de un número que no conoces no se le devuelve la llamada</b>, y menos si es internacional o sonó una sola vez. Si es importante, volverán a llamar o te dejarán un mensaje.'

const RESUMEN = 'Amaneces con una llamada perdida de madrugada de un número extranjero.'

const CONTEXTO: Contexto = {
  antes: (
    <>
      No esperas ninguna llamada del exterior: <strong>no tienes familia fuera</strong> ni trámites
      en otro país.
    </>
  ),
  ahora: (
    <>
      <strong>Al despertarte</strong> ves en el registro una llamada perdida de las{' '}
      <strong>03:12</strong>, de un número que empieza por +225.
    </>
  ),
  detalle: 'Sonó una sola vez y no dejaron mensaje en el buzón.',
}

function LlamadaPerdida() {
  return (
    <StoryEscenario
      escenarioId="vishing/llamada-perdida"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule={RULE}
      restartLabel="↻ Repetir el escenario"
      accionesEnPantalla
      apps={APPS}
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Aquí nadie te está llamando: la llamada ya pasó. Actúa sobre el teléfono como lo harías
          con el tuyo, y usa <strong>cualquier app de abajo</strong>.
        </p>
      }
      pista={
        <p>
          Puedes devolver la llamada, bloquear el número, dejarlo estar o averiguar primero de quién
          es ese prefijo. Cuál de ellos es el acertado es justamente lo que decides tú.
        </p>
      }
    />
  )
}

export default LlamadaPerdida
