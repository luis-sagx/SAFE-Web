import type { ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import AIChatScenario from './EscenarioChatIA'
import {
  createAIChat,
  withEditableDraft,
  buildDraftSegments,
  evaluateDatum,
  evaluateData,
  worstLevel,
  signal,
  type SensitiveDatum,
} from './chatIA'

/** Hoja de vida = documento de identidad disfrazado de currículum, pegado entero (copiar/pegar sin leer), no un
 *  dato suelto colado en un texto. escenarioId sigue siendo `correo-credenciales` porque ahí están guardadas
 *  las corridas anteriores.
 *
 *  Issue #185: no todos los datos pesan igual. La cédula, la fecha de nacimiento y el domicilio son el
 *  paquete que prueba identidad — cualquiera de los tres, solo, ya es fuga completa. El teléfono es menos
 *  grave —sirve para contactar, no para suplantar— así que solo baja a "parcial", nunca a "seguro" del
 *  todo si aparece. El nombre no se evalúa: una hoja de vida sin nombre no sirve para nada. */

const TIME = '19:40'

const NAME = 'Paola Guamán'
// Imposible por construcción: tercer dígito 9, que el Registro Civil no asigna (ver identidadFicticia).
const ECUADORIAN_ID = '1799999980'
const BIRTH = '12/03/1999'
const ADDRESS = 'Av. Napo y Quimiag, casa 214'
const PHONE = '099 000 0011'
// Dominio de entrenamiento, no uno real: un gmail aquí podría existir y llegarle a alguien.
const EMAIL = 'paola.guaman@safeweb.com'

const PATH =
  'Experiencia: asistencia administrativa 2023–2026 en Comercial Andes. Estudios: Tecnología en Administración.'

// El paquete que prueba identidad: cualquiera de los tres, solo, ya es fuga completa.
const IDENTITY_POINTS: SensitiveDatum[] = [
  { id: 'dato-cedula', tipo: 'numero', etiqueta: 'la cédula real de tu prima', valor: ECUADORIAN_ID },
  { id: 'dato-nacimiento', tipo: 'texto', etiqueta: 'la fecha de nacimiento real de tu prima', valor: BIRTH },
  { id: 'dato-direccion', tipo: 'texto', etiqueta: 'el domicilio real de tu prima', valor: ADDRESS },
]
// Menos grave: sirve para contactarla, no para suplantarla ante un trámite.
const PHONE_POINT: SensitiveDatum = { id: 'dato-telefono', tipo: 'numero', etiqueta: 'el teléfono real de tu prima', valor: PHONE }

function onEnviar(texto: string): { goto: string; label?: string } {
  const identityLevel = worstLevel(evaluateData(texto, IDENTITY_POINTS))
  const phoneLevel = evaluateDatum(texto, PHONE_POINT).nivel
  const goto =
    identityLevel === 'fuga'
      ? 'e_fuga'
      : identityLevel === 'parcial' || phoneLevel !== 'seguro'
        ? 'e_parcial'
        : 'e_seguro'
  return { goto, label: 'Tocó "Enviar" con lo que decidió dejar del borrador' }
}

// El nombre y el correo no se evalúan (ver nota arriba), así que no van en la lista que le pasamos a
// buildDraftSegments: quedan como texto fijo del borrador, sin poder tocarse.
const MARKED_POINTS: SensitiveDatum[] = [...IDENTITY_POINTS, PHONE_POINT]
const DRAFT = `Aquí va: ${NAME}, cédula ${ECUADORIAN_ID}, nacida el ${BIRTH}, domicilio ${ADDRESS}, teléfono ${PHONE}, correo ${EMAIL}. ${PATH}`

// Va en el computador: una hoja de vida se arma con el archivo abierto al lado, de un copiar y pegar.
const CHAT = withEditableDraft(
  createAIChat(
    'Asistente de escritura · servicio externo',
    [
      { texto: 'Hola, ayúdame a mejorar la hoja de vida de mi prima.', mio: true },
      {
        texto:
          'Con gusto. Pégame el contenido que quieres mejorar y te lo devuelvo ordenado, con mejor redacción y un perfil profesional al inicio.',
      },
    ],
    TIME,
    [],
    { titulo: 'Asistente IA', url: 'https://chat.asistente-ia.com/nuevo' },
  ),
  {
    segmentos: buildDraftSegments(DRAFT, MARKED_POINTS),
    hora: TIME,
    respuestaIA:
      'Aquí tienes la hoja de vida mejorada, con un perfil profesional al inicio y mejor redacción en la experiencia y la formación.',
    onEnviar,
  },
)

const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: CHAT },
  e_fuga: {
    kind: 'bad',
    view: CHAT,
    senales: IDENTITY_POINTS.map((dato) =>
      signal(
        dato.id,
        'e_fuga',
        `Si tu mensaje incluyó <b>${dato.etiqueta}</b>: junto con el resto del paquete, es lo que piden casi todos los formularios para comprobar que alguien es quien dice ser — y no mejora en nada la redacción de su hoja de vida.`,
      ),
    ),
    verdict: 'La hoja de vida entera de tu prima quedó en un servicio externo',
    outcome:
      'Una hoja de vida es un documento de identidad disfrazado de currículum. Para mejorar la redacción, la IA no necesitaba la cédula, la fecha de nacimiento ni el domicilio de tu prima. Ella nunca decidió compartirlos.',
  },
  e_parcial: {
    kind: 'partial',
    view: CHAT,
    senales: [
      signal(
        'dato-telefono',
        'e_parcial',
        'El <b>teléfono</b> no prueba quién es ante un trámite, pero sí es por dónde llegar hasta ella — y con eso empieza cualquier intento de estafa dirigida.',
      ),
    ],
    verdict: 'Quitaste lo peor, pero dejaste cómo encontrarla',
    outcome:
      'Lo grave —cédula, fecha de nacimiento y domicilio— se quedó fuera. Pero el teléfono real de tu prima tampoco hacía falta para mejorar la redacción.',
  },
  e_seguro: {
    kind: 'good',
    view: CHAT,
    senales: [
      signal(
        'borrador-enviado',
        'e_seguro',
        'Le pegaste a la IA solo lo que había que mejorar: la experiencia y los estudios. Ninguna de las dos cosas identifica a nadie ni sirve para contactarla.',
      ),
    ],
    verdict: 'Hoja de vida mejorada sin entregar los datos de nadie',
    outcome:
      'La IA devolvió el perfil, la experiencia y la formación mejor redactados. La cabecera con el nombre y el contacto de tu prima la pegas tú en el documento que se envía — donde sí corresponde.',
  },
}

