import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import SesionBogota from './SesionBogota'

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
      <SesionBogota />
    </MemoryRouter>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
}

describe('SesionBogota', () => {
  it('completar clave y luego el código de un tirón cae en la trampa', () => {
    renderEscenario()

    fireEvent.click(screen.getByRole('link', { name: 'No fui yo (proteger mi cuenta)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar acceso no reconocido' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar y cerrar sesión' }))

    expect(screen.getByText('Caíste en la trampa')).toBeDefined()
  })

  it('pasar de la página de clave al OTP no abre una pestaña nueva: sigue habiendo solo dos', () => {
    renderEscenario()

    fireEvent.click(screen.getByRole('link', { name: 'No fui yo (proteger mi cuenta)' }))
    expect(screen.getAllByRole('tab')).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar acceso no reconocido' }))

    expect(screen.getAllByRole('tab')).toHaveLength(2)
    expect(screen.getByRole('heading', { name: 'Un paso más' })).toBeDefined()
  })

  it('verificar por la app del banco desde los marcadores acredita sin escribir nada', () => {
    renderEscenario()

    fireEvent.click(screen.getByRole('button', { name: 'Banco del Litoral' }))

    expect(screen.getByText('No caíste · verificaste por la app')).toBeDefined()
  })
})
