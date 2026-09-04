import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AccionesFinal from './AccionesFinal'

const { fetchProgresoMock } = vi.hoisted(() => ({
  fetchProgresoMock: vi.fn(),
}))

vi.mock('../../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../../lib/api')>('../../lib/api')
  return { ...actual, fetchProgreso: fetchProgresoMock }
})

describe('AccionesFinal', () => {
  const mockOnRestart = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    fetchProgresoMock.mockReset()
  })

  it('renderiza sin errores cuando hay progreso', async () => {
    fetchProgresoMock.mockResolvedValue({
      escenarios: [{ id: 'fisico/salida-segura' }],
      aprobados: 1,
      requeridos: 5,
    })

    const { container } = render(
      <BrowserRouter>
        <AccionesFinal
          escenarioId="fisico/salida-segura"
          onRestart={mockOnRestart}
          restartLabel="Repetir"
        />
      </BrowserRouter>
    )

    expect(container).toBeDefined()
  })

  it('renderiza sin errores cuando no hay progreso', async () => {
    fetchProgresoMock.mockRejectedValue(new Error('sin red'))

    const { container } = render(
      <BrowserRouter>
        <AccionesFinal
          escenarioId="fisico/salida-segura"
          onRestart={mockOnRestart}
          restartLabel="Repetir"
        />
      </BrowserRouter>
    )

    expect(container).toBeDefined()
  })

  it('renderiza sin errores cuando autoFocus está activado', async () => {
    fetchProgresoMock.mockResolvedValue({
      escenarios: [{ id: 'fisico/salida-segura' }],
      aprobados: 1,
      requeridos: 5,
    })

    const { container } = render(
      <BrowserRouter>
        <AccionesFinal
          escenarioId="fisico/salida-segura"
          onRestart={mockOnRestart}
          restartLabel="Repetir"
          autoFocus={true}
        />
      </BrowserRouter>
    )

    expect(container).toBeDefined()
  })
})
