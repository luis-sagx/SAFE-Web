import type { ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import BlocNotas from '../../components/ui/BlocNotas'
import type { Story } from '../../hooks/useStoryEngine'
import AIChatScenario from './EscenarioChatIA'
import {
  createAIChat,
  withFreeTextComposer,
  splitKnownData,
  evaluateData,
  worstLevel,
  mentionsAny,
  signal,
  type SendResult,
  type SensitiveDatum,
} from './chatIA'

/** La IA es legítima; el riesgo está en lo que el participante le escribe antes de pedir ayuda,aquí, los
 *  datos de una compañera que no hacían falta para redactar el texto.
 *
 *  Issue #184: el texto con los datos reales vive aparte, en un bloc de notas fijo junto al celular,el
 *  participante decide qué copiar y qué dejar afuera al escribir su propio mensaje en el chat, en vez de
 *  elegir entre burbujas ya redactadas ni tocar palabras de un borrador fijo. Lo que se evalúa sigue siendo
 *  si esos datos REALES quedaron en el mensaje al tocar "Enviar", nunca por parecerse a un dato de ese
 *  tipo, sino por ser el dato de verdad (ver evaluateDatum). */

const TIME = '10:14'

// Imposible por construcción, como la del participante: tercer dígito 9, que el Registro Civil no asigna (ver identidadFicticia).
const ECUADORIAN_ID = '1799999990'
const FIRST_NAME = 'Andrea Carolina'
const LAST_NAME = 'Cedeño Mora'
// Dominio de entrenamiento, no uno real: un gmail aquí podría existir y llegarle a alguien.
const EMAIL = 'andrea.cedeno02@safeweb.com'
const TEACHER = 'Ing. Marcelo Alejandro Tapia Vera'

const DATA_POINTS: SensitiveDatum[] = [
  { id: 'dato-nombre', tipo: 'nombre', etiqueta: 'el nombre completo de tu compañera', nombre: FIRST_NAME, apellido: LAST_NAME },
  { id: 'dato-docente', tipo: 'nombre', etiqueta: 'el nombre completo del docente', nombre: 'Marcelo Alejandro', apellido: 'Tapia Vera' },
  { id: 'dato-cedula', tipo: 'numero', etiqueta: 'la cédula de tu compañera', valor: ECUADORIAN_ID },
  // Sin el dominio también es su correo (el usuario identifica a la persona).
  { id: 'dato-correo', tipo: 'patron', etiqueta: 'el correo de tu compañera', patron: /andrea\.?cedeno02/ },
]

// De qué trata el correo: el trámite, la materia o a quién va. Sin nada de esto la IA no tiene qué redactar.
const TOPIC_ROOTS = ['horario', 'cambi', 'materia', 'redes', 'profe', 'docente', 'ingenier', 'ing\\b', 'tapia', 'clase', 'curso', 'solicit', 'permiso', 'coordinac']

function onEnviar(texto: string): SendResult {
  const nivel = worstLevel(evaluateData(texto, DATA_POINTS))
  // La fuga manda aunque el pedido esté incompleto: el dato ya salió.
  if (nivel === 'seguro' && !mentionsAny(texto, TOPIC_ROOTS)) {
    return { repregunta: 'Me falta información para redactarlo. ¿Sobre qué asunto es el correo y a quién va dirigido?' }
  }
  return {
    goto: nivel === 'fuga' ? 'e_fuga' : nivel === 'parcial' ? 'e_parcial' : 'e_seguro',
    label: 'Escribió su propio mensaje para pedirle ayuda a la IA',
  }
}

// El texto fuente vive en el bloc de notas (ver SOURCE_DOCUMENT más abajo); el mensaje real lo escribe el
// participante, copiando de ahí lo que decida.
const CHAT = withFreeTextComposer(
  createAIChat(
    'Redactor de mensajes · servicio externo',
    [
      { texto: 'Hola, ayúdame a redactar un correo.', mio: true },
      {
        texto:
          'Claro que sí. Cuéntame sobre qué asunto es el correo, a quién va dirigido y qué debe incluir. Con eso te lo entrego formal y listo para enviar.',
      },
    ],
    TIME,
    [],
    { titulo: 'Asistente IA', url: 'https://chat.asistente-ia.com/nuevo' },
  ),
  {
    placeholder: 'Escribe (o pega) lo que le pedirías a la IA…',
    hora: TIME,
    respuestaIA:
      'Aquí tienes un correo formal con lo que me diste. Si quieres, puedo ajustar el tono o agregar algún detalle más.',
    onEnviar,
    segmentar: (texto) => splitKnownData(texto, DATA_POINTS),
  },
)

// El "documento fuente": lo que la compañera le pasó al participante para pedirle el favor, con sus
// datos reales dentro. Vive en un bloc de notas fijo junto al celular, copiar de ahí es una decisión
// del participante, no algo que el escenario le sirva ya redactado.
const SOURCE_DOCUMENT = `Hola, ¿me ayudas a pedirle al ${TEACHER} un cambio de horario? Soy ${FIRST_NAME} ${LAST_NAME}, cédula ${ECUADORIAN_ID}, mi correo es ${EMAIL}. Es de la materia de Redes.`

const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: CHAT },
  e_fuga: {
    kind: 'bad',
    view: CHAT,
    senales: DATA_POINTS.map((dato) =>
      signal(
        dato.id,
        'e_fuga',
        `<b>${dato.etiqueta}</b> no hacía falta para redactar el correo. Quedó en un servicio externo.`,
      ),
    ),
    verdict: 'Datos personales compartidos con la IA',
    outcome:
      'Compartiste varios datos reales de tu compañera. Bastaba con decir "una compañera", "el docente" y la materia.',
  },
  e_parcial: {
    kind: 'partial',
    view: CHAT,
    senales: [
      signal(
        'borrador-enviado',
        'e_parcial',
        '<b>Dejaste parte de la cédula real</b>. Aún permite identificarla.',
      ),
    ],
    verdict: 'Quedó algo identificable, aunque no el dato completo',
    outcome:
      'Dejaste parte de la cédula real. No copies esos datos, usa palabras como "compañera".',
  },
  e_seguro: {
    kind: 'good',
    view: CHAT,
    senales: [
      signal(
        'borrador-enviado',
        'e_seguro',
        '<b>Compartiste solo el asunto, a quién va y la materia</b>. No diste datos reales.',
      ),
    ],
    verdict: 'Correo redactado sin compartir datos reales de nadie',
    outcome:
      'La IA tuvo lo necesario para redactar el correo. Agrega los datos reales después, fuera del chat.',
  },
}