const SIGNALS = [
  signal(
    'cv-en-juego',
    'n1',
    'La IA te pide el <b>contenido que quieres mejorar</b>. La hoja de vida trae además la cédula, la fecha de nacimiento, el domicilio y el teléfono de tu prima — y ninguno de esos cambia cómo se redacta su experiencia.',
  ),
]

const RULE =
  'Regla de oro: una hoja de vida es un documento de identidad disfrazado de currículum. Antes de pegar una en una IA —la tuya o la de alguien más— quítale la <b>cédula, la fecha de nacimiento, el domicilio y el teléfono</b>: en la que se envía, esos los pones tú.'

const SUMMARY = 'Le pides a una IA que mejore la hoja de vida de tu prima, con la cédula y la dirección dentro.'

const CONTEXT: Context = {
  antes: 'Tu prima está postulando a una vacante y te pidió que le arregles la hoja de vida antes de mandarla.',
  ahora: (
    <>
      <strong>Abres el asistente de IA</strong> en el computador, con el archivo que ella te pasó abierto
      al lado, listo para copiar y pegar. Escribe (o pega) tú mismo lo que le pedirías.
    </>
  ),
}

function Resume() {
  return (
    <AIChatScenario
      escenarioId="asistentes-ia/correo-credenciales"
      resumen={SUMMARY}
      contexto={CONTEXT}
      story={STORY}
      senales={SIGNALS}
      rule={RULE}
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Toca las palabras marcadas para cambiarlas, y toca "Enviar" cuando el mensaje quede como
          quieres.
        </p>
      }
      pista={
        <p>
          La IA puede mejorar la experiencia y los estudios sin saber la cédula de tu prima ni dónde vive.
          Lo que decides es cuánto del documento le pegas.
        </p>
      }
    />
  )
}

export default Resume
