import type { ScreenView } from '../../components/ui/DeviceScreen'

export type ChatIA = Extract<ScreenView, { kind: 'sms' }>

/// Los cuatro escenarios de esta sección simulan el mismo tipo de pantalla —un
/// chat con un "Asistente IA" externo— con el borrador ya escrito y sin
/// enviar. Factorizado porque los cuatro repetían esta forma letra por letra,
/// salvo el remitente y la hora.
export function crearChatIA(sub: string, borrador: string, hora: string): ChatIA {
  return {
    kind: 'sms',
    sender: 'Asistente IA',
    sub,
    msgs: [{ text: borrador, time: hora, mine: true, senal: 'borrador' }],
  }
}

/// La burbuja de respuesta de la IA, para mostrar sobre qué texto contestó:
/// el que realmente se envió, no el borrador original. Se usa tanto si el
/// participante mandó el borrador tal cual como si lo reescribió antes.
export function conRespuestaIA(chat: ChatIA, hora: string, textoEnviado: string, respuestaIA: string): ChatIA {
  return {
    ...chat,
    msgs: [
      { text: textoEnviado, time: hora, mine: true, senal: 'borrador-enviado' },
      { text: respuestaIA, time: hora },
    ],
  }
}
