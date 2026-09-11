import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'

// vitest eleva `vi.mock` al principio del archivo que lo declara, así que las
// fábricas deben importarse *dentro* del vi.mock, nunca arriba:
//     vi.mock('../../context/AuthContext', async () =>
//       (await import('../../test/escenario')).authFalso())
export function authFalso() {
  return {
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
      isSupervisor: false,
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
  }
}

// Deja el resto del módulo intacto: solo la llamada que sale a la red se mockea.
export async function apiSinRed() {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...actual, createRun: vi.fn().mockResolvedValue(undefined) }
}

// Busca dentro del marco del teléfono, no en toda la pantalla: el veredicto
// repite textos que también están en la pantalla simulada.
export function empezar(escenario: ReactElement): HTMLElement {
  const { container } = render(<MemoryRouter>{escenario}</MemoryRouter>)
  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
  return container.querySelector('#pantalla-escenario') as HTMLElement
}
