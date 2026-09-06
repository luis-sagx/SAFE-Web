import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Admin from './Admin'

const { fetchParticipantesMock, fetchResultadosMock } = vi.hoisted(() => ({
  fetchParticipantesMock: vi.fn(),
  fetchResultadosMock: vi.fn(),
}))

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    fetchParticipantes: fetchParticipantesMock,
    fetchResultados: fetchResultadosMock,
  }
})

vi.mock('../context/AuthContext', async () => (await import('../test/escenario')).authFalso())

function renderAdmin() {
  return render(
    <MemoryRouter>
      <Admin />
    </MemoryRouter>,
  )
}

describe('Admin', () => {
  beforeEach(() => {
    fetchParticipantesMock.mockReset()
    fetchResultadosMock.mockReset()
  })

  it('muestra el estado de carga mientras llega la lista de participantes', () => {
    fetchParticipantesMock.mockReturnValue(new Promise(() => {}))

    renderAdmin()

    expect(screen.getByText('Cargando participantes…')).toBeDefined()
  })

  it('sin participantes, dice que todavía no hay ninguno', async () => {
    fetchParticipantesMock.mockResolvedValue([])

    renderAdmin()

    expect(
      await screen.findByText('Todavía no hay participantes registrados.'),
    ).toBeDefined()
  })

  it('muestra el estado de carga de resultados al cambiar de pestaña', async () => {
    fetchParticipantesMock.mockResolvedValue([])
    fetchResultadosMock.mockReturnValue(new Promise(() => {}))

    renderAdmin()

    fireEvent.click(screen.getByRole('tab', { name: 'Resultados' }))

    expect(await screen.findByText('Cargando resultados…')).toBeDefined()
  })
})
