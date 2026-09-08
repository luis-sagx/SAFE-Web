import { fireEvent, render, screen } from '@testing-library/react'
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

  it('avisa que el nombre es muy corto solo al salir del campo, no mientras escribe', () => {
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

    const campoNombre = screen.getByLabelText(/Nombre/)
    fireEvent.change(campoNombre, { target: { value: 'A' } })
    expect(screen.queryByText(/al menos 2 caracteres/)).toBeNull()

    fireEvent.blur(campoNombre)
    expect(screen.getByText(/al menos 2 caracteres/)).toBeDefined()
  })

  it('muestra el contador de caracteres solo cerca del límite', () => {
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

    const campoNombre = screen.getByLabelText(/Nombre/)
    fireEvent.change(campoNombre, { target: { value: 'María' } })
    expect(screen.queryByText(/\/60/)).toBeNull()

    fireEvent.change(campoNombre, { target: { value: 'M'.repeat(52) } })
    expect(screen.getByText('52/60')).toBeDefined()
  })
})
