import { Landmark, School } from 'lucide-react'
import ScenarioStory, { type ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import { FOOTER_LINKS } from '../../components/ui/armazonSitio'
import type { BrowserBookmark } from '../../components/ui/Navegador'
import { ACTIONS_BAR, createToolbarEndings } from './barraDeCorreo'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Signal } from '../../components/ui/PanelVeredicto'
import { createSignal } from '../../lib/crearSenal'

// Único escenario sin nada raro que señalar: la cuenta de la secretaría está hackeada de
// verdad, y todo lo que se aprendió a mirar sale bien igual. Solo el hábito de confirmar salva.

const THREAD_PREVIOUS = `
  <div style="border-left:3px solid #d7dde1;padding-left:12px;margin:14px 0;color:#5f6b7a;font-size:13px;line-height:1.55;">
    <p style="margin:0 0 8px;"><b>Secretaría, Unidad Educativa San Rafael</b> · hace 3 días<br/>
    Buenas tardes, le recuerdo que la pensión de este mes vence en cinco días. El monto es $145.</p>
    <p style="margin:0;"><b>Yo</b> · hace 3 días<br/>
    Perfecto, gracias, hago la transferencia esta semana a la cuenta de siempre.</p>
  </div>
`

const EMAIL: ScreenView = {
  kind: 'mail',
  from: 'Secretaría, Unidad Educativa San Rafael',
  address: 'secretaria@unidadsanrafael.edu.ec',
  senalDireccion: 'remitente',
  subject: 'Re: Pensión de este mes',
  date: 'hoy 11:15',
  marca: {
    nombre: 'Unidad Educativa San Rafael',
    detalle: 'Secretaría · Pensiones',
    icono: 'colegio',
    variante: 'institucional',
  },
  body: `
    <p>Buenas de nuevo:</p>
    <p>
      Antes de que transfiera, le cuento que
      <mark class="marca" data-signal="cuenta">cambiamos de banco</mark> este mes. Adjunto el
      comprobante corregido con el nuevo número de cuenta para la pensión de este mes.
    </p>
    ${THREAD_PREVIOUS}
  `,
  attachment: 'Comprobante_pension_mes_actual.pdf',
  adjuntoGoto: 'n4',
  adjuntoLabel: 'Abrió el comprobante adjunto',
  senalAdjunto: 'adjunto',
}

// La banca en línea: es donde la decisión se vuelve irreversible.
const BANKING: ScreenView = {
  kind: 'web',
  url: 'https://banca.bancodellitoral.ec/transferencias',
  secure: true,
  brand: 'Banco del Litoral · Banca en línea',
  menu: ['Cuentas', 'Transferencias', 'Pagos', 'Ayuda'],
  title: 'Transferencia a terceros',
  subtitle: 'Revise los datos antes de confirmar la transferencia.',
  fields: [
    // Cuenta de origen del participante: sin ella la pérdida no se siente propia.
    { label: 'Cuenta de origen', placeholder: '', valor: 'cuenta' },
    {
      label: 'Beneficiario',
      placeholder: 'Carlos Andrés Mena',
      senal: 'beneficiario-ajeno',
    },
    {
      label: 'Cuenta destino',
      placeholder: 'Banco Austral · 2200418877',
      senal: 'cuenta-nueva',
    },
    { label: 'Monto', placeholder: '$145,00' },
  ],
  aviso:
    'Verifique el número de cuenta antes de confirmar. Las transferencias a terceros no pueden revertirse una vez procesadas.',
  footer: 'Banco del Litoral · Entidad supervisada',
  pie: FOOTER_LINKS,
  button: 'Transferir $145',
  botonGoto: 'e_transfiere',
  botonLabel: 'Transfirió los $145 a la cuenta nueva',
  cerrarGoto: 'n1',
  cerrarLabel: 'Abrió la banca, no transfirió y volvió al correo',
}

