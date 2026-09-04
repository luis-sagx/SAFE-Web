import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CierreModulo from './CierreModulo'
import type { Escenario, Seccion } from '../data/catalogo'
import type { Progreso, RunSummary } from '../lib/api'

const { fetchMyRunsMock } = vi.hoisted(() => ({
  fetchMyRunsMock: vi.fn(),
}))

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...actual, fetchMyRuns: fetchMyRunsMock }
})

const SECCION = { id: 'phishing', titulo: 'Phishing' } as Seccion
const ESCENARIOS = Array.from({ length: 8 }, (_, i) => ({ id: `phishing/e${i}` }) as Escenario)
const PROGRESO: Progreso = {
  modulo: 'phishing',
  escenarios: [],
  aprobados: 6,
  requeridos: 6,
  aprobado: true,
}

function runFixture(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    id: 'r1',
    scenarioId: 'phishing/e0',
    version: 1,
    outcome: 'CORRECTO',
    score: 100,
    endingId: 'e_verifica',
    durationMs: 60_000,
    finishedAt: '2026-08-01T10:00:00.000Z',
    ...overrides,
  }
}

describe('CierreModulo', () => {
  beforeEach(() => {
    fetchMyRunsMock.mockReset()
  })

  it('muestra el conteo de aprobados y los cuatro discriminadores', () => {
    fetchMyRunsMock.mockReturnValue(new Promise(() => {}))

    render(<CierreModulo seccion={SECCION} escenarios={ESCENARIOS} progreso={PROGRESO} />)

    expect(screen.getByText('Módulo aprobado')).toBeDefined()
    expect(screen.getByText('¿Qué te piden?')).toBeDefined()
    expect(screen.getByText('¿Resiste la verificación?')).toBeDefined()
    expect(screen.getByText('¿Cómo reacciona a tu duda?')).toBeDefined()
    expect(screen.getByText('¿Adónde va el dinero?')).toBeDefined()
  })

  it('suma la duración del último intento de cada escenario propio', async () => {
    fetchMyRunsMock.mockResolvedValue([
      // Dos corridas del mismo escenario: solo la más reciente debe contar.
      runFixture({ scenarioId: 'phishing/e0', durationMs: 500_000, finishedAt: '2026-08-01T09:00:00.000Z' }),
      runFixture({ scenarioId: 'phishing/e0', durationMs: 60_000, finishedAt: '2026-08-01T10:00:00.000Z' }),
      runFixture({ scenarioId: 'phishing/e1', durationMs: 30_000, finishedAt: '2026-08-01T10:00:00.000Z' }),
      // De otra sección: no debe sumarse a este cierre.
      runFixture({ scenarioId: 'smishing/e0', durationMs: 999_000, finishedAt: '2026-08-01T10:00:00.000Z' }),
    ])

    render(<CierreModulo seccion={SECCION} escenarios={ESCENARIOS} progreso={PROGRESO} />)

    // (60_000 + 30_000) ms = 1 minuto y 30s, redondeado a 2 minutos.
    expect(await screen.findByText(/en 2 minutos/)).toBeDefined()
  })

  it('menos de un minuto se dice en palabras, no como "0 minutos"', async () => {
    fetchMyRunsMock.mockResolvedValue([runFixture({ durationMs: 20_000 })])

    render(<CierreModulo seccion={SECCION} escenarios={ESCENARIOS} progreso={PROGRESO} />)

    expect(await screen.findByText(/en menos de un minuto/)).toBeDefined()
  })

  it('si falla la petición del tiempo, el cierre se muestra igual', async () => {
    fetchMyRunsMock.mockRejectedValue(new Error('red caída'))

    render(<CierreModulo seccion={SECCION} escenarios={ESCENARIOS} progreso={PROGRESO} />)

    expect(await screen.findByText('Módulo aprobado')).toBeDefined()
    expect(screen.queryByText(/en \d/)).toBeNull()
  })
})
