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

const highlighted = (signal: string) =>
  document.querySelector(`[data-signal="${signal}"]`)?.classList.contains('senal-resaltada')

describe('LoteriaPremiada', () => {
  it('recorre cuatro pistas dentro del correo antes de dejar la decisión libre', async () => {
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
    expect(screen.getByText('Pista 1 de 4').closest('[aria-live="polite"]')).not.toBeNull()
    expect(highlighted('saludo')).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente pista' }))

    expect(screen.getByText(/pagar antes de recibir/i)).toBeDefined()
    await waitFor(() =>
      expect(document.querySelector('[data-guia-target="pago"]')).not.toBeNull(),
    )
    expect(highlighted('pago')).toBe(true)
    expect(highlighted('saludo')).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente pista' }))

    expect(screen.getByText(/quién envía el correo/i)).toBeDefined()
    await waitFor(() =>
      expect(document.querySelector('[data-guia-target="remitente"]')).not.toBeNull(),
    )
    expect(highlighted('remitente')).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente pista' }))

    // La última pista apunta a la barra, fuera del cuerpo del correo.
    expect(screen.getByRole('button', { name: 'Ahora decide' })).toBeDefined()
    expect(screen.getByText(/con el botón Spam reportas el correo/i)).toBeDefined()
    await waitFor(() =>
      expect(document.querySelector('[data-guia-target="e_spam"]')).not.toBeNull(),
    )
    expect(highlighted('e_spam')).toBe(true)
    expect(highlighted('remitente')).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'Ahora decide' }))

    expect(screen.queryByRole('button', { name: 'Ahora decide' })).toBeNull()
    expect(document.querySelector('[data-guia-target]')).toBeNull()
    expect(document.querySelector('.senal-resaltada')).toBeNull()
    expect(screen.queryByText(/fraude|trampa|respuesta correcta/i)).toBeNull()
  })
})
