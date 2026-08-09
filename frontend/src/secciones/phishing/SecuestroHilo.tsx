import { Landmark, School } from 'lucide-react'
import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { MarcadorNavegador } from '../../components/ui/Navegador'
import { ACCIONES_BARRA, finalesDeBarra } from './barraDeCorreo'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'

/**
 * El hilo secuestrado: el correo es auténtico y el remitente también.
 *
 * Es el único escenario del módulo sin nada raro que señalar — no hay dominio
 * parecido, ni faltas de ortografía, ni prisa fingida. La cuenta de la
 * secretaría está comprometida de verdad, así que todo lo que el participante
 * aprendió a mirar en los escenarios anteriores le sale bien y aun así pierde
 * el dinero. Lo único que lo salva es el hábito: un cambio de número de cuenta
 * se confirma por fuera del canal donde llegó.
 *
 * Por eso aquí responder es un fallo, y no la respuesta tibia que es en el
 * resto del módulo: preguntar dentro del hilo es preguntarle al atacante.
 */

const HILO_PREVIO = `
  <div style="border-left:3px solid #d7dde1;padding-left:12px;margin:14px 0;color:#5f6b7a;font-size:13px;line-height:1.55;">
    <p style="margin:0 0 8px;"><b>Secretaría — Unidad Educativa San Rafael</b> · hace 3 días<br/>
    Buenas tardes, le recuerdo que la pensión de julio vence el día 30. El monto es $145.</p>
    <p style="margin:0;"><b>Yo</b> · hace 3 días<br/>
    Perfecto, gracias, hago la transferencia esta semana a la cuenta de siempre.</p>
  </div>
`

const CORREO: ScreenView = {
  kind: 'mail',
  from: 'Secretaría — Unidad Educativa San Rafael',
  address: 'secretaria@unidadsanrafael.edu.ec',
  senalDireccion: 'remitente',
  subject: 'Re: Pensión de julio',
  date: 'hoy 11:15',
  body: `
    <p>Buenas de nuevo:</p>
    <p>
      Antes de que transfiera, le cuento que
      <mark class="marca" data-signal="cuenta">cambiamos de banco</mark> este mes. Adjunto el
      comprobante corregido con el nuevo número de cuenta para la pensión de julio.
    </p>
    ${HILO_PREVIO}
  `,
  attachment: 'Comprobante_pension_julio.pdf',
  adjuntoGoto: 'n4',
  adjuntoLabel: 'Abrió el comprobante adjunto',
  senalAdjunto: 'adjunto',
}

/// La banca en línea, abierta desde los marcadores: es donde la decisión se
/// vuelve irreversible. La cuenta destino aparece ya escrita con el número
/// nuevo, que es exactamente lo que el correo consiguió.
const BANCA: ScreenView = {
  kind: 'web',
  url: 'https://banca.bancodellitoral.ec/transferencias',
  secure: true,
  brand: 'Banco del Litoral · Banca en línea',
  title: 'Transferencia a terceros',
  subtitle: 'Revise los datos antes de confirmar la transferencia.',
  fields: [
    // La cuenta de origen es la del participante, la misma que vio antes de
    // empezar: sin ella la pantalla enseña a dónde va el dinero pero no de
    // dónde sale, que es lo que hace propia la pérdida.
    { label: 'Cuenta de origen', placeholder: '', valor: 'cuenta' },
    { label: 'Beneficiario', placeholder: 'Unidad Educativa San Rafael' },
    {
      label: 'Cuenta destino',
      placeholder: 'Banco Austral · 2200418877 (nueva)',
      senal: 'cuenta-nueva',
    },
    { label: 'Monto', placeholder: '$145,00' },
  ],
  button: 'Transferir $145',
  botonGoto: 'e_transfiere',
  botonLabel: 'Transfirió los $145 a la cuenta nueva',
  cerrarGoto: 'e_no_transfiere',
  cerrarLabel: 'Abrió la banca y cerró sin transferir',
}

