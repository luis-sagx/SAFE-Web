import { Camera, MessageCircle, ShoppingBag, Wallet } from 'lucide-react'
import StoryEscenario, { type AppTelefono, type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { CUENTA_FICTICIA, IDENTIDAD_FICTICIA } from '../../lib/identidadFicticia'

/**
 * El lado del comprador: el celular que cuesta la mitad de lo que cuesta.
 *
 * Los demás escenarios del módulo te ponen a vender; este te pone a comprar, y
 * la diferencia importa: cuando el que arriesga eres tú, el precio bajo deja de
 * ser una señal de alarma y pasa a sentirse como suerte.
 *
 * No hay ninguna urgencia inventada al principio, y por eso es difícil. La
 * urgencia la pone la ganga: si no pagas ya, se lo lleva otro. Todo lo demás
 * (la cuenta a otro nombre, el perfil de tres días, el "no puedo verme") está a
 * la vista desde el primer momento para quien mire.
 */

const VENDEDOR = 'Marlon Cedeño'
const NUMERO_VENDEDOR = '+593 98 052 6613'
const CUENTA_VENDEDOR = '4471-2280-33 · Jessica Bravo Mera'
const PRECIO = '$430'

const OFERTA = {
  text: `Buenas 👋 sí está disponible el celular, nuevo en caja, sellado. Se lo dejo en ${PRECIO} porque necesito venderlo rápido. Es el último que me queda.`,
  time: '19:20',
  senal: 'precio',
}

const CHAT: ScreenView = {
  kind: 'sms',
  sender: VENDEDOR,
  sub: `${NUMERO_VENDEDOR} · vendedor del anuncio`,
  senalRemitente: 'remitente',
  msgs: [OFERTA],
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

const NO_SE_VE: ScreenView = {
  ...CHAT,
  msgs: [
    OFERTA,
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

const CUENTA: ScreenView = {
  ...CHAT,
  msgs: [
    OFERTA,
    { text: 'Me interesa. ¿A qué cuenta le deposito?', time: '19:22', mine: true },
    {
      text: `Perfecto 🙌 deposite los ${PRECIO} a esta cuenta: ${CUENTA_VENDEDOR}. Está a nombre de mi esposa, la mía la tengo bloqueada. Mándeme el comprobante y despacho hoy mismo.`,
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

const PRESIONA: ScreenView = {
  ...CHAT,
  msgs: [
    OFERTA,
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

/// El anuncio, mirado por dentro. Todo lo que hace falta para dudar está aquí
/// y se llega en dos toques, mientras el chat mete prisa por otro lado.
const ANUNCIO: ScreenView = {
  kind: 'web',
  app: 'Mercado Abierto',
  url: 'mercadoabierto.ec',
  secure: true,
  brand: 'Anuncio',
  title: 'Celular gama alta, nuevo en caja',
  subtitle: `${PRECIO} · publicado hace 2 días`,
  datos: [
    {
      etiqueta: 'Precio en tiendas',
      valor: '$860 a $910 · este anuncio pide la mitad',
      senal: 'precio',
    },
    { etiqueta: 'Vendedor', valor: `${VENDEDOR} · cuenta creada hace 3 días`, senal: 'perfil' },
    { etiqueta: 'Calificaciones', valor: 'Ninguna todavía', senal: 'perfil' },
    { etiqueta: 'Fotos', valor: 'Tres, y son las mismas del catálogo del fabricante', senal: 'fotos' },
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

const BUSQUEDA: ScreenView = {
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
      etiqueta: `${VENDEDOR}`,
      valor: `${PRECIO} · nuevo en caja, solo encomienda`,
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

const TRANSFERENCIA: ScreenView = {
  kind: 'web',
  app: IDENTIDAD_FICTICIA.banco,
  url: 'bancolitoral.ec',
  secure: true,
  brand: 'Transferir a terceros',
  title: 'Confirma la transferencia',
  subtitle: `Desde ${CUENTA_FICTICIA}`,
  datos: [
    { etiqueta: 'Cuenta de destino', valor: CUENTA_VENDEDOR, senal: 'cuenta' },
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

const APPS: AppTelefono[] = [
  { Icono: MessageCircle, texto: 'Mensajes', color: '#2f9e44', hilo: 'sms' },
  {
    Icono: ShoppingBag,
    texto: 'Mercado Abierto',
    color: '#7048e8',
    goto: 'n6',
    label: 'Abrió el anuncio en la página de compraventa',
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
  n2: { kind: 'scene', view: NO_SE_VE },
  n3: { kind: 'scene', view: CUENTA },
  n4: { kind: 'scene', view: PRESIONA },
  n5: { kind: 'scene', view: TRANSFERENCIA },
  n6: { kind: 'scene', view: ANUNCIO },
  n7: { kind: 'scene', view: BUSQUEDA },
  e_paga: {
    kind: 'bad',
    view: TRANSFERENCIA,
    verdict: 'Caíste en la estafa',
    outcome:
      'Los $430 salieron a la cuenta de Jessica Bravo, que no es quien te escribía. El celular nunca se despachó: al día siguiente el chat decía "este número ya no existe" y el anuncio había desaparecido de la página. Una transferencia enviada no se reversa, y el nombre al que pagaste no es el de nadie a quien puedas reclamar.',
  },
  e_deja: {
    kind: 'good',
    view: PRESIONA,
    verdict: 'No caíste · dejaste pasar la ganga',
    outcome:
      'Lo dejaste ir, y no perdiste nada más que un anuncio que no existía. Nadie más se lo llevó: la cuenta se cerró tres días después y el mismo texto reapareció con otro nombre y otro número. Un equipo a mitad de precio que solo se paga por adelantado no es una oferta, es el anzuelo.',
  },
  e_ignora: {
    kind: 'partial',
    view: CHAT,
    verdict: 'No perdiste nada, pero no supiste por qué',
    outcome:
      'Saliste sin pagar, que es lo que importaba. Pero tampoco miraste el anuncio ni comparaste el precio, así que la próxima vez que aparezca lo mismo con un vendedor más convincente no vas a tener con qué decidir. Comparar el precio cuesta un toque y es lo que desarma la oferta.',
    score: 50,
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'precio',
    pantalla: 'n6',
    texto:
      'El <b>precio es la mitad</b> del de cualquier tienda. Un descuento así no existe porque nadie regala cuatrocientos dólares: el precio bajo es lo que paga tu prisa por no perderlo.',
  },
  {
    id: 's2',
    targetId: 'cuenta',
    pantalla: 'n3',
    texto:
      'La cuenta está a <b>otro nombre</b>. Es lo que hace que no puedas reclamarle a nadie: quien recibe el dinero no es quien te vendió, y muchas veces ni sabe que su cuenta se está usando.',
  },
  {
    id: 's3',
    targetId: 'no-se-ve',
    pantalla: 'n2',
    texto:
      'Siempre hay un motivo para <b>no poder verse</b>: otra ciudad, el trabajo, la encomienda. Es la condición que la estafa necesita, porque en persona no hay nada que entregar.',
  },
  {
    id: 's4',
    targetId: 'perfil',
    pantalla: 'n6',
    texto:
      'La cuenta del vendedor tiene <b>tres días y ninguna calificación</b>. No prueba que sea falsa por sí sola, pero junto al precio y al pago por adelantado ya son tres cosas a la vez.',
  },
  {
    id: 's5',
    targetId: 'prisa',
    pantalla: 'n4',
    texto:
      'Los <b>otros dos compradores</b> y la media hora son del guion. La ganga que se va si no pagas ya es la misma herramienta de siempre: quitarte el tiempo de comparar.',
  },
  {
    id: 's6',
    targetId: 'comparacion',
    pantalla: 'n7',
    texto:
      'Comparar en la misma página lo deja a la vista: <b>ningún otro baja de $820</b>, y todos dejan verlo antes de pagar. La comparación es gratis y desarma la oferta en un toque.',
  },
]

const RULE =
  'Regla de oro: <b>no pagues por adelantado lo que no has visto</b>, y desconfía del precio que es demasiado bueno. Compara con otros anuncios del mismo producto, exige verlo o pagar contra entrega, y no transfieras nunca a una cuenta que está a otro nombre.'

const RESUMEN = 'Un celular a mitad de precio, pero solo se paga por adelantado y sin verlo.'

const CONTEXTO: Contexto = {
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
  detalle: 'Tienes el anuncio abierto en la app y el dinero en tu cuenta.',
}

function MitadDePrecio() {
  return (
    <StoryEscenario
      escenarioId="estafa/mitad-de-precio"
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

export default MitadDePrecio
