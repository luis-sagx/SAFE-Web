import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import OlvidePassword from './OlvidePassword'

const { forgotPasswordMock } = vi.hoisted(() => ({
  forgotPasswordMock: vi.fn(),
}))

vi.mock('../lib/api', () => ({
  forgotPassword: forgotPasswordMock,
  ApiError: class ApiError extends Error {
    status: number
    constructor(message: string, status: number) {
      super(message)
      this.status = status
    }
  },
}))

function fill(email: string) {
  fireEvent.change(screen.getByLabelText(/Correo/), { target: { value: email } })
}

describe('OlvidePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('pide el correo y, al enviarlo, muestra un mensaje genérico de confirmación', async () => {
    forgotPasswordMock.mockResolvedValue(null)

    render(
      <BrowserRouter>
        <OlvidePassword />
      </BrowserRouter>,
    )

    fill('ana@correo.com')
    fireEvent.click(screen.getByRole('button', { name: /Enviar/ }))

    await waitFor(() => expect(forgotPasswordMock).toHaveBeenCalledWith('ana@correo.com'))
    expect(
      screen.getByText(/si ese correo tiene una cuenta/i),
    ).toBeDefined()
  })

  // El mensaje debe ser el mismo exista o no la cuenta: no hay forma (ni
  // debe haberla) de distinguir el caso desde el frontend.
  it('con un correo con formato inválido, avisa antes de llamar a la API', () => {
    render(
      <BrowserRouter>
        <OlvidePassword />
      </BrowserRouter>,
    )

    fill('no-es-un-correo')
    fireEvent.click(screen.getByRole('button', { name: /Enviar/ }))

    expect(forgotPasswordMock).not.toHaveBeenCalled()
    expect(screen.getByText(/correo no tiene un formato válido/i)).toBeDefined()
  })

  it('si la API falla de verdad (no por el correo), muestra el error', async () => {
    const { ApiError } = await import('../lib/api')
    forgotPasswordMock.mockRejectedValue(
      new ApiError('No pudimos completar la solicitud. Inténtalo de nuevo en unos minutos.', 500),
    )

    render(
      <BrowserRouter>
        <OlvidePassword />
      </BrowserRouter>,
    )

    fill('ana@correo.com')
    fireEvent.click(screen.getByRole('button', { name: /Enviar/ }))

    expect(
      await screen.findByText('No pudimos completar la solicitud. Inténtalo de nuevo en unos minutos.'),
    ).toBeDefined()
  })

  it('tiene un enlace para volver a iniciar sesión', () => {
    render(
      <BrowserRouter>
        <OlvidePassword />
      </BrowserRouter>,
    )

    const link = screen.getByRole('link', { name: /volver a iniciar sesión/i })
    expect(link.getAttribute('href')).toBe('/login')
  })
})
