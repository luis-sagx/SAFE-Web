import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { setToken } from './lib/api'

const { fetchMeMock, fetchProgressMock } = vi.hoisted(() => ({
  fetchMeMock: vi.fn(),
  fetchProgressMock: vi.fn(),
}))

vi.mock('./lib/api', async () => {
  const current = await vi.importActual<typeof import('./lib/api')>('./lib/api')
  return { ...current, fetchMe: fetchMeMock, fetchProgress: fetchProgressMock }
})

vi.mock('./secciones/phishing/RolDePagos', () => ({
  default: () => <p>Escenario rol de pagos montado</p>,
}))

vi.mock('./secciones/phishing/SecuestroHilo', () => ({
  default: () => <p>Escenario pago del colegio montado</p>,
}))

function participant() {
  return {
    id: 'p1',
    nombre: 'María',
    apellido: 'Pérez',
    email: 'maria@ejemplo.com',
    role: 'PARTICIPANT',
    onboardingVisto: true,
  }
}

describe('App', () => {
  beforeEach(() => {
    fetchMeMock.mockReset()
    fetchProgressMock.mockReset()
  })

  it('redirige a la sección cuando se entra por URL a un escenario bloqueado', async () => {
    setToken('t0ken')
    fetchMeMock.mockResolvedValue(participant())
    fetchProgressMock.mockResolvedValue({
      modulo: 'phishing',
      escenarios: [{ id: 'phishing/factura-sri', ultimoOutcome: 'INCORRECTO' }],
      aprobados: 0,
      requeridos: 6,
      aprobado: false,
    })

    render(
      <MemoryRouter initialEntries={['/seccion/phishing/rol-de-pagos']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Phishing' })).toBeDefined()
    await waitFor(() => {
      expect(screen.queryByText('Escenario rol de pagos montado')).toBeNull()
    })
  })

  it.each([
    '/seccion/phishing/pago-pension-colegio',
    '/seccion/phishing/secuestro-hilo',
  ])('abre el escenario del colegio desde la ruta pública o la ruta histórica: %s', async (path) => {
    setToken('t0ken')
    fetchMeMock.mockResolvedValue(participant())
    fetchProgressMock.mockResolvedValue({
      modulo: 'phishing',
      escenarios: [
        'loteria-premiada',
        'factura-sri',
        'clave-caducada',
        'rol-de-pagos',
        'quishing-actualice',
      ].map((id) => ({ id: `phishing/${id}`, ultimoOutcome: 'CORRECTO' })),
      aprobados: 5,
      requeridos: 6,
      aprobado: false,
    })

    render(
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Escenario pago del colegio montado')).toBeDefined()
  })
})
