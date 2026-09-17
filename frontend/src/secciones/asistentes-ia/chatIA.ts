import type { ScreenView } from '../../components/ui/DeviceScreen'
import { createSignal } from '../../lib/crearSenal'
import type { Signal } from '../../components/ui/PanelVeredicto'

/// Casi todas las señales de esta sección resaltan el elemento que lleva su
/// mismo id (`data-signal`). El helper evita repetir `id` y `targetId` con el
/// mismo valor en cada objeto, cuatro escenarios seguidos, que es como la
/// duplicación estructural terminaba fallando el Quality Gate.
export const signal = (id: string, screen: string, text: string): Signal =>
  createSignal(id, screen, id, text)

export type AIChat = Extract<ScreenView, { kind: 'sms' }>
export type AIResponse = NonNullable<AIChat['respuestas']>[number]
export type AISite = NonNullable<AIChat['sitio']>

/// Una línea del saludo inicial: sin `mio`, es la IA la que la escribe.
export interface OpeningLine {
  texto: string
  mio?: boolean
}

/// Los cuatro escenarios de esta sección simulan el mismo tipo de pantalla,un
/// chat con un "Asistente IA" externo, que arranca con un saludo (para que se
/// sienta como una conversación de verdad y no como un mensaje que ya salió) y
/// termina en el pedido de ayuda, con las versiones posibles de lo que se le
/// escribiría a continuación como burbujas para tocar, igual que un hilo de
/// SMS con `respuestas` (ver smishing/BajaSuscripcion.tsx): la decisión se
/// toma dentro del chat, no en una lista aparte. Factorizado porque los
/// cuatro repetían esta forma letra por letra, salvo el remitente, la
/// apertura, la hora y las respuestas.
///
/// La apertura alterna estrictamente: escribes tú, contesta la IA, y recién
/// entonces eliges. Con dos burbujas tuyas seguidas,el "hola" y el pedido,
/// el hilo dejaba de leerse como una conversación y pasaba a leerse como un
/// mensaje partido en dos; y la respuesta elegida caía sobre otra burbuja
/// tuya, que ningún chat hace.
///
/// Con `sitio` el chat deja el marco del celular y se abre en una pestaña del
/// navegador: en la oficina un asistente de IA se usa en el computador, y la
/// barra de direcciones enseña de paso que es un sitio ajeno.
export function createAIChat(
  sub: string,
  opening: OpeningLine[],
  time: string,
  responses: AIResponse[],
  site?: AISite,
): AIChat {
  return {
    kind: 'sms',
    sender: 'Asistente IA',
    sub,
    sitio: site,
    msgs: opening.map((line) => ({ text: line.texto, time: time, mine: line.mio })),
    respuestas: responses,
  }
}

/// La burbuja de respuesta de la IA, para mostrar sobre qué texto contestó:
/// el mensaje que realmente se envió, encima del saludo con el que arrancó
/// el chat. Se usa tanto si el participante mandó el borrador tal cual como
/// si lo reescribió antes. Sin `respuestas`: la decisión ya se tomó, no hay
/// nada más que elegir.
export function withAIResponse(chat: AIChat, time: string, textSent: string, aiResponse: string): AIChat {
  return {
    ...chat,
    respuestas: undefined,
    msgs: [
      ...chat.msgs,
      { text: textSent, time: time, mine: true, senal: 'borrador-enviado' },
      { text: aiResponse, time: time },
    ],
  }
}

/// Continúa el hilo dejando el chat abierto: agrega [tu mensaje, respuesta de la
/// IA] y mantiene nuevas `respuestas` para elegir. Como `conRespuestaIA`, pero
/// la conversación no ha terminado, la IA contestó y además repreguntó, y lo
/// que se elige a continuación es la respuesta a esa segunda pregunta.
///
/// Las ramas que salen de ese segundo paso se arman con `conRespuestaIA` sobre
/// el chat que devuelve esta función.
export function withAIFollowUp(
  chat: AIChat,
  time: string,
  textSent: string,
  aiResponse: string,
  responses: AIResponse[],
): AIChat {
  return {
    ...chat,
    respuestas: responses,
    msgs: [
      ...chat.msgs,
      { text: textSent, time: time, mine: true, senal: 'borrador-enviado' },
      { text: aiResponse, time: time },
    ],
  }
}

