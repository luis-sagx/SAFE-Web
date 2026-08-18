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

  it('las apps que no deciden se abren igual y se vuelve con la flecha', () => {
    const telefono = empezar()

    fireEvent.click(within(telefono).getByRole('button', { name: /Cámara/ }))

    expect(within(telefono).getByText(/La cámara está lista/)).toBeDefined()
    // Mirar no decide: la corrida sigue en curso y no entró en la traza.
    expect(screen.getByText('¿Qué haces?')).toBeDefined()
    expect(within(telefono).queryByText(/SUPERMERCADO LA UNIÓN/)).toBeNull()

    fireEvent.click(within(telefono).getByRole('button', { name: 'Volver al hilo de mensajes' }))
    expect(within(telefono).getByText(/SUPERMERCADO LA UNIÓN/)).toBeDefined()
  })

  it('verificar es usar la app, no abrirla', () => {
    const telefono = empezar()

    fireEvent.click(within(telefono).getByRole('button', { name: /Banco del Litoral/ }))

    // Abrir deja en el inicio de la banca móvil, sin veredicto todavía, y sin
    // barra de direcciones porque no se llegó por un enlace.
    expect(within(telefono).getByText('Tarjeta *4417')).toBeDefined()
    expect(within(telefono).queryByText('bancolitoral.ec')).toBeNull()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    fireEvent.click(within(telefono).getByRole('button', { name: /Movimientos/ }))

    expect(within(telefono).getByText('Últimos consumos')).toBeDefined()
    expect(within(telefono).getByText('$42,90')).toBeDefined()
    expect(screen.getByText('Acertaste · el aviso era legítimo')).toBeDefined()
  })

  it('bloquear la tarjeta sin mirar los movimientos no es el acierto', () => {
    const telefono = empezar()

    fireEvent.click(within(telefono).getByRole('button', { name: /Banco del Litoral/ }))
    fireEvent.click(within(telefono).getByRole('button', { name: /Bloquear tarjeta/ }))

    expect(screen.getByText('Reaccionaste sin comprobar')).toBeDefined()
  })
})
