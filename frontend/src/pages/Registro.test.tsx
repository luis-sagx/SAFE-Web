import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Registro from './Registro'
import { esCedulaEcuatoriana } from '../lib/cedula'

function llenarCamposValidos() {
  fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'María' } })
  fireEvent.change(screen.getByLabelText(/Apellido/), { target: { value: 'Pérez' } })
  fireEvent.change(screen.getByLabelText(/Cédula/), { target: { value: '1710034065' } })
  fireEvent.change(screen.getByLabelText(/Correo/), { target: { value: 'maria@correo.com' } })
  fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'unaClaveLarga123' } })
  fireEvent.click(screen.getByRole('checkbox'))
}

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

  it('avisa que el apellido es muy corto solo al salir del campo, no mientras escribe', () => {
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

    const campoApellido = screen.getByLabelText(/Apellido/)
    fireEvent.change(campoApellido, { target: { value: 'P' } })
    expect(screen.queryByText(/al menos 2 caracteres/)).toBeNull()

    fireEvent.blur(campoApellido)
    expect(screen.getByText(/al menos 2 caracteres/)).toBeDefined()
  })

  it('muestra el contador de caracteres del apellido solo cerca del límite', () => {
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

    const campoApellido = screen.getByLabelText(/Apellido/)
    fireEvent.change(campoApellido, { target: { value: 'Pérez' } })
    expect(screen.queryByText(/\/60/)).toBeNull()

    fireEvent.change(campoApellido, { target: { value: 'P'.repeat(52) } })
    expect(screen.getByText('52/60')).toBeDefined()
  })

  it('bloquea el envío si el nombre o el apellido no llegan al mínimo', () => {
    const registerMock = vi.fn()
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      register: registerMock,
    })

    render(
      <BrowserRouter>
        <Registro />
      </BrowserRouter>
    )

    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'A' } })
    fireEvent.change(screen.getByLabelText(/Apellido/), { target: { value: 'Pérez' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(
      screen.getByText('El nombre y el apellido deben tener al menos 2 caracteres.'),
    ).toBeDefined()
    expect(registerMock).not.toHaveBeenCalled()
    // El blur no llegó a pasar, pero el intento de envío también marca el
    // campo como tocado: por eso el error en línea aparece igual.
    expect(screen.getAllByText(/al menos 2 caracteres/).length).toBeGreaterThan(0)
  })

  it('bloquea el envío con una cédula inválida, antes de mirar nombre y apellido', () => {
    const registerMock = vi.fn()
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      register: registerMock,
    })

    render(
      <BrowserRouter>
        <Registro />
      </BrowserRouter>
    )

    llenarCamposValidos()
    // Se pone justo antes del envío, no antes: el componente ya llama a esta
    // función en cada render para pintar (o no) el error de la cédula, y un
    // "Once" puesto más temprano se consumiría ahí en vez de en el envío.
    vi.mocked(esCedulaEcuatoriana).mockReturnValueOnce(false)
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(screen.getByText('Revisa tu número de cédula: son 10 dígitos.')).toBeDefined()
    expect(registerMock).not.toHaveBeenCalled()
  })

  it('bloquea el envío si no aceptó la política de datos', () => {
    const registerMock = vi.fn()
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      register: registerMock,
    })

    render(
      <BrowserRouter>
        <Registro />
      </BrowserRouter>
    )

    llenarCamposValidos()
    // La deja sin marcar otra vez: llenarCamposValidos() la marcó al hacer clic.
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(screen.getByText('Debes aceptar la política de datos para continuar')).toBeDefined()
    expect(registerMock).not.toHaveBeenCalled()
  })

  it('con todo válido, registra con los datos del formulario', async () => {
    const registerMock = vi.fn().mockResolvedValue(undefined)
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      register: registerMock,
    })

    render(
      <BrowserRouter>
        <Registro />
      </BrowserRouter>
    )

    llenarCamposValidos()
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    await waitFor(() =>
      expect(registerMock).toHaveBeenCalledWith({
        nombre: 'María',
        apellido: 'Pérez',
        email: 'maria@correo.com',
        cedula: '1710034065',
        password: 'unaClaveLarga123',
      }),
    )
  })

  it('si el registro falla, muestra el mensaje de error del servidor', async () => {
    const registerMock = vi.fn().mockRejectedValue(new Error('Ese correo ya está registrado.'))
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      register: registerMock,
    })

    render(
      <BrowserRouter>
        <Registro />
      </BrowserRouter>
    )

    llenarCamposValidos()
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByText('Ese correo ya está registrado.')).toBeDefined()
  })
})
