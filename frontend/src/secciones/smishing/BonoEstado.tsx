import { Camera, Compass, MessageSquareText, Wallet } from 'lucide-react'
import StoryEscenario, { type AppTelefono, type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'

/// El acortador se ve como texto y no como dirección: eso es justo lo que la
/// señal s2 enseña, así que el enlace se pinta tal cual llega, sin desplegar.
const ENLACE =
  '<a href="https://bit.ly/bono-ec-2026" data-hotspot-goto="n2" data-hotspot-label="Abrió el enlace acortado del mensaje">bit.ly/bono-ec-2026</a>'

const TEXTO_BONO = `MIES INFORMA: usted fue PRESELECCIONADO para el bono de $180. Registre su cuenta bancaria antes de las 18h00 de hoy o el cupo pasa a otro beneficiario: ${ENLACE}`

const SMS: ScreenView = {
  kind: 'sms',
  sender: 'MIES-BONO',
  sub: 'Remitente sin verificar · SMS',
  senalRemitente: 'remitente',
  msgs: [{ text: TEXTO_BONO, time: '09:41', senal: 'mensaje' }],
}

const PAGINA: ScreenView = {
  kind: 'web',
  url: 'http://bono-social-ec.online/registro',
  secure: false,
  senalUrl: 'url',
  brand: 'Registro de beneficiarios',
  title: 'Acreditación del bono de $180',
  subtitle: 'Verifica tu identidad y la cuenta donde recibirás la transferencia.',
  fields: [
    { label: 'Cédula', placeholder: '0000000000' },
    { label: 'Usuario de banca en línea', placeholder: 'tu usuario' },
    { label: 'Clave de banca en línea', placeholder: '••••••••', senal: 'clave' },
    { label: 'Código que te llegó por SMS', placeholder: '000000', senal: 'codigo' },
  ],
  button: 'Acreditar mi bono',
  botonGoto: 'e_datos',
  botonLabel: 'Envió cédula, usuario, clave y código de verificación',
  cerrarGoto: 'e_cierra',
  cerrarLabel: 'Salió de la página sin enviar los datos',
}

/// El navegador abre en sus sitios frecuentes. Abrirlo no comprueba nada: la
/// dirección oficial la eliges tú, y esa elección es la lección.
const NAVEGADOR: ScreenView = {
  kind: 'web',
  app: 'Navegador',
  url: 'inicio',
  secure: true,
  brand: 'Sitios frecuentes',
  title: 'Nueva pestaña',
  opciones: [
    { texto: 'elcomercio.com', detalle: 'Noticias del Ecuador' },
    { texto: 'bancolitoral.ec', detalle: 'Banca en línea' },
    {
      texto: 'inclusion.gob.ec',
      detalle: 'Ministerio de Inclusión Económica y Social',
      goto: 'e_verifica',
      label: 'Entró al sitio oficial del MIES desde sus sitios frecuentes',
    },
    { texto: 'sri.gob.ec', detalle: 'Servicio de Rentas Internas' },
  ],
  fields: [],
  button: '',
}

/// Lo que el participante ve al comprobarlo por su cuenta. El acierto tiene
/// que enseñarse en pantalla, no solo contarse en el veredicto: la lección es
/// que la fuente oficial *da una respuesta*, y una pantalla que no cambia no
/// lo demuestra.
const PORTAL_MIES: ScreenView = {
  kind: 'web',
  url: 'https://www.inclusion.gob.ec/consulta-de-beneficiarios',
  secure: true,
  brand: 'MIES · Ministerio de Inclusión Económica y Social',
  title: 'Consulta de beneficiarios',
  subtitle: 'Resultado para la cédula registrada a tu nombre.',
  datos: [
    { etiqueta: 'Bonos o subsidios activos', valor: 'Ninguno' },
    { etiqueta: 'Procesos de preselección', valor: 'Ninguno' },
    { etiqueta: 'Registros pendientes', valor: 'Ninguno' },
  ],
  aviso:
    'El MIES no preselecciona beneficiarios por mensajes de texto ni solicita claves de banca en línea. Los trámites se realizan únicamente en este portal o en las oficinas del Ministerio.',
  fields: [],
  button: '',
}

const APPS: AppTelefono[] = [
  {
    Icono: Compass,
    texto: 'Navegador',
    color: '#1971c2',
    goto: 'n3',
    label: 'Abrió el navegador para comprobarlo por su cuenta',
  },
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
]

const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: SMS },
  n2: { kind: 'scene', view: PAGINA },
  n3: { kind: 'scene', view: NAVEGADOR },
  e_datos: {
    kind: 'bad',
    view: PAGINA,
    verdict: 'Caíste en la trampa',
    outcome:
      'Entregaste tu usuario, tu clave y el código de verificación. Con los tres entraron a tu banca en línea desde otro dispositivo y vaciaron tu cuenta de ahorros.',
  },
  e_cierra: {
    kind: 'good',
    view: PAGINA,
    verdict: 'No caíste · el formulario te delató',
    outcome:
      'Ninguna institución pública necesita tu clave de banca en línea para depositarte. Saliste de la página y reportaste el mensaje.',
  },
  e_verifica: {
    kind: 'good',
    view: PORTAL_MIES,
    verdict: 'No caíste · buscaste la fuente oficial',
    outcome:
      'En el portal del MIES no constaba ningún bono a tu nombre ni ninguna preselección: no existía el registro exprés que anunciaba el SMS. El mensaje circulaba masivamente ese día.',
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'mensaje',
    pantalla: 'n1',
    texto: 'Te da un <b>premio que nunca pediste</b> y un plazo de horas para reclamarlo.',
  },
  {
    id: 's2',
    targetId: 'mensaje',
    pantalla: 'n1',
    texto:
      'El enlace está <b>acortado</b> (bit.ly): el texto que ves no dice a qué página te lleva, así que no puedes saber a dónde vas hasta que ya estás ahí.',
  },
  {
    id: 's3',
    targetId: 'url',
    pantalla: 'n2',
    texto:
      'La página está en <b>bono-social-ec.online</b>, y las páginas del Estado ecuatoriano terminan en <b>.gob.ec</b>. El nombre suena oficial, pero el final delata que no lo es. Tampoco empieza por https: ni siquiera protege lo que escribes.',
  },
  {
    id: 's4',
    targetId: 'clave',
    pantalla: 'n2',
    texto:
      'Pide tu <b>clave de banca en línea</b> para "recibir" un depósito. Para que te depositen basta tu número de cuenta: la clave solo sirve para sacar dinero, nunca para meterlo.',
  },
  {
    id: 's5',
    targetId: 'codigo',
    pantalla: 'n2',
    texto:
      'Pide el <b>código que te llega por SMS</b>. Ese código es la última puerta de tu banco: con tu clave y con él ya entran a tu cuenta desde su propio teléfono.',
  },
]
const RULE =
  'Regla de oro: para <b>recibir</b> dinero nadie necesita tu clave ni tu código de verificación; solo tu número de cuenta. Cualquier bono o subsidio se confirma en el sitio oficial <b>.gob.ec</b>, escrito por ti.'

const RESUMEN = 'Un SMS anuncia que tu cédula quedó preseleccionada para un bono de $180.'

const CONTEXTO: Contexto = {
  antes: 'Nunca postulaste a ningún bono, pero el dinero haría falta este mes.',
  ahora: (
    <>
      <strong>Una mañana cualquiera</strong> te llega un mensaje de texto que anuncia un{' '}
      <strong>bono de $180</strong> a tu nombre.
    </>
  ),
}

function BonoEstado() {
  return (
    <StoryEscenario
      escenarioId="smishing/bono-estado"
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
          Tienes varios caminos posibles: hacer lo que el mensaje te pide, o dejarlo de lado y
          comprobar por tu cuenta si ese bono existe. Cuál de ellos es el acertado es justamente lo
          que decides tú.
        </p>
      }
    />
  )
}

export default BonoEstado
