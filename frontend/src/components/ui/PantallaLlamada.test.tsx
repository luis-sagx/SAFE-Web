import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import CallScreen from './PantallaLlamada'
import type { ScreenView } from './DeviceScreen'

type Call = Extract<ScreenView, { kind: 'call' }>

const { SPOKEN_LINE, OWN_REPLY, SECOND_LINE } = vi.hoisted(() => ({
  SPOKEN_LINE: 'Buenas tardes, le llamo por el sorteo.',
  OWN_REPLY: 'Ya entendí, gracias por avisarme.',
  SECOND_LINE: 'Es el impuesto de entrega, todos lo pagan.',
}))

vi.mock('../../data/voces', () => ({
  VOICES: { [SPOKEN_LINE]: '/voz/prueba.mp3', [SECOND_LINE]: '/voz/segunda.mp3' },
}))

const VIEW: Call = {
  kind: 'call',
  quien: 'Almacenes La Ganga',
  numero: '+593 98 342 1177',
  dialogo: [{ texto: SPOKEN_LINE }],
  decir: [
    { texto: '¿Por qué tengo que pagar para recibir un premio?', goto: 'n3' },
    { texto: 'Ya, está bien. ¿A qué cuenta deposito?', goto: 'n3b' },
  ],
  colgarGoto: 'e_cuelga',
}

const NEXT_VIEW: Call = {
  ...VIEW,
  dialogo: [{ texto: SPOKEN_LINE }, { texto: OWN_REPLY, mio: true }, { texto: SECOND_LINE }],
}

describe('CallScreen', () => {
  // Issue #250: el orden original (transcripción y luego "Tú contestas") se
  // mantiene — lo que causaba el recorte era `overflow: hidden` sin scroll,
  // no el orden. Se prueba que el contenedor ya no recorta el contenido.
  it('mantiene la transcripción antes que "Tú contestas", como en el diseño original', () => {
    render(<CallScreen view={VIEW} />)

    const transcripcion = screen.getByText('Transcripción')
    const decir = screen.getByText('Tú contestas')

    expect(transcripcion.compareDocumentPosition(decir) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('las dos opciones de respuesta se pueden encontrar como botones', () => {
    render(<CallScreen view={VIEW} />)

    expect(
      screen.getByRole('button', { name: '¿Por qué tengo que pagar para recibir un premio?' }),
    ).toBeDefined()
    expect(
      screen.getByRole('button', { name: 'Ya, está bien. ¿A qué cuenta deposito?' }),
    ).toBeDefined()
  })

  // Issue #250: antes se podía contestar de inmediato, incluso con el otro
  // lado todavía "hablando" — eso es justo lo que hace que se sienta como
  // elegir de una lista y no como esperar el turno en una llamada real.
  it('mientras el otro lado está hablando, las respuestas están deshabilitadas', () => {
    render(<CallScreen view={VIEW} />)

    expect(screen.getByText('Están hablando…')).toBeDefined()
    const option = screen.getByRole('button', {
      name: '¿Por qué tengo que pagar para recibir un premio?',
    }) as HTMLButtonElement
    expect(option.disabled).toBe(true)
  })

  // Issue #250 (seguimiento): la transcripción crece hacia abajo y, sin
  // scroll automático, el texto que se está revelando queda tapado por el
  // resto de la pantalla — el participante tendría que desplazarse a mano.
  it('la transcripción se desplaza sola hasta el fondo al revelar contenido nuevo', () => {
    const { container } = render(<CallScreen view={VIEW} />)

    const transcript = container.querySelector(
      '[class*="callTranscripcion"]',
    ) as HTMLDivElement & { scrollTop: number }
    Object.defineProperty(transcript, 'scrollHeight', { value: 500, configurable: true })

    fireEvent.ended(container.querySelector('audio')!)

    expect(transcript.scrollTop).toBe(500)
  })

  // Bug reportado: el panel de señales vuelve a mostrar una pantalla de
  // llamada ya cerrada (terminada) para resaltar `data-signal` dentro de
  // ella, sin reproducir audio ni esperar ningún `ended`. Si el revelado
  // progresivo también aplicara ahí, esas líneas nunca aparecerían y las
  // señales se quedarían sin nada que resaltar.
  it('con la llamada terminada, toda la transcripción se ve de una vez, sin esperar audio', () => {
    render(<CallScreen view={NEXT_VIEW} terminada />)

    expect(screen.getByText(SPOKEN_LINE)).toBeDefined()
    expect(screen.getByText(OWN_REPLY)).toBeDefined()
    expect(screen.getByText(SECOND_LINE)).toBeDefined()
  })

  it('cuando termina de hablar, las respuestas se habilitan', () => {
    const { container } = render(<CallScreen view={VIEW} />)

    const audio = container.querySelector('audio')!
    fireEvent.ended(audio)

    expect(screen.getByText('Terminaron de hablar. Te toca a ti.')).toBeDefined()
    const option = screen.getByRole('button', {
      name: '¿Por qué tengo que pagar para recibir un premio?',
    }) as HTMLButtonElement
    expect(option.disabled).toBe(false)
  })

  // Issue #250 (seguimiento): mostrar toda la transcripción de golpe es lo
  // que hacía que la llamada se sintiera como un audio ya grabado. Ahora
  // cada frase del otro lado aparece recién cuando termina de sonar.
  it('la frase del otro lado no aparece en la transcripción hasta que termina de sonar', () => {
    const { container } = render(<CallScreen view={VIEW} />)

    expect(screen.queryByText(SPOKEN_LINE)).toBeNull()

    const audio = container.querySelector('audio')!
    fireEvent.ended(audio)

    expect(screen.getByText(SPOKEN_LINE)).toBeDefined()
  })

  // Antes el texto solo aparecía completo al terminar el audio; ahora se
  // revela al ritmo de la reproducción, como un subtítulo en vivo, no como
  // un párrafo que aparece de golpe al final.
  it('la frase que está sonando se revela progresivamente, no de golpe al terminar', () => {
    const { container } = render(<CallScreen view={VIEW} />)

    const audio = container.querySelector('audio')!
    Object.defineProperty(audio, 'duration', { value: 10, configurable: true })
    Object.defineProperty(audio, 'currentTime', { value: 5, configurable: true, writable: true })
    fireEvent.timeUpdate(audio)

    const lines = Array.from(container.querySelectorAll('p')).map((p) => p.textContent ?? '')
    const partialLine = lines.find(
      (text) => text.length > 0 && text.length < SPOKEN_LINE.length && SPOKEN_LINE.startsWith(text),
    )
    expect(partialLine).toBeDefined()
  })

  // Una frase propia (`mio`) no tiene audio que esperar: ya se sabe que se
  // dijo, así que se ve de inmediato al llegar al nuevo nodo.
  it('la frase propia se ve de inmediato al pasar a un nuevo nodo, sin esperar audio', () => {
    const { container, rerender } = render(<CallScreen view={VIEW} />)
    fireEvent.ended(container.querySelector('audio')!)

    rerender(<CallScreen view={NEXT_VIEW} />)

    expect(screen.getByText(OWN_REPLY)).toBeDefined()
    expect(screen.queryByText(SECOND_LINE)).toBeNull()

    fireEvent.ended(container.querySelector('audio')!)

    expect(screen.getByText(SECOND_LINE)).toBeDefined()
  })
})
