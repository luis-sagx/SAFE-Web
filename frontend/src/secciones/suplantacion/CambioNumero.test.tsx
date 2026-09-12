import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import NumberChange from './CambioNumero'

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
      <NumberChange />
    </MemoryRouter>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
  return container.querySelector('#pantalla-escenario') as HTMLElement
}

describe('CambioNumero', () => {
  // La ficha del contacto es donde está la señal, y abrirla no decide nada:
  // mirar quién te escribe no es responderle.
  it('la cabecera del chat abre el perfil sin terminar la corrida', () => {
    const phone = start()

    fireEvent.click(within(phone).getByRole('button', { name: /No está en tus contactos/ }))

    expect(within(phone).getByText('Hace 2 días')).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: 'Salir de la aplicación' }))
    expect(within(phone).getByText(/se me dañó el celular/)).toBeDefined()
  })

  it('la nota de voz llega al contestar y se puede reproducir', () => {
    const phone = start()

    expect(within(phone).queryByRole('button', { name: 'Reproducir la nota de voz' })).toBeNull()

    fireEvent.click(within(phone).getByRole('button', { name: /¿Qué pasó, hijo?/ }))

    const play = within(phone).getByRole('button', { name: 'Reproducir la nota de voz' })
    // Tiene audio generado: si faltara, el botón quedaría inhabilitado.
    expect(play.hasAttribute('disabled')).toBe(false)
    // Y escuchar no decide nada.
    fireEvent.click(play)
    expect(screen.getByText('¿Qué haces?')).toBeDefined()
  })

  it('llamar al número de siempre es el acierto', () => {
    const phone = start()

    fireEvent.click(within(phone).getByRole('button', { name: /Teléfono/ }))
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: /Andrés · Hijo/ }))
    expect(screen.getByText('No caíste · llamaste al número de siempre')).toBeDefined()
  })

  it('transferir no es un toque: hay que confirmarlo en la app', () => {
    const phone = start()

    fireEvent.click(within(phone).getByRole('button', { name: /Banco del Litoral/ }))
    fireEvent.click(within(phone).getByRole('button', { name: /Transferir/ }))

    expect(within(phone).getAllByText(/Kevin Loor Zambrano/).length).toBeGreaterThan(0)
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: 'Transferir $350,00' }))
    expect(screen.getByText('Caíste en la suplantación')).toBeDefined()
  })

  it('salir del chat sin comprobar deja la duda', () => {
    const phone = start()

    fireEvent.click(within(phone).getByRole('button', { name: 'Volver a la lista de mensajes' }))
    expect(screen.getByText('No perdiste nada, pero te quedaste con la duda')).toBeDefined()
  })
})
