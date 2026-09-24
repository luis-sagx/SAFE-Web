import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import PayrollStatement from './RolDePagos'

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

function renderScenario() {
  render(
    <MemoryRouter>
      <PayrollStatement />
    </MemoryRouter>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
}

describe('RolDePagos', () => {
  it('al eliminar el correo, la barra lateral lo refleja: sale de Recibidos y aparece en Papelera', () => {
    renderScenario()

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))

    expect(screen.getByText('No hay correos en la bandeja de entrada.')).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Papelera' }))

    expect(screen.getByRole('heading', { name: 'Papelera' })).toBeDefined()
    expect(screen.getByText(/Tu rol de pagos de .* ya está disponible/)).toBeDefined()
  })

  it('responder deja el veredicto de haber entregado la contraseña', () => {
    renderScenario()

    fireEvent.click(screen.getByRole('button', { name: 'Responder' }))

    expect(screen.getByText('Correo legítimo, reacción peligrosa')).toBeDefined()
  })

  it('entrar al portal y pulsar Ingresar muestra el rol de pagos, no el veredicto directo (issue #253)', () => {
    renderScenario()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Portal Andes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(screen.getByRole('heading', { name: /Rol de pagos/ })).toBeDefined()
    expect(screen.queryByText('Acertaste · el correo era legítimo')).toBeNull()
    // La cifra que el veredicto ya prometía ("faltaban dos horas extra") tiene
    // que verse en el propio rol, no solo contarse después.
    expect(screen.getByText(/6 horas/)).toBeDefined()
    expect(screen.getByText(/8 horas/)).toBeDefined()
  })

  it('reportar la diferencia desde el rol de pagos acredita el escenario', () => {
    renderScenario()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Portal Andes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reportar diferencia' }))

    expect(screen.getByText('Acertaste · el correo era legítimo')).toBeDefined()
  })

  it('personaliza el saludo y permite abrir el portal legítimo desde su URL visible', () => {
    renderScenario()

    expect(screen.getByText('Hola, María:')).toBeDefined()
    fireEvent.click(screen.getByRole('link', { name: 'portal.andes.com.ec' }))

    expect(screen.getByRole('heading', { name: 'Portal del colaborador' })).toBeDefined()
    expect(screen.getByText('https://portal.andes.com.ec/rrhh/rol')).toBeDefined()
  })

  it('cerrar la pestaña del portal devuelve al correo sin terminar el escenario', () => {
    renderScenario()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Portal Andes' }))
    expect(screen.getAllByRole('tab')).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar la pestaña Portal del colaborador' }))
    expect(screen.getAllByRole('tab')).toHaveLength(1)
  })

  it('clicar fuera de los hotspots muestra aviso de zona sin interacción', () => {
    renderScenario()

    fireEvent.click(screen.getByText('Hola, María:'))

    expect(screen.getByText(/Aquí no hay nada que hacer/)).toBeDefined()
  })

  it('cerrar la pestaña del rol de pagos vuelve al portal', () => {
    renderScenario()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Portal Andes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(screen.getAllByRole('tab')).toHaveLength(3)

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar la pestaña Rol de pagos' }))
    expect(screen.getAllByRole('tab')).toHaveLength(2)
    expect(screen.getByRole('heading', { name: 'Portal del colaborador' })).toBeDefined()
  })
})
