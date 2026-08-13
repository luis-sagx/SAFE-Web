import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { setToken } from './lib/api'

const { fetchMeMock, fetchProgresoMock } = vi.hoisted(() => ({
  fetchMeMock: vi.fn(),
  fetchProgresoMock: vi.fn(),
}))

vi.mock('./lib/api', async () => {
  const actual = await vi.importActual<typeof import('./lib/api')>('./lib/api')
  return { ...actual, fetchMe: fetchMeMock, fetchProgreso: fetchProgresoMock }
})

vi.mock('./secciones/phishing/RolDePagos', () => ({
  default: () => <p>Escenario rol de pagos montado</p>,
}))

function participante() {
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
    fetchProgresoMock.mockReset()
  })

  it('redirige a la sección cuando se entra por URL a un escenario bloqueado', async () => {
    setToken('t0ken')
    fetchMeMock.mockResolvedValue(participante())
    fetchProgresoMock.mockResolvedValue({
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
})
