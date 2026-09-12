import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import QuishingUpdate from './QuishingActualice'

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
  const current = await vi.importActual<typeof import('../../lib/api')>('../../lib/api')
  return { ...current, createRun: vi.fn().mockResolvedValue(undefined) }
})

function renderScenario() {
  render(
    <MemoryRouter>
      <QuishingUpdate />
    </MemoryRouter>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
}

describe('QuishingActualice', () => {
  it('muestra el dominio del remitente con la sustitución de l por 1', () => {
    renderScenario()

    expect(screen.getByText('de: notificaciones@bancodel1itoral.com')).toBeDefined()
  })

  it('escanear el QR y enviar el formulario cuenta como caer en la trampa', () => {
    renderScenario()

    fireEvent.click(screen.getByRole('button', { name: 'Código QR, escanear para continuar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar datos' }))

    expect(screen.getByText('Caíste en la trampa')).toBeDefined()
  })

  it('comprueba la solicitud desde la app del banco antes de acreditar', () => {
    renderScenario()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Banco del Litoral' }))
    expect(screen.getByRole('heading', { name: 'Centro de seguridad' })).toBeDefined()
    expect(screen.queryByText('No caíste · entraste por tu cuenta')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Revisar alertas recientes' }))

    expect(screen.getByText('No caíste · entraste por tu cuenta')).toBeDefined()
  })

  it('al marcar como spam, la barra lateral lo refleja', () => {
    renderScenario()

    fireEvent.click(screen.getByRole('button', { name: 'Marcar como spam' }))
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Spam' }))

    expect(screen.getByRole('heading', { name: 'Spam' })).toBeDefined()
    expect(screen.getByText('Actualice sus datos antes de que se limite su cuenta')).toBeDefined()
  })
})