/// Nivel de fuga de UN dato sensible dentro de lo que escribió el
/// participante. 'parcial' es a propósito un tercer estado, no un punto
/// intermedio en una escala binaria: es "quedó algo identificable, pero no
/// la combinación completa que de verdad delata a la persona o la cuenta".
export type LeakLevel = 'fuga' | 'parcial' | 'seguro'

/// Qué comparar y cómo. La comparación es siempre contra el valor REAL de
/// este escenario, nunca contra un patrón genérico (un regex de "10 dígitos"
/// marcaría como fuga una cédula inventada, y uno que solo busca "el nombre"
/// se queda mudo ante un apodo), así se evitan los dos falsos que pide
/// resolver el issue: no marca lo inventado, y no deja pasar lo real aunque
/// venga con espacios o guiones distintos.
export type SensitiveDatum =
  | { id: string; tipo: 'numero'; etiqueta: string; valor: string }
  | { id: string; tipo: 'nombre'; etiqueta: string; nombre: string; apellido: string }
  | { id: string; tipo: 'texto'; etiqueta: string; valor: string }
  // Para datos que se escriben de muchas formas ("$340.000", "340 mil",
  // "14/06/2015", "14 de junio de 2015"): con 'texto' exacto la variante
  // pasaba como segura. Se prueba sobre el texto normalizado (sin tildes, en
  // minúsculas), así que el patrón se escribe sin tildes.
  | { id: string; tipo: 'patron'; etiqueta: string; patron: RegExp }

export interface DatumResult {
  id: string
  etiqueta: string
  nivel: LeakLevel
}

/// Cada número escrito, con sus separadores habituales (espacio, guion,
/// punto) quitados. Por tramo y no todo el texto junto: juntar todos los
/// dígitos del mensaje armaba números que nadie escribió ("aula 99, grupo 90"
/// daba "9990").
function digitRuns(texto: string): string[] {
  return (texto.match(/\d(?:[\s.-]*\d)*/g) ?? []).map((run) => run.replace(/\D/g, ''))
}

