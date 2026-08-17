import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import AlertaConsumo from './AlertaConsumo'

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
  const actual = await vi.importActual<typeof import('../../lib/api')>('../../lib/api')
  return { ...actual, createRun: vi.fn().mockResolvedValue(undefined) }
})

function empezar() {
  const { container } = render(
    <MemoryRouter>
      <AlertaConsumo />
    </MemoryRouter>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
  return container.querySelector('#pantalla-escenario') as HTMLElement
}

describe('AlertaConsumo', () => {
  it('escribir y enviar son dos gestos: el borrador se ve antes de mandarlo', () => {
    const telefono = empezar()

    // Sin borrador todavía: el campo es el marcador de posición del teclado.
    expect(within(telefono).queryByText(/mi tarjeta es la 4539/)).toBeNull()

    fireEvent.click(within(telefono).getByRole('button', { name: 'Mensaje de texto' }))

    const borrador = within(telefono).getByText(/mi tarjeta es la 4539 0011 8842 4417/)
    expect(borrador).toBeDefined()
    // Sigue siendo un borrador: la corrida no ha terminado.
    expect(screen.queryByText('Aviso legítimo, reacción peligrosa')).toBeNull()

    fireEvent.click(within(telefono).getByRole('button', { name: 'Enviar el mensaje' }))
    expect(screen.getByText('Aviso legítimo, reacción peligrosa')).toBeDefined()
  })

  it('salir del hilo cuenta como dejarlo pasar sin verificar', () => {
    const telefono = empezar()

    fireEvent.click(within(telefono).getByRole('button', { name: 'Volver a la lista de mensajes' }))
    expect(screen.getByText('Prudente, pero incompleto')).toBeDefined()
  })

  it('la app del banco es el camino a verificar por tu cuenta', () => {
    const telefono = empezar()

    fireEvent.click(within(telefono).getByRole('button', { name: /Banco del Litoral/ }))
    expect(screen.getByText('Acertaste · el aviso era legítimo')).toBeDefined()
  })
})
