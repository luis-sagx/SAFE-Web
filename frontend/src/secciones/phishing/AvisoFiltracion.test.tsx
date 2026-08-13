import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import AvisoFiltracion from './AvisoFiltracion'

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

function renderEscenario() {
  render(
    <MemoryRouter>
      <AvisoFiltracion />
    </MemoryRouter>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
}

describe('AvisoFiltracion', () => {
  it('cerrar la pestaña que dispara el final devuelve el navegador al correo', () => {
    renderEscenario()

    fireEvent.click(screen.getByRole('button', { name: 'TiendaExpress' }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }))

    expect(screen.getByRole('tab', { name: /Contraseña actualizada/ })).toBeDefined()

    fireEvent.click(
      screen.getByRole('button', { name: 'Cerrar la pestaña Contraseña actualizada' }),
    )

    // El final llega, y lo que queda detrás es la única pestaña abierta: el
    // correo. Antes seguía viéndose la página de TiendaExpress, cuya pestaña
    // acababa de desaparecer de la barra.
    expect(screen.getByText('Bien encaminado, pero incompleto')).toBeDefined()
    expect(screen.queryByRole('tab', { name: /Contraseña actualizada/ })).toBeNull()
    expect(screen.getByText('https://correo.safeweb.com/recibidos')).toBeDefined()
    expect(screen.getByText('Aviso importante de seguridad')).toBeDefined()
  })
})