// El canal alterno que hace falta para confirmar el cambio sin pasar por el correo.
const SCHOOL: ScreenView = {
  kind: 'web',
  url: 'https://www.unidadsanrafael.edu.ec/contacto',
  secure: true,
  brand: 'Unidad Educativa San Rafael',
  menu: ['Inicio', 'Admisiones', 'Pensiones', 'Contacto'],
  title: 'Contacto',
  subtitle: 'Secretaría · atención de 07:30 a 15:00',
  datos: [
    { etiqueta: 'Teléfono', valor: '(02) 244 1180', senal: 'telefono' },
    { etiqueta: 'Dirección', valor: 'Av. de los Shyris N38-24, Quito' },
    { etiqueta: 'Correo', valor: 'secretaria@unidadsanrafael.edu.ec' },
  ],
  fields: [],
  aviso:
    'Cualquier cambio en las cuentas de pago se comunica por la agenda escolar y se confirma en secretaría. Ante la duda, llámenos antes de transferir.',
  footer: 'Unidad Educativa San Rafael · Quito',
  pie: FOOTER_LINKS,
  button: '📞 Llamar al (02) 244 1180',
  botonGoto: 'e_llama',
  botonLabel: 'Llamó al colegio al número de su sitio oficial',
  cerrarGoto: 'n1',
  cerrarLabel: 'Miró el teléfono del colegio y volvió al correo',
}

// No es trampa técnica (PDF real, sin macros): un documento con membrete convence,
// y aquí solo aporta el número de cuenta nuevo — que es justo lo que había que desconfiar.
const RECEIPT: ScreenView = {
  kind: 'web',
  url: 'C:\\Usuarios\\Descargas\\Comprobante_pension_mes_actual.pdf',
  secure: true,
  local: true,
  brand: 'Unidad Educativa San Rafael',
  title: 'Comprobante de pago · Pensión del mes',
  subtitle: 'Documento generado hoy por Secretaría',
  datos: [
    { etiqueta: 'Estudiante', valor: 'A nombre del representante' },
    { etiqueta: 'Concepto', valor: 'Pensión del mes actual' },
    { etiqueta: 'Monto', valor: '$145,00' },
    { etiqueta: 'Banco', valor: 'Banco Austral', senal: 'banco-nuevo' },
    { etiqueta: 'Número de cuenta', valor: '2200418877', senal: 'cuenta-pdf' },
  ],
  fields: [],
  button: '',
  cerrarGoto: 'n1',
  cerrarLabel: 'Cerró el comprobante y volvió al correo',
}

const STORY: Story<ScreenNode> = {
  ...createToolbarEndings('fraude', EMAIL),
  n1: { kind: 'scene', view: EMAIL },
  n2: { kind: 'scene', view: BANKING },
  n3: { kind: 'scene', view: SCHOOL },
  n4: { kind: 'scene', view: RECEIPT },
  e_transfiere: {
    kind: 'bad',
    view: BANKING,
    verdict: 'Caíste en la estafa',
    outcome:
      'Transferiste a la cuenta nueva. La cuenta de correo de la secretaría estaba comprometida: el atacante escribía desde ahí, con el hilo real y el PDF corregido. El dinero no llegó a la escuela, y la pensión sigue debiéndose.',
  },
  e_llama: {
    kind: 'good',
    view: SCHOOL,
    verdict: 'No caíste · llamaste al número que ya tenías',
    outcome:
      'La secretaria no sabía nada de ningún cambio de banco: su cuenta de correo había sido hackeada. Evitaste transferir a la cuenta falsa y, al avisar, evitaste que otros padres transfirieran.',
  },
  // Aquí responder no es tibio, es el fallo: la cuenta desde la que llegó el
  // correo es la que está en manos del atacante, así que contesta él.
  e_responder: {
    kind: 'bad',
    view: EMAIL,
    verdict: 'Preguntaste por el canal equivocado',
    outcome:
      'Respondiste el mismo hilo preguntando si el cambio era real, y te contestaron que sí: porque quien contesta es el atacante, desde la cuenta que controla. Verificar por el mismo canal que trae el aviso no verifica nada.',
  },
  // Y marcar como spam tampoco es la buena reacción de siempre: la dirección
  // es la real del colegio, y el filtro se llevaría por delante los avisos
  // legítimos que vengan después.
  e_spam: {
    kind: 'partial',
    view: EMAIL,
    verdict: 'No caíste, pero castigaste la dirección real',
    outcome:
      'No transferiste, y eso es lo importante. Pero la dirección es la auténtica del colegio: al marcarla como spam le enseñaste al filtro a esconder también las circulares y los recordatorios que sí vas a necesitar. El problema no era el remitente, era su cuenta hackeada, y eso se avisa llamando.',
  },
}

