import type { ScreenView } from '../../components/ui/DeviceScreen'
import { createSignal } from '../../lib/crearSenal'
import type { Signal } from '../../components/ui/PanelVeredicto'

/// Casi todas las señales de esta sección resaltan el elemento que lleva su
/// mismo id (`data-signal`). El helper evita repetir `id` y `targetId` con el
/// mismo valor en cada objeto, cuatro escenarios seguidos — que es como la
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

/// Los cuatro escenarios de esta sección simulan el mismo tipo de pantalla —un
/// chat con un "Asistente IA" externo— que arranca con un saludo (para que se
/// sienta como una conversación de verdad y no como un mensaje que ya salió) y
/// termina en el pedido de ayuda, con las versiones posibles de lo que se le
/// escribiría a continuación como burbujas para tocar — igual que un hilo de
/// SMS con `respuestas` (ver smishing/BajaSuscripcion.tsx): la decisión se
/// toma dentro del chat, no en una lista aparte. Factorizado porque los
/// cuatro repetían esta forma letra por letra, salvo el remitente, la
/// apertura, la hora y las respuestas.
///
/// La apertura alterna estrictamente: escribes tú, contesta la IA, y recién
/// entonces eliges. Con dos burbujas tuyas seguidas —el "hola" y el pedido—
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
/// la conversación no ha terminado — la IA contestó y además repreguntó, y lo
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

/// Envuelve fragmentos sueltos del mensaje en `<b data-signal="…">` para que el
/// repaso resalte **la palabra exacta** —la cédula, el número de cuenta, la
/// contraseña— y no la burbuja entera. Señalar el mensaje completo obligaba a
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
    // `$` —un saldo, un monto— haría que `replace` leyera `$2` como grupo de
    // captura dentro del texto de reemplazo.
    return acc.replace(fragment, () => `<b data-signal="${signal}">${fragment}</b>`)
  }, text)
}
