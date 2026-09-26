import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Registration from './Registro'

const { useAuthMock, navigateMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  navigateMock: vi.fn(),
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: useAuthMock,
}))

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return { ...actual, useNavigate: () => navigateMock }
})

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana' } })
  fireEvent.change(screen.getByLabelText('Apellido'), { target: { value: 'Pérez' } })
  fireEvent.change(screen.getByLabelText('Cédula'), { target: { value: '1710034065' } })
  fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'ana@correo.com' } })
  fireEvent.change(screen.getByLabelText('Contraseña'), {
    target: { value: 'ClaveSegura123!' },
  })
  fireEvent.click(screen.getByLabelText(/acepto/i))
}

describe('Registro', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tras registrarse, navega a /revisa-tu-correo con el correo en el state', async () => {
    const register = vi.fn().mockResolvedValue({ email: 'ana@correo.com' })
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      register,
    })

    render(
      <BrowserRouter>
        <Registration />
      </BrowserRouter>,
    )

    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith('/revisa-tu-correo', {
        state: { email: 'ana@correo.com' },
      }),
    )
  })

  it('si register falla, muestra el error y no navega', async () => {
    const register = vi.fn().mockRejectedValue(new Error('Ya existe una cuenta con esos datos.'))
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      register,
    })

    render(
      <BrowserRouter>
        <Registration />
      </BrowserRouter>,
    )

    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await waitFor(() =>
      expect(screen.getByText('Ya existe una cuenta con esos datos.')).toBeDefined(),
    )
    expect(navigateMock).not.toHaveBeenCalled()
  })
})
