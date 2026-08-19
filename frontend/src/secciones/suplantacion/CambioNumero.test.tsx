import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import CambioNumero from './CambioNumero'

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
      <CambioNumero />
    </MemoryRouter>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
  return container.querySelector('#pantalla-escenario') as HTMLElement
}

describe('CambioNumero', () => {
  // La ficha del contacto es donde está la señal, y abrirla no decide nada:
  // mirar quién te escribe no es responderle.
  it('la cabecera del chat abre el perfil sin terminar la corrida', () => {
    const telefono = empezar()

    fireEvent.click(within(telefono).getByRole('button', { name: /No está en tus contactos/ }))

    expect(within(telefono).getByText('Hace 2 días')).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    fireEvent.click(within(telefono).getByRole('button', { name: 'Salir de la aplicación' }))
    expect(within(telefono).getByText(/se me dañó el celular/)).toBeDefined()
  })

  it('la nota de voz llega al contestar y se puede reproducir', () => {
    const telefono = empezar()

    expect(within(telefono).queryByRole('button', { name: 'Reproducir la nota de voz' })).toBeNull()

    fireEvent.click(within(telefono).getByRole('button', { name: /¿Qué pasó, hijo?/ }))

    const play = within(telefono).getByRole('button', { name: 'Reproducir la nota de voz' })
    // Tiene audio generado: si faltara, el botón quedaría inhabilitado.
    expect(play.hasAttribute('disabled')).toBe(false)
    // Y escuchar no decide nada.
    fireEvent.click(play)
    expect(screen.getByText('¿Qué haces?')).toBeDefined()
  })

  it('llamar al número de siempre es el acierto', () => {
    const telefono = empezar()

    fireEvent.click(within(telefono).getByRole('button', { name: /Teléfono/ }))
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    fireEvent.click(within(telefono).getByRole('button', { name: /Andrés · Hijo/ }))
    expect(screen.getByText('No caíste · llamaste al número de siempre')).toBeDefined()
  })

  it('transferir no es un toque: hay que confirmarlo en la app', () => {
    const telefono = empezar()

    fireEvent.click(within(telefono).getByRole('button', { name: /Banco del Litoral/ }))
    fireEvent.click(within(telefono).getByRole('button', { name: /Transferir/ }))

    expect(within(telefono).getAllByText(/Kevin Loor Zambrano/).length).toBeGreaterThan(0)
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    fireEvent.click(within(telefono).getByRole('button', { name: 'Transferir $350,00' }))
    expect(screen.getByText('Caíste en la suplantación')).toBeDefined()
  })

  it('salir del chat sin comprobar deja la duda', () => {
    const telefono = empezar()

    fireEvent.click(within(telefono).getByRole('button', { name: 'Volver a la lista de mensajes' }))
    expect(screen.getByText('No perdiste nada, pero te quedaste con la duda')).toBeDefined()
  })
})
