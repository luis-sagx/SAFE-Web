import { Images, MessageCircle, ShoppingBag, Wallet } from 'lucide-react'
import ScenarioStory, { type PhoneApp, type ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Signal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { ACCOUNT_FAKE, IDENTITY_FAKE } from '../../lib/identidadFicticia'

/** El lado del comprador: aquí el que arriesga eres tú, así que el precio bajo se siente como suerte, no como
 *  alarma. No hay urgencia inventada,la pone la ganga misma, y todo lo demás está a la vista desde el
 *  principio para quien mire. */

const SELLER = 'Marlon Cedeño'
const NUMBER_SELLER = '+593 98 052 6613'
const ACCOUNT_SELLER = '4471-2280-33 · Jessica Bravo Mera'
const PRICE = '$430'

const OFFER = {
  text: `Buenas 👋 sí está disponible el celular, nuevo en caja, sellado. Se lo dejo en ${PRICE} porque necesito venderlo rápido. Es el último que me queda.`,
  time: '19:20',
  senal: 'precio',
}

const CHAT: ScreenView = {
  kind: 'sms',
  sender: SELLER,
  sub: `${NUMBER_SELLER} · vendedor del anuncio`,
  senalRemitente: 'remitente',
  msgs: [OFFER],
  respuestas: [
    {
      texto: '¿Podemos vernos y lo reviso antes de pagar?',
      goto: 'n2',
      label: 'Propuso verse en persona antes de pagar',
    },
    {
      texto: 'Me interesa. ¿A qué cuenta le deposito?',
      goto: 'n3',
      label: 'Aceptó pagar por transferencia sin ver el equipo',
    },
  ],
  volverGoto: 'e_ignora',
  volverLabel: 'Salió del chat sin seguir el trato',
}

const NOT_VISIBLE: ScreenView = {
  ...CHAT,
  msgs: [
    OFFER,
    { text: '¿Podemos vernos y lo reviso antes de pagar?', time: '19:22', mine: true },
    {
      text: 'Es que yo estoy en Santo Domingo y trabajo todo el día 😕 se lo mando por encomienda, llega mañana. Pero necesito el pago completo primero para despacharlo, es la política.',
      time: '19:23',
      senal: 'no-se-ve',
    },
  ],
  respuestas: [
    {
      texto: 'Está bien, deme la cuenta.',
      goto: 'n3',
      label: 'Aceptó pagar por adelantado a un vendedor que no podía verse',
    },
    {
      texto: 'Prefiero pagar contra entrega. Si no, lo dejamos.',
      goto: 'n4',
      label: 'Propuso pagar contra entrega',
    },
  ],
}

const ACCOUNT: ScreenView = {
  ...CHAT,
  msgs: [
    OFFER,
    { text: 'Me interesa. ¿A qué cuenta le deposito?', time: '19:22', mine: true },
    {
      text: `Perfecto 🙌 deposite los ${PRICE} a esta cuenta: ${ACCOUNT_SELLER}. Está a nombre de mi esposa, la mía la tengo bloqueada. Mándeme el comprobante y despacho hoy mismo.`,
      time: '19:23',
      senal: 'cuenta',
    },
  ],
  respuestas: [
    {
      texto: 'Ya mismo le deposito.',
      goto: 'n5',
      label: 'Fue a transferir el dinero al vendedor',
    },
    {
      texto: 'La cuenta está a otro nombre. Así no.',
      goto: 'n4',
      label: 'Hizo notar que la cuenta era de otra persona',
    },
  ],
}

const PRESSES: ScreenView = {
  ...CHAT,
  msgs: [
    OFFER,
    { text: 'Prefiero pagar contra entrega. Si no, lo dejamos.', time: '19:25', mine: true },
    {
      text: 'Mire, tengo a otras dos personas preguntando por el mismo equipo y una ya me dijo que deposita ahorita. Yo se lo estoy guardando a usted por orden de llegada, pero si no me confirma en media hora se lo doy al otro 🤷',
      time: '19:26',
      senal: 'prisa',
    },
  ],
  respuestas: [
    {
      texto: 'Ya, no lo pierdo. Deme la cuenta.',
      goto: 'n3',
      label: 'Cedió a la prisa y pidió la cuenta',
    },
    {
      texto: 'Que se lo lleve el otro. Yo no pago sin ver.',
      goto: 'e_deja',
      label: 'Dejó pasar la oferta antes que pagar sin ver el equipo',
    },
  ],
}

// El anuncio: todo lo que hace falta para dudar está aquí, a dos toques, mientras el chat mete prisa por otro lado.
const AD: ScreenView = {
  kind: 'web',
  app: 'Mercado Abierto',
  url: 'mercadoabierto.ec',
  secure: true,
  brand: 'Anuncio',
  title: 'Celular gama alta, nuevo en caja',
  subtitle: `${PRICE} · publicado hace 2 días`,
  datos: [
    {
      etiqueta: 'Precio en tiendas',
      valor: '$860 a $910 · este anuncio pide la mitad',
      senal: 'precio',
    },
    { etiqueta: 'Vendedor', valor: `${SELLER} · cuenta creada hace 3 días`, senal: 'perfil' },
    { etiqueta: 'Calificaciones', valor: 'Ninguna todavía', senal: 'perfil' },
    {
      etiqueta: 'Fotos',
      valor: 'Tres, y son las mismas del catálogo del fabricante',
      senal: 'fotos',
    },
    { etiqueta: 'Entrega', valor: 'Solo por encomienda, pago por adelantado' },
  ],
  opciones: [
    {
      texto: 'Buscar el mismo modelo en la página',
      detalle: 'Ver a cuánto lo venden los demás',
      goto: 'n7',
      label: 'Comparó el precio con otros anuncios del mismo modelo',
    },
    { texto: 'Guardar en favoritos', detalle: 'Para verlo después' },
    { texto: 'Compartir el anuncio', detalle: 'Mandárselo a alguien' },
  ],
  cerrarGoto: 'n1',
  cerrarLabel: 'Volvió al chat desde el anuncio',
  fields: [],
  button: '',
}

const SEARCH: ScreenView = {
  kind: 'web',
  app: 'Mercado Abierto',
  url: 'mercadoabierto.ec',
  secure: true,
  brand: 'Resultados',
  title: 'Celular gama alta, nuevo',
  subtitle: 'Doce anuncios del mismo modelo.',
  datos: [
    { etiqueta: 'Tienda Movilcenter', valor: '$895 · factura y garantía', senal: 'comparacion' },
    { etiqueta: 'Tecnomundo Quito', valor: '$879 · local en el centro comercial' },
    { etiqueta: 'Usuario particular', valor: '$820 · usado, seis meses de uso' },
    {
      etiqueta: `${SELLER}`,
      valor: `${PRICE} · nuevo en caja, solo encomienda`,
      senal: 'comparacion',
    },
  ],
  aviso:
    'Ningún otro anuncio del mismo modelo baja de $820, y todos permiten verlo antes de pagar.',
  cerrarGoto: 'n6',
  cerrarLabel: 'Volvió al anuncio después de comparar precios',
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
    { etiqueta: 'Cuenta de destino', valor: ACCOUNT_SELLER, senal: 'cuenta' },
    { etiqueta: 'Titular', valor: 'Jessica Bravo Mera' },
    { etiqueta: 'Valor', valor: '$430,00' },
  ],
  aviso: 'Las transferencias enviadas no se pueden reversar.',
  button: 'Transferir $430,00',
  botonGoto: 'e_paga',
  botonLabel: 'Pagó por adelantado un equipo que no había visto',
  cerrarGoto: 'n3',
  cerrarLabel: 'Volvió atrás sin transferir',
  fields: [],
}

