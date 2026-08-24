import { Camera, Compass, MessageSquareText, Wallet } from 'lucide-react'
import StoryEscenario, { type AppTelefono, type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'

const ENLACE =
  '<a href="https://transito-ec-pagos.com/citacion" data-hotspot-goto="n2" data-hotspot-label="Abrió el enlace de pago del mensaje">https://transito-ec-pagos.com/citacion</a>'

const PRIMER_SMS = {
  text: `TRANSITO EC: tiene una citación pendiente. Cancele antes del viernes o el valor se duplica. Consulte y pague aquí: ${ENLACE}`,
  time: '08:27',
  senal: 'mensaje',
}

const SMS: ScreenView = {
  kind: 'sms',
  sender: 'TRANSITO-EC',
  sub: 'Remitente sin verificar · SMS',
  senalRemitente: 'remitente',
  msgs: [PRIMER_SMS],
  composerGoto: 'n1b',
  composerLabel: 'Respondió el mensaje preguntando qué placa tiene la multa',
}

/// El mismo hilo después de haber comprobado. Ahora salir de él sí decide: se
/// deja el mensaje sabiendo lo que es, que es lo que se quería medir.
const SMS_VERIFICADO: ScreenView = {
  ...SMS,
  volverGoto: 'e_portal',
  volverLabel: 'Dejó el mensaje después de comprobarlo en el portal oficial',
}

const SMS_RESPONDIDO: ScreenView = {
  ...SMS,
  composerGoto: undefined,
  msgs: [
    PRIMER_SMS,
    { text: '¿Cuál es la placa?', time: '08:31', mine: true },
    {
      text: 'Para consultar debe ingresar placa y cédula en el enlace. Último plazo viernes 17h00.',
      time: '08:32',
      senal: 'respuesta',
    },
  ],
}

const PAGINA: ScreenView = {
  kind: 'web',
  url: 'https://transito-ec-pagos.com/citacion',
  secure: true,
  senalUrl: 'url',
  brand: 'Tránsito EC',
  title: 'Consulta y pago de citaciones',
  subtitle: 'Ingrese sus datos para verificar valores pendientes.',
  fields: [
    { label: 'Placa del vehículo', placeholder: 'ABC-1234', senal: 'datos' },
    { label: 'Cédula del propietario', placeholder: '0000000000' },
    { label: 'Número de tarjeta', placeholder: '0000 0000 0000 0000', senal: 'tarjeta' },
    { label: 'Fecha de caducidad', placeholder: 'MM/AA' },
    { label: 'Código de seguridad (CVV)', placeholder: '123', senal: 'tarjeta' },
  ],
  button: 'Pagar citación',
  botonGoto: 'e_pago',
  botonLabel: 'Pagó la citación con placa, cédula y tarjeta',
  cerrarGoto: 'e_cierra',
  cerrarLabel: 'Salió de la página sin enviar los datos',
}

/// El navegador abre en sus sitios frecuentes, no en el portal. Es el
/// equivalente móvil de la barra de marcadores: entrar por tu cuenta sigue
/// siendo una decisión con dirección, no un icono que resuelve el escenario.
const NAVEGADOR: ScreenView = {
  kind: 'web',
  app: 'Navegador',
  url: 'inicio',
  secure: true,
  brand: 'Sitios frecuentes',
  title: 'Nueva pestaña',
  opciones: [
    { texto: 'elcomercio.com', detalle: 'Noticias del Ecuador' },
    {
      texto: 'ant.gob.ec',
      detalle: 'Agencia Nacional de Tránsito · consultas y trámites',
      goto: 'n_portal',
      label: 'Entró al portal oficial de la ANT desde sus sitios frecuentes',
    },
    { texto: 'sri.gob.ec', detalle: 'Servicio de Rentas Internas' },
    { texto: 'bancolitoral.ec', detalle: 'Banca en línea' },
  ],
  fields: [],
  button: '',
  cerrarGoto: 'n_sms_verificado',
  cerrarLabel: 'Cerró el navegador',
}

/// El portal de verdad, abierto escribiendo tú la dirección. Que la consulta
/// devuelva cero citaciones tiene que verse en pantalla: es la prueba de que
/// el SMS mentía, y contarla solo en el veredicto la deja en promesa.
const PORTAL: ScreenView = {
  kind: 'web',
  url: 'https://www.ant.gob.ec/consulta-de-citaciones',
  secure: true,
  brand: 'ANT · Agencia Nacional de Tránsito',
  title: 'Consulta de citaciones',
  subtitle: 'Resultado para la cédula registrada a tu nombre.',
  datos: [
    { etiqueta: 'Citaciones pendientes', valor: '0' },
    { etiqueta: 'Valores por pagar', valor: '$0,00' },
    { etiqueta: 'Última consulta', valor: 'hoy, 08:34' },
  ],
  aviso:
    'Los valores por infracciones se pagan en ventanilla o desde este portal. La ANT no envía enlaces de pago por mensaje de texto.',
  fields: [],
  button: '',
  // Comprobar es mirar: la respuesta se lee aquí y se vuelve al mensaje,
  // donde está la decisión. Antes esta pantalla solo se veía detrás del
  // veredicto, así que la lección se contaba en vez de enseñarse.
  cerrarGoto: 'n3',
  cerrarLabel: 'Cerró el portal después de ver que no había ninguna citación',
}

/// El navegador es aquí lo que el marcador del portal era en phishing: el
/// camino para consultar la multa escribiendo tú la dirección oficial.
const APPS: AppTelefono[] = [
  { Icono: MessageSquareText, texto: 'Mensajes', color: '#2f9e44' },
  {
    Icono: Wallet,
    texto: 'Banco',
    color: '#155e75',
    vacia: 'Banca móvil · Saldo disponible $312,45. Sin notificaciones nuevas.',
  },
  {
    Icono: Camera,
    texto: 'Cámara',
    color: '#495057',
    vacia: 'La cámara está lista. No hay nada que fotografiar en este momento.',
  },
  {
    Icono: Compass,
    texto: 'Navegador',
    color: '#1971c2',
    goto: 'n3',
    label: 'Abrió el navegador para consultar por su cuenta',
  },
]

const STORY: Story<ScreenNode> = {
  n_portal: { kind: 'scene', view: PORTAL },
  n_sms_verificado: { kind: 'scene', view: SMS_VERIFICADO },
  n1: { kind: 'scene', view: SMS },
  n1b: { kind: 'scene', view: SMS_RESPONDIDO },
  n2: { kind: 'scene', view: PAGINA },
  n3: { kind: 'scene', view: NAVEGADOR },
  e_pago: {
    kind: 'bad',
    view: PAGINA,
    verdict: 'Caíste en la trampa',
    outcome:
      'La citación no existía. Al escribir la tarjeta completa, entregaste los datos necesarios para compras por internet.',
  },
  e_cierra: {
    kind: 'good',
    view: PAGINA,
    verdict: 'No caíste · el formulario pedía lo que debía saber',
    outcome:
      'Saliste de la página antes de enviar datos. Una institución que registra una multa no necesita pescar tu placa por un enlace.',
  },
  e_portal: {
    kind: 'good',
    view: PORTAL,
    verdict: 'No caíste · verificaste por tu canal',
    outcome:
      'Al consultar en el portal oficial no apareció ninguna citación pendiente. El SMS usaba el miedo al recargo para llevarte a una página falsa.',
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'mensaje',
    pantalla: 'n1',
    texto: 'El mensaje <b>no trae tu placa</b>; te pide escribirla porque no la sabe.',
  },
  {
    id: 's2',
    targetId: 'mensaje',
    pantalla: 'n1',
    texto:
      'El plazo "antes del viernes" crea presión, pero no explica artículo, fecha ni lugar de la supuesta infracción.',
  },
  {
    id: 's3',
    targetId: 'url',
    pantalla: 'n2',
    texto:
      'El dominio <b>transito-ec-pagos.com</b> suena oficial, pero no es un portal público ecuatoriano.',
  },
  {
    id: 's4',
    targetId: 'tarjeta',
    pantalla: 'n2',
    texto: 'La página pide <b>tarjeta completa y CVV</b> antes de demostrar que la deuda existe.',
  },
  {
    id: 's5',
    targetId: 'respuesta',
    pantalla: 'n1b',
    texto: 'Al responder, no dan datos concretos: solo empujan de nuevo al mismo enlace.',
  },
]

const RULE =
  'Regla de oro: una multa se consulta entrando tú al portal oficial o en ventanilla. Si el mensaje te pide los datos que la entidad debería conocer, está pescando.'

const RESUMEN = 'Un SMS avisa una citación de tránsito y amenaza con duplicar el valor.'

const CONTEXTO: Contexto = {
  antes: (
    <>
      Tienes carro y ya te ha pasado pagar multas tarde, así que una citación nueva no te parece
      imposible.
    </>
  ),
  ahora: (
    <>
      <strong>Antes de salir al trabajo</strong> recibes un SMS de Tránsito EC con un plazo cercano
      para pagar.
    </>
  ),
}

function CitacionTransito() {
  return (
    <StoryEscenario
      escenarioId="smishing/citacion-transito"
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
          Actúa sobre el teléfono como lo harías con el tuyo: puedes usar{' '}
          <strong>cualquier parte de él</strong>, incluidas las apps de abajo. Antes de tocar un
          enlace, mantén el cursor encima para ver a dónde lleva.
        </p>
      }
      pista={
        <p>
          Tienes varios caminos posibles: hacer lo que el mensaje te pide, responderlo para
          preguntar, o dejarlo de lado y consultar tus multas por tu cuenta desde el teléfono. Cuál
          de ellos es el acertado es justamente lo que decides tú.
        </p>
      }
    />
  )
}

export default CitacionTransito
