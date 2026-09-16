import type { ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import BlocNotas from '../../components/ui/BlocNotas'
import type { Story } from '../../hooks/useStoryEngine'
import AIChatScenario from './EscenarioChatIA'
import {
  createAIChat,
  withFreeTextComposer,
  splitKnownData,
  evaluateDatum,
  evaluateData,
  worstLevel,
  signal,
  type SensitiveDatum,
} from './chatIA'

/** Informe escolar = documento pedagógico que además es, sin querer, un documento de identidad de un
 *  menor de edad, pegado entero (copiar/pegar sin leer) — mismo patrón que la hoja de vida que reemplaza
 *  (issue #186). escenarioId sigue siendo `correo-credenciales` porque ahí están guardadas las corridas
 *  anteriores.
 *
 *  Deliberadamente en el plano de datos de texto (cédula, fecha de nacimiento, domicilio): nunca se simula
 *  subir una foto del estudiante ni un dato biométrico. El objetivo es enseñar el riesgo de pegar los datos
 *  de un menor en un servicio externo, no representar de forma gráfica un tema delicado.
 *
 *  Issue #184: la ficha del estudiante vive en un bloc de notas fijo junto al celular; el participante
 *  escribe su propio mensaje a la IA, copiando de la ficha lo que decida.
 *
 *  Mismo criterio de peso que #185: la cédula, la fecha de nacimiento y el domicilio son el paquete que
 *  prueba identidad — cualquiera de los tres, solo, ya es fuga completa. El teléfono de contacto es menos
 *  grave —sirve para llegar a la familia, no para suplantar al estudiante— así que solo baja a "parcial".
 *  El nombre no se evalúa: un informe sin nombre no sirve para nada. */

const TIME = '08:55'

const STUDENT_NAME = 'Emilio Torres'
// Imposible por construcción: tercer dígito 9, que el Registro Civil no asigna (ver identidadFicticia).
const ECUADORIAN_ID = '1799999965'
const BIRTH = '14/06/2015'
const ADDRESS = 'Cdla. La Alborada, Mz 14 Villa 7'
const CONTACT_PHONE = '099 000 0072'

const PROGRESS =
  'Seguimiento del segundo parcial: mejoró la participación en clase y el trabajo en equipo; todavía le cuesta entregar las tareas a tiempo. Se recomienda reforzar hábitos de organización en casa.'

// El paquete que prueba identidad: cualquiera de los tres, solo, ya es fuga completa.
const IDENTITY_POINTS: SensitiveDatum[] = [
  { id: 'dato-cedula', tipo: 'numero', etiqueta: 'la cédula real del estudiante', valor: ECUADORIAN_ID },
  { id: 'dato-nacimiento', tipo: 'texto', etiqueta: 'la fecha de nacimiento real del estudiante', valor: BIRTH },
  { id: 'dato-direccion', tipo: 'texto', etiqueta: 'el domicilio real del estudiante', valor: ADDRESS },
]
// Menos grave: sirve para llegar a la familia, no para suplantar al estudiante ante un trámite.
const PHONE_POINT: SensitiveDatum = {
  id: 'dato-telefono',
  tipo: 'numero',
  etiqueta: 'el teléfono real de contacto del estudiante',
  valor: CONTACT_PHONE,
}

function onEnviar(texto: string): { goto: string; label?: string } {
  const identityLevel = worstLevel(evaluateData(texto, IDENTITY_POINTS))
  const phoneLevel = evaluateDatum(texto, PHONE_POINT).nivel
  const goto =
    identityLevel === 'fuga'
      ? 'e_fuga'
      : identityLevel === 'parcial' || phoneLevel !== 'seguro'
        ? 'e_parcial'
        : 'e_seguro'
  return { goto, label: 'Escribió su propio mensaje para pedirle ayuda a la IA' }
}

const MARKED_POINTS: SensitiveDatum[] = [...IDENTITY_POINTS, PHONE_POINT]

// Va en el computador: un informe escolar se arma con la ficha del estudiante abierta al lado, de un
// copiar y pegar.
const CHAT = withFreeTextComposer(
  createAIChat(
    'Asistente de escritura · servicio externo',
    [
      { texto: 'Hola, ayúdame a mejorar la redacción de un informe de seguimiento de un estudiante.', mio: true },
      {
        texto:
          'Con gusto. Pégame el contenido que quieres mejorar y te lo devuelvo con mejor redacción y un tono más claro para la familia.',
      },
    ],
    TIME,
    [],
    { titulo: 'Asistente IA', url: 'https://chat.asistente-ia.com/nuevo' },
  ),
  {
    placeholder: 'Escribe (o pega) el contenido que quieres mejorar…',
    hora: TIME,
    respuestaIA:
      'Aquí tienes el informe mejorado, con mejor redacción y un tono más claro para la familia.',
    onEnviar,
    segmentar: (texto) => splitKnownData(texto, MARKED_POINTS),
  },
)

// La ficha del estudiante, tal como está en el sistema de la institución — con los datos reales que el
// informe no necesitaba para mejorar la redacción.
const SOURCE_DOCUMENT = `Ficha del estudiante — uso interno.\n\nNombre: ${STUDENT_NAME}\nCédula: ${ECUADORIAN_ID}\nFecha de nacimiento: ${BIRTH}\nDomicilio: ${ADDRESS}\nTeléfono de contacto: ${CONTACT_PHONE}\n\n${PROGRESS}`

const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: CHAT },
  e_fuga: {
    kind: 'bad',
    view: CHAT,
    senales: IDENTITY_POINTS.map((dato) =>
      signal(
        dato.id,
        'e_fuga',
        `Si tu mensaje incluyó <b>${dato.etiqueta}</b>: junto con el resto del paquete, es lo que identifica a un estudiante menor de edad fuera de la institución — y no mejora en nada la redacción del informe.`,
      ),
    ),
    verdict: 'El informe entero del estudiante quedó en un servicio externo',
    outcome:
      'Un informe escolar es, además de un documento pedagógico, un documento de identidad de un menor de edad. Para mejorar la redacción, la IA no necesitaba la cédula, la fecha de nacimiento ni el domicilio del estudiante. Nadie más que la institución y su familia debía decidir compartirlos.',
  },
  e_parcial: {
    kind: 'partial',
    view: CHAT,
    senales: [
      signal(
        'dato-telefono',
        'e_parcial',
        'El <b>teléfono de contacto</b> no prueba la identidad del estudiante, pero sí es por dónde llegar hasta su familia — y con eso empieza cualquier intento de contacto no autorizado.',
      ),
    ],
    verdict: 'Quitaste lo peor, pero dejaste cómo llegar hasta él',
    outcome:
      'Lo grave —cédula, fecha de nacimiento y domicilio— se quedó fuera. Pero el teléfono de contacto tampoco hacía falta para mejorar la redacción.',
  },
  e_seguro: {
    kind: 'good',
    view: CHAT,
    senales: [
      signal(
        'borrador-enviado',
        'e_seguro',
        'Le pegaste a la IA solo lo que había que mejorar: el seguimiento académico. Eso no identifica a nadie ni sirve para contactar a la familia.',
      ),
    ],
    verdict: 'Informe mejorado sin entregar los datos de nadie',
    outcome:
      'La IA devolvió el seguimiento académico mejor redactado y con un tono más claro. El nombre y los datos de contacto del estudiante los agregas tú en el documento que se entrega a la institución — donde sí corresponde.',
  },
}

