import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'

// vitest eleva `vi.mock` al principio del archivo que lo declara, así que las
// fábricas deben importarse *dentro* del vi.mock, nunca arriba:
//     vi.mock('../../context/AuthContext', async () =>
//       (await import('../../test/escenario')).authFalso())
export function mockAuth() {
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
      isAdmin: false,
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
export async function offlineApi() {
  const current = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...current, createRun: vi.fn().mockResolvedValue(undefined) }
}

// Busca dentro del marco del teléfono, no en toda la pantalla: el veredicto
// repite textos que también están en la pantalla simulada.
export function start(scenario: ReactElement): HTMLElement {
  const { container } = render(<MemoryRouter>{scenario}</MemoryRouter>)
  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
  return container.querySelector('#pantalla-escenario') as HTMLElement
}

// Las opciones de "Tú contestas" están deshabilitadas mientras suena el
// audio del otro lado (issue #250): en jsdom el audio nunca termina solo
// (no hay reproducción de verdad), así que los tests de vishing que
// necesitan elegir una respuesta primero simulan que la locución terminó.
// Un nodo puede encolar varias frases seguidas, cada `ended` solo saca una
// de la cola, por eso se dispara varias veces: de sobra si la cola ya
// estaba vacía, no hace nada.
export function terminarDeHablar(container: HTMLElement): void {
  const audio = container.querySelector('audio')
  if (!audio) return
  for (let i = 0; i < 5; i++) fireEvent.ended(audio)
}
