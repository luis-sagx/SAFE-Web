import { describe, expect, it } from 'vitest'
import type { Progress } from './api'
import { withAttemptedScenario } from './bloqueoEscenarios'

function progress(over: Partial<Progress> = {}): Progress {
  return {
    modulo: 'fisico',
    escenarios: [],
    aprobados: 0,
    requeridos: 5,
    aprobado: false,
    ...over,
  }
}

describe('conEscenarioIntentado', () => {
  it('añade el escenario al recorrido normal cuando no hay ronda', () => {
    const out = withAttemptedScenario(progress(), 'fisico/salida-segura')
    expect(out.escenarios).toEqual([{ id: 'fisico/salida-segura', ultimoOutcome: 'CORRECTO' }])
  })

  it('lo añade a la ronda en curso cuando la hay, no al recorrido normal', () => {
    const out = withAttemptedScenario(
      progress({ rondaEnCurso: { jugados: 0, escenarios: [] } }),
      'fisico/salida-segura',
    )
    expect(out.rondaEnCurso!.escenarios).toEqual([{ id: 'fisico/salida-segura', ultimoOutcome: 'CORRECTO' }])
    expect(out.escenarios).toEqual([])
  })

  it('es idempotente: si ya figura devuelve el mismo objeto', () => {
    const p = progress({ escenarios: [{ id: 'fisico/salida-segura', ultimoOutcome: 'INCORRECTO' }] })
    expect(withAttemptedScenario(p, 'fisico/salida-segura')).toBe(p)
  })

  it('no muta el progreso recibido', () => {
    const p = progress()
    withAttemptedScenario(p, 'fisico/salida-segura')
    expect(p.escenarios).toEqual([])
  })
})
