import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'

/**
 * Lo que todo test de escenario necesita antes de poder tocar el teléfono.
 *
 * Un escenario se monta dentro del router, lee la sesión del participante y al
 * llegar a un final manda la corrida al backend. Los tres estorban a un test
 * que solo quiere comprobar el grafo, y repetir sus cuarenta líneas de `vi.mock`
 * en cada archivo hacía que añadir un test costara más copiar que pensar.
 *
 * Los `vi.mock` no se pueden esconder aquí —vitest los eleva al principio del
 * archivo que los declara—, pero sí sus fábricas. Y por esa misma elevación las
 * fábricas se importan *dentro* del `vi.mock` y nunca arriba: cuando el mock se
 * registra, los imports del archivo todavía no se han evaluado.
 *
 *     vi.mock('../../context/AuthContext', async () =>
 *       (await import('../../test/escenario')).authFalso())
 */

/// Fábrica del contexto de sesión.
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

/// Fábrica del cliente de API. Deja el resto del módulo intacto: solo la
/// llamada que sale a la red se queda en el aire.
export async function apiSinRed() {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...actual, createRun: vi.fn().mockResolvedValue(undefined) }
}

/// Monta el escenario, pulsa "Empezar" y devuelve el marco del teléfono, que es
/// donde viven los toques. Buscar dentro de él y no en toda la pantalla importa:
/// el veredicto repite textos que también están en la pantalla simulada.
export function empezar(escenario: ReactElement): HTMLElement {
  const { container } = render(<MemoryRouter>{escenario}</MemoryRouter>)
  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
  return container.querySelector('#pantalla-escenario') as HTMLElement
}
