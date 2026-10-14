import { describe, expect, it, vi } from 'vitest'
import { SCENARIOS } from '../data/catalogo'
import type { RunResult } from './api'
import { assessmentResultsToCsv, downloadCsv, resultsToCsv } from './resultsCsv'

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


describe('assessmentResultsToCsv', () => {
  it('exporta el par por seudónimo sin identidad, con respuestas numeradas de 1 a 4', () => {
    const csv = assessmentResultsToCsv([{ pseudonym: 'P001', version: 1, baselineMissing: false, pretest: { ageRange: '18 - 29 años', gender: 'Femenino', answers: Array(21).fill(0), score: 10 }, posttest: { ageRange: '18 - 29 años', gender: 'Femenino', answers: Array(21).fill(2), score: 18 }, improvement: 8 }])
    const [header, row] = csv.split('\r\n')
    expect(header).toContain('pre_puntaje,post_puntaje,diferencia')
    expect(row).toContain('P001,1,par_completo,18 - 29 años,Femenino,18 - 29 años,Femenino,10,18,8,1,1,1')
    expect(row?.endsWith(',3,3,3')).toBe(true)
    expect(csv).not.toMatch(/participantId|nombre|correo|email/)
    expect(csv.startsWith('﻿')).toBe(true)
  })
  it.each([0, -3])('mantiene diferencia %s y puntaje cero sin confundirlos con datos faltantes', (difference) => {
    const csv = assessmentResultsToCsv([{ pseudonym: 'P003', version: 1, baselineMissing: false, pretest: { ageRange: '45 - 65 años', gender: 'Masculino', answers: Array(21).fill(0), score: difference === 0 ? 0 : 3 }, posttest: { ageRange: '45 - 65 años', gender: 'Masculino', answers: Array(21).fill(0), score: 0 }, improvement: difference }])
    expect(csv.split('\r\n')[1]?.split(',').slice(7, 10)).toEqual([difference === 0 ? '0' : '3', '0', String(difference)])
  })

  it('marca sin medición inicial y final pendiente sin inventar mejora y neutraliza fórmulas', () => {
    const csv = assessmentResultsToCsv([{ pseudonym: '=P002', version: 1, baselineMissing: true, pretest: null, posttest: null, improvement: null }])
    expect(csv).toContain("'=P002,1,sin_medicion_inicial_final_pendiente")
    expect(csv).not.toContain(',0,')
  })
})
