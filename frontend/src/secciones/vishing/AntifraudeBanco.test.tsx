import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import AntifraudeBanco from './AntifraudeBanco'

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

function enLlamada() {
  const { container } = render(
    <MemoryRouter>
      <AntifraudeBanco />
    </MemoryRouter>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
  const telefono = container.querySelector('#pantalla-escenario') as HTMLElement
  fireEvent.click(within(telefono).getByRole('button', { name: 'Contestar la llamada' }))
  fireEvent.click(within(telefono).getByRole('button', { name: /No, yo no hice esa compra/ }))
  return telefono
}

describe('AntifraudeBanco', () => {
  // El escenario tiene mensajes y llamada a la vez, así que "volver" significa
  // una pantalla distinta según el icono: sin esto, Teléfono devolvía al SMS.
  it('Mensajes abre el hilo y Teléfono devuelve a la llamada, no al revés', () => {
    const telefono = enLlamada()

    fireEvent.click(within(telefono).getByRole('button', { name: /Mensajes/ }))
    expect(within(telefono).getByText(/nunca le pedirá este código/)).toBeDefined()

    fireEvent.click(within(telefono).getByRole('button', { name: /Teléfono/ }))
    expect(within(telefono).getByText(/Y no cuelgue: si corta la llamada/i)).toBeDefined()
    // Ir y volver es mirar, no decidir: la corrida sigue en curso.
    expect(screen.getByText('¿Qué haces?')).toBeDefined()
  })

  it('dictar el código termina la corrida en fallo', () => {
    const telefono = enLlamada()

    fireEvent.click(within(telefono).getByRole('button', { name: /Ya me llegó/ }))
    expect(screen.getByText('Caíste en la trampa')).toBeDefined()
  })

  it('comprobar los movimientos en la app es el acierto', () => {
    const telefono = enLlamada()

    fireEvent.click(within(telefono).getByRole('button', { name: /Banco del Litoral/ }))
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    fireEvent.click(within(telefono).getByRole('button', { name: /Movimientos/ }))
    expect(screen.getByText('No caíste · lo comprobaste donde consta')).toBeDefined()
  })

  it('colgar cuando piden el código es un acierto', () => {
    const telefono = enLlamada()

    fireEvent.click(within(telefono).getByRole('button', { name: 'Colgar la llamada' }))
    expect(screen.getByText('No caíste · colgaste')).toBeDefined()
  })
})
