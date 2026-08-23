import { Building2, Camera, MessageCircle, Wallet } from 'lucide-react'
import StoryEscenario, { type AppTelefono, type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { CUENTA_FICTICIA, IDENTIDAD_FICTICIA } from '../../lib/identidadFicticia'

/**
 * El departamento que no se puede ver.
 *
 * Aquí lo que aprieta no es la prisa del estafador sino la necesidad de quien
 * busca: cuando llevas un mes viendo departamentos caros y aparece uno bueno y
 * barato, la parte de ti que quiere creer trabaja gratis para el otro lado.
 *
 * La señal decisiva no está escrita en ningún mensaje. Está en el orden: te
 * piden pagar antes de ver, y todo lo demás (el dueño que está fuera, las
 * fotos preciosas, el contrato que llega por correo) existe para justificar ese
 * orden invertido.
 */

const DUENO = 'Sr. Patricio Moncayo'
const NUMERO_DUENO = '+593 96 884 0257'
const CUENTA_DUENO = '7712-3390-46 · Rosa Angélica Tumbaco'
const DEPARTAMENTO = 'Departamento amoblado, 2 dormitorios, La Floresta'
const DEPOSITO = '$700'

const OFRECE = {
  text: `Buenas noches. Sí, el departamento sigue disponible: $350 mensuales, amoblado, incluye alícuota. Para reservarlo necesito el depósito de garantía de ${DEPOSITO} (dos meses), y le entrego las llaves apenas llegue a Quito.`,
  time: '20:38',
  senal: 'paga-primero',
}

const CHAT: ScreenView = {
  kind: 'sms',
  sender: DUENO,
  sub: `${NUMERO_DUENO} · dueño del anuncio`,
  msgs: [OFRECE],
  respuestas: [
    {
      texto: 'Quisiera verlo antes. ¿Cuándo puedo pasar?',
      goto: 'n2',
      label: 'Pidió ver el departamento antes de pagar',
    },
    {
      texto: 'Me interesa. ¿A qué cuenta deposito la garantía?',
      goto: 'n3',
      label: 'Aceptó pagar la garantía sin ver el departamento',
    },
  ],
  volverGoto: 'e_ignora',
  volverLabel: 'Salió del chat sin seguir el trato',
}

const NO_SE_PUEDE_VER: ScreenView = {
  ...CHAT,
  msgs: [
    OFRECE,
    { text: 'Quisiera verlo antes. ¿Cuándo puedo pasar?', time: '20:41', mine: true },
    {
      text: 'Ese es el problema: yo estoy trabajando en Lago Agrio y bajo recién el 12. El departamento está cerrado y no hay quien le abra hasta que yo vuelva. Por eso lo doy tan barato, para no tenerlo vacío. Le mando más fotos y el contrato si quiere 📄',
      time: '20:42',
      senal: 'no-se-ve',
    },
  ],
  respuestas: [
    {
      texto: 'Entiendo. Deme la cuenta y le deposito.',
      goto: 'n3',
      label: 'Aceptó pagar sin poder ver el departamento',
    },
    {
      texto: '¿No hay algún familiar o conserje que me abra?',
      goto: 'n4',
      label: 'Pidió que alguien más le abriera el departamento',
    },
  ],
}

const CUENTA: ScreenView = {
  ...CHAT,
  msgs: [
    OFRECE,
    { text: 'Me interesa. ¿A qué cuenta deposito la garantía?', time: '20:41', mine: true },
    {
      text: `Deposite a esta cuenta: ${CUENTA_DUENO}. Está a nombre de mi hermana, que es la que me maneja las cosas mientras estoy fuera. Mándeme el comprobante y le paso el contrato firmado por correo esta misma noche.`,
      time: '20:43',
      senal: 'cuenta',
    },
  ],
  respuestas: [
    {
      texto: 'Ya mismo deposito los $700.',
      goto: 'n5',
      label: 'Fue a transferir la garantía',
    },
    {
      texto: 'Un contrato no me sirve si no he visto el lugar.',
      goto: 'n4',
      label: 'Dijo que el contrato no sustituía a ver el departamento',
    },
  ],
}

const APRIETA: ScreenView = {
  ...CHAT,
  msgs: [
    OFRECE,
    { text: 'Un contrato no me sirve si no he visto el lugar.', time: '20:46', mine: true },
    {
      text: 'Mire, tengo tres personas interesadas y una señorita ya me pidió los datos para depositar mañana temprano. Yo se lo doy al primero que reserve, es lo justo. Si usted no está seguro no hay problema, se lo entiendo perfectamente 🙏',
      time: '20:47',
      senal: 'prisa',
    },
  ],
  respuestas: [
    {
      texto: 'No lo quiero perder. Ya deposito.',
      goto: 'n5',
      label: 'Cedió a la prisa y fue a depositar',
    },
    {
      texto: 'Si no puedo verlo, prefiero dejarlo.',
      goto: 'e_deja',
      label: 'Dejó pasar el departamento antes que pagar sin verlo',
    },
  ],
}

/// El anuncio. Las fotos son de verdad, pero no son suyas: la búsqueda por
/// imagen las encuentra en un anuncio de venta de hace dos años.
const ANUNCIO: ScreenView = {
  kind: 'web',
  app: 'Portal Inmobiliario',
  url: 'portalinmobiliario.ec',
  secure: true,
  brand: 'Anuncio de arriendo',
  title: DEPARTAMENTO,
  subtitle: '$350 mensuales · publicado hace 5 días',
  datos: [
    { etiqueta: 'Precio de la zona', valor: '$520 a $650 por algo parecido', senal: 'precio' },
    { etiqueta: 'Publicado por', valor: `${DUENO} · sin verificar`, senal: 'perfil' },
    { etiqueta: 'Dirección exacta', valor: 'No consta, solo el sector', senal: 'direccion' },
    { etiqueta: 'Fotos', valor: 'Ocho, muy buenas, con muebles que no se repiten en ninguna' },
    { etiqueta: 'Visitas', valor: 'No disponibles hasta el 12' },
  ],
  opciones: [
    {
      texto: 'Buscar de dónde salieron las fotos',
      detalle: 'Búsqueda por imagen',
      goto: 'n7',
      label: 'Buscó el origen de las fotos del anuncio',
    },
    { texto: 'Guardar el anuncio', detalle: 'Para verlo después' },
    { texto: 'Ver otros en el sector', detalle: '23 departamentos en La Floresta' },
  ],
  cerrarGoto: 'n1',
  cerrarLabel: 'Volvió al chat desde el anuncio',
  fields: [],
  button: '',
}

const IMAGENES: ScreenView = {
  kind: 'web',
  app: 'Navegador',
  url: 'buscador.com/imagen',
  secure: true,
  brand: 'Búsqueda por imagen',
  title: 'Estas fotos ya estaban en internet',
  subtitle: 'Cuatro coincidencias exactas.',
  resultados: [
    {
      titulo: 'Departamento en venta, La Floresta · vendido',
      url: 'inmobiliariacaicedo.ec/vendidos/2024',
      fragmento:
        'Las mismas ocho fotos, publicadas hace dos años en un anuncio de venta que ya se cerró.',
      senal: 'fotos',
    },
    {
      titulo: 'Blog de decoración · "Departamentos pequeños bien resueltos"',
      url: 'casaymas.blog/departamentos-pequenos',
      fragmento: 'Reportaje con las mismas fotos del salón y la cocina.',
      senal: 'fotos',
    },
    {
      titulo: 'Arriendo en Cuenca · $300 mensuales',
      url: 'portalinmobiliario.ec/anuncio/88412',
      fragmento: 'Otro anuncio activo con las mismas fotos, en otra ciudad y con otro dueño.',
      senal: 'fotos',
    },
  ],
  cerrarGoto: 'n6',
  cerrarLabel: 'Volvió al anuncio después de rastrear las fotos',
  fields: [],
  button: '',
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
    { etiqueta: 'Cuenta de destino', valor: CUENTA_DUENO, senal: 'cuenta' },
    { etiqueta: 'Concepto', valor: 'Garantía de arriendo' },
    { etiqueta: 'Valor', valor: '$700,00' },
  ],
  aviso: 'Las transferencias enviadas no se pueden reversar.',
  button: 'Transferir $700,00',
  botonGoto: 'e_paga',
  botonLabel: 'Pagó la garantía de un departamento que no había visto',
  cerrarGoto: 'n3',
  cerrarLabel: 'Volvió atrás sin transferir',
  fields: [],
}

