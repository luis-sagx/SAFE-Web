import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Login from './Login'

const { useAuthMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: useAuthMock,
}))

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza mensaje de cargando cuando loading es true', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      loading: true,
      isSupervisor: false,
      login: vi.fn(),
    })

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    expect(screen.getByText('Cargando…')).toBeDefined()
  })

  it('renderiza formulario de login cuando no está autenticado', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      isSupervisor: false,
      login: vi.fn(),
    })

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    expect(screen.getByRole('button', { name: 'Entrar' })).toBeDefined()
    expect(screen.getByLabelText(/Correo/)).toBeDefined()
  })

  it('renderiza enlace para crear cuenta', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      isSupervisor: false,
      login: vi.fn(),
    })

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    expect(screen.getByText('Crear una cuenta')).toBeDefined()
  })

  it('renderiza mensaje de ayuda sobre la contraseña', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      isSupervisor: false,
      login: vi.fn(),
    })

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    expect(screen.getByText(/¿No puedes entrar/)).toBeDefined()
  })
})
