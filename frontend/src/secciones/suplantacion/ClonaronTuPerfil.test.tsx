import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import ClonaronTuPerfil from './ClonaronTuPerfil'

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
      <ClonaronTuPerfil />
    </MemoryRouter>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
  return container.querySelector('#pantalla-escenario') as HTMLElement
}

describe('ClonaronTuPerfil', () => {
  // La captura es la única pantalla que enseña la suplantación desde fuera, y
  // solo cumple si se ve como una captura: el nombre copiado encabezándola y el
  // mensaje dentro. Si volviera a ser texto entre corchetes, esto falla.
  it('pedir la captura la enseña dibujada, con el nombre suplantado en la cabecera', () => {
    const telefono = empezar()

    expect(within(telefono).queryByText('Captura de pantalla')).toBeNull()

    fireEvent.click(within(telefono).getByRole('button', { name: '¿Me mandas una captura?' }))

    const captura = within(telefono).getByText('Captura de pantalla').closest('figure')
    expect(captura).not.toBeNull()
    // Con el nombre del participante, no con la etiqueta "Tu nombre": la
    // captura solo enseña algo si se lee lo que su gente ve en el teléfono.
    expect(within(captura as HTMLElement).getByText('María')).toBeDefined()
    expect(
      within(captura as HTMLElement).getByText(/me prestas 150 hasta el viernes/),
    ).toBeDefined()
    // Y mirarla no decide nada: la corrida sigue abierta.
    expect(screen.getByText('¿Qué haces?')).toBeDefined()
  })

  it('reportar el perfil es el acierto', () => {
    const telefono = empezar()

    fireEvent.click(within(telefono).getByRole('button', { name: /Red social/ }))
    fireEvent.click(within(telefono).getByRole('button', { name: /Buscar tu propio nombre/ }))
    fireEvent.click(within(telefono).getByRole('button', { name: /desde hace 4 días/ }))
    fireEvent.click(within(telefono).getByRole('button', { name: /Reportar este perfil/ }))

    expect(screen.getByText('Acertaste · reportaste la copia')).toBeDefined()
  })
})
