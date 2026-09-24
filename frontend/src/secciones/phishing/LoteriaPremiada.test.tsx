import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import LotteryPrize from './LoteriaPremiada'

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

describe('LoteriaPremiada', () => {
  it('recorre tres pistas dentro del correo antes de dejar la decisión libre', async () => {
    render(
      <MemoryRouter>
        <LotteryPrize />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))

    expect(screen.getByRole('button', { name: 'Siguiente pista' })).toBeDefined()
    expect(screen.getByText(/participaste en algún sorteo/i)).toBeDefined()
    await waitFor(() =>
      expect(document.querySelector('[data-guia-target="saludo"]')).not.toBeNull(),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente pista' }))

    expect(screen.getByText(/pagar antes de recibir/i)).toBeDefined()
    await waitFor(() =>
      expect(document.querySelector('[data-guia-target="pago"]')).not.toBeNull(),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente pista' }))

    expect(screen.getByRole('button', { name: 'Ahora decide' })).toBeDefined()
    expect(screen.getByText(/quién envía el correo/i)).toBeDefined()
    await waitFor(() =>
      expect(document.querySelector('[data-guia-target="remitente"]')).not.toBeNull(),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Ahora decide' }))

    expect(screen.queryByRole('button', { name: 'Ahora decide' })).toBeNull()
    expect(document.querySelector('[data-guia-target]')).toBeNull()
    expect(screen.queryByText(/fraude|trampa|respuesta correcta/i)).toBeNull()
  })
})
