import { describe, expect, it } from 'vitest'
import type { Progreso } from './api'
import { conEscenarioIntentado } from './bloqueoEscenarios'

function progreso(over: Partial<Progreso> = {}): Progreso {
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
    const out = conEscenarioIntentado(progreso(), 'fisico/salida-segura')
    expect(out.escenarios).toEqual([{ id: 'fisico/salida-segura', ultimoOutcome: 'CORRECTO' }])
  })

  it('lo añade a la ronda en curso cuando la hay, no al recorrido normal', () => {
    const out = conEscenarioIntentado(
      progreso({ rondaEnCurso: { jugados: 0, escenarios: [] } }),
      'fisico/salida-segura',
    )
    expect(out.rondaEnCurso!.escenarios).toEqual([{ id: 'fisico/salida-segura', ultimoOutcome: 'CORRECTO' }])
    expect(out.escenarios).toEqual([])
  })

  it('es idempotente: si ya figura devuelve el mismo objeto', () => {
    const p = progreso({ escenarios: [{ id: 'fisico/salida-segura', ultimoOutcome: 'INCORRECTO' }] })
    expect(conEscenarioIntentado(p, 'fisico/salida-segura')).toBe(p)
  })

  it('no muta el progreso recibido', () => {
    const p = progreso()
    conEscenarioIntentado(p, 'fisico/salida-segura')
    expect(p.escenarios).toEqual([])
  })
})
