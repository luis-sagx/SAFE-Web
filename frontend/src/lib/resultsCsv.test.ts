import { describe, expect, it, vi } from 'vitest'
import { SCENARIOS } from '../data/catalogo'
import type { RunResult } from './api'
import { downloadCsv, resultsToCsv } from './resultsCsv'

const scenario = SCENARIOS[0] ?? expect.unreachable('El catálogo no tiene escenarios')

function run(overrides: Partial<RunResult> = {}): RunResult {
  return {
    seudonimo: 'P001',
    scenarioId: scenario.id,
    version: 1,
    outcome: 'CORRECTO',
    score: 100,
    endingId: 'fin-seguro',
    durationMs: 61_400,
    startedAt: '2026-09-01T10:00:00.000Z',
    finishedAt: '2026-09-01T10:01:01.400Z',
    ...overrides,
  }
}

describe('resultsToCsv', () => {
  it('abre con BOM y cabecera, una fila por corrida', () => {
    const lines = resultsToCsv([run(), run({ seudonimo: 'P002' })]).split('\r\n')

    expect(lines[0]?.startsWith('﻿seudonimo,modulo,escenario_id')).toBe(true)
    expect(lines).toHaveLength(4) // cabecera + 2 filas + línea final vacía
    expect(lines[2]?.startsWith('P002,')).toBe(true)
  })

  it('agrega módulo y título del escenario desde el catálogo, y la duración en segundos', () => {
    const [, first] = resultsToCsv([run()]).split('\r\n')

    expect(first).toContain(scenario.escenarioId)
    expect(first).toContain(',61,')
  })

  it('neutraliza celdas que Excel ejecutaría como fórmula', () => {
    const [, first] = resultsToCsv([run({ endingId: '=HYPERLINK("x")' })]).split('\r\n')

    expect(first).toContain(`"'=HYPERLINK(""x"")"`)
  })
})

describe('downloadCsv', () => {
  it('descarga el archivo con su nombre y libera la URL', () => {
    const create = vi.fn(() => 'blob:csv')
    const revoke = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL: create, revokeObjectURL: revoke })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('resultados.csv')
      expect(this.href).toBe('blob:csv')
    })

    downloadCsv('resultados.csv', 'a,b')

    expect(click).toHaveBeenCalledOnce()
    expect(revoke).toHaveBeenCalledWith('blob:csv')
    click.mockRestore()
    vi.unstubAllGlobals()
  })
})
