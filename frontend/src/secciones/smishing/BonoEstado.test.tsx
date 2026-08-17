import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import BonoEstado from './BonoEstado'

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
      <BonoEstado />
    </MemoryRouter>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
  return container
}

describe('BonoEstado', () => {
  it('decide desde la pantalla del celular y no desde opciones laterales', () => {
    const container = empezar()
    const telefono = container.querySelector('#pantalla-escenario')

    expect(telefono).not.toBeNull()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Ver contexto y mis datos' })).toBeDefined()

    const abrirEnlace = screen.getByRole('button', {
      name: /Abrir el enlace antes de que se venza el plazo\./,
    })
    expect((telefono as HTMLElement).contains(abrirEnlace)).toBe(false)
    fireEvent.click(abrirEnlace)

    expect(within(telefono as HTMLElement).getByText('Acreditación del bono de $180')).toBeDefined()
    expect(within(telefono as HTMLElement).queryByText('No seguro')).toBeNull()
    expect(within(telefono as HTMLElement).getByText('bono-social-ec.online/registro')).toBeDefined()
    expect(within(telefono as HTMLElement).queryByText('HTTP')).toBeNull()
    expect(screen.getByRole('button', { name: /Llenar el formulario: piden datos que ya conozco\./ })).toBeDefined()
  })

  it('el repaso de señales resalta elementos dentro del celular', async () => {
    const container = empezar()
    const telefono = container.querySelector('#pantalla-escenario') as HTMLElement

    fireEvent.click(screen.getByRole('button', { name: /Abrir el enlace antes de que se venza el plazo\./ }))
    fireEvent.click(screen.getByRole('button', { name: /Llenar el formulario: piden datos que ya conozco\./ }))
    fireEvent.click(screen.getByRole('button', { name: 'Ver las señales' }))

    await waitFor(() => {
      expect(
        within(telefono)
          .getByText(/MIES INFORMA/)
          .closest('[data-signal="mensaje"]')
          ?.classList.contains('senal-resaltada'),
      ).toBe(true)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente →' }))
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente →' }))

    await waitFor(() => {
      expect(
        within(telefono)
          .getByText('bono-social-ec.online/registro')
          .closest('[data-signal="url"]')
          ?.classList.contains('senal-resaltada'),
      ).toBe(true)
    })
  })
})
