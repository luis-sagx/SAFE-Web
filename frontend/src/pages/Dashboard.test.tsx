import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Dashboard from './Dashboard'

const { fetchProgresoMock } = vi.hoisted(() => ({
  fetchProgresoMock: vi.fn(),
}))

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...actual, fetchProgreso: fetchProgresoMock }
})

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ displayName: 'María', logout: vi.fn() }),
}))

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  )
}

describe('Dashboard', () => {
  beforeEach(() => {
    fetchProgresoMock.mockReset()
  })

  it('siempre ofrece el enlace al recorrido propio', async () => {
    fetchProgresoMock.mockResolvedValue({
      modulo: 'phishing',
      escenarios: [],
      aprobados: 0,
      requeridos: 6,
      aprobado: false,
    })

    renderDashboard()

    expect(await screen.findByRole('link', { name: 'Tu recorrido' })).toBeDefined()
  })

  it('sin aprobar todos los módulos, no ofrece el certificado', async () => {
    fetchProgresoMock.mockResolvedValue({
      modulo: 'phishing',
      escenarios: [],
      aprobados: 5,
      requeridos: 6,
      aprobado: false,
    })

    renderDashboard()

    // "Tu avance" solo se pinta una vez que al menos un progreso resolvió;
    // es el punto de espera fiable, sin depender de cómo el conteo reparte
    // los números entre varios `<span>`.
    await screen.findByText('Tu avance')
    expect(screen.queryByRole('button', { name: 'Descargar certificado' })).toBeNull()
  })

  // El botón no depende de un número escrito en el componente: aparece
  // exactamente cuando el servidor ya dio por aprobados todos los módulos que
  // declara (una condición que aquí se simula aprobando los de todas las
  // secciones activas).
  it('con todos los módulos aprobados, ofrece descargar el certificado', async () => {
    fetchProgresoMock.mockImplementation((modulo: string) =>
      Promise.resolve({
        modulo,
        escenarios: [],
        aprobados: 6,
        requeridos: 6,
        aprobado: true,
      }),
    )

    renderDashboard()

    await screen.findByText('Tu avance')
    expect(await screen.findByRole('button', { name: 'Descargar certificado' })).toBeDefined()
  })
})
