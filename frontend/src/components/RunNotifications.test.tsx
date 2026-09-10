import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { ApiError, type RunPayload } from '../lib/api'
import { pendingCount, queueRun } from '../lib/pendingRuns'
import RunNotifications from './RunNotifications'

const { createRunMock } = vi.hoisted(() => ({ createRunMock: vi.fn() }))

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...actual, createRun: createRunMock }
})

const RUN: RunPayload = {
  scenarioId: 'phishing/factura-sri',
  version: 1,
  outcome: 'CORRECTO',
  score: 100,
  endingId: 'e_verifica',
  durationMs: 1000,
  startedAt: '2026-09-10T10:00:00.000Z',
  decisions: [],
}

describe('RunNotifications', () => {
  beforeEach(() => {
    createRunMock.mockReset()
    toast.dismiss()
  })

  it('reintenta al recuperar la conexión y confirma el envío pendiente', async () => {
    createRunMock
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({})
    queueRun(RUN)

    render(<RunNotifications enabled />)

    await waitFor(() => expect(createRunMock).toHaveBeenCalledTimes(1))
    expect(pendingCount()).toBe(1)

    fireEvent(window, new Event('online'))

    expect(await screen.findByText(/intentos pendientes se enviaron correctamente/i)).toBeDefined()
    expect(pendingCount()).toBe(0)
  })

  it('repite el vaciado si recupera conexión mientras había uno en curso', async () => {
    let rejectFirstRequest!: (error: unknown) => void
    createRunMock
      .mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            rejectFirstRequest = reject
          }),
      )
      .mockResolvedValueOnce({})
    queueRun(RUN)

    render(<RunNotifications enabled />)
    await waitFor(() => expect(createRunMock).toHaveBeenCalledTimes(1))

    fireEvent(window, new Event('online'))
    rejectFirstRequest(new TypeError('Failed to fetch'))

    await waitFor(() => expect(createRunMock).toHaveBeenCalledTimes(2))
    expect(pendingCount()).toBe(0)
  })

  it('reintenta fallos temporales cuando la persona vuelve a la pestaña', async () => {
    createRunMock
      .mockRejectedValueOnce(new ApiError('Servidor no disponible', 503))
      .mockResolvedValueOnce({})
    queueRun(RUN)

    render(<RunNotifications enabled />)
    await waitFor(() => expect(createRunMock).toHaveBeenCalledTimes(1))

    fireEvent(window, new Event('focus'))

    await waitFor(() => expect(createRunMock).toHaveBeenCalledTimes(2))
    expect(pendingCount()).toBe(0)
  })

  it('avisa si el servidor rechaza una corrida pendiente sin anunciar éxito total', async () => {
    createRunMock
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new ApiError('scenarioId inválido', 400))
    queueRun(RUN)
    queueRun({ ...RUN, scenarioId: 'mal-formado' })

    render(<RunNotifications enabled />)

    expect(await screen.findByText(/un intento pendiente fue rechazado/i)).toBeDefined()
    expect(screen.queryByText(/intentos pendientes se enviaron correctamente/i)).toBeNull()
  })
})
