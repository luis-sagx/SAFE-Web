import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import RafflePrize from './PremioSorteo'

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
      <RafflePrize />
    </MemoryRouter>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
  return container.querySelector('#pantalla-escenario') as HTMLElement
}

describe('PremioSorteo', () => {
  it('no contestar es una decisión, y se toma antes de oír nada', () => {
    const phone = start()

    // Mientras suena no hay nada que escuchar todavía: solo las dos teclas.
    expect(within(phone).queryByText(/ganador de una cocina/)).toBeNull()

    fireEvent.click(within(phone).getByRole('button', { name: 'Rechazar la llamada' }))
    expect(screen.getByText('No caíste · no contestaste')).toBeDefined()
  })

  it('contestar abre la llamada y colgar la termina', () => {
    const phone = start()

    fireEvent.click(within(phone).getByRole('button', { name: 'Contestar la llamada' }))
    expect(within(phone).getByText(/ganador de una cocina/)).toBeDefined()
    // Contestar no es todavía un veredicto: la corrida sigue en curso.
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: 'Colgar la llamada' }))
    expect(screen.getByText('No caíste · colgaste')).toBeDefined()
    // Y la llamada se ve colgada: ni cronómetro corriendo ni nada que decirle
    // a quien acabas de cortar.
    expect(within(phone).getByText('Llamada finalizada')).toBeDefined()
    expect(within(phone).queryByText(/¿Y no puedo pagar/)).toBeNull()
  })

  it('preguntar tiene respuesta propia, pero acaba en el mismo depósito', () => {
    const phone = start()

    fireEvent.click(within(phone).getByRole('button', { name: 'Contestar la llamada' }))
    fireEvent.click(within(phone).getByRole('button', { name: /¿Por qué tengo que pagar/ }))

    // Contestan a lo que se preguntó, no una frase de guion cualquiera…
    expect(within(phone).getByText(/el premio es gratis/)).toBeDefined()
    // …y aun así terminan pidiendo el depósito.
    expect(within(phone).getByText(/Deposite a la cuenta de mi compañera/)).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()
  })

  it('aceptar pagar no pasa por esa explicación: van directo a la cuenta', () => {
    const phone = start()

    fireEvent.click(within(phone).getByRole('button', { name: 'Contestar la llamada' }))
    fireEvent.click(within(phone).getByRole('button', { name: /¿A qué cuenta deposito/ }))

    expect(within(phone).queryByText(/el premio es gratis/)).toBeNull()
    expect(within(phone).getByText(/Deposite a la cuenta de mi compañera/)).toBeDefined()
  })

  it('pagar no es un toque: hay que hacer la transferencia en la app', () => {
    const phone = start()

    fireEvent.click(within(phone).getByRole('button', { name: 'Contestar la llamada' }))
    fireEvent.click(within(phone).getByRole('button', { name: /Banco del Litoral/ }))

    // Abrir la app deja en el inicio de la banca móvil, sin veredicto.
    expect(within(phone).getByText('Tus cuentas')).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: /Transferir/ }))
    expect(within(phone).getByText(/cuenta personal/)).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: 'Transferir $40,00' }))
    expect(screen.getByText('Caíste en la estafa')).toBeDefined()
  })

  it('la llamada sigue abierta mientras compruebas en otra app', () => {
    const phone = start()

    fireEvent.click(within(phone).getByRole('button', { name: 'Contestar la llamada' }))
    fireEvent.click(within(phone).getByRole('button', { name: /Cámara/ }))
    expect(within(phone).getByText(/La cámara está lista/)).toBeDefined()

    // Volver deja la conversación donde estaba, sin haber decidido nada.
    fireEvent.click(within(phone).getByRole('button', { name: 'Volver a la llamada' }))
    expect(within(phone).getByText(/ganador de una cocina/)).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()
  })

  it('comprobar en el sitio del almacén es el acierto', () => {
    const phone = start()

    fireEvent.click(within(phone).getByRole('button', { name: 'Contestar la llamada' }))
    fireEvent.click(within(phone).getByRole('button', { name: /Navegador/ }))
    fireEvent.click(within(phone).getByRole('button', { name: /laganga\.com\.ec/ }))

    expect(within(phone).getByText('Ninguno')).toBeDefined()
    expect(screen.getByText('No caíste · lo comprobaste por tu cuenta')).toBeDefined()
  })
})
