import { Building2, Images, MessageCircle, Wallet } from 'lucide-react'
import ScenarioStory, { type PhoneApp, type ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Signal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { ACCOUNT_FAKE, IDENTITY_FAKE } from '../../lib/identidadFicticia'

/** El departamento que no se puede ver: lo que aprieta es la necesidad de quien busca, no la prisa del
 *  estafador. La señal decisiva no está en ningún mensaje sino en el orden: piden pagar antes de ver, y
 *  todo lo demás existe para justificar ese orden invertido. */

const OWNER = 'Sr. Patricio Moncayo'
const NUMBER_OWNER = '+593 96 884 0257'
const ACCOUNT_OWNER = '7712-3390-46 · Rosa Angélica Tumbaco'
const APARTMENT = 'Departamento amoblado, 2 dormitorios, La Floresta'
const DEPOSIT = '$700'

const OFFERS = {
  text: `Buenas noches. Sí, el departamento sigue disponible: $350 mensuales, amoblado, incluye alícuota. Para reservarlo necesito el depósito de garantía de ${DEPOSIT} (dos meses), y le entrego las llaves apenas llegue a Quito.`,
  time: '20:38',
  senal: 'paga-primero',
}

const CHAT: ScreenView = {
  kind: 'sms',
  sender: OWNER,
  sub: `${NUMBER_OWNER} · dueño del anuncio`,
  msgs: [OFFERS],
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

const CANNOT_BE_SEEN: ScreenView = {
  ...CHAT,
  msgs: [
    OFFERS,
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

const ACCOUNT: ScreenView = {
  ...CHAT,
  msgs: [
    OFFERS,
    { text: 'Me interesa. ¿A qué cuenta deposito la garantía?', time: '20:41', mine: true },
    {
      text: `Deposite a esta cuenta: ${ACCOUNT_OWNER}. Está a nombre de mi hermana, que es la que me maneja las cosas mientras estoy fuera. Mándeme el comprobante y le paso el contrato firmado por correo esta misma noche.`,
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

const PRESSES: ScreenView = {
  ...CHAT,
  msgs: [
    OFFERS,
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

// El anuncio: las fotos son de verdad, pero no son suyas (la búsqueda por imagen las encuentra en un anuncio de venta de hace dos años).
const AD: ScreenView = {
  kind: 'web',
  app: 'Portal Inmobiliario',
  url: 'portalinmobiliario.ec',
  secure: true,
  brand: 'Anuncio de arriendo',
  title: APARTMENT,
  subtitle: '$350 mensuales · publicado hace 5 días',
  datos: [
    { etiqueta: 'Precio de la zona', valor: '$520 a $650 por algo parecido', senal: 'precio' },
    { etiqueta: 'Publicado por', valor: `${OWNER} · sin verificar`, senal: 'perfil' },
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

const IMAGES: ScreenView = {
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

const TRANSFER: ScreenView = {
  kind: 'web',
  app: IDENTITY_FAKE.banco,
  url: 'bancolitoral.ec',
  secure: true,
  brand: 'Transferir a terceros',
  title: 'Confirma la transferencia',
  subtitle: `Desde ${ACCOUNT_FAKE}`,
  datos: [
    { etiqueta: 'Cuenta de destino', valor: ACCOUNT_OWNER, senal: 'cuenta' },
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

const APPS: PhoneApp[] = [
  { Icono: MessageCircle, texto: 'Mensajes', color: '#2f9e44', hilo: 'sms' },
  {
    Icono: Building2,
    texto: 'Portal Inmobiliario',
    color: '#c2255c',
    viewNode: 'n6',
    label: 'Abrió el anuncio del departamento',
  },
  {
    Icono: Wallet,
    texto: IDENTITY_FAKE.banco,
    color: '#155e75',
    viewNode: 'n5',
    label: 'Abrió la app del banco para transferir',
  },
  { Icono: Images, texto: 'Galería', color: '#c2410c', relleno: 'galeria' },
]

export const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: CHAT },
  n2: { kind: 'scene', view: CANNOT_BE_SEEN },
  n3: { kind: 'scene', view: ACCOUNT },
  n4: { kind: 'scene', view: PRESSES },
  n5: { kind: 'scene', view: TRANSFER },
  n6: { kind: 'scene', view: AD },
  n7: { kind: 'scene', view: IMAGES },
  e_paga: {
    kind: 'bad',
    view: TRANSFER,
    verdict: 'Caíste en la estafa',
    outcome:
      'Los $700 salieron a la cuenta de Rosa Tumbaco, y el 14 el número ya no existía. El departamento de las fotos se vendió hace dos años: nunca estuvo en arriendo.',
  },
  e_deja: {
    kind: 'good',
    view: PRESSES,
    verdict: 'No caíste · no pagaste sin ver',
    outcome:
      'Lo dejaste ir sin poner un dólar. El anuncio desapareció dos semanas después, junto con otro idéntico en Cuenca.',
  },
  e_ignora: {
    kind: 'partial',
    view: CHAT,
    verdict: 'No perdiste nada, pero no comprobaste nada',
    outcome:
      'No pagaste, pero nunca revisaste el anuncio ni las fotos. El próximo va a ser más simpático, con el mismo orden invertido.',
    score: 50,
  },
}

const SIGNALS: Signal[] = [
  {
    id: 's1',
    targetId: 'paga-primero',
    pantalla: 'n1',
    texto: 'Te piden <b>pagar antes de ver</b>. Un arriendo real se ve primero y se paga al firmar.',
  },
  {
    id: 's2',
    targetId: 'no-se-ve',
    pantalla: 'n2',
    texto:
      '<b>El dueño está fuera</b> y nadie más puede abrir. Es la excusa para no enseñar un lugar que quizá no es suyo.',
  },
  {
    id: 's3',
    targetId: 'fotos',
    pantalla: 'n7',
    texto:
      'Las <b>fotos ya estaban en internet</b>, de un anuncio de venta de hace dos años. Un toque de búsqueda desarma el anuncio.',
  },
  {
    id: 's4',
    targetId: 'cuenta',
    pantalla: 'n3',
    texto: 'La cuenta está <b>a otro nombre</b>, la hermana. Así después no hay a quién reclamarle.',
  },
  {
    id: 's5',
    targetId: 'precio',
    pantalla: 'n6',
    texto:
      'El precio está <b>muy por debajo del sector</b>. El descuento grande compra que aceptes condiciones raras.',
  },
  {
    id: 's6',
    targetId: 'prisa',
    pantalla: 'n4',
    texto:
      'Aparecen <b>otras tres personas interesadas</b> justo cuando dudas, con mucha cortesía. Sirve para apurarte.',
  },
]

const RULE =
  'Regla de oro: en un arriendo el orden es <b>ver, firmar y después pagar</b>. Si el dueño no puede enseñártelo, no hay nada que enseñar.'

const SUMMARY = 'Un departamento barato cuya garantía hay que depositar antes de poder verlo.'

export const CONTEXT: Context = {
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

function AdvanceRent() {
  return (
    <ScenarioStory
      escenarioId="estafa/arriendo-anticipado"
      resumen={SUMMARY}
      contexto={CONTEXT}
      story={STORY}
      senales={SIGNALS}
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

export default AdvanceRent
