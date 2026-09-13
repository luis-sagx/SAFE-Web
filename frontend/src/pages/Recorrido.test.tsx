import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TrainingHistory from './Recorrido'
import type { RunSummary } from '../lib/api'

const { fetchMyRunsMock } = vi.hoisted(() => ({
  fetchMyRunsMock: vi.fn(),
}))

vi.mock('../lib/api', async () => {
  const current = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...current, fetchMyRuns: fetchMyRunsMock }
})

vi.mock('../context/AuthContext', async () => (await import('../test/escenario')).mockAuth())

function renderHistory() {
  return render(
    <MemoryRouter>
      <TrainingHistory />
    </MemoryRouter>,
  )
}

function runFixture(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    id: 'r1',
    scenarioId: 'phishing/factura-sri',
    version: 1,
    outcome: 'CORRECTO',
    score: 100,
    endingId: 'e_verifica',
    durationMs: 42_000,
    finishedAt: '2026-08-01T10:00:42.000Z',
    ...overrides,
  }
}

describe('Recorrido', () => {
  beforeEach(() => {
    fetchMyRunsMock.mockReset()
  })

  it('mientras carga, no muestra ni el error ni el vacío', () => {
    fetchMyRunsMock.mockReturnValue(new Promise(() => {}))

    renderHistory()

    expect(screen.getByText('Cargando…')).toBeDefined()
  })

  it('sin corridas, dice que todavía no jugó nada', async () => {
    fetchMyRunsMock.mockResolvedValue([])

    renderHistory()

    expect(await screen.findByText('Todavía no has jugado ningún escenario.')).toBeDefined()
  })

  it('si la petición falla, muestra el aviso de error', async () => {
    fetchMyRunsMock.mockRejectedValue(new Error('red caída'))

    renderHistory()

    expect(
      await screen.findByText('No se pudo cargar tu recorrido. Vuelve a intentarlo más tarde.'),
    ).toBeDefined()
  })

  it('agrupa por sección y usa el último intento de cada escenario', async () => {
    fetchMyRunsMock.mockResolvedValue([
      runFixture({ outcome: 'INCORRECTO', score: 0, finishedAt: '2026-08-01T10:00:00.000Z' }),
      runFixture({ outcome: 'CORRECTO', score: 100, finishedAt: '2026-08-02T10:00:00.000Z' }),
    ])

    renderHistory()

    expect(await screen.findByText('Factura por validar')).toBeDefined()
    expect(screen.getByText('Aprobado')).toBeDefined()
    expect(screen.getByText('100/100')).toBeDefined()
    // Dos corridas del mismo escenario: la insignia cuenta ambas, aunque solo
    // la más reciente decida el resultado que se muestra.
    expect(screen.getByText('2 intentos')).toBeDefined()
  })

  it('un escenario nunca jugado no aparece en el listado', async () => {
    fetchMyRunsMock.mockResolvedValue([runFixture()])

    renderHistory()

    await screen.findByText('Factura por validar')
    expect(screen.queryByText('Contraseña por caducar')).toBeNull()
  })
})
