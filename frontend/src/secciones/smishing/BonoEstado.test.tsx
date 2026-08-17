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
  it('se decide tocando el propio teléfono, sin lista de opciones', () => {
    const container = empezar()
    const telefono = container.querySelector('#pantalla-escenario') as HTMLElement

    expect(telefono).not.toBeNull()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Ver contexto y mis datos' })).toBeDefined()

    // El enlace del SMS es el punto interactivo: no hay ningún botón fuera del
    // teléfono que describa la acción.
    const enlace = within(telefono).getByText('bit.ly/bono-ec-2026')
    fireEvent.click(enlace)

    expect(within(telefono).getByText('Acreditación del bono de $180')).toBeDefined()
    expect(within(telefono).getByText('bono-social-ec.online/registro')).toBeDefined()

    fireEvent.click(within(telefono).getByRole('button', { name: 'Acreditar mi bono' }))
    expect(screen.getByText('Caíste en la trampa')).toBeDefined()
  })

  it('reenviar abre el hilo del grupo y salir de la página no entrega datos', () => {
    const container = empezar()
    const telefono = container.querySelector('#pantalla-escenario') as HTMLElement

    fireEvent.click(within(telefono).getByRole('button', { name: /Reenviar/ }))
    expect(within(telefono).getByText('Familia ❤️')).toBeDefined()

    fireEvent.click(within(telefono).getByText('bit.ly/bono-ec-2026'))
    fireEvent.click(within(telefono).getByRole('button', { name: 'Volver atrás' }))
    expect(screen.getByText('No caíste · el formulario te delató')).toBeDefined()
  })

  it('la app del navegador lleva a comprobarlo por cuenta propia', () => {
    const container = empezar()
    const telefono = container.querySelector('#pantalla-escenario') as HTMLElement

    fireEvent.click(within(telefono).getByRole('button', { name: /Navegador/ }))
    expect(screen.getByText('No caíste · buscaste la fuente oficial')).toBeDefined()
  })

  it('el repaso de señales resalta elementos dentro del celular', async () => {
    const container = empezar()
    const telefono = container.querySelector('#pantalla-escenario') as HTMLElement

    fireEvent.click(within(telefono).getByText('bit.ly/bono-ec-2026'))
    fireEvent.click(within(telefono).getByRole('button', { name: 'Acreditar mi bono' }))
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
