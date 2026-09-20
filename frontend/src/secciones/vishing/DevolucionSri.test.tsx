import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import TaxRefund from './DevolucionSri'
import { terminarDeHablar } from '../../test/escenario'

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
      <TaxRefund />
    </MemoryRouter>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
  const phone = container.querySelector('#pantalla-escenario') as HTMLElement
  fireEvent.click(within(phone).getByRole('button', { name: 'Contestar la llamada' }))
  terminarDeHablar(phone)
  return phone
}

describe('DevolucionSri', () => {
  // Bug reportado: al dudar (sin dar la cédula todavía), la transcripción
  // saltaba a "Perfecto, la acreditación va a la cuenta..." y pedía el
  // código del banco, aunque la única opción para contestar seguía siendo
  // dar la cédula. Esas líneas son de la rama en la que ya se dio la
  // cédula (GAVE_ECUADORIAN_ID); no le corresponden a esta.
  it('al dudar, no se adelanta a pedir el código antes de que se haya dado la cédula', () => {
    const phone = start()

    fireEvent.click(
      within(phone).getByRole('button', { name: /Yo no he reclamado ninguna devolución/ }),
    )
    terminarDeHablar(phone)

    expect(within(phone).getByText(/solo confirmarme la cédula/)).toBeDefined()
    expect(within(phone).queryByText(/La acreditación va a la cuenta/)).toBeNull()
    expect(within(phone).queryByText(/código de seis dígitos/)).toBeNull()
  })

  // Segundo bug del mismo hilo: la respuesta decía "y la cuenta es esa" sin
  // que ninguna cuenta se hubiera mencionado antes, un pronombre sin
  // referente. La respuesta debe decir qué cuenta da, no señalar al vacío.
  it('la respuesta da un número de cuenta concreto, no "esa" sin más', () => {
    const phone = start()

    fireEvent.click(
      within(phone).getByRole('button', { name: /Yo no he reclamado ninguna devolución/ }),
    )
    terminarDeHablar(phone)

    expect(
      within(phone).getByRole('button', { name: /Bueno, mi cédula es .* y mi cuenta es .+/ }),
    ).toBeDefined()
  })
})
