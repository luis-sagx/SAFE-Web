import { Camera, MessageCircle, TrendingUp, Wallet } from 'lucide-react'
import StoryEscenario, { type AppTelefono, type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { CUENTA_FICTICIA, IDENTIDAD_FICTICIA } from '../../lib/identidadFicticia'

/**
 * El más difícil del módulo, porque el primer retiro sí llega.
 *
 * Aquí no hay comprobante falso ni cuenta a otro nombre: los cincuenta dólares
 * que te devuelven son de verdad, y esa es toda la inversión que hace el
 * estafador. Con ese dinero compra lo único que necesita, que es tu confianza
 * para la segunda entrega, la que ya no vuelve.
 *
 * Por eso el escenario no se gana desconfiando de lo que ves, sino sabiendo
 * una regla que no depende de la pantalla: ninguna inversión garantiza una
 * rentabilidad, y el dinero de verdad no cobra por dejarte sacarlo.
 */

const ASESOR = 'Andrés Villacís'
const NUMERO_ASESOR = '+593 99 302 7715'
const CUENTA_PLATAFORMA = '5520-1188-70 · Comercializadora Ruvel S.A.'

const RETIRO_LLEGO = {
  text: '¿Vio? Sus $50 de rendimiento ya están en su cuenta, tal como le dije 🎉 así de simple es. Con $200 usted habría retirado $260 este mes.',
  time: '11:05',
  senal: 'primer-pago',
}

const CHAT: ScreenView = {
  kind: 'sms',
  sender: ASESOR,
  sub: `${NUMERO_ASESOR} · asesor del grupo de inversión`,
  msgs: [RETIRO_LLEGO],
  respuestas: [
    {
      texto: 'Sí llegó. ¿Cuánto tendría que poner ahora?',
      goto: 'n2',
      label: 'Preguntó cuánto debía invertir después de recibir el primer pago',
    },
    {
      texto: '¿De dónde sale esa ganancia exactamente?',
      goto: 'n2b',
      label: 'Preguntó de dónde salía la rentabilidad',
    },
  ],
  volverGoto: 'e_ignora',
  volverLabel: 'Salió del chat sin seguir',
}

const PIDE_MAS: ScreenView = {
  ...CHAT,
  msgs: [
    RETIRO_LLEGO,
    { text: 'Sí llegó. ¿Cuánto tendría que poner ahora?', time: '11:07', mine: true },
    {
      text: 'El plan Plata arranca en $1.000 y le garantiza el 30% mensual, fijo, esté como esté el mercado. Es el que tienen casi todos en el grupo. Pero le soy honesto: los cupos de este mes se cierran mañana a mediodía.',
      time: '11:08',
      senal: 'garantiza',
    },
  ],
  respuestas: [
    {
      texto: 'Me interesa. ¿A qué cuenta deposito?',
      goto: 'n3',
      label: 'Aceptó invertir los $1.000',
    },
    {
      texto: 'Nadie puede garantizar un 30% mensual.',
      goto: 'n4',
      label: 'Cuestionó que se pudiera garantizar esa rentabilidad',
    },
  ],
}

const EXPLICA: ScreenView = {
  ...CHAT,
  msgs: [
    RETIRO_LLEGO,
    { text: '¿De dónde sale esa ganancia exactamente?', time: '11:07', mine: true },
    {
      text: 'De arbitraje de criptomonedas con inteligencia artificial 🤖 nuestro algoritmo opera 24/7 en doce mercados a la vez. No se preocupe por lo técnico, para eso estamos nosotros. Lo importante es que el 30% mensual está garantizado por contrato.',
      time: '11:09',
      senal: 'garantiza',
    },
  ],
  respuestas: [
    {
      texto: 'Suena bien. ¿Cuánto tengo que poner?',
      goto: 'n2',
      label: 'Se convenció con la explicación y preguntó cuánto invertir',
    },
    {
      texto: 'Ninguna inversión garantiza una ganancia fija.',
      goto: 'n4',
      label: 'Cuestionó que se pudiera garantizar esa rentabilidad',
    },
  ],
}

const CUENTA: ScreenView = {
  ...CHAT,
  msgs: [
    RETIRO_LLEGO,
    { text: 'Me interesa. ¿A qué cuenta deposito?', time: '11:10', mine: true },
    {
      text: `Excelente decisión 🙌 deposite los $1.000 a esta cuenta: ${CUENTA_PLATAFORMA}. En cuanto me mande el comprobante le activo el plan y desde mañana ve el rendimiento subiendo en su panel.`,
      time: '11:11',
      senal: 'cuenta',
    },
  ],
  respuestas: [
    {
      texto: 'Ya mismo deposito.',
      goto: 'n5',
      label: 'Fue a transferir los $1.000',
    },
    {
      texto: 'Antes quiero ver si la empresa está registrada.',
      goto: 'n6b',
      label: 'Fue a comprobar si la empresa estaba registrada',
    },
  ],
}

const SE_MOLESTA: ScreenView = {
  ...CHAT,
  msgs: [
    RETIRO_LLEGO,
    { text: 'Ninguna inversión garantiza una ganancia fija.', time: '11:12', mine: true },
    {
      text: 'Con todo respeto, eso es lo que le enseñaron en el banco para que deje su plata ahí ganando el 3% al año 😅 en el grupo hay señoras que ya se compraron carro. Usted verá si quiere seguir donde está o quiere avanzar. El cupo se lo doy hasta mañana.',
      time: '11:13',
      senal: 'desprecia',
    },
  ],
  respuestas: [
    {
      texto: 'Tiene razón, no quiero quedarme atrás. Deme la cuenta.',
      goto: 'n3',
      label: 'Cedió a la presión del grupo y pidió la cuenta',
    },
    {
      texto: 'No voy a poner nada. Hasta aquí llego.',
      goto: 'e_corta',
      label: 'Cortó la relación con el supuesto asesor',
    },
  ],
}

/// El panel de la plataforma. No hay ningún error a la vista, y ese es el
/// punto: los números que enseña los escribe quien cobra, y no hay dinero
/// detrás de ninguno.
const PANEL: ScreenView = {
  kind: 'web',
  app: 'Ruvel Capital',
  url: 'ruvelcapital.io',
  secure: true,
  brand: 'Tu panel',
  title: 'Rendimiento de tu cuenta',
  subtitle: 'Capital invertido: $200,00',
  datos: [
    { etiqueta: 'Rendimiento acumulado', valor: '+$50,00 este mes (25%)', senal: 'panel' },
    {
      etiqueta: 'Proyección con $1.000',
      valor: '+$300,00 mensuales · garantizado',
      senal: 'garantiza',
    },
    { etiqueta: 'Inversionistas activos', valor: '4.812' },
    {
      etiqueta: 'Retiro mínimo',
      valor: '$500,00 · comisión de liberación del 8%',
      senal: 'comision',
    },
  ],
  aviso:
    'Rentabilidad garantizada del 30% mensual. Sin riesgo. Respaldado por nuestro algoritmo de arbitraje.',
  opciones: [
    {
      texto: 'Retirar mis fondos',
      detalle: 'Sacar el dinero de la plataforma',
      goto: 'n7',
      label: 'Intentó retirar su dinero de la plataforma',
    },
    { texto: 'Invitar a un amigo', detalle: 'Gana el 5% de lo que invierta' },
    { texto: 'Ver el grupo', detalle: '4.812 inversionistas' },
  ],
  cerrarGoto: 'n1',
  cerrarLabel: 'Volvió al chat desde el panel de la plataforma',
  fields: [],
  button: '',
}

const RETIRO: ScreenView = {
  kind: 'web',
  app: 'Ruvel Capital',
  url: 'ruvelcapital.io',
  secure: true,
  brand: 'Retiro de fondos',
  title: 'Tu solicitud no se puede procesar',
  subtitle: 'Faltan requisitos para liberar el retiro.',
  datos: [
    { etiqueta: 'Saldo en la plataforma', valor: '$250,00' },
    { etiqueta: 'Retiro mínimo', valor: '$500,00 · te faltan $250,00', senal: 'comision' },
    {
      etiqueta: 'Comisión de liberación',
      valor: '8% del monto, se paga por adelantado',
      senal: 'comision',
    },
  ],
  aviso:
    'Para retirar debes alcanzar el mínimo y abonar la comisión de liberación antes de que se procese la salida de fondos.',
  button: 'No voy a invertir en esto.',
  botonGoto: 'e_corta',
  botonLabel: 'Cortó la inversión tras ver la comisión de liberación',
  cerrarGoto: 'n6',
  cerrarLabel: 'Volvió al panel después de ver las condiciones de retiro',
  fields: [],
}

const REGISTRO: ScreenView = {
  kind: 'web',
  app: 'Navegador',
  url: 'supercias.gob.ec',
  secure: true,
  brand: 'Consulta de compañías',
  title: 'Ruvel Capital',
  subtitle: 'Resultado de la búsqueda.',
  datos: [
    { etiqueta: 'Compañías encontradas', valor: 'Ninguna con esa denominación', senal: 'registro' },
    {
      etiqueta: 'Comercializadora Ruvel S.A.',
      valor: 'Existe, pero su actividad registrada es venta de repuestos automotrices',
      senal: 'registro',
    },
    {
      etiqueta: 'Autorización para captar dinero del público',
      valor: 'No consta. Solo las entidades supervisadas pueden hacerlo',
      senal: 'registro',
    },
  ],
  aviso:
    'Captar dinero del público sin autorización es un delito. Si una plataforma no está en el registro, no hay a quién reclamarle.',
  button: 'No voy a invertir en esto.',
  botonGoto: 'e_corta',
  botonLabel: 'Cortó la inversión tras comprobar el registro público',
  cerrarGoto: 'n3',
  cerrarLabel: 'Volvió al chat después de consultar el registro',
  fields: [],
}

const TRANSFERENCIA: ScreenView = {
  kind: 'web',
  app: IDENTIDAD_FICTICIA.banco,
  url: 'bancolitoral.ec',
  secure: true,
  brand: 'Transferir a terceros',
  title: 'Confirma la transferencia',
  subtitle: `Desde ${CUENTA_FICTICIA}`,
  datos: [
    { etiqueta: 'Cuenta de destino', valor: CUENTA_PLATAFORMA, senal: 'cuenta' },
    { etiqueta: 'Concepto', valor: 'Plan Plata · inversión' },
    { etiqueta: 'Valor', valor: '$1.000,00' },
  ],
  aviso: 'Las transferencias enviadas no se pueden reversar.',
  button: 'Transferir $1.000,00',
  botonGoto: 'e_invierte',
  botonLabel: 'Invirtió $1.000 en la plataforma',
  cerrarGoto: 'n3',
  cerrarLabel: 'Volvió atrás sin transferir',
  fields: [],
}

const APPS: AppTelefono[] = [
  { Icono: MessageCircle, texto: 'Mensajes', color: '#2f9e44', hilo: 'sms' },
  {
    Icono: TrendingUp,
    texto: 'Ruvel Capital',
    color: '#0ca678',
    goto: 'n6',
    label: 'Abrió el panel de la plataforma de inversión',
  },
  {
    Icono: Wallet,
    texto: IDENTIDAD_FICTICIA.banco,
    color: '#155e75',
    goto: 'n5',
    label: 'Abrió la app del banco para transferir',
  },
  {
    Icono: Camera,
    texto: 'Cámara',
    color: '#495057',
    vacia: 'La cámara está lista. No hay nada que fotografiar en este momento.',
  },
]

export const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: CHAT },
  n2: { kind: 'scene', view: PIDE_MAS },
  n2b: { kind: 'scene', view: EXPLICA },
  n3: { kind: 'scene', view: CUENTA },
  n4: { kind: 'scene', view: SE_MOLESTA },
  n5: { kind: 'scene', view: TRANSFERENCIA },
  n6: { kind: 'scene', view: PANEL },
  n6b: { kind: 'scene', view: REGISTRO },
  n7: { kind: 'scene', view: RETIRO },
  e_invierte: {
    kind: 'bad',
    view: TRANSFERENCIA,
    verdict: 'Caíste en la estafa',
    outcome:
      'Los $1.000 salieron y el panel los mostró creciendo durante tres semanas, hasta $1.390. Cuando quisiste retirar te pidieron el 8% de comisión de liberación por adelantado; si lo pagas, aparece otra condición, y después otra. Los $50 que te devolvieron al principio eran tuyos desde el primer momento: fue lo que costó comprarte para la segunda entrega. El grupo se cerró y el número dejó de existir.',
  },
  e_corta: {
    kind: 'good',
    view: SE_MOLESTA,
    verdict: 'No caíste · cortaste a tiempo',
    outcome:
      'Te quedaste con tus $200 recuperados y no pusiste un dólar más. La plataforma cerró siete semanas después con varios cientos de personas dentro, la mayoría con dinero puesto justo por lo mismo que a ti te ofrecieron: el primer retiro había llegado. Lo que te sacó no fue mirar bien la pantalla, fue saber que una ganancia garantizada no existe.',
  },
  e_ignora: {
    kind: 'partial',
    view: CHAT,
    verdict: 'No pusiste más, pero quedaste dentro',
    outcome:
      'Dejaste de contestar y no invertiste los $1.000, que es lo que importaba. Pero tus $200 iniciales siguen en la plataforma y el panel te los sigue mostrando crecer: si en dos meses te tienta retirarlos, la comisión de liberación te va a pedir dinero nuevo para sacar dinero que ya no existe.',
    score: 50,
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'garantiza',
    pantalla: 'n2',
    texto: 'La palabra es <b>garantizado</b>. Ninguna inversión garantiza una ganancia fija.',
  },
  {
    id: 's2',
    targetId: 'primer-pago',
    pantalla: 'n1',
    texto:
      'El <b>primer retiro sí llega</b>. No prueba nada: compra tu confianza para la entrega grande.',
  },
  {
    id: 's3',
    targetId: 'comision',
    pantalla: 'n7',
    texto:
      'Te piden <b>dinero por adelantado para retirar</b>. Nadie cobra por dejarte sacar lo tuyo.',
  },
  {
    id: 's4',
    targetId: 'registro',
    pantalla: 'n6b',
    texto:
      'La empresa <b>no está autorizada a captar dinero del público</b>. No hay a quién reclamar.',
  },
  {
    id: 's5',
    targetId: 'panel',
    pantalla: 'n6',
    texto:
      'Los números del panel los <b>escribe quien cobra</b>. Que suban no prueba que haya fondos.',
  },
  {
    id: 's6',
    targetId: 'desprecia',
    pantalla: 'n4',
    texto:
      'Cuando dudas, <b>cambia de tono y mete prisa</b>: el cupo que vence es la presión de siempre.',
  },
]

