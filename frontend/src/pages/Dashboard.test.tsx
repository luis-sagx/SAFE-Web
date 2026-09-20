import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Dashboard from './Dashboard'

const { fetchProgressMock, reproducirModuloCompletoMock, useSoundMock } = vi.hoisted(() => ({
  fetchProgressMock: vi.fn(),
  reproducirModuloCompletoMock: vi.fn(),
  useSoundMock: vi.fn(),
}))

vi.mock('../lib/api', async () => {
  const current = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...current, fetchProgress: fetchProgressMock }
})

vi.mock('../lib/sonidos', () => ({ reproducirModuloCompleto: reproducirModuloCompletoMock }))
vi.mock('../context/SoundContext', () => ({ useSound: useSoundMock }))

vi.mock('../context/AuthContext', async () => (await import('../test/escenario')).mockAuth())

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  )
}

describe('Dashboard', () => {
  beforeEach(() => {
    fetchProgressMock.mockReset()
    reproducirModuloCompletoMock.mockReset()
    useSoundMock.mockReturnValue({ activado: true, setActivado: vi.fn() })
    localStorage.clear()
  })

  // El recorrido propio vive en el menú de cuenta del header, que es el mismo
  // en todas las pantallas: se llega a él desde cualquier punto, no solo aquí.
  it('siempre ofrece el enlace al recorrido propio', async () => {
    fetchProgressMock.mockResolvedValue({
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
    fetchProgressMock.mockResolvedValue({
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
    fetchProgressMock.mockImplementation((module: string) =>
      Promise.resolve({
        modulo: module,
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

  it('la primera vez que se aprueban todos los módulos, toca el sonido de logro', async () => {
    fetchProgressMock.mockImplementation((module: string) =>
      Promise.resolve({ modulo: module, escenarios: [], aprobados: 6, requeridos: 6, aprobado: true }),
    )

    renderDashboard()

    await screen.findByRole('button', { name: 'Descargar certificado' })
    // El sonido sale de un useEffect, que React corre justo después de pintar:
    // el botón puede aparecer antes, y en un runner lento la aserción directa
    // llegaba antes que el efecto (fallaba solo en CI).
    await waitFor(() => expect(reproducirModuloCompletoMock).toHaveBeenCalledTimes(1))
  })

  it('en visitas siguientes con todo ya aprobado, no vuelve a tocarlo', async () => {
    localStorage.setItem('modulo-completo-sonado', '1')
    fetchProgressMock.mockImplementation((module: string) =>
      Promise.resolve({ modulo: module, escenarios: [], aprobados: 6, requeridos: 6, aprobado: true }),
    )

    renderDashboard()

    await screen.findByRole('button', { name: 'Descargar certificado' })
    expect(reproducirModuloCompletoMock).not.toHaveBeenCalled()
  })
})
