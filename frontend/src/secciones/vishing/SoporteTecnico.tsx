import { Camera, LayoutGrid, Phone, Wifi } from 'lucide-react'
import StoryEscenario, { type AppTelefono, type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'

/**
 * El soporte técnico que no pediste.
 *
 * Aquí no piden dinero ni códigos: piden permiso. La estafa entera cabe en un
 * botón que dice "Permitir", y por eso el escenario obliga a pasar por la
 * tienda de aplicaciones y por la pantalla de permisos en vez de resolverse al
 * primer toque: quien instala una herramienta de control remoto casi nunca lee
 * lo que está autorizando, y esa pantalla es la lección.
 */

const NUMERO = '+593 4 601 2288'
const CODIGO_SESION = '483 992 117'

const ENTRANTE: ScreenView = {
  kind: 'call',
  entrante: true,
  quien: NUMERO,
  numero: 'Guayaquil, Ecuador',
  etiqueta: 'No está en tus contactos',
  senalQuien: 'quien',
  contestarGoto: 'n2',
  contestarLabel: 'Contestó la llamada',
  rechazarGoto: 'e_rechaza',
  rechazarLabel: 'Rechazó la llamada sin contestar',
}

const APERTURA = [
  {
    texto:
      'Buenas tardes, le llamo del soporte técnico de AndinaNet, su proveedor de internet. ¿Ha notado que la conexión le va más lenta estos días?',
    senal: 'llaman',
  },
  {
    texto:
      'Es lo que le iba a decir. Nuestros sistemas detectaron que su router está enviando tráfico infectado hacia el exterior. Podemos limpiarlo ahora mismo sin que tenga que salir de casa.',
    senal: 'infectado',
  },
]

const LLAMADA: ScreenView = {
  kind: 'call',
  quien: NUMERO,
  numero: 'Guayaquil, Ecuador',
  etiqueta: 'No está en tus contactos',
  senalQuien: 'quien',
  dialogo: APERTURA,
  // Cada respuesta recibe la suya. Acaban las dos en la misma instrucción
  // —instale esto— pero contestando a lo que dijiste: si el guion no escucha,
  // deja de parecer una llamada y el escenario pierde lo único que enseña.
  decir: [
    {
      texto: 'Sí, algo lento sí anda. ¿Qué tengo que hacer?',
      goto: 'n3',
      label: 'Siguió la conversación con el supuesto técnico',
    },
    {
      texto: '¿Y ustedes cómo saben lo que hace mi router?',
      goto: 'n3b',
      label: 'Preguntó cómo sabían lo del router',
    },
  ],
  colgarGoto: 'e_cuelga',
  colgarLabel: 'Colgó al principio de la llamada',
}

const SIGO = 'Sí, algo lento sí anda. ¿Qué tengo que hacer?'
const COMO_SABEN = '¿Y ustedes cómo saben lo que hace mi router?'

const INSTRUCCIONES = [
  {
    texto:
      'Le paso el proceso: abra la tienda de aplicaciones de su teléfono e instale AsistenciaMóvil, que es la herramienta oficial de soporte.',
    senal: 'instalar',
  },
  {
    texto:
      'Cuando la abra le va a pedir un permiso; acéptelo y desde aquí le hago la limpieza en dos minutos. No cuelgue, que si corta pierdo la sesión.',
    senal: 'permiso',
  },
]

function pidiendoApp(respuesta: { texto: string; mio?: boolean }[]): ScreenView {
  return {
    kind: 'call',
    quien: NUMERO,
    numero: 'Guayaquil, Ecuador',
    etiqueta: 'No está en tus contactos',
    senalQuien: 'quien',
    dialogo: [...APERTURA, ...respuesta, ...INSTRUCCIONES],
    decir: [
      {
        texto: 'No voy a instalar nada en mi teléfono.',
        goto: 'e_niega',
        label: 'Se negó a instalar la aplicación',
      },
    ],
    colgarGoto: 'e_cuelga',
    colgarLabel: 'Colgó cuando le pidieron instalar una aplicación',
  }
}

const SIGUE_EL_PASO = pidiendoApp([
  { texto: SIGO, mio: true },
  {
    texto:
      'Perfecto, entonces es lo que veíamos: el equipo está saturado por ese tráfico. No se preocupe, lo dejamos limpio en un momento.',
  },
])

const PREGUNTA_COMO = pidiendoApp([
  { texto: COMO_SABEN, mio: true },
  {
    texto:
      'Lo vemos desde la central, porque su router pasa por nuestra red. Nosotros no entramos a nada suyo, solo miramos el tráfico.',
  },
])

const TIENDA: ScreenView = {
  kind: 'web',
  app: 'Tienda de apps',
  url: 'tienda',
  secure: true,
  brand: 'Buscar aplicaciones',
  title: 'asistencia móvil',
  opciones: [
    {
      texto: 'AsistenciaMóvil · Control remoto',
      detalle: 'Permite que otra persona vea y maneje tu pantalla · 4,1 ★',
      goto: 'n5',
      label: 'Instaló la aplicación de control remoto que le indicaron',
    },
    { texto: 'Asistencia Vial EC', detalle: 'Grúas y auxilio mecánico · 3,8 ★' },
    { texto: 'Asistente de notas', detalle: 'Listas y recordatorios · 4,6 ★' },
    { texto: 'Salud Asistida', detalle: 'Citas y recetas · 4,0 ★' },
  ],
  fields: [],
  button: '',
}

/// La pantalla de permisos, que es donde de verdad se decide todo. Va con el
/// texto entero y sin adornos: lo que se autoriza aquí no es "una limpieza",
/// es que un desconocido vea y maneje el teléfono.
const PERMISO: ScreenView = {
  kind: 'web',
  app: 'AsistenciaMóvil',
  url: 'asistencia-movil',
  secure: true,
  brand: 'Sesión de asistencia',
  title: 'Tu código de sesión es ' + CODIGO_SESION,
  subtitle: 'La persona que tenga este código podrá conectarse a tu teléfono.',
  datos: [
    {
      etiqueta: 'Al permitirlo, quien se conecte podrá',
      valor: 'Ver tu pantalla, tocar por ti y abrir cualquier app, incluida la del banco',
      senal: 'permiso-texto',
    },
    { etiqueta: 'Duración', valor: 'Hasta que tú cierres la sesión' },
  ],
  aviso: 'Concede el control solo a personas que conozcas y a las que hayas llamado tú.',
  button: 'Permitir el control de mi teléfono',
  botonGoto: 'e_control',
  botonLabel: 'Permitió el control remoto de su teléfono',
  cerrarGoto: 'n4',
  cerrarLabel: 'Salió de la aplicación sin conceder el permiso',
  fields: [],
}

const OPERADORA: ScreenView = {
  kind: 'web',
  app: 'Mi AndinaNet',
  url: 'andinanet',
  secure: true,
  brand: 'Mi cuenta',
  title: 'Plan Hogar 200 Mb',
  subtitle: 'Titular: tu cuenta · al día',
  opciones: [
    {
      texto: 'Estado de mi servicio',
      detalle: 'Incidencias, cortes y estado del equipo',
      goto: 'e_verifica',
      label: 'Consultó el estado de su servicio en la app de la operadora',
    },
    { texto: 'Mi factura', detalle: 'Consumo y pagos' },
    { texto: 'Cambiar mi plan', detalle: 'Velocidad y canales' },
    { texto: 'Soporte', detalle: 'Chat y agencias' },
  ],
  fields: [],
  button: '',
}

const ESTADO: ScreenView = {
  kind: 'web',
  app: 'Mi AndinaNet',
  url: 'andinanet',
  secure: true,
  brand: 'Estado de tu servicio',
  title: 'Todo normal',
  subtitle: 'Comprobado hace unos segundos.',
  datos: [
    { etiqueta: 'Incidencias en tu zona', valor: 'Ninguna', senal: 'sin-averia' },
    { etiqueta: 'Tu router', valor: 'En línea desde el 12/07, sin alertas' },
    { etiqueta: 'Soporte', valor: '100 desde tu línea, o el chat de esta app' },
  ],
  aviso:
    'AndinaNet nunca te llama para pedirte que instales aplicaciones ni para pedirte acceso a tu teléfono. Si alguien lo hace, cuelga y escríbenos por el chat de esta app.',
  fields: [],
  button: '',
}

const APPS: AppTelefono[] = [
  { Icono: Phone, texto: 'Teléfono', color: '#2f9e44', hilo: 'call' },
  {
    Icono: LayoutGrid,
    texto: 'Tienda de apps',
    color: '#5f3dc4',
    goto: 'n4',
    label: 'Abrió la tienda de aplicaciones',
  },
  {
    Icono: Wifi,
    texto: 'Mi AndinaNet',
    color: '#0b7285',
    goto: 'n6',
    label: 'Abrió la app de su proveedor de internet',
  },
  {
    Icono: Camera,
    texto: 'Cámara',
    color: '#495057',
    vacia: 'La cámara está lista. No hay nada que fotografiar en este momento.',
  },
]

export const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: ENTRANTE },
  n2: { kind: 'scene', view: LLAMADA },
  n3: { kind: 'scene', view: SIGUE_EL_PASO },
  n3b: { kind: 'scene', view: PREGUNTA_COMO },
  n4: { kind: 'scene', view: TIENDA },
  n5: { kind: 'scene', view: PERMISO },
  n6: { kind: 'scene', view: OPERADORA },
  e_rechaza: {
    kind: 'good',
    view: ENTRANTE,
    verdict: 'No caíste · no contestaste',
    outcome:
      'Rechazaste una llamada de un número desconocido. Tu operadora no necesita llamarte para arreglarte nada, y si de verdad hubiera una avería, la verías en su app o te llegaría un aviso por escrito.',
  },
  e_cuelga: {
    kind: 'good',
    view: SIGUE_EL_PASO,
    verdict: 'No caíste · colgaste',
    outcome:
      'Colgaste. Nadie que te llame sin que lo pidas necesita que instales una aplicación en tu teléfono. Si llegaste a instalarla antes de colgar, desinstálala: mientras esté ahí, alguien con el código puede volver a intentarlo.',
  },
  e_niega: {
    kind: 'good',
    view: SIGUE_EL_PASO,
    verdict: 'No caíste · te negaste a instalar nada',
    outcome:
      'Dijiste que no y ahí se acabó. La estafa entera dependía de que instalaras la herramienta: sin ella, quien llamaba no tenía forma de tocar tu teléfono por muy convincente que sonara.',
  },
  e_control: {
    kind: 'bad',
    view: PERMISO,
    verdict: 'Caíste en la trampa',
    outcome:
      'Diste el control de tu teléfono a un desconocido. Mientras te explicaba la "limpieza", abrió tu app del banco, hizo una transferencia y borró los mensajes de aviso para que no la vieras. No hizo falta ninguna contraseña: tu teléfono ya estaba abierto y era él quien tocaba.',
  },
  e_verifica: {
    kind: 'good',
    view: ESTADO,
    verdict: 'No caíste · lo comprobaste en tu canal',
    outcome:
      'En la app de tu operadora no había ninguna avería ni alerta del router, y ahí mismo estaba escrito que nunca llaman para pedirte instalar nada. La llamada seguía esperando mientras comprobabas.',
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'quien',
    pantalla: 'n1',
    texto:
      'Un <b>número desconocido</b> que dice ser tu proveedor. Tú no pediste soporte: la llamada la empezaron ellos.',
  },
  {
    id: 's2',
    targetId: 'infectado',
    pantalla: 'n2',
    texto:
      'Un <b>problema técnico que no puedes comprobar</b>. "Su router está infectado" suena grave y no significa nada verificable: está ahí para que aceptes ayuda.',
  },
  {
    id: 's3',
    targetId: 'instalar',
    pantalla: 'n3',
    texto:
      'Te piden <b>instalar una aplicación</b> que ellos eligen. Ninguna operadora arregla nada así; el soporte de verdad se hace desde su central o mandando a un técnico.',
  },
  {
    id: 's4',
    targetId: 'permiso-texto',
    pantalla: 'n5',
    texto:
      'La propia app lo dice: quien se conecte <b>ve tu pantalla y toca por ti</b>, también en la app del banco. No es una limpieza, es entregar el teléfono.',
  },
  {
    id: 's5',
    targetId: 'permiso',
    pantalla: 'n3',
    texto:
      '<b>"No cuelgue."</b> Te acompañan paso a paso para que no pares a pensar, y para que no te dé tiempo a comprobarlo en otro lado.',
  },
  {
    id: 's6',
    targetId: 'sin-averia',
    pantalla: 'e_verifica',
    texto:
      'En la app de tu operadora <b>no había ninguna incidencia</b>. Tu canal está a un toque y no depende de lo que te cuenten por teléfono.',
  },
]