const APPS: PhoneApp[] = [
  { Icono: MessageCircle, texto: 'Mensajes', color: '#2f9e44', hilo: 'sms' },
  {
    Icono: ShoppingBag,
    texto: 'Mercado Abierto',
    color: '#7048e8',
    viewNode: 'n6',
    label: 'Abrió el anuncio en la página de compraventa',
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
  n2: { kind: 'scene', view: NOT_VISIBLE },
  n3: { kind: 'scene', view: ACCOUNT },
  n4: { kind: 'scene', view: PRESSES },
  n5: { kind: 'scene', view: TRANSFER },
  n6: { kind: 'scene', view: AD },
  n7: { kind: 'scene', view: SEARCH },
  e_paga: {
    kind: 'bad',
    view: TRANSFER,
    verdict: 'Caíste en la estafa',
    outcome:
      'Los $430 salieron a la cuenta de Jessica Bravo, que no era quien te escribía. Al día siguiente el número ya no existía y el anuncio había desaparecido.',
  },
  e_deja: {
    kind: 'good',
    view: PRESSES,
    verdict: 'No caíste · dejaste pasar la ganga',
    outcome:
      'No perdiste nada. La cuenta se cerró tres días después y el mismo texto reapareció con otro nombre y otro número.',
  },
  e_ignora: {
    kind: 'partial',
    view: CHAT,
    verdict: 'No perdiste nada, pero no supiste por qué',
    outcome:
      'Saliste sin pagar, pero no miraste el anuncio ni comparaste el precio. Comparar cuesta un toque y desarma la oferta.',
    score: 50,
  },
}

const SIGNALS: Signal[] = [
  {
    id: 's1',
    targetId: 'precio',
    pantalla: 'n6',
    texto: 'El <b>precio es la mitad</b> del de cualquier tienda. Nadie regala cuatrocientos dólares.',
  },
  {
    id: 's2',
    targetId: 'cuenta',
    pantalla: 'n3',
    texto:
      'La cuenta está a <b>otro nombre</b>. Quien recibe el dinero no es quien te vendió, y no hay a quién reclamar.',
  },
  {
    id: 's3',
    targetId: 'no-se-ve',
    pantalla: 'n2',
    texto:
      'Siempre hay un motivo para <b>no poder verse</b>. Es la condición que la estafa necesita: en persona no hay nada que entregar.',
  },
  {
    id: 's4',
    targetId: 'perfil',
    pantalla: 'n6',
    texto:
      'La cuenta del vendedor tiene <b>tres días y ninguna calificación</b>. Junto al precio y al pago por adelantado, ya son tres señales.',
  },
  {
    id: 's5',
    targetId: 'prisa',
    pantalla: 'n4',
    texto:
      'Los <b>otros dos compradores</b> y la media hora son del guion: quitarte el tiempo de comparar.',
  },
  {
    id: 's6',
    targetId: 'comparacion',
    pantalla: 'n7',
    texto:
      'Comparar lo deja a la vista: <b>ningún otro baja de $820</b>, y todos dejan verlo antes de pagar.',
  },
]

const RULE =
  'Regla de oro: <b>no pagues por adelantado lo que no has visto</b>. Compara precios, exige ver el producto o pagar contra entrega, y nunca transfieras a una cuenta a otro nombre.'

const SUMMARY = 'Un celular a mitad de precio, pero solo se paga por adelantado y sin verlo.'

const CONTEXT: Context = {
  antes: (
    <>
      Llevas semanas queriendo cambiar de celular y vas mirando anuncios en una{' '}
      <strong>página de compraventa</strong>.
    </>
  ),
  ahora: (
    <>
      <strong>Anoche</strong> encontraste uno nuevo en caja a bastante menos de lo que cuesta en las
      tiendas, y le escribiste al vendedor.
    </>
  ),
}

function HalfPrice() {
  return (
    <ScenarioStory
      escenarioId="estafa/mitad-de-precio"
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
          Actúa sobre el teléfono como lo harías con el tuyo: contéstale al vendedor y usa{' '}
          <strong>cualquier app de abajo</strong>. Aquí el que arriesga el dinero eres tú.
        </p>
      }
      pista={
        <p>
          Puedes negociar por el chat, abrir el anuncio a mirarlo con calma, comparar el precio con
          otros iguales o ir directo a pagar. Fíjate en el precio, en quién cobra y en si puedes
          verlo antes.
        </p>
      }
    />
  )
}

export default HalfPrice
