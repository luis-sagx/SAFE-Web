import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import DataLeakNotice from './AvisoFiltracion'

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
      <DataLeakNotice />
    </MemoryRouter>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
}

describe('AvisoFiltracion', () => {
  it('termina al cambiar la contraseña en el sitio oficial', () => {
    renderScenario()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir TiendaExpress' }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }))

    expect(screen.getByText('Correcto · reaccionaste bien')).toBeDefined()
    expect(screen.queryByRole('tab', { name: /Contraseña actualizada/ })).toBeNull()
  })
})
