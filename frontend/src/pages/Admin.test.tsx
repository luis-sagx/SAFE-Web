import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Admin from './Admin'

const { fetchParticipantsMock, fetchResultsMock } = vi.hoisted(() => ({
  fetchParticipantsMock: vi.fn(),
  fetchResultsMock: vi.fn(),
}))

vi.mock('../lib/api', async () => {
  const current = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...current,
    fetchParticipants: fetchParticipantsMock,
    fetchResults: fetchResultsMock,
  }
})

vi.mock('../context/AuthContext', async () => (await import('../test/escenario')).mockAuth())

function renderAdmin() {
  return render(
    <MemoryRouter>
      <Admin />
    </MemoryRouter>,
  )
}

describe('Admin', () => {
  beforeEach(() => {
    fetchParticipantsMock.mockReset()
    fetchResultsMock.mockReset()
  })

  it('muestra el estado de carga mientras llega la lista de participantes', () => {
    fetchParticipantsMock.mockReturnValue(new Promise(() => {}))

    renderAdmin()

    expect(screen.getByText('Cargando participantes…')).toBeDefined()
  })

  it('sin participantes, dice que todavía no hay ninguno', async () => {
    fetchParticipantsMock.mockResolvedValue([])

    renderAdmin()

    expect(
      await screen.findByText('Todavía no hay participantes registrados.'),
    ).toBeDefined()
  })

  it('muestra el estado de carga de resultados al cambiar de pestaña', async () => {
    fetchParticipantsMock.mockResolvedValue([])
    fetchResultsMock.mockReturnValue(new Promise(() => {}))

    renderAdmin()

    fireEvent.click(screen.getByRole('tab', { name: 'Resultados' }))

    expect(await screen.findByText('Cargando resultados…')).toBeDefined()
  })
})
