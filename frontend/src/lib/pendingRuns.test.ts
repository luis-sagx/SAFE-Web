import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, type RunPayload } from './api'
import { flushPendingRuns, pendingCount, queueRun } from './pendingRuns'

const { createRunMock } = vi.hoisted(() => ({ createRunMock: vi.fn() }))

vi.mock('./api', async () => {
  const actual = await vi.importActual<typeof import('./api')>('./api')
  return { ...actual, createRun: createRunMock }
})

function run(scenarioId: string): RunPayload {
  return {
    scenarioId,
    version: 1,
    outcome: 'CORRECTO',
    score: 100,
    endingId: 'e_verifica',
    durationMs: 1000,
    startedAt: '2026-08-01T10:00:00.000Z',
    decisions: [],
  }
}

describe('cola de corridas pendientes', () => {
  beforeEach(() => {
    localStorage.clear()
    createRunMock.mockReset()
  })

  it('vacía la cola cuando el envío funciona', async () => {
    createRunMock.mockResolvedValue({})
    queueRun(run('phishing/factura-sri'))
    queueRun(run('smishing/bono-estado'))

    await flushPendingRuns()

    expect(createRunMock).toHaveBeenCalledTimes(2)
    expect(pendingCount()).toBe(0)
  })

  it('conserva la corrida si el servidor falla', async () => {
    createRunMock.mockRejectedValue(new ApiError('caído', 503))
    queueRun(run('phishing/factura-sri'))

    await flushPendingRuns()

    expect(pendingCount()).toBe(1)
  })

  it('conserva la corrida ante un error de red sin respuesta', async () => {
    createRunMock.mockRejectedValue(new TypeError('Failed to fetch'))
    queueRun(run('phishing/factura-sri'))

    await flushPendingRuns()

    expect(pendingCount()).toBe(1)
  })

  // El token se renueva al volver a entrar; la corrida sigue siendo válida.
  it('conserva la corrida ante un 401', async () => {
    createRunMock.mockRejectedValue(new ApiError('Token inválido', 401))
    queueRun(run('phishing/factura-sri'))

    await flushPendingRuns()

    expect(pendingCount()).toBe(1)
  })

  // Reintentar un payload inválido fallaría siempre y la cola crecería sin fin.
  it('descarta la corrida que el servidor rechaza por inválida', async () => {
    createRunMock.mockRejectedValue(new ApiError('scenarioId inválido', 400))
    queueRun(run('mal-formado'))

    await flushPendingRuns()

    expect(pendingCount()).toBe(0)
  })

  it('separa las que fallan de las que pasan en el mismo vaciado', async () => {
    createRunMock
      .mockRejectedValueOnce(new ApiError('caído', 500))
      .mockResolvedValueOnce({})
    queueRun(run('phishing/factura-sri'))
    queueRun(run('smishing/bono-estado'))

    await flushPendingRuns()

    expect(pendingCount()).toBe(1)
  })

  it('no llama al servidor cuando no hay nada pendiente', async () => {
    await flushPendingRuns()
    expect(createRunMock).not.toHaveBeenCalled()
  })

  it('se recupera de un localStorage corrupto', async () => {
    localStorage.setItem('mic-pending-runs', '{no es json')

    expect(pendingCount()).toBe(0)
    await expect(flushPendingRuns()).resolves.toBeUndefined()
  })
})
