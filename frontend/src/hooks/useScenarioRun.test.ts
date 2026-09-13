import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, type RunPayload } from '../lib/api'
import { getScenario } from '../data/catalogo'
import { pendingCount } from '../lib/pendingRuns'
import { outcomeFromKind, scoreFromOutcome, useScenarioRun } from './useScenarioRun'

const { createRunMock } = vi.hoisted(() => ({ createRunMock: vi.fn() }))

vi.mock('../lib/api', async () => {
  const current = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...current, createRun: createRunMock }
})

// Cualquier escenario activo del catálogo sirve como fixture: la prueba no
// depende de su contenido, solo de que exista.
const SCENARIO = 'phishing/factura-sri'

// Se lee del catálogo en vez de fijarla a mano: lo que esta prueba verifica es
// que la versión del catálogo viaje en el payload, no cuál es. Escrita a mano,
// rompía cada vez que se editaba el guion de ese escenario, que es justo cuando
// la versión debe subir.
const EXPECTED_VERSION = getScenario(SCENARIO)!.version

function payloadSent(): RunPayload {
  const [firstCall] = createRunMock.mock.calls
  if (!firstCall) {
    throw new Error('No se envió ninguna corrida al servidor.')
  }
  return firstCall[0] as RunPayload
}

describe('outcomeFromKind / scoreFromOutcome', () => {
  it('traduce el tipo de final al resultado del estudio', () => {
    expect(outcomeFromKind('good')).toBe('CORRECTO')
    expect(outcomeFromKind('partial')).toBe('PARCIAL')
    expect(outcomeFromKind('bad')).toBe('INCORRECTO')
  })

  it('puntúa cada resultado dentro del rango 0–100 que acepta el backend', () => {
    expect(scoreFromOutcome('CORRECTO')).toBe(100)
    expect(scoreFromOutcome('PARCIAL')).toBe(50)
    expect(scoreFromOutcome('INCORRECTO')).toBe(0)
  })
})

describe('useScenarioRun', () => {
  beforeEach(() => {
    localStorage.clear()
    createRunMock.mockReset()
    createRunMock.mockResolvedValue({})
  })

  it('rechaza un escenario que no está en el catálogo', () => {
    expect(() => renderHook(() => useScenarioRun('no/existe'))).toThrow()
  })

  it('envía la corrida con la traza de decisiones y la versión del catálogo', async () => {
    const { result } = renderHook(() => useScenarioRun(SCENARIO))

    act(() => {
      result.current.recordDecision({ desde: 'n1', hacia: 'n2', eleccion: 'Verificar' })
    })
    await act(async () => {
      await result.current.finish({ endingId: 'e_verifica', outcome: 'CORRECTO' })
    })

    const payload = payloadSent()
    expect(payload.scenarioId).toBe(SCENARIO)
    expect(payload.version).toBe(EXPECTED_VERSION)
    expect(payload.endingId).toBe('e_verifica')
    expect(payload.score).toBe(100)
    expect(payload.decisions).toHaveLength(1)
    expect(payload.decisions[0]).toMatchObject({ desde: 'n1', hacia: 'n2' })
    expect(result.current.status).toBe('saved')
  })

  it('respeta el puntaje explícito del final', async () => {
    const { result } = renderHook(() => useScenarioRun(SCENARIO))

    await act(async () => {
      await result.current.finish({ endingId: 'e_dudo', outcome: 'PARCIAL', score: 70 })
    })

    expect(payloadSent().score).toBe(70)
  })

  // StrictMode ejecuta los efectos dos veces: sin la guarda se duplican filas.
  it('envía una sola vez aunque se llame a finish dos veces', async () => {
    const { result } = renderHook(() => useScenarioRun(SCENARIO))

    await act(async () => {
      await result.current.finish({ endingId: 'e_verifica', outcome: 'CORRECTO' })
      await result.current.finish({ endingId: 'e_verifica', outcome: 'CORRECTO' })
    })

    expect(createRunMock).toHaveBeenCalledTimes(1)
  })

  it('encola la corrida cuando falla la red', async () => {
    createRunMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const { result } = renderHook(() => useScenarioRun(SCENARIO))

    await act(async () => {
      await result.current.finish({ endingId: 'e_pago', outcome: 'INCORRECTO' })
    })

    expect(result.current.status).toBe('queued')
    expect(pendingCount()).toBe(1)
  })

  it('no encola una corrida inválida que nunca podrá reenviarse', async () => {
    createRunMock.mockRejectedValue(new ApiError('scenarioId inválido', 400))
    const { result } = renderHook(() => useScenarioRun(SCENARIO))

    await act(async () => {
      await result.current.finish({ endingId: 'e_pago', outcome: 'INCORRECTO' })
    })

    expect(result.current.status).toBe('failed')
    expect(pendingCount()).toBe(0)
  })

  it('permite volver a enviar después de reiniciar el escenario', async () => {
    const { result } = renderHook(() => useScenarioRun(SCENARIO))

    await act(async () => {
      await result.current.finish({ endingId: 'e_pago', outcome: 'INCORRECTO' })
    })
    act(() => {
      result.current.restart()
    })
    await act(async () => {
      await result.current.finish({ endingId: 'e_verifica', outcome: 'CORRECTO' })
    })

    expect(createRunMock).toHaveBeenCalledTimes(2)
    expect(result.current.status).toBe('saved')
  })

  it('reinicia la traza al reiniciar', async () => {
    const { result } = renderHook(() => useScenarioRun(SCENARIO))

    act(() => {
      result.current.recordDecision({ desde: 'n1', hacia: 'n2' })
      result.current.restart()
    })
    await act(async () => {
      await result.current.finish({ endingId: 'e_verifica', outcome: 'CORRECTO' })
    })

    expect(payloadSent().decisions).toHaveLength(0)
    expect(result.current.status).toBe('saved')
  })
})
