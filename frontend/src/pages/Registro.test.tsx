import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Registro from './Registro'

const { useAuthMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: useAuthMock,
}))

vi.mock('../lib/cedula', () => ({
  esCedulaEcuatoriana: vi.fn(() => true),
  normalizarCedula: vi.fn((c: string) => c.replace(/\D/g, '')),
}))

describe('Registro', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza mensaje de cargando cuando loading es true', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      loading: true,
      register: vi.fn(),
    })

    render(
      <BrowserRouter>
        <Registro />
      </BrowserRouter>
    )

    expect(screen.getByText('Cargando…')).toBeDefined()
  })

  it('renderiza formulario de registro cuando no está autenticado', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      register: vi.fn(),
    })

    render(
      <BrowserRouter>
        <Registro />
      </BrowserRouter>
    )

    expect(screen.getByLabelText(/Nombre/)).toBeDefined()
    expect(screen.getByLabelText(/Apellido/)).toBeDefined()
    expect(screen.getByLabelText(/Correo/)).toBeDefined()
  })

  it('renderiza enlace para ir al login', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      register: vi.fn(),
    })

    render(
      <BrowserRouter>
        <Registro />
      </BrowserRouter>
    )

    expect(screen.getByText(/Ya tienes cuenta/)).toBeDefined()
  })
})