const SIGNALS = [
  signal(
    'informe-en-juego',
    'n1',
    'La IA te pide el <b>contenido que quieres mejorar</b>. El informe trae además la cédula, la fecha de nacimiento, el domicilio y el teléfono de contacto del estudiante — y ninguno de esos cambia cómo se redacta su seguimiento académico.',
  ),
]

const RULE =
  'Regla de oro: un informe escolar es, además de un documento pedagógico, un documento de identidad de un menor de edad. Antes de pegarlo en una IA —el de un estudiante o el de cualquier persona— quítale la <b>cédula, la fecha de nacimiento, el domicilio y el teléfono de contacto</b>: esos los agregas tú al entregarlo.'

const SUMMARY = 'Le pides a una IA que mejore un informe escolar de un estudiante, con su cédula y su domicilio dentro.'

const CONTEXT: Context = {
  antes: 'Eres tutor de un curso y te pidieron mejorar la redacción de un informe de seguimiento antes de entregarlo a coordinación.',
  ahora: (
    <>
      <strong>Abres el asistente de IA</strong> en el computador. Al lado tienes la ficha del estudiante,
      del sistema de la institución.
    </>
  ),
}

function SchoolReport() {
  return (
    <AIChatScenario
      escenarioId="asistentes-ia/correo-credenciales"
      resumen={SUMMARY}
      contexto={CONTEXT}
      story={STORY}
      senales={SIGNALS}
      rule={RULE}
      documentoFuente={<BlocNotas titulo="Ficha.txt — Bloc de notas" texto={SOURCE_DOCUMENT} />}
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Escribe (o pega) el contenido que le pedirías mejorar a la IA, y toca "Enviar" cuando el
          informe quede como quieres.
        </p>
      }
      pista={
        <p>
          La IA puede mejorar el seguimiento académico sin saber la cédula del estudiante ni dónde vive.
          Lo que decides es cuánto de la ficha le pegas.
        </p>
      }
    />
  )
}

export default SchoolReport
