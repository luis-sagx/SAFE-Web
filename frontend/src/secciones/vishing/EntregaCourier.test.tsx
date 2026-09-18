import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import CourierDelivery from './EntregaCourier'

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

describe('EntregaCourier', () => {
  it('presenta la solicitud de tarjeta por teléfono como riesgo durante la llamada', () => {
    const { container } = render(
      <MemoryRouter>
        <CourierDelivery />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
    const phone = container.querySelector('#pantalla-escenario') as HTMLElement
    fireEvent.click(within(phone).getByRole('button', { name: 'Contestar la llamada' }))

    expect(
      within(phone).getByText(/pagar con tarjeta, dícteme el número por teléfono/i),
    ).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: /dicto el número de mi tarjeta/ }))
    expect(screen.getByText('Llamada legítima, reacción peligrosa')).toBeDefined()
  })
})