const MARKERS: BrowserBookmark[] = [
  {
    Icono: Landmark,
    texto: 'Banco del Litoral',
    goto: 'n2',
    label: 'Abrió su banca en línea para transferir',
  },
  {
    Icono: School,
    texto: 'U.E. San Rafael',
    goto: 'n3',
    label: 'Buscó el teléfono del colegio por su cuenta',
  },
]

const INSTRUCTION = (
  <>
    <p className="text-lg leading-relaxed text-body">
      Actúa sobre la ventana como lo harías frente a tu correo de verdad: puedes usar{' '}
      <strong>cualquier parte de ella</strong>, incluidos los marcadores del navegador.
    </p>
    <p className="text-base leading-relaxed text-body">
      El escenario termina cuando decidas qué hacer con el mensaje, o si caes en lo que pide.
      Moverte por las pantallas no decide nada: puedes abrir una página, mirarla y cerrarla, y
      seguirás donde estabas.
    </p>
  </>
)

const CLUE = (
  <p>
    Aquí no hay nada raro que descubrir en el correo. Puedes abrir el comprobante adjunto y mirarlo.
    Lo que se decide es otra cosa: si haces la transferencia, si preguntas por donde llegó el
    mensaje, si respondes con la barra del cliente o si lo confirmas por un camino que no dependa de
    ese correo.
  </p>
)

const SIGNALS: Signal[] = [
  createSignal(
    's0',
    'n4',
    'cuenta-pdf',
    'El comprobante tiene membrete, fecha y monto correctos, y aun así <b>solo repite el número de cuenta nuevo</b>. Un archivo adjunto no confirma nada: lo escribió quien mandó el correo.',
  ),
  createSignal(
    's1',
    'n1',
    'remitente',
    'No hay una dirección imitada, ni errores de redacción, ni urgencia artificial: el hilo es <b>real</b> y la dirección también. La cuenta de la secretaría estaba hackeada, así que todo lo que sueles mirar salía bien.',
  ),
  createSignal(
    's2',
    'n1',
    'cuenta',
    'La única anomalía es el hecho en sí: <b>un cambio de número de cuenta</b>. Eso, por sí solo, ya obliga a confirmar por otra vía.',
  ),
  createSignal(
    's3',
    'n2',
    'beneficiario-ajeno',
    'El beneficiario es <b>una persona ajena a la escuela</b>. Aunque el número de cuenta pareciera correcto, ese nombre distinto confirma que no debes transferir.',
  ),
  createSignal(
    's4',
    'n2',
    'cuenta-nueva',
    'La cuenta destino <b>no es la de siempre</b>, y es lo último que ves antes de que el dinero salga. Ese es el momento de parar, no después.',
  ),
  createSignal(
    's5',
    'n3',
    'telefono',
    'El teléfono del colegio <b>ya lo tenías</b>, y está en su sitio oficial: un número que no salió del correo sospechoso es lo que convierte la duda en respuesta.',
  ),
]

const RULE =
  'Regla de oro: todo cambio de número de cuenta se confirma <b>por llamada al número que ya tenías</b>, jamás por el mismo canal donde llegó el aviso. Responder el correo para verificar es preguntarle al estafador si es estafador.'

const SUMMARY = 'La secretaría del colegio de tu hijo dice que "cambió de banco" para la pensión.'

const CONTEXT: Context = {
  antes: (
    <>
      Pagas la pensión del colegio de tu hijo y tienes un hilo de correo real y en curso con la{' '}
      <strong>secretaría</strong>, sobre la pensión de este mes.
    </>
  ),
  ahora: (
    <>
      <strong>Esta semana</strong>, la que habías acordado para transferir, llega una respuesta
      dentro de ese mismo hilo y desde la dirección de siempre.
    </>
  ),
}

function ThreadHijacking() {
  return (
    <ScenarioStory
      escenarioId="phishing/secuestro-hilo"
      resumen={SUMMARY}
      contexto={CONTEXT}
      story={STORY}
      accionesCorreo={ACTIONS_BAR}
      identidad={['cuenta']}
      marcadores={MARKERS}
      instruccion={INSTRUCTION}
      pista={CLUE}
      senales={SIGNALS}
      rule={RULE}
      restartLabel="↻ Repetir el escenario"
    />
  )
}

export default ThreadHijacking