const SIGNALS = [
  signal(
    'datos-en-juego',
    'n1',
    '<b>Tienes el nombre, la cédula y el correo de tu compañera</b>. No hacen falta para redactar el correo.',
  ),
]

const RULE =
  '<b>No compartas datos personales de otras personas</b>, como nombres completos, cédulas, correos o teléfonos.'

const SUMMARY = 'Pides a una IA redactar un correo para una compañera.'

export const CONTEXT: Context = {
  antes: 'Ayudas a tus compañeros con trámites y usas una IA para redactar correos.',
  ahora: (
    <>
      <strong>Abres el asistente de IA</strong>. Al lado está el mensaje de tu compañera.
    </>
  ),
}

function ThirdPartyDataEmail() {
  return (
    <AIChatScenario
      escenarioId="asistentes-ia/correo-datos-terceros"
      resumen={SUMMARY}
      contexto={CONTEXT}
      story={STORY}
      senales={SIGNALS}
      rule={RULE}
      documentoFuente={<BlocNotas titulo="Bloc de notas" texto={SOURCE_DOCUMENT} />}
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Escribe qué necesitas y copia solo lo necesario del bloc. Luego toca "Enviar".
        </p>
      }
      pista={
        <p>
          La IA puede redactar el correo sin saber quién es tu compañera. Decide qué datos dejar fuera.
        </p>
      }
    />
  )
}

export default ThirdPartyDataEmail
