import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import SecuestroHilo from './SecuestroHilo'

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

describe('SecuestroHilo', () => {
  it('muestra un beneficiario distinto a la escuela para hacer visible la trampa', () => {
    render(
      <MemoryRouter>
        <SecuestroHilo />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Banco del Litoral' }))

    expect(screen.getByText('Carlos Andrés Mena')).toBeDefined()
  })
})
