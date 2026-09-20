import { fireEvent, render, screen } from '@testing-library/react'
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
      isAdmin: false,
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
      isAdmin: false,
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
      isAdmin: false,
      login: vi.fn(),
    })

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    expect(screen.getByText('Crear una cuenta')).toBeDefined()
  })

  // Issue #256: ya hay recuperación por correo, así que el enlace lleva a
  // /olvide-password en vez de decir que solo un supervisor puede ayudar.
  it('renderiza el enlace para recuperar la contraseña', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      isAdmin: false,
      login: vi.fn(),
    })

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    const link = screen.getByRole('link', { name: /olvidaste tu contraseña/i })
    expect(link.getAttribute('href')).toBe('/olvide-password')
  })

  it('muestra el error de formato del correo debajo del campo al escribir', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      isAdmin: false,
      login: vi.fn(),
    })

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    fireEvent.change(screen.getByLabelText(/Correo/), { target: { value: 'correo-invalido' } })
    expect(screen.getByText('El correo no tiene un formato válido.')).toBeDefined()
  })

  it('no envía el login cuando el correo no tiene formato válido', () => {
    const login = vi.fn()
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      isAdmin: false,
      login,
    })

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    fireEvent.change(screen.getByLabelText(/Correo/), { target: { value: 'correo-invalido' } })
    fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'ClaveSegura1!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getAllByText('El correo no tiene un formato válido.')).not.toHaveLength(0)
    expect(login).not.toHaveBeenCalled()
  })

  it('no envía el login cuando falta la contraseña', () => {
    const login = vi.fn()
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      isAdmin: false,
      login,
    })

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    fireEvent.change(screen.getByLabelText(/Correo/), { target: { value: 'ana@correo.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByText('Ingresa tu contraseña para continuar.')).toBeDefined()
    expect(login).not.toHaveBeenCalled()
  })
})
