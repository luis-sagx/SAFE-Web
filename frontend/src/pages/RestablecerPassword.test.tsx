import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RestablecerPassword from './RestablecerPassword'

const { resetPasswordMock } = vi.hoisted(() => ({
  resetPasswordMock: vi.fn(),
}))

vi.mock('../lib/api', () => ({
  resetPassword: resetPasswordMock,
  ApiError: class ApiError extends Error {
    status: number
    constructor(message: string, status: number) {
      super(message)
      this.status = status
    }
  },
}))

function renderWithToken(token: string | null) {
  const path = token ? `/restablecer-password?token=${token}` : '/restablecer-password'
  return render(
    <MemoryRouter initialEntries={[path]}>
      <RestablecerPassword />
    </MemoryRouter>,
  )
}

describe('RestablecerPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sin token en la URL, avisa que el enlace no es válido en vez de mostrar el formulario', () => {
    renderWithToken(null)

    expect(screen.getByText(/enlace no es válido/i)).toBeDefined()
    expect(screen.queryByLabelText(/Contraseña nueva/)).toBeNull()
  })

  it('con una contraseña que no cumple la política, avisa antes de llamar a la API', () => {
    renderWithToken('token-abc')

    fireEvent.change(screen.getByLabelText(/Contraseña nueva/), {
      target: { value: 'corta' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Cambiar contraseña/ }))

    expect(resetPasswordMock).not.toHaveBeenCalled()
    expect(screen.getByText(/una mayúscula/i)).toBeDefined()
  })

  it('con token y contraseña válidos, llama a la API y muestra éxito', async () => {
    resetPasswordMock.mockResolvedValue(null)
    renderWithToken('token-abc')

    fireEvent.change(screen.getByLabelText(/Contraseña nueva/), {
      target: { value: 'ClaveNueva123!' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Cambiar contraseña/ }))

    await waitFor(() =>
      expect(resetPasswordMock).toHaveBeenCalledWith('token-abc', 'ClaveNueva123!'),
    )
    expect(screen.getByText(/contraseña se actualizó/i)).toBeDefined()
    expect(screen.getByRole('link', { name: /iniciar sesión/i }).getAttribute('href')).toBe(
      '/login',
    )
  })

  it('con un enlace vencido o inválido, muestra el error del servidor y ofrece pedir uno nuevo', async () => {
    const { ApiError } = await import('../lib/api')
    resetPasswordMock.mockRejectedValue(
      new ApiError('El enlace no es válido o ya venció.', 401),
    )
    renderWithToken('token-viejo')

    fireEvent.change(screen.getByLabelText(/Contraseña nueva/), {
      target: { value: 'ClaveNueva123!' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Cambiar contraseña/ }))

    expect(await screen.findByText('El enlace no es válido o ya venció.')).toBeDefined()
    expect(
      screen.getByRole('link', { name: /pedir uno nuevo/i }).getAttribute('href'),
    ).toBe('/olvide-password')
  })
})
