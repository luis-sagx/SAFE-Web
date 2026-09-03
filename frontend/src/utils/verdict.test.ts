import { describe, expect, it } from 'vitest'
import { outcomeForLevel, pinForLevel, stampForLevel, verdictForLevel } from './verdict'

describe('verdict helpers', () => {
  it('keeps the visible labels and outcome mapping for every level', () => {
    expect(verdictForLevel('safe')).toBe('Decisión segura')
    expect(verdictForLevel('warn')).toBe('Observación')
    expect(verdictForLevel('danger')).toBe('Riesgo detectado')
    expect(stampForLevel('safe')).toBe('APROBADO')
    expect(stampForLevel('warn')).toBe('OBSERVACIÓN')
    expect(stampForLevel('danger')).toBe('RIESGO')
    expect(pinForLevel('safe')).toBe('✓')
    expect(pinForLevel('warn')).toBe('!')
    expect(pinForLevel('danger')).toBe('✕')
    expect(outcomeForLevel('safe')).toBe('CORRECTO')
    expect(outcomeForLevel('warn')).toBe('PARCIAL')
    expect(outcomeForLevel('danger')).toBe('INCORRECTO')
  })
})
