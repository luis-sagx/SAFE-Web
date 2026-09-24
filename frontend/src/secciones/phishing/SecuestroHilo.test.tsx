import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import ThreadHijacking from './SecuestroHilo'

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
      <ThreadHijacking />
    </MemoryRouter>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
}

describe('SecuestroHilo', () => {
  it('muestra un beneficiario distinto a la escuela para hacer visible la trampa', () => {
    renderScenario()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Banco del Litoral' }))

    expect(screen.getByText('Carlos Andrés Mena')).toBeDefined()
    expect(screen.getByText('Banco Austral · 2200418877')).toBeDefined()
    expect(screen.queryByText(/\(nueva\)/i)).toBeNull()
  })

  it('cerrar la pestaña de la banca vuelve al correo', () => {
    renderScenario()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Banco del Litoral' }))

    expect(screen.getAllByRole('tab')).toHaveLength(2)

    fireEvent.click(
      screen.getByRole('button', { name: 'Cerrar la pestaña Transferencia a terceros' }),
    )

    expect(screen.getAllByRole('tab')).toHaveLength(1)
    expect(screen.getByText('Re: Pensión de este mes')).toBeDefined()
  })

  it('clicar la pestaña del correo mientras la banca está abierta muestra el correo', () => {
    renderScenario()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Banco del Litoral' }))

    fireEvent.click(screen.getByRole('tab', { name: 'Correo' }))

    expect(screen.getByText('Re: Pensión de este mes')).toBeDefined()
  })
})