const RULE =
  'Regla de oro: <b>nadie que te llame sin que lo pidas debe instalar nada en tu teléfono</b>. Una app de control remoto no limpia virus: le entrega tu pantalla y tus apps a quien esté al otro lado.'

const RESUMEN = 'Una llamada dice ser del soporte de tu internet y quiere arreglarte el router.'

const CONTEXTO: Contexto = {
  antes: (
    <>
      Tienes internet en casa con <strong>AndinaNet</strong> y, como a todo el mundo, alguna tarde
      te va lento. <strong>No has pedido ningún soporte.</strong>
    </>
  ),
  ahora: (
    <>
      <strong>A media tarde</strong> te llama un número desconocido de Guayaquil diciendo que es el
      servicio técnico.
    </>
  ),
  detalle: 'Habla con calma, sabe tu nombre y no te pide dinero en ningún momento.',
}

function SoporteTecnico() {
  return (
    <StoryEscenario
      escenarioId="vishing/soporte-tecnico"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule={RULE}
      restartLabel="↻ Recibir la llamada otra vez"
      accionesEnPantalla
      apps={APPS}
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Actúa sobre el teléfono como lo harías con el tuyo: contesta o rechaza, cuelga cuando
          quieras y usa <strong>cualquier app de abajo</strong>, incluso con la llamada abierta.
        </p>
      }
      pista={
        <p>
          Puedes no contestar, seguir lo que te dicen paso a paso, negarte, colgar en cualquier
          momento o dejar la llamada esperando y mirar por tu cuenta si el problema del que hablan
          existe.
        </p>
      }
    />
  )
}

export default SoporteTecnico
