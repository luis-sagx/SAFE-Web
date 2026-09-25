import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import NarracionContexto from './NarracionContexto'
import type { Context } from './ContextoEscenario'
import * as api from '../../lib/api'

vi.mock('../../data/narracion', () => ({
  NARRATION: {
    'No juegas a la lotería. Aparece un correo. Tu misión: decide qué haces con esto y por qué.':
      '/narracion/abc123.mp3',
  },
}))

const CONTEXTO_CON_AUDIO: Context = {
  antes: 'No juegas a la lotería.',
  ahora: 'Aparece un correo.',
}

beforeEach(() => {
  HTMLMediaElement.prototype.play = vi.fn()
  HTMLMediaElement.prototype.pause = vi.fn()
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:saludo-fake-url'),
    revokeObjectURL: vi.fn(),
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('NarracionContexto', () => {
  it('muestra un botón para reproducir la narración del contexto', () => {
    render(<NarracionContexto contexto={CONTEXTO_CON_AUDIO} />)
    expect(screen.getByRole('button', { name: /escuchar/i })).toBeDefined()
  })

  it('al presionar, pide el saludo, lo reproduce, y encadena el audio de contexto al terminar', async () => {
    const saludo = new Blob(['saludo-mp3'])
    vi.spyOn(api, 'fetchGreetingAudio').mockResolvedValue(saludo)

    render(<NarracionContexto contexto={CONTEXTO_CON_AUDIO} />)
    fireEvent.click(screen.getByRole('button', { name: /escuchar/i }))

    await waitFor(() => expect(api.fetchGreetingAudio).toHaveBeenCalledTimes(1))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /pausar/i })).toBeDefined(),
    )
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1)

    const audios = document.querySelectorAll('audio')
    expect(audios).toHaveLength(2)
    const [saludoAudio, contextoAudio] = Array.from(audios) as [
      HTMLAudioElement,
      HTMLAudioElement,
    ]

    // Termina el saludo → arranca el audio de contexto.
    fireEvent.ended(saludoAudio)
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2)

    // Termina el contexto → el botón vuelve a su estado inicial.
    fireEvent.ended(contextoAudio)
    expect(screen.getByRole('button', { name: /escuchar/i })).toBeDefined()
  })

  it('pausa al presionar de nuevo mientras suena', async () => {
    const saludo = new Blob(['saludo-mp3'])
    vi.spyOn(api, 'fetchGreetingAudio').mockResolvedValue(saludo)

    render(<NarracionContexto contexto={CONTEXTO_CON_AUDIO} />)
    fireEvent.click(screen.getByRole('button', { name: /escuchar/i }))
    await waitFor(() => screen.getByRole('button', { name: /pausar/i }))

    fireEvent.click(screen.getByRole('button', { name: /pausar/i }))
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: /escuchar/i })).toBeDefined()
  })

  it('reanuda sin volver a pedir el saludo por red ni reiniciar el audio', async () => {
    const saludo = new Blob(['saludo-mp3'])
    vi.spyOn(api, 'fetchGreetingAudio').mockResolvedValue(saludo)

    render(<NarracionContexto contexto={CONTEXTO_CON_AUDIO} />)
    fireEvent.click(screen.getByRole('button', { name: /escuchar/i }))
    await waitFor(() => screen.getByRole('button', { name: /pausar/i }))
    expect(api.fetchGreetingAudio).toHaveBeenCalledTimes(1)
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1)

    // Pausa: no debe perder el progreso ni tocar el fetch.
    fireEvent.click(screen.getByRole('button', { name: /pausar/i }))
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: /escuchar/i })).toBeDefined()

    // Reanuda: mismo elemento, sin segunda llamada de red.
    fireEvent.click(screen.getByRole('button', { name: /escuchar/i }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /pausar/i })).toBeDefined(),
    )
    expect(api.fetchGreetingAudio).toHaveBeenCalledTimes(1)
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2)
  })

  it('si falla el saludo, reproduce igual el audio de contexto solo', async () => {
    vi.spyOn(api, 'fetchGreetingAudio').mockRejectedValue(new Error('red caída'))

    render(<NarracionContexto contexto={CONTEXTO_CON_AUDIO} />)
    fireEvent.click(screen.getByRole('button', { name: /escuchar/i }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /pausar/i })).toBeDefined(),
    )
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1)
    // Sin saludo: un solo <audio>, el de contexto.
    expect(document.querySelectorAll('audio')).toHaveLength(1)
  })

  it('no muestra nada si el escenario todavía no tiene audio generado', () => {
    const contextoSinAudio: Context = {
      antes: 'Texto que no está en el índice.',
      ahora: 'Otro texto que tampoco está.',
    }
    const { container } = render(<NarracionContexto contexto={contextoSinAudio} />)
    expect(container.innerHTML).toBe('')
  })
})