// NFD + quitar los diacríticos: "á" se descompone en "a" + acento y el acento
// se cae, así "Andrango" y "andrángo" cuentan como el mismo texto. Deja el
// mismo número de caracteres que el original, letra por letra, no como la
// forma compuesta, que por eso no sirve para comparar longitudes.
function normalizeText(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function containsWord(texto: string, palabra: string): boolean {
  if (!palabra) return false
  const escaped = palabra.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\b${escaped}\\b`, 'i').test(texto)
}

/// Evalúa un solo dato. La cédula/cuenta/teléfono cuenta como fuga completa
/// solo si aparecen TODOS sus dígitos reales seguidos (sin importar espacios
/// o guiones en medio); si solo aparecen los últimos 4,como cuando alguien
/// cree que "ocultar" es mostrar la cola, queda en parcial. El nombre cuenta
/// como fuga completa solo con nombre Y apellido juntos; uno solo de los dos
/// (o un apodo real que igual sea su nombre de pila) queda en parcial.
export function evaluateDatum(texto: string, dato: SensitiveDatum): DatumResult {
  const base = { id: dato.id, etiqueta: dato.etiqueta }

  if (dato.tipo === 'numero') {
    const real = dato.valor.replace(/\D/g, '')
    const runs = digitRuns(texto)
    // Un celular con prefijo de país ("+593 99…") pierde el 0 inicial.
    const sinCero = real.startsWith('0') ? real.slice(1) : real
    if (real.length >= 4 && runs.some((run) => run.includes(real) || run.includes(sinCero))) {
      return { ...base, nivel: 'fuga' }
    }
    const ultimos4 = real.slice(-4)
    if (real.length > 4 && runs.some((run) => run.includes(ultimos4))) {
      return { ...base, nivel: 'parcial' }
    }
    return { ...base, nivel: 'seguro' }
  }

  if (dato.tipo === 'nombre') {
    const normalizado = normalizeText(texto)
    const tieneNombre = containsWord(normalizado, normalizeText(dato.nombre))
    const tieneApellido = containsWord(normalizado, normalizeText(dato.apellido))
    if (tieneNombre && tieneApellido) return { ...base, nivel: 'fuga' }
    if (tieneNombre || tieneApellido) return { ...base, nivel: 'parcial' }
    return { ...base, nivel: 'seguro' }
  }

  if (dato.tipo === 'patron') {
    return { ...base, nivel: dato.patron.test(normalizeText(texto)) ? 'fuga' : 'seguro' }
  }

  // 'texto': cifras institucionales, direcciones, fechas, no tienen un
  // "parcial" natural (a diferencia de un nombre, la mitad de una fecha o de
  // una dirección no delata nada por sí sola), así que es binario.
  const normalizado = normalizeText(texto)
  if (normalizado.includes(normalizeText(dato.valor))) {
    return { ...base, nivel: 'fuga' }
  }
  return { ...base, nivel: 'seguro' }
}

export function evaluateData(texto: string, datos: SensitiveDatum[]): DatumResult[] {
  return datos.map((dato) => evaluateDatum(texto, dato))
}

/// El peor de los niveles manda: un solo dato filtrado por completo pesa más
/// que diez datos bien sustituidos.
export function worstLevel(resultados: DatumResult[]): LeakLevel {
  if (resultados.some((r) => r.nivel === 'fuga')) return 'fuga'
  if (resultados.some((r) => r.nivel === 'parcial')) return 'parcial'
  return 'seguro'
}

/// Si el mensaje trae al menos una de las `raices` como comienzo de palabra
/// ("particip" calza con "participa" y "participación"). Es el otro lado de la
/// evaluación: no filtrar datos no basta para aprobar, el mensaje tiene que
/// pedirle a la IA algo con qué trabajar. Sin esto un "nose" salía aprobado.
export function mentionsAny(texto: string, raices: string[]): boolean {
  const normalizado = normalizeText(texto)
  return raices.some((raiz) => new RegExp(`\\b${raiz}`).test(normalizado))
}

/// Lo que decide un envío: saltar a un final, o que la IA repregunte y el
/// chat siga abierto porque el mensaje no traía nada con qué trabajar. Un
/// mensaje vacío de contenido no es ni acierto ni fallo: no se decidió nada.
export type SendResult = { goto: string; label?: string } | { repregunta: string }

/// Un campo de texto real: el participante escribe su propio mensaje,o lo
/// pega, ver BlocNotas.tsx, en vez de elegir entre burbujas ya redactadas ni
/// tocar palabras de un borrador fijo. `onEnviar` recibe el texto tal como
/// quedó al tocar "Enviar" y decide a qué nodo saltar, normalmente
/// construido con `worstLevel(evaluateData(texto, ...))`.
export interface FreeTextComposer {
  placeholder: string
  hora: string
  respuestaIA: string
  onEnviar: (texto: string, adjuntos: string[]) => SendResult
  // Imágenes que se pueden adjuntar al mensaje (ver InvitacionCumpleanos.tsx).
  archivos?: { id: string; nombre: string }[]
  // Para resaltar, en el mensaje ya enviado, los datos reales que hayan
  // quedado tal cual (ver `splitKnownData` más abajo). Sin esto el mensaje
  // se pinta plano, sin nada que el repaso de señales pueda apuntar.
  segmentar?: (texto: string) => DraftSegment[]
}

/// Reemplaza las burbujas de `respuestas` (si las hubiera) por el campo de
/// texto libre. Separado de `createAIChat` porque solo la apertura del chat
/// cambia entre un escenario y otro; la parte de "cómo se decide" es del
/// mismo tipo de dato para los cuatro escenarios de esta sección.
export function withFreeTextComposer(chat: AIChat, composer: FreeTextComposer): AIChat {
  return { ...chat, respuestas: undefined, entradaLibre: composer }
}

/// Un tramo del mensaje ya enviado: texto fijo, o,si `sensible` está
/// presente, un dato real (el nombre, la cédula…) que apareció tal cual.
/// `splitKnownData` arma esta lista para que el mensaje se pinte como JSX de
/// verdad (no como HTML de `dangerouslySetInnerHTML`, que React reconstruye
/// en cada repintado y se lleva por delante cualquier resaltado que el
/// repaso de señales le haya agregado a mano) y así el repaso pueda apuntar
/// al dato exacto dentro del mensaje que el participante escribió.
export interface DraftSegment {
  texto: string
  sensible?: { id: string; etiqueta: string }
}

function findRealValue(texto: string, dato: SensitiveDatum): { valor: string; indice: number } | null {
  if (dato.tipo === 'patron') {
    // Normalizar no cambia la cantidad de caracteres (ver normalizeText), así
    // que el índice sobre el texto normalizado vale para el original.
    const match = dato.patron.exec(normalizeText(texto))
    return match ? { valor: texto.slice(match.index, match.index + match[0].length), indice: match.index } : null
  }
  const valor = dato.tipo === 'nombre' ? `${dato.nombre} ${dato.apellido}` : dato.valor
  const indice = texto.indexOf(valor)
  return indice === -1 ? null : { valor, indice }
}

/// A diferencia de un borrador fijo, lo que escribió el participante es
/// libre: puede no traer ningún dato real, traer solo uno, o traerlos
/// parafraseados (que entonces no calzan por texto exacto y no se marcan,
/// esto es una ayuda visual para el repaso, no el criterio de evaluación,
/// que sigue siendo `evaluateData`). Por eso, a diferencia del extinto
/// `buildDraftSegments` de un borrador de autor, esta función nunca revienta:
/// un dato que no aparece simplemente no genera un tramo `sensible`.
export function splitKnownData(texto: string, datos: SensitiveDatum[]): DraftSegment[] {
  const encontrados = datos
    .map((dato) => {
      const encontrado = findRealValue(texto, dato)
      return encontrado && { id: dato.id, etiqueta: dato.etiqueta, ...encontrado }
    })
    .filter((encontrado) => encontrado !== null)
    .sort((a, b) => a.indice - b.indice)

  const segmentos: DraftSegment[] = []
  let cursor = 0
  for (const { id, etiqueta, valor, indice } of encontrados) {
    // Coincidencias superpuestas (un dato contenido dentro de otro ya
    // marcado): se queda la primera, la segunda no tiene dónde ir.
    if (indice < cursor) continue
    if (indice > cursor) segmentos.push({ texto: texto.slice(cursor, indice) })
    segmentos.push({ texto: valor, sensible: { id, etiqueta } })
    cursor = indice + valor.length
  }
  if (cursor < texto.length || segmentos.length === 0) {
    segmentos.push({ texto: texto.slice(cursor) })
  }
  return segmentos
}

/// Envuelve fragmentos sueltos del mensaje en `<b data-signal="…">` para que el
/// repaso resalte **la palabra exacta**,la cédula, el número de cuenta, la
/// contraseña, y no la burbuja entera. Señalar el mensaje completo obligaba a
/// releerlo buscando qué de todo eso sobraba, que es justo lo que el escenario
/// tiene que enseñar.
///
/// Solo para la burbuja: el botón de respuesta pinta texto plano y ahí las
/// etiquetas se verían escritas. Por eso el mismo texto viaja crudo a
/// `respuestas` y marcado a `conRespuestaIA`.
export function mark(text: string, brands: Record<string, string>): string {
  return Object.entries(brands).reduce((acc, [signal, fragment]) => {
    if (!acc.includes(fragment)) {
      // Un fragmento que no casa deja la señal sin nada que resaltar, y el
      // repaso se queda mudo justo en la pantalla que explica. Mejor que no
      // compile la historia a que falle en silencio delante del participante.
      throw new Error(`marcar(): el fragmento "${fragment}" no está en el mensaje.`)
    }
    // Reemplazo por función y no por plantilla: un fragmento que empieza con
    // `$`,un saldo, un monto, haría que `replace` leyera `$2` como grupo de
    // captura dentro del texto de reemplazo.
    return acc.replace(fragment, () => `<b data-signal="${signal}">${fragment}</b>`)
  }, text)
}
