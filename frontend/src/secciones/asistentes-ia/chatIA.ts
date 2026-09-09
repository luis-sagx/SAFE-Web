import type { ScreenView } from '../../components/ui/DeviceScreen'

export type ChatIA = Extract<ScreenView, { kind: 'sms' }>
export type RespuestaIA = NonNullable<ChatIA['respuestas']>[number]

/// Una línea del saludo inicial: sin `mio`, es la IA la que la escribe.
export interface LineaApertura {
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
export function crearChatIA(
  sub: string,
  apertura: LineaApertura[],
  hora: string,
  respuestas: RespuestaIA[],
): ChatIA {
  return {
    kind: 'sms',
    sender: 'Asistente IA',
    sub,
    msgs: apertura.map((linea) => ({ text: linea.texto, time: hora, mine: linea.mio })),
    respuestas,
  }
}

/// La burbuja de respuesta de la IA, para mostrar sobre qué texto contestó:
/// el mensaje que realmente se envió, encima del saludo con el que arrancó
/// el chat. Se usa tanto si el participante mandó el borrador tal cual como
/// si lo reescribió antes. Sin `respuestas`: la decisión ya se tomó, no hay
/// nada más que elegir.
export function conRespuestaIA(chat: ChatIA, hora: string, textoEnviado: string, respuestaIA: string): ChatIA {
  return {
    ...chat,
    respuestas: undefined,
    msgs: [
      ...chat.msgs,
      { text: textoEnviado, time: hora, mine: true, senal: 'borrador-enviado' },
      { text: respuestaIA, time: hora },
    ],
  }
}
