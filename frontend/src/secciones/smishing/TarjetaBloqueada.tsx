import { Compass, MessageSquareText, Phone, Wallet } from 'lucide-react'
import StoryEscenario, { type AppTelefono, type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import { IDENTIDAD_FICTICIA } from '../../lib/identidadFicticia'

/**
 * El SMS que no trae enlace sino un número al que llamar.
 *
 * Los otros escenarios del módulo enseñan a mirar una dirección. Aquí no hay
 * ninguna: la trampa es un número de teléfono, y marcarlo te mete en una
 * llamada donde el engaño ya no se lee, se escucha. Es el puente natural hacia
 * el módulo de vishing.
 *
 * Un teléfono convierte cualquier número de un mensaje en algo que se toca, así
 * que marcarlo cuesta un gesto y comprobarlo cuesta buscar la tarjeta. Esa
 * diferencia de esfuerzo es justo la que explota el ataque, y por eso el
 * escenario deja las dos cosas a un toque de distancia.
 */

const NUMERO_FALSO = '09 87 654 321'
const PREGUNTA = '¿Qué consumo fue? No reconozco ningún bloqueo.'

/// El número va como enlace porque en un teléfono lo es: el sistema los
/// detecta y los vuelve pulsables. Que se toque sin pensar es parte del ataque.
const TEXTO = `BANCO DEL LITORAL: su tarjeta terminada en ${IDENTIDAD_FICTICIA.tarjeta} fue BLOQUEADA por un intento de consumo no reconocido. Para reactivarla comuniquese de inmediato al <a href="tel:0987654321" data-hotspot-goto="n2" data-hotspot-label="Llamó al número que venía en el mensaje">${NUMERO_FALSO}</a>.`

const SMS: ScreenView = {
  kind: 'sms',
  sender: 'BANCO-LIT',
  sub: 'Remitente sin verificar · SMS',
  senalRemitente: 'remitente',
  msgs: [{ text: TEXTO, time: '20:36', senal: 'mensaje' }],
  // Ninguna de las dos entrega un dato, y aun así ninguna es gratis: contestar
  // ya confirma que la línea existe. La segunda además encadena con la prisa
  // que el mensaje intenta meter, y por eso lleva a la llamada.
  respuestas: [
    { texto: PREGUNTA, goto: 'e_responde', label: 'Contestó el mensaje preguntando por el consumo' },
    {
      texto: 'No me anulen la tarjeta, ya los llamo.',
      goto: 'n2',
      label: 'Contestó el mensaje y marcó el número que le daban',
    },
  ],
  volverGoto: 'e_ignora',
  volverLabel: 'Salió del hilo sin hacer nada',
}

/// El hilo con la pregunta ya enviada. El final se ve sobre lo que de verdad
/// salió del teléfono, no sobre un borrador que nunca se mandó.
const SMS_RESPONDIDO: ScreenView = {
  ...SMS,
  respuestas: undefined,
  volverGoto: undefined,
  msgs: [
    { text: TEXTO, time: '20:36', senal: 'mensaje' },
    { text: PREGUNTA, time: '20:38', mine: true },
  ],
}

/// La llamada. El escenario no termina al marcar: termina en lo que se dice
/// dentro, que es donde está la lección. Quien marca todavía puede colgar.
const LLAMADA: ScreenView = {
  kind: 'web',
  app: 'Teléfono',
  url: 'llamada',
  secure: true,
  brand: `En llamada · ${NUMERO_FALSO}`,
  title: '"Departamento de seguridad"',
  subtitle:
    'Contesta un hombre con voz tranquila y ruido de central telefónica de fondo. Confirma tu nombre y los cuatro últimos dígitos de tu tarjeta antes de que preguntes nada.',
  datos: [
    {
      etiqueta: 'Le dicen',
      valor:
        '"Para levantar el bloqueo necesito el código de seis dígitos que le acaba de llegar por mensaje."',
      senal: 'piden-codigo',
    },
    {
      etiqueta: 'Y añaden',
      valor: '"No corte: si corta la tarjeta queda anulada y hay que emitir una nueva."',
      senal: 'no-cuelgue',
    },
  ],
  fields: [],
  button: 'Dictar el código',
  botonGoto: 'e_dicta',
  botonLabel: 'Dictó por teléfono el código que le llegó',
  cerrarGoto: 'e_cuelga',
  cerrarLabel: 'Colgó sin dictar el código',
}

/// El inicio de la banca móvil. Abrir la app todavía no es haber comprobado
/// nada: desde aquí se puede mirar el estado de la tarjeta o anularla a ciegas,
/// que es el gesto precipitado que este escenario mide. Un icono que resuelve
/// el escenario de un toque premia haber encontrado el icono, no haber sabido
/// qué hacer con él.
const BANCO_INICIO: ScreenView = {
  kind: 'web',
  app: 'Banco',
  url: 'inicio',
  secure: true,
  brand: 'Banco del Litoral · Banca móvil',
  title: `Tarjeta ${IDENTIDAD_FICTICIA.tarjeta}`,
  subtitle: 'Cupo disponible $1.240,00',
  opciones: [
    { texto: 'Transferir', detalle: 'A cuentas propias o de terceros' },
    {
      texto: 'Mis tarjetas',
      detalle: 'Estado, bloqueos e intentos rechazados',
      goto: 'e_app',
      label: 'Revisó el estado de sus tarjetas en la app del banco',
    },
    { texto: 'Movimientos', detalle: 'Consumos y débitos de los últimos 30 días' },
    {
      texto: 'Bloquear tarjeta',
      detalle: 'Anula la tarjeta de forma inmediata',
      goto: 'e_bloquea',
      label: 'Anuló la tarjeta sin comprobar antes si el bloqueo era cierto',
    },
  ],
  fields: [],
  button: '',
}

/// Lo que se ve al mirar las tarjetas: nunca estuvo bloqueada, y el número de
/// verdad está ahí escrito. El acierto se enseña, no se cuenta.
const APP_BANCO: ScreenView = {
  kind: 'web',
  app: 'Banco',
  url: 'inicio',
  secure: true,
  brand: 'Banco del Litoral · Banca móvil',
  title: 'Tus tarjetas',
  subtitle: 'Estado en tiempo real, actualizado hace un minuto.',
  datos: [
    {
      etiqueta: `Tarjeta ${IDENTIDAD_FICTICIA.tarjeta}`,
      valor: 'Activa · sin bloqueos ni intentos rechazados',
      senal: 'sin-bloqueo',
    },
    { etiqueta: 'Último consumo', valor: 'Supermercado, hace tres días, $38,20' },
    { etiqueta: 'Atención al cliente', valor: '1700 123 456 · el mismo del reverso de tu tarjeta' },
  ],
  aviso:
    'El banco nunca te pide por teléfono el código que te envía por mensaje. Si dudas de una llamada, cuelga y marca tú el número impreso en el reverso de tu tarjeta.',
  fields: [],
  button: '',
}

const APPS: AppTelefono[] = [
  {
    Icono: Wallet,
    texto: 'Banco',
    color: '#155e75',
    goto: 'n3',
    label: 'Abrió la app del banco para comprobar el bloqueo',
  },
  { Icono: MessageSquareText, texto: 'Mensajes', color: '#2f9e44' },
  {
    Icono: Phone,
    texto: 'Teléfono',
    color: '#495057',
    vacia: 'Sin llamadas recientes. Puedes marcar un número desde aquí.',
  },
  {
    Icono: Compass,
    texto: 'Navegador',
    color: '#1971c2',
    vacia: 'Nueva pestaña. No hay ninguna dirección escrita todavía.',
  },
]

const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: SMS },
  n2: { kind: 'scene', view: LLAMADA },
  n3: { kind: 'scene', view: BANCO_INICIO },
  e_dicta: {
    kind: 'bad',
    view: LLAMADA,
    verdict: 'Caíste en la trampa',
    outcome:
      'Tu tarjeta nunca estuvo bloqueada. El código que dictaste autorizaba una compra que ellos hacían mientras hablabas: mil doscientos dólares en electrónica. Y la llamada la hiciste tú.',
  },
  e_cuelga: {
    kind: 'good',
    view: LLAMADA,
    verdict: 'No caíste · no dictaste el código',
    outcome:
      'Colgaste al oír que te pedían el código. Ningún banco lo pide por teléfono, y la insistencia en no cortar era la señal más clara. Llamar ya confirmó tu línea: espera más intentos.',
  },
  e_bloquea: {
    kind: 'partial',
    view: BANCO_INICIO,
    verdict: 'Anulaste una tarjeta que estaba sana',
    outcome:
      'No entregaste nada, pero la tarjeta no tenía ningún bloqueo: la anulaste tú. Te quedas sin ella hasta que llegue la nueva. Su estado estaba a un toque, en "Mis tarjetas".',
  },
  e_responde: {
    kind: 'partial',
    view: SMS_RESPONDIDO,
    verdict: 'No entregaste nada, pero contestaste',
    outcome:
      'No diste ningún dato, pero confirmaste que alguien lee esa línea. Ahora tienen una conversación abierta contigo para insistir mejor.',
  },
  e_ignora: {
    kind: 'partial',
    view: SMS,
    verdict: 'No caíste, pero te quedaste con la duda',
    outcome:
      'Saliste sin llamar ni contestar, que es lo que evita el daño. Pero si el bloqueo hubiera sido real, seguirías sin tarjeta y sin saberlo.',
  },
  e_app: {
    kind: 'good',
    view: APP_BANCO,
    verdict: 'No caíste · lo comprobaste donde consta',
    outcome:
      'Tu tarjeta estaba activa y sin intentos rechazados: no había bloqueo que levantar. En la misma pantalla estaba el número de atención de verdad.',
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'mensaje',
    pantalla: 'n1',
    texto:
      'No hay enlace que mirar: la trampa es <b>un número de teléfono</b>. En un móvil basta tocarlo, y por eso cuesta menos llamar que comprobar.',
  },
  {
    id: 's2',
    targetId: 'remitente',
    pantalla: 'n1',
    texto:
      'El remitente es un <b>nombre corto sin verificar</b>. Cualquiera manda mensajes con el nombre que quiera escrito arriba.',
  },
  {
    id: 's3',
    targetId: 'piden-codigo',
    pantalla: 'n2',
    texto:
      'Te piden el <b>código que te acaba de llegar</b>. Ese código autoriza operaciones: dictarlo es firmar lo que hagan al otro lado.',
  },
  {
    id: 's4',
    targetId: 'no-cuelgue',
    pantalla: 'n2',
    texto:
      '<b>Insisten en que no cuelgues.</b> Colgar y llamar tú rompe el engaño, y por eso es lo primero que impiden.',
  },
  {
    id: 's5',
    targetId: 'sin-bloqueo',
    pantalla: 'e_app',
    texto:
      'En la app <b>no había ningún bloqueo</b>. El estado real está ahí y en el reverso de tu tarjeta: dos sitios que no dependen de quien te escribió.',
  },
]