const APPS: AppTelefono[] = [
  { Icono: MessageCircle, texto: 'Mensajes', color: '#2f9e44', hilo: 'sms' },
  {
    Icono: Building2,
    texto: 'Portal Inmobiliario',
    color: '#c2255c',
    goto: 'n6',
    label: 'Abrió el anuncio del departamento',
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
  n2: { kind: 'scene', view: NO_SE_PUEDE_VER },
  n3: { kind: 'scene', view: CUENTA },
  n4: { kind: 'scene', view: APRIETA },
  n5: { kind: 'scene', view: TRANSFERENCIA },
  n6: { kind: 'scene', view: ANUNCIO },
  n7: { kind: 'scene', view: IMAGENES },
  e_paga: {
    kind: 'bad',
    view: TRANSFERENCIA,
    verdict: 'Caíste en la estafa',
    outcome:
      'Los $700 salieron a la cuenta de Rosa Tumbaco. El contrato llegó por correo esa misma noche, muy bien hecho y sin valor ninguno. El 12 no contestó, el 13 tampoco, y el 14 el número ya no existía. El departamento de las fotos se vendió hace dos años y nunca estuvo en arriendo: quien te escribía no tenía nada que entregar.',
  },
  e_deja: {
    kind: 'good',
    view: APRIETA,
    verdict: 'No caíste · no pagaste sin ver',
    outcome:
      'Lo dejaste ir sin poner un dólar. El anuncio siguió activo dos semanas más y después desapareció, junto con otro idéntico que el mismo número tenía puesto en Cuenca. Un arriendo se ve, se firma y se paga, en ese orden, y ningún dueño de verdad pide la garantía de alguien a quien no le puede abrir la puerta.',
  },
  e_ignora: {
    kind: 'partial',
    view: CHAT,
    verdict: 'No perdiste nada, pero no comprobaste nada',
    outcome:
      'Dejaste de contestar y no pagaste, que es lo que importaba. Pero no miraste el anuncio ni de dónde salían las fotos, así que sigue pareciéndote que el problema era el dueño y no el trato. El próximo que te escriba va a ser más simpático, y el orden va a ser el mismo: pagar antes de ver.',
    score: 50,
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'paga-primero',
    pantalla: 'n1',
    texto:
      'Te piden <b>pagar antes de ver</b>. Ese es el orden invertido, y es toda la estafa: un arriendo de verdad se ve primero, se firma después y se paga al firmar.',
  },
  {
    id: 's2',
    targetId: 'no-se-ve',
    pantalla: 'n2',
    texto:
      'El dueño <b>está fuera de la ciudad</b> y nadie más puede abrir. Es la excusa que sostiene el orden invertido: si el lugar no existe o no es suyo, no hay nada que enseñar.',
  },
  {
    id: 's3',
    targetId: 'fotos',
    pantalla: 'n7',
    texto:
      'Las <b>fotos ya estaban en internet</b>: son de un anuncio de venta de hace dos años, y el mismo juego está publicado en otra ciudad. Buscar por imagen cuesta un toque y desarma el anuncio entero.',
  },
  {
    id: 's4',
    targetId: 'cuenta',
    pantalla: 'n3',
    texto:
      'La cuenta está a <b>otro nombre</b>, con la explicación de la hermana. Es lo que hace que después no haya nadie a quien reclamarle.',
  },
  {
    id: 's5',
    targetId: 'precio',
    pantalla: 'n6',
    texto:
      'El precio está <b>bastante por debajo del sector</b>. En arriendos, el descuento grande no es una oportunidad: es lo que compra que aceptes las condiciones raras.',
  },
  {
    id: 's6',
    targetId: 'prisa',
    pantalla: 'n4',
    texto:
      'Las <b>otras tres personas interesadas</b> aparecen justo cuando dudas, y con mucha educación: "si no está seguro, no hay problema". La cortesía también sirve para apurar.',
  },
]

const RULE =
  'Regla de oro: en un arriendo el orden es <b>ver, firmar y después pagar</b>. Nunca deposites una garantía por un lugar que no has pisado, ni a una cuenta que está a otro nombre. Si el dueño no puede enseñártelo, no es tu problema resolverlo: es la señal de que no hay nada que enseñar.'

const RESUMEN = 'Un departamento barato cuya garantía hay que depositar antes de poder verlo.'

const CONTEXTO: Contexto = {
  antes: (
    <>
      Llevas <strong>un mes buscando departamento</strong> y todo lo que ves en el sector que te
      interesa se va de tu presupuesto.
    </>
  ),
  ahora: (
    <>
      <strong>Anoche</strong> encontraste uno amoblado por bastante menos de lo normal y le
      escribiste al dueño, que contestó enseguida.
    </>
  ),
}

function ArriendoAnticipado() {
  return (
    <StoryEscenario
      escenarioId="estafa/arriendo-anticipado"
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
          Actúa sobre el teléfono como lo harías con el tuyo: contéstale al dueño y usa{' '}
          <strong>cualquier app de abajo</strong>.
        </p>
      }
      pista={
        <p>
          Puedes negociar por el chat, abrir el anuncio a mirarlo con calma, rastrear de dónde
          salieron las fotos o ir directo a depositar. Fíjate en el orden de las cosas: qué te piden
          hacer primero.
        </p>
      }
    />
  )
}

export default ArriendoAnticipado
