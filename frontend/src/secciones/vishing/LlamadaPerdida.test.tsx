import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import MissedCall from './LlamadaPerdida'

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

function start() {
  const { container } = render(
    <MemoryRouter>
      <MissedCall />
    </MemoryRouter>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
  return container.querySelector('#pantalla-escenario') as HTMLElement
}

describe('LlamadaPerdida', () => {
  // El registro solo enumera llamadas; lo que se puede hacer con una aparece
  // al abrirla, como en cualquier teléfono. Abrir la ficha no decide nada.
  it('abrir la llamada perdida enseña sus opciones sin decidir todavía', () => {
    const phone = start()

    expect(within(phone).queryByText(/Bloquear y reportar/)).toBeNull()

    fireEvent.click(within(phone).getByRole('button', { name: /Llamada perdida/ }))

    expect(within(phone).getByText(/sonó una sola vez/)).toBeDefined()
    expect(within(phone).getByText(/Devolver la llamada/)).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()
  })

  it('bloquear desde la ficha es el acierto', () => {
    const phone = start()

    fireEvent.click(within(phone).getByRole('button', { name: /Llamada perdida/ }))
    fireEvent.click(within(phone).getByRole('button', { name: /Bloquear y reportar/ }))

    expect(screen.getByText('No caíste · no devolviste la llamada')).toBeDefined()
  })

  it('devolver la llamada abre la línea y colgar rápido ya cuesta dinero', () => {
    const phone = start()

    fireEvent.click(within(phone).getByRole('button', { name: /Llamada perdida/ }))
    fireEvent.click(within(phone).getByRole('button', { name: /Devolver la llamada/ }))

    expect(within(phone).getByText(/tarifa internacional/)).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: 'Colgar la llamada' }))
    expect(screen.getByText('Colgaste rápido, pero la llamada ya estaba hecha')).toBeDefined()
  })
})