const RULE =
  'Regla de oro: <b>al número del mensaje no se llama</b>. Si de verdad hubiera un problema con tu tarjeta, lo ves en la app o llamas al número impreso en su reverso. Y ningún banco te pide por teléfono el código que te envía por mensaje: ese código autoriza, no identifica.'

const RESUMEN = 'Un SMS avisa que tu tarjeta fue bloqueada y da un número para reactivarla.'

const CONTEXTO: Contexto = {
  antes:
    'Usas esa tarjeta casi a diario y la última compra fue hace unos días, en el supermercado.',
  ahora: (
    <>
      <strong>Ya de noche</strong> te llega un mensaje que dice que tu tarjeta está{' '}
      <strong>bloqueada por un consumo no reconocido</strong>.
    </>
  ),
  detalle: 'Trae los cuatro últimos dígitos de tu tarjeta, y son los tuyos.',
}

function TarjetaBloqueada() {
  return (
    <StoryEscenario
      escenarioId="smishing/tarjeta-bloqueada"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule={RULE}
      restartLabel="↻ Repetir el escenario"
      accionesEnPantalla
      apps={APPS}
      identidad={['tarjeta']}
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Actúa sobre el teléfono como lo harías con el tuyo: puedes usar{' '}
          <strong>cualquier parte de él</strong>, incluidas las apps de abajo.
        </p>
      }
      pista={
        <p>
          Este mensaje no trae enlace, trae un número. Puedes llamarlo, contestar el mensaje, salir
          del hilo, o comprobar el estado de tu tarjeta por tu cuenta. Cuál de ellos es el acertado
          es justamente lo que decides tú.
        </p>
      }
    />
  )
}

export default TarjetaBloqueada
