import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RunPayload } from '../lib/api'
import { pendingCount } from '../lib/pendingRuns'
import { outcomeFromKind, scoreFromOutcome, useScenarioRun } from './useScenarioRun'

const { createRunMock } = vi.hoisted(() => ({ createRunMock: vi.fn() }))

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...actual, createRun: createRunMock }
})

// Cualquier escenario activo del catálogo sirve como fixture: la prueba no
// depende de su contenido, solo de que exista.
const ESCENARIO = 'phishing/factura-sri'

function payloadEnviado(): RunPayload {
  const [primeraLlamada] = createRunMock.mock.calls
  if (!primeraLlamada) {
    throw new Error('No se envió ninguna corrida al servidor.')
  }
  return primeraLlamada[0] as RunPayload
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
    const { result } = renderHook(() => useScenarioRun(ESCENARIO))

    act(() => {
      result.current.recordDecision({ desde: 'n1', hacia: 'n2', eleccion: 'Verificar' })
    })
    await act(async () => {
      await result.current.finish({ endingId: 'e_verifica', outcome: 'CORRECTO' })
    })

    const payload = payloadEnviado()
    expect(payload.scenarioId).toBe(ESCENARIO)
    expect(payload.version).toBe(1)
    expect(payload.endingId).toBe('e_verifica')
    expect(payload.score).toBe(100)
    expect(payload.decisions).toHaveLength(1)
    expect(payload.decisions[0]).toMatchObject({ desde: 'n1', hacia: 'n2' })
    expect(result.current.status).toBe('saved')
  })

  it('respeta el puntaje explícito del final', async () => {
    const { result } = renderHook(() => useScenarioRun(ESCENARIO))

    await act(async () => {
      await result.current.finish({ endingId: 'e_dudo', outcome: 'PARCIAL', score: 70 })
    })

    expect(payloadEnviado().score).toBe(70)
  })

  // StrictMode ejecuta los efectos dos veces: sin la guarda se duplican filas.
  it('envía una sola vez aunque se llame a finish dos veces', async () => {
    const { result } = renderHook(() => useScenarioRun(ESCENARIO))

    await act(async () => {
      await result.current.finish({ endingId: 'e_verifica', outcome: 'CORRECTO' })
      await result.current.finish({ endingId: 'e_verifica', outcome: 'CORRECTO' })
    })

    expect(createRunMock).toHaveBeenCalledTimes(1)
  })

  it('encola la corrida cuando el servidor falla', async () => {
    createRunMock.mockRejectedValue(new Error('sin red'))
    const { result } = renderHook(() => useScenarioRun(ESCENARIO))

    await act(async () => {
      await result.current.finish({ endingId: 'e_pago', outcome: 'INCORRECTO' })
    })

    expect(result.current.status).toBe('queued')
    expect(pendingCount()).toBe(1)
  })

  it('permite volver a enviar después de reiniciar el escenario', async () => {
    const { result } = renderHook(() => useScenarioRun(ESCENARIO))

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
    const { result } = renderHook(() => useScenarioRun(ESCENARIO))

    act(() => {
      result.current.recordDecision({ desde: 'n1', hacia: 'n2' })
      result.current.restart()
    })
    await act(async () => {
      await result.current.finish({ endingId: 'e_verifica', outcome: 'CORRECTO' })
    })

    expect(payloadEnviado().decisions).toHaveLength(0)
    expect(result.current.status).toBe('saved')
  })
})
