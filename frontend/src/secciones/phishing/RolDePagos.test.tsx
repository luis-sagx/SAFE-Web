import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import RolDePagos from './RolDePagos'

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    participant: {
      id: 'p1',
      nombre: 'María',
      apellido: 'Pérez',
      email: 'maria@ejemplo.com',
      role: 'PARTICIPANT',
      onboardingVisto: true,
    },
    loading: false,
    isAuthenticated: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    marcarOnboardingVisto: vi.fn(),
    onboardingDismissed: true,
    displayName: 'María',
    roleLabel: 'Participante',
    initials: 'MP',
    correoSimulado: 'mariaperez@safeweb.com',
  }),
}))

vi.mock('../../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../../lib/api')>('../../lib/api')
  return { ...actual, createRun: vi.fn().mockResolvedValue(undefined) }
})

function renderEscenario() {
  render(
    <MemoryRouter>
      <RolDePagos />
    </MemoryRouter>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
}

describe('RolDePagos', () => {
  it('al eliminar el correo, la barra lateral lo refleja: sale de Recibidos y aparece en Papelera', () => {
    renderEscenario()

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))

    expect(screen.getByText('No hay correos en la bandeja de entrada.')).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Papelera' }))

    expect(screen.getByRole('heading', { name: 'Papelera' })).toBeDefined()
    expect(screen.getByText('Tu rol de pagos de julio ya está disponible')).toBeDefined()
  })

  it('responder deja el veredicto de haber entregado la contraseña', () => {
    renderEscenario()

    fireEvent.click(screen.getByRole('button', { name: 'Responder' }))

    expect(screen.getByText('Correo legítimo, reacción peligrosa')).toBeDefined()
  })

  it('entrar al portal desde los marcadores y pulsar Ingresar acredita el escenario', () => {
    renderEscenario()

    fireEvent.click(screen.getByRole('button', { name: 'Portal Andes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(screen.getByText('Acertaste · el correo era legítimo')).toBeDefined()
  })
})
