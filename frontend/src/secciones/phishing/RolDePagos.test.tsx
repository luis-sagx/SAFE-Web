import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import PayrollStatement from './RolDePagos'

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
    usuarioSimulado: 'mariaperez',
  }),
}))

vi.mock('../../lib/api', async () => {
  const current = await vi.importActual<typeof import('../../lib/api')>('../../lib/api')
  return { ...current, createRun: vi.fn().mockResolvedValue(undefined) }
})

function renderScenario() {
  render(
    <MemoryRouter>
      <PayrollStatement />
    </MemoryRouter>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
}

describe('RolDePagos', () => {
  it('al eliminar el correo, la barra lateral lo refleja: sale de Recibidos y aparece en Papelera', () => {
    renderScenario()

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))

    expect(screen.getByText('No hay correos en la bandeja de entrada.')).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Papelera' }))

    expect(screen.getByRole('heading', { name: 'Papelera' })).toBeDefined()
    expect(screen.getByText(/Tu rol de pagos de .* ya está disponible/)).toBeDefined()
  })

  it('responder deja el veredicto de haber entregado la contraseña', () => {
    renderScenario()

    fireEvent.click(screen.getByRole('button', { name: 'Responder' }))

    expect(screen.getByText('Correo legítimo, reacción peligrosa')).toBeDefined()
  })

  it('entrar al portal desde los marcadores y pulsar Ingresar acredita el escenario', () => {
    renderScenario()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Portal Andes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(screen.getByText('Acertaste · el correo era legítimo')).toBeDefined()
  })

  it('personaliza el saludo y permite abrir el portal legítimo desde su URL visible', () => {
    renderScenario()

    expect(screen.getByText('Hola, María:')).toBeDefined()
    fireEvent.click(screen.getByRole('link', { name: 'portal.andes.com.ec' }))

    expect(screen.getByRole('heading', { name: 'Portal del colaborador' })).toBeDefined()
    expect(screen.getByText('https://portal.andes.com.ec/rrhh/rol')).toBeDefined()
  })
})
