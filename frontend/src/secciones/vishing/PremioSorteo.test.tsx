import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import PremioSorteo from './PremioSorteo'

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
      <PremioSorteo />
    </MemoryRouter>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
  return container.querySelector('#pantalla-escenario') as HTMLElement
}

describe('PremioSorteo', () => {
  it('no contestar es una decisión, y se toma antes de oír nada', () => {
    const telefono = empezar()

    // Mientras suena no hay nada que escuchar todavía: solo las dos teclas.
    expect(within(telefono).queryByText(/ganador de una cocina/)).toBeNull()

    fireEvent.click(within(telefono).getByRole('button', { name: 'Rechazar la llamada' }))
    expect(screen.getByText('No caíste · no contestaste')).toBeDefined()
  })

  it('contestar abre la llamada y colgar la termina', () => {
    const telefono = empezar()

    fireEvent.click(within(telefono).getByRole('button', { name: 'Contestar la llamada' }))
    expect(within(telefono).getByText(/ganador de una cocina/)).toBeDefined()
    // Contestar no es todavía un veredicto: la corrida sigue en curso.
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    fireEvent.click(within(telefono).getByRole('button', { name: 'Colgar la llamada' }))
    expect(screen.getByText('No caíste · colgaste')).toBeDefined()
    // Y la llamada se ve colgada: ni cronómetro corriendo ni nada que decirle
    // a quien acabas de cortar.
    expect(within(telefono).getByText('Llamada finalizada')).toBeDefined()
    expect(within(telefono).queryByText(/¿Y no puedo pagar/)).toBeNull()
  })

  it('preguntar tiene respuesta propia, pero acaba en el mismo depósito', () => {
    const telefono = empezar()

    fireEvent.click(within(telefono).getByRole('button', { name: 'Contestar la llamada' }))
    fireEvent.click(within(telefono).getByRole('button', { name: /¿Por qué tengo que pagar/ }))

    // Contestan a lo que se preguntó, no una frase de guion cualquiera…
    expect(within(telefono).getByText(/el premio es gratis/)).toBeDefined()
    // …y aun así terminan pidiendo el depósito.
    expect(within(telefono).getByText(/Deposite a la cuenta de mi compañera/)).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()
  })

  it('aceptar pagar no pasa por esa explicación: van directo a la cuenta', () => {
    const telefono = empezar()

    fireEvent.click(within(telefono).getByRole('button', { name: 'Contestar la llamada' }))
    fireEvent.click(within(telefono).getByRole('button', { name: /¿A qué cuenta deposito/ }))

    expect(within(telefono).queryByText(/el premio es gratis/)).toBeNull()
    expect(within(telefono).getByText(/Deposite a la cuenta de mi compañera/)).toBeDefined()
  })

  it('pagar no es un toque: hay que hacer la transferencia en la app', () => {
    const telefono = empezar()

    fireEvent.click(within(telefono).getByRole('button', { name: 'Contestar la llamada' }))
    fireEvent.click(within(telefono).getByRole('button', { name: /Banco del Litoral/ }))

    // Abrir la app deja en el inicio de la banca móvil, sin veredicto.
    expect(within(telefono).getByText('Tus cuentas')).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    fireEvent.click(within(telefono).getByRole('button', { name: /Transferir/ }))
    expect(within(telefono).getByText(/cuenta personal/)).toBeDefined()

    fireEvent.click(within(telefono).getByRole('button', { name: 'Transferir $40,00' }))
    expect(screen.getByText('Caíste en la estafa')).toBeDefined()
  })

  it('la llamada sigue abierta mientras compruebas en otra app', () => {
    const telefono = empezar()

    fireEvent.click(within(telefono).getByRole('button', { name: 'Contestar la llamada' }))
    fireEvent.click(within(telefono).getByRole('button', { name: /Cámara/ }))
    expect(within(telefono).getByText(/La cámara está lista/)).toBeDefined()

    // Volver deja la conversación donde estaba, sin haber decidido nada.
    fireEvent.click(within(telefono).getByRole('button', { name: 'Volver a la llamada' }))
    expect(within(telefono).getByText(/ganador de una cocina/)).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()
  })

  it('comprobar en el sitio del almacén es el acierto', () => {
    const telefono = empezar()

    fireEvent.click(within(telefono).getByRole('button', { name: 'Contestar la llamada' }))
    fireEvent.click(within(telefono).getByRole('button', { name: /Navegador/ }))
    fireEvent.click(within(telefono).getByRole('button', { name: /laganga\.com\.ec/ }))

    expect(within(telefono).getByText('Ninguno')).toBeDefined()
    expect(screen.getByText('No caíste · lo comprobaste por tu cuenta')).toBeDefined()
  })
})
