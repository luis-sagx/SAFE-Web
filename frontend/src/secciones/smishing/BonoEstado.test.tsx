import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import BonoEstado from './BonoEstado'

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
  const actual = await vi.importActual<typeof import('../../lib/api')>('../../lib/api')
  return { ...actual, createRun: vi.fn().mockResolvedValue(undefined) }
})

function empezar() {
  const { container } = render(
    <MemoryRouter>
      <BonoEstado />
    </MemoryRouter>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
  return container
}

describe('BonoEstado', () => {
  it('decide desde la pantalla del celular y no desde opciones laterales', () => {
    const container = empezar()
    const telefono = container.querySelector('#pantalla-escenario')

    expect(telefono).not.toBeNull()
    expect(screen.queryByText('¿Qué haces?')).toBeNull()

    fireEvent.click(
      within(telefono as HTMLElement).getByRole('button', {
        name: 'Abrir el enlace antes de que se venza el plazo.',
      }),
    )

    expect(within(telefono as HTMLElement).getByText('Acreditación del bono de $180')).toBeDefined()
    expect(
      within(telefono as HTMLElement).getByRole('button', {
        name: 'Llenar el formulario: piden datos que ya conozco.',
      }),
    ).toBeDefined()
  })
})