const RULE =
  'Regla de oro: <b>ninguna inversión garantiza una ganancia fija</b>, y quien te cobra por dejarte retirar tu dinero no lo tiene. Antes de poner un dólar, comprueba en el registro público si la empresa existe y si está autorizada a recibir dinero del público. Que el primer retiro llegue no prueba nada: eso es lo que cuesta la trampa.'

const RESUMEN = 'Una plataforma garantiza 30% mensual, y tu primer retiro pequeño sí llegó.'

const CONTEXTO: Contexto = {
  antes: (
    <>
      Un conocido te metió en un <strong>grupo de inversión</strong> por mensajería, donde la gente
      publica capturas de sus ganancias. Probaste con <strong>$200</strong>, la cantidad mínima.
    </>
  ),
  ahora: (
    <>
      <strong>Este mes</strong> pediste retirar y te llegaron $250 a tu cuenta: los $200 tuyos más
      $50 de rendimiento. El asesor te escribe para hablar del siguiente paso.
    </>
  ),
}

function GananciaGarantizada() {
  return (
    <StoryEscenario
      escenarioId="estafa/ganancia-garantizada"
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
          Actúa sobre el teléfono como lo harías con el tuyo: contéstale al asesor y usa{' '}
          <strong>cualquier app de abajo</strong>. Ten en cuenta que el primer retiro sí te llegó.
        </p>
      }
      pista={
        <p>
          Puedes seguirle la conversación, abrir el panel de la plataforma, intentar retirar lo que
          tienes ahí, consultar si la empresa existe o ir directo a invertir. Fíjate en qué es
          exactamente lo que te están garantizando.
        </p>
      }
    />
  )
}

export default GananciaGarantizada
