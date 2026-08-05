import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import FacturaSri from './FacturaSri'

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    participant: {
      id: 'p1',
      nombre: 'María',
      apellido: 'Pérez',
      email: 'maria@ejemplo.com',
      role: 'PARTICIPANT',
      cohort: null,
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
      <FacturaSri />
    </MemoryRouter>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
}

describe('FacturaSri', () => {
  it('permite revisar Enviados sin cerrar el escenario', () => {
    renderEscenario()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Enviados' }))

    expect(screen.getByRole('heading', { name: 'Enviados' })).toBeDefined()
    expect(screen.getByText('No hay correos enviados.')).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()
    expect(screen.queryByText('Escenario no aprobado')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Recibidos' }))

    expect(
      screen.getByRole('heading', { name: 'Factura electrónica pendiente de validación' }),
    ).toBeDefined()
  })

  it('permite revisar Papelera sin cerrar el escenario', () => {
    renderEscenario()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Papelera' }))

    expect(screen.getByRole('heading', { name: 'Papelera' })).toBeDefined()
    expect(screen.getByText('La papelera está vacía.')).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()
    expect(screen.queryByText('Escenario no aprobado')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Recibidos' }))

    expect(
      screen.getByRole('heading', { name: 'Factura electrónica pendiente de validación' }),
    ).toBeDefined()
  })
})