/// El sitio del colegio, con el teléfono de siempre: el canal alterno que hace
/// falta para confirmar el cambio sin pasar por el correo.
const COLEGIO: ScreenView = {
  kind: 'web',
  url: 'https://www.unidadsanrafael.edu.ec/contacto',
  secure: true,
  brand: 'Unidad Educativa San Rafael',
  title: 'Contacto',
  subtitle: 'Secretaría · atención de 07:30 a 15:00',
  datos: [
    { etiqueta: 'Teléfono', valor: '(02) 244 1180', senal: 'telefono' },
    { etiqueta: 'Dirección', valor: 'Av. de los Shyris N38-24, Quito' },
    { etiqueta: 'Correo', valor: 'secretaria@unidadsanrafael.edu.ec' },
  ],
  fields: [],
  button: '📞 Llamar al (02) 244 1180',
  botonGoto: 'e_llama',
  botonLabel: 'Llamó al colegio al número de su sitio oficial',
  // Cerrar aquí no decide nada: buscar el número y no usarlo deja al
  // participante donde estaba, con el correo todavía sin responder.
  cerrarGoto: 'n1',
  cerrarLabel: 'Miró el teléfono del colegio y volvió al correo',
}

/// El comprobante, abierto desde el disco después de descargarlo. No es una
/// trampa técnica —es un PDF de verdad, sin macros ni doble extensión— y por
/// eso mismo enseña algo distinto de factura-sri: un documento con membrete
/// convence, y aquí lo único que aporta es el número de cuenta nuevo, que es
/// exactamente lo que había que desconfiar. Un archivo no verifica nada.
const COMPROBANTE: ScreenView = {
  kind: 'web',
  url: 'C:\\Usuarios\\Descargas\\Comprobante_pension_julio.pdf',
  secure: true,
  local: true,
  brand: 'Unidad Educativa San Rafael',
  title: 'Comprobante de pago · Pensión julio',
  subtitle: 'Documento generado por Secretaría · 05/08/2026',
  datos: [
    { etiqueta: 'Estudiante', valor: 'A nombre del representante' },
    { etiqueta: 'Concepto', valor: 'Pensión de julio' },
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
  // Responder, reenviar, eliminar y marcar como spam.
  ...finalesDeBarra('fraude', CORREO),
  n1: { kind: 'scene', view: CORREO },
  n2: { kind: 'scene', view: BANCA },
  n3: { kind: 'scene', view: COLEGIO },
  n4: { kind: 'scene', view: COMPROBANTE },
  e_transfiere: {
    kind: 'bad',
    view: BANCA,
    verdict: 'Caíste en la estafa',
    outcome:
      'Transferiste a la cuenta nueva. La cuenta de correo de la secretaría estaba comprometida: el atacante escribía desde ahí, con el hilo real y el PDF corregido. El dinero no llegó a la escuela, y la pensión sigue debiéndose.',
  },
  e_no_transfiere: {
    kind: 'partial',
    verdict: 'No transferiste, pero tampoco confirmaste',
    view: BANCA,
    outcome:
      'Te frenaste a tiempo, que es lo que evita la pérdida. Pero quedaste igual de a ciegas: no sabes si el cambio era real ni avisaste al colegio de que su correo está comprometido, y la pensión sigue pendiente.',
  },
  e_llama: {
    kind: 'good',
    view: COLEGIO,
    verdict: 'No caíste · llamaste al número que ya tenías',
    outcome:
      'La secretaria no sabía nada de ningún cambio de banco: su cuenta de correo había sido hackeada. Evitaste transferir a la cuenta falsa y, al avisar, evitaste que otros padres transfirieran.',
  },
  // Aquí responder no es tibio, es el fallo: la cuenta desde la que llegó el
  // correo es la que está en manos del atacante, así que contesta él.
  e_responder: {
    kind: 'bad',
    view: CORREO,
    verdict: 'Preguntaste por el canal equivocado',
    outcome:
      'Respondiste el mismo hilo preguntando si el cambio era real, y te contestaron que sí — porque quien contesta es el atacante, desde la cuenta que controla. Verificar por el mismo canal que trae el aviso no verifica nada.',
  },
  // Y marcar como spam tampoco es la buena reacción de siempre: la dirección
  // es la real del colegio, y el filtro se llevaría por delante los avisos
  // legítimos que vengan después.
  e_spam: {
    kind: 'partial',
    view: CORREO,
    verdict: 'No caíste, pero castigaste la dirección real',
    outcome:
      'No transferiste, y eso es lo importante. Pero la dirección es la auténtica del colegio: al marcarla como spam le enseñaste al filtro a esconder también las circulares y los recordatorios que sí vas a necesitar. El problema no era el remitente, era su cuenta hackeada — y eso se avisa llamando.',
  },
}

const MARCADORES: MarcadorNavegador[] = [
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

const INSTRUCCION = (
  <>
    <p className="text-lg leading-relaxed text-body">
      Actúa sobre la ventana como lo harías frente a tu correo de verdad: puedes usar{' '}
      <strong>cualquier parte de ella</strong>, incluidos los marcadores del navegador.
    </p>
    <p className="text-base leading-relaxed text-body">
      Lo primero que hagas cierra el escenario y te muestra en qué terminaba. Cambiar de pestaña no
      decide nada.
    </p>
  </>
)

const PISTA = (
  <p>
    Aquí no hay nada raro que descubrir en el correo. Puedes abrir el comprobante adjunto y mirarlo.
    Lo que se decide es otra cosa: si haces la transferencia, si preguntas por donde llegó el
    mensaje, si respondes con la barra del cliente o si lo confirmas por un camino que no dependa de
    ese correo.
  </p>
)

const SENALES: Senal[] = [
  {
    id: 's0',
    pantalla: 'n4',
    targetId: 'cuenta-pdf',
    texto:
      'El comprobante tiene membrete, fecha y monto correctos — y aun así <b>solo repite el número de cuenta nuevo</b>. Un archivo adjunto no confirma nada: lo escribió quien mandó el correo.',
  },
  {
    id: 's1',
    pantalla: 'n1',
    targetId: 'remitente',
    texto:
      'No hay dominio falso, ni error de redacción, ni urgencia artificial: el hilo es <b>real</b> y la dirección también. La cuenta de la secretaría estaba hackeada, así que todo lo que sueles mirar salía bien.',
  },
  {
    id: 's2',
    pantalla: 'n1',
    targetId: 'cuenta',
    texto:
      'La única anomalía es el hecho en sí: <b>un cambio de número de cuenta</b>. Eso, por sí solo, ya obliga a confirmar por otra vía.',
  },
  {
    id: 's3',
    pantalla: 'n2',
    targetId: 'cuenta-nueva',
    texto:
      'La cuenta destino <b>no es la de siempre</b>, y es lo último que ves antes de que el dinero salga. Ese es el momento de parar, no después.',
  },
  {
    id: 's4',
    pantalla: 'n3',
    targetId: 'telefono',
    texto:
      'El teléfono del colegio <b>ya lo tenías</b>, y está en su sitio oficial: un número que no salió del correo sospechoso es lo que convierte la duda en respuesta.',
  },
]

const RULE =
  'Regla de oro: todo cambio de número de cuenta se confirma <b>por llamada al número que ya tenías</b>, jamás por el mismo canal donde llegó el aviso. Responder el correo para verificar es preguntarle al estafador si es estafador.'

const RESUMEN = 'La secretaría del colegio de tu hijo dice que "cambió de banco" para la pensión.'

const CONTEXTO: Contexto = {
  antes: (
    <>
      Pagas la pensión del colegio de tu hijo y tienes un hilo de correo real y en curso con la{' '}
      <strong>secretaría</strong>, sobre la de julio.
    </>
  ),
  ahora: (
    <>
      <strong>Esta semana</strong>, la que habías acordado para transferir, llega una respuesta
      dentro de ese mismo hilo y desde la dirección de siempre.
    </>
  ),
  detalle: 'Ya habían quedado en que el pago iba a la cuenta de siempre.',
}

function SecuestroHilo() {
  return (
    <StoryEscenario
      escenarioId="phishing/secuestro-hilo"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      accionesCorreo={ACCIONES_BARRA}
      identidad={['cuenta']}
      marcadores={MARCADORES}
      instruccion={INSTRUCCION}
      pista={PISTA}
      senales={SENALES}
      rule={RULE}
      restartLabel="↻ Repetir el escenario"
    />
  )
}

export default SecuestroHilo
