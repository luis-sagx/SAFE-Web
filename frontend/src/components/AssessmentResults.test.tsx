import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AssessmentResults from './AssessmentResults'
import type { AssessmentResult, AssessmentResponse } from '../lib/api'

const { load } = vi.hoisted(() => ({ load: vi.fn() }))
vi.mock('../lib/api', async () => ({
  ...await vi.importActual<typeof import('../lib/api')>('../lib/api'),
  fetchAssessmentResults: load,
}))

function response(score: number): AssessmentResponse {
  return { ageRange: '18 - 29 años', gender: 'Prefiero no decirlo', answers: Array(21).fill(0), score }
}

describe('AssessmentResults', () => {
  beforeEach(() => { load.mockReset().mockResolvedValue([]) })

  it('informa la carga y desactiva exportación cuando aún no hay evaluaciones', async () => {
    render(<AssessmentResults />)
    expect(screen.getByRole('status')).toBeDefined()
    const button = await screen.findByRole('button', { name: 'Exportar evaluaciones CSV' })
    expect((button as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('permite recuperar una carga fallida y consultar los resultados al reintentar', async () => {
    load.mockRejectedValueOnce(new Error('Servicio temporalmente indisponible.'))
    load.mockResolvedValueOnce([{ pseudonym: 'P001', version: 1, baselineMissing: false, pretest: response(0), posttest: response(3), improvement: 3 }])
    render(<AssessmentResults />)
    expect(await screen.findByRole('alert')).toBeDefined()
    expect(screen.queryByRole('table')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    const row = (await screen.findByText('P001')).closest('tr')!
    expect(within(row).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['P001', '0', '3', '3'])
    expect(screen.queryByRole('alert')).toBeNull()
    expect((screen.getByRole('button', { name: 'Exportar evaluaciones CSV' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('distingue pares, pendientes y falta de medición inicial sin inventar diferencias', async () => {
    const rows: AssessmentResult[] = [
      { pseudonym: 'P001', version: 1, baselineMissing: false, pretest: response(7), posttest: response(7), improvement: 0 },
      { pseudonym: 'P002', version: 1, baselineMissing: false, pretest: response(9), posttest: response(6), improvement: -3 },
      { pseudonym: 'P003', version: 1, baselineMissing: false, pretest: response(8), posttest: null, improvement: null },
      { pseudonym: 'P004', version: 1, baselineMissing: true, pretest: null, posttest: response(12), improvement: null },
      { pseudonym: 'P005', version: 1, baselineMissing: false, pretest: null, posttest: null, improvement: null },
      { pseudonym: 'P006', version: 1, baselineMissing: false, pretest: response(4), posttest: response(5), improvement: null },
    ]
    load.mockResolvedValue(rows)
    render(<AssessmentResults />)
    const table = await screen.findByRole('table')
    expect(within(table).getAllByRole('row').slice(1).map((row) => within(row).getAllByRole('cell').map((cell) => cell.textContent))).toEqual([
      ['P001', '7', '7', '0'],
      ['P002', '9', '6', '-3'],
      ['P003', '8', 'Pendiente', 'No comparable'],
      ['P004', 'Sin medición inicial', '12', 'No comparable'],
      ['P005', 'Pendiente', 'Pendiente', 'No comparable'],
      ['P006', '4', '5', '—'],
    ])
  })
})
