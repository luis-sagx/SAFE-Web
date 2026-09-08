import { fireEvent, render, screen } from '@testing-library/react'
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

vi.mock('../context/AuthContext', async () => (await import('../test/escenario')).authFalso())

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

  // El recorrido propio vive en el menú de cuenta del header, que es el mismo
  // en todas las pantallas: se llega a él desde cualquier punto, no solo aquí.
  it('siempre ofrece el enlace al recorrido propio', async () => {
    fetchProgresoMock.mockResolvedValue({
      modulo: 'phishing',
      escenarios: [],
      aprobados: 0,
      requeridos: 6,
      aprobado: false,
    })

    renderDashboard()

    fireEvent.click(await screen.findByRole('button', { name: /María/ }))
    expect(screen.getByRole('menuitem', { name: 'Tu recorrido' })).toBeDefined()
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
    // Sigue visible en el pie, solo que sin ser un enlace todavía.
    expect(screen.getByText(/Completa las .* secciones/)).toBeDefined()
    expect(screen.queryByRole('link', { name: 'Cuéntanos tu opinión' })).toBeNull()
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
    expect(screen.getByRole('link', { name: 'Cuéntanos tu opinión' })).toBeDefined()
  })
})
