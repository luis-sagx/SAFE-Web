import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Admin from './Admin'

const { createTrainerMock, fetchParticipantsMock, fetchResultsMock, fetchTrainersMock } = vi.hoisted(() => ({
  createTrainerMock: vi.fn(),
  fetchParticipantsMock: vi.fn(),
  fetchResultsMock: vi.fn(),
  fetchTrainersMock: vi.fn(),
}))

vi.mock('../lib/api', async () => {
  const current = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...current,
    fetchParticipants: fetchParticipantsMock,
    fetchResults: fetchResultsMock,
    fetchTrainers: fetchTrainersMock,
    createTrainer: createTrainerMock,
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
    fetchTrainersMock.mockReset()
    createTrainerMock.mockReset()
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

  it('muestra etiquetas claras cuando faltan nombre o correo', async () => {
    fetchParticipantsMock.mockResolvedValue([
      {
        id: 'participante-sin-datos',
        seudonimo: 'P001',
        nombre: null,
        apellido: null,
        email: null,
        activo: true,
        createdAt: '2026-09-16T00:00:00.000Z',
      },
    ])
    fetchTrainersMock.mockResolvedValue([
      {
        id: 'formador-sin-correo',
        seudonimo: 'F001',
        nombre: 'Ana',
        apellido: 'López',
        email: null,
        activo: true,
        createdAt: '2026-09-16T00:00:00.000Z',
      },
    ])

    renderAdmin()

    expect(await screen.findByText('Sin nombre')).toBeDefined()
    expect(screen.getByText('Sin correo')).toBeDefined()

    fireEvent.click(screen.getByRole('tab', { name: 'Capacitadores' }))

    expect(await screen.findByText('Ana López')).toBeDefined()
    expect(screen.getByText('Sin correo')).toBeDefined()
  })

  it('muestra el estado de carga de resultados al cambiar de pestaña', async () => {
    fetchParticipantsMock.mockResolvedValue([])
    fetchResultsMock.mockReturnValue(new Promise(() => {}))

    renderAdmin()

    fireEvent.click(screen.getByRole('tab', { name: 'Resultados' }))

    expect(await screen.findByText('Cargando resultados…')).toBeDefined()
  })

  it('permite abrir la gestión de capacitadores y muestra su formulario de alta', async () => {
    fetchParticipantsMock.mockResolvedValue([])
    fetchTrainersMock.mockResolvedValue([])

    renderAdmin()

    fireEvent.click(screen.getByRole('tab', { name: 'Capacitadores' }))

    expect(await screen.findByRole('heading', { name: 'Crear capacitador' })).toBeDefined()
    expect(screen.getByLabelText('Correo')).toBeDefined()
  })

  it('muestra acciones claras para copiar y ocultar la contraseña inicial', async () => {
    fetchParticipantsMock.mockResolvedValue([])
    fetchTrainersMock.mockResolvedValue([])
    createTrainerMock.mockResolvedValue({ password: 'clave-inicial' })

    renderAdmin()
    fireEvent.click(screen.getByRole('tab', { name: 'Capacitadores' }))
    await screen.findByRole('heading', { name: 'Crear capacitador' })
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText('Apellido'), { target: { value: 'López' } })
    fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'ana@ejemplo.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear capacitador' }))

    expect(await screen.findByRole('button', { name: 'Copiar contraseña' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Ya la copié, ocultar contraseña' })).toBeDefined()
  })
})
