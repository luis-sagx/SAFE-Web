import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import QuishingActualice from './QuishingActualice'

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
      <QuishingActualice />
    </MemoryRouter>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
}

describe('QuishingActualice', () => {
  it('escanear el QR y enviar el formulario cuenta como caer en la trampa', () => {
    renderEscenario()

    fireEvent.click(screen.getByRole('button', { name: 'Código QR, escanear para continuar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar datos' }))

    expect(screen.getByText('Caíste en la trampa')).toBeDefined()
  })

  it('entrar por la app del banco desde los marcadores acredita sin escanear', () => {
    renderEscenario()

    fireEvent.click(screen.getByRole('button', { name: 'Banco del Litoral' }))

    expect(screen.getByText('No caíste · entraste por tu cuenta')).toBeDefined()
  })

  it('al marcar como spam, la barra lateral lo refleja', () => {
    renderEscenario()

    fireEvent.click(screen.getByRole('button', { name: 'Marcar como spam' }))
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Spam' }))

    expect(screen.getByRole('heading', { name: 'Spam' })).toBeDefined()
    expect(screen.getByText('Actualice sus datos antes de que se limite su cuenta')).toBeDefined()
  })
})
